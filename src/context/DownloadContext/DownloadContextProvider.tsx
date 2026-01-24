import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { usePatchQueries } from '../../hooks/usePatchQueries'
import { useAudioStorageContext } from '../AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../PlaybackContext/PlaybackContext'
import { DownloadContext } from './DownloadContext'

const STORAGE_KEY = 'mediaTaskQueue'

type Task = { mediaItem: MediaItem; action: 'download' | 'remove'; containerId?: string; mediaSourceId?: string }

export type IDownloadContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const audioStorage = useAudioStorageContext()
    const { patchMediaItem, patchMediaItems, prependItemsToQueryData, removeItemFromQueryData } = usePatchQueries()
    const [storageStats, setStorageStats] = useState({ usage: 0, trackCount: 0 })
    const progressBarRef = useRef<HTMLDivElement | null>(null)
    const [currentDownloadingId, setCurrentDownloadingId] = useState<string | undefined>(undefined)
    const [downloadProgress, setDownloadProgress] = useState<{
        speed: number
        downloaded: number
        total: number
        timeRemaining: number
    } | null>(null)

    const refreshStorageStats = useCallback(async () => {
        if (isTauri()) {
            try {
                const stats = await invoke<{ usage: number; trackCount: number }>('storage_get_stats')
                setStorageStats(stats)
            } catch (error) {
                console.error('Failed to load storage stats:', error)
            }
        }
    }, [])

    useEffect(() => {
        refreshStorageStats()
    }, [refreshStorageStats])

    // Listen for download progress events
    useEffect(() => {
        if (!isTauri()) return

        const unlisten = listen<{
            id: string
            downloaded: number
            total: number
            progress: number
            speed: number
            timeRemaining: number
        }>('download-progress', event => {
            const { id, downloaded, total, progress, speed, timeRemaining } = event.payload
            console.log(`Download progress for ${id}: ${progress}% (${downloaded}/${total} bytes)`)

            // Update the progress bar element
            if (progressBarRef.current) {
                progressBarRef.current.style.setProperty('--progress-percent', `${progress}%`)
            }

            // Update download progress state with data from Rust
            setDownloadProgress({
                speed,
                downloaded,
                total,
                timeRemaining,
            })
        })

        return () => {
            unlisten.then(fn => fn())
        }
    }, [])

    const [queue, setQueue] = useState<Task[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? (JSON.parse(stored) as Task[]) : []
        } catch (e) {
            console.error('Failed to load media task queue:', e)
            return []
        }
    })

    const processingRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Abort ongoing download on unmount
    useEffect(() => {
        return () => {
            if (isTauri()) {
                invoke('storage_abort_downloads').catch(err =>
                    console.error('Failed to abort downloads on unmount:', err)
                )
            }
        }
    }, [])

    // Persist queue
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
        } catch (e) {
            console.error('Failed to save media task queue:', e)
        }
    }, [queue])

    // Enqueue download
    const addToDownloads = (items: MediaItem[], container?: MediaItem, mediaSourceId?: string) => {
        const containerId = container?.Id

        patchMediaItems(
            items.map(item => item.Id),
            item => ({ ...item, offlineState: 'downloading' })
        )

        if (containerId) {
            patchMediaItem(containerId, item => ({ ...item, offlineState: 'downloading' }))
        }

        setQueue(prev => {
            const filtered = prev.filter(task => !items.some(i => i.Id === task.mediaItem.Id))
            const newTasks: Task[] = items.map(item => ({
                mediaItem: item,
                action: 'download' as const,
                containerId,
                mediaSourceId,
            }))

            if (containerId) {
                newTasks.push({ mediaItem: container, action: 'download' })
            }

            return newTasks.length ? [...filtered, ...newTasks] : filtered
        })
    }

    // Enqueue removal
    const removeFromDownloads = (items: MediaItem[], container?: MediaItem, mediaSourceId?: string) => {
        const containerId = container?.Id

        patchMediaItems(
            items.map(item => item.Id),
            item => ({ ...item, offlineState: 'deleting' })
        )

        if (containerId) {
            patchMediaItem(containerId, item => ({ ...item, offlineState: 'deleting' }))
        }

        setQueue(prev => {
            const filtered = prev.filter(task => !items.some(i => i.Id === task.mediaItem.Id))
            const newTasks: Task[] = items.map(item => ({
                mediaItem: item,
                action: 'remove' as const,
                containerId,
                mediaSourceId,
            }))

            if (containerId) {
                newTasks.push({ mediaItem: container, action: 'remove' })
            }

            return newTasks.length ? [...filtered, ...newTasks] : filtered
        })
    }

    const clearQueue = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort('clearQueue')
            abortControllerRef.current = null

            if (isTauri()) {
                invoke('storage_abort_downloads').catch(err => console.error('Failed to abort downloads:', err))
            }
        }

        queue.forEach(({ mediaItem }) => {
            patchMediaItem(mediaItem.Id, item => ({
                ...item,
                offlineState:
                    item.offlineState === 'downloading'
                        ? undefined
                        : item.offlineState === 'deleting'
                          ? 'downloaded'
                          : item.offlineState,
            }))
        })

        setQueue([])
    }, [queue, patchMediaItem])

    // Process queue tasks one at a time
    useEffect(() => {
        const runNext = async () => {
            if (processingRef.current) return
            const next = queue[0]
            if (!next) return

            processingRef.current = true
            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            const { mediaItem, action } = next
            let shouldRemoveFromQueue = true

            try {
                if (action === 'download') {
                    setCurrentDownloadingId(mediaItem.Id)
                    setDownloadProgress(null)
                    const already = await audioStorage.hasTrack(mediaItem.Id)

                    if (already) {
                        patchMediaItem(mediaItem.Id, item => ({ ...item, offlineState: 'downloaded' }))
                    } else {
                        // The mediaItem object is saved so we modify it directly
                        mediaItem.offlineState = 'downloaded'

                        if (
                            mediaItem.Type === BaseItemKind.Series ||
                            mediaItem.Type === BaseItemKind.Episode ||
                            mediaItem.Type === BaseItemKind.BoxSet ||
                            mediaItem.Type === BaseItemKind.Movie
                        ) {
                            const streamUrl = api.getStreamUrl(mediaItem.Id, playback.bitrate, next.mediaSourceId)
                            const thumbnailUrl = api.getImageUrl(mediaItem, 'Primary', { width: 360, height: 360 })

                            const [trackInfo] = await Promise.all([api.getItemById(mediaItem.Id)])

                            if (!trackInfo) throw new Error(`Track info not found for ${mediaItem.Id}`)

                            await audioStorage.downloadAndSaveTrack(
                                mediaItem.Id,
                                {
                                    type: 'video',
                                    timestamp: Date.now(),
                                    bitrate: playback.bitrate,
                                    mediaItem,
                                    containerId: next.containerId,
                                    mediaSources: trackInfo.MediaSources || undefined,
                                },
                                streamUrl,
                                thumbnailUrl
                            )
                        } else {
                            const thumbnailUrl = api.getImageUrl(mediaItem, 'Primary', { width: 360, height: 360 })

                            await audioStorage.downloadAndSaveTrack(
                                mediaItem.Id,
                                {
                                    type: 'container',
                                    timestamp: Date.now(),
                                    bitrate: playback.bitrate,
                                    mediaItem,
                                },
                                undefined,
                                thumbnailUrl
                            )
                        }

                        prependItemsToQueryData(['downloads', mediaItem.Type || ''], [mediaItem])
                        patchMediaItem(mediaItem.Id, item => ({ ...item, offlineState: 'downloaded' }))
                    }
                } else if (action === 'remove') {
                    await audioStorage.removeTrack(mediaItem.Id)
                    removeItemFromQueryData(['downloads', mediaItem.Type || ''], mediaItem.Id)
                    patchMediaItem(mediaItem.Id, item => ({ ...item, offlineState: undefined }))
                }

                refreshStorageStats()
            } catch (error) {
                console.error(`Task failed for ${action} id=${mediaItem.Id}`, error)

                if (signal.aborted && signal.reason === 'removeFromQueue') {
                    shouldRemoveFromQueue = false
                } else {
                    if (action === 'download') {
                        patchMediaItem(mediaItem.Id, item => ({ ...item, offlineState: undefined }))
                    } else if (action === 'remove') {
                        patchMediaItem(mediaItem.Id, item => ({ ...item, offlineState: 'downloaded' }))
                    }
                }
            } finally {
                // Clear progress bar
                if (progressBarRef.current) {
                    progressBarRef.current.style.setProperty('--progress-percent', '0%')
                }
                setCurrentDownloadingId(undefined)
                setDownloadProgress(null)
                abortControllerRef.current = null
                // Only remove from queue if it wasn't manually removed
                if (shouldRemoveFromQueue) {
                    setQueue(prev => prev.slice(1))
                }
                processingRef.current = false
            }
        }

        runNext()
    }, [
        api,
        audioStorage,
        patchMediaItem,
        playback.bitrate,
        prependItemsToQueryData,
        queue,
        refreshStorageStats,
        removeItemFromQueryData,
    ])

    // We need the addToDownloads in jellyfin API but we don't want to cause unnecessary re-renders
    window.addToDownloads = addToDownloads
    window.removeFromDownloads = removeFromDownloads

    // Expose getDownloadState to check if an item is in the queue
    window.getDownloadState = (itemId: string) => {
        const task = queue.find(t => t.mediaItem.Id === itemId)
        if (!task) return undefined
        return task.action === 'download' ? 'downloading' : 'deleting'
    }

    const removeFromQueue = (itemId: string) => {
        setQueue(prev => {
            const task = prev.find(t => t.mediaItem.Id === itemId)
            if (!task) return prev

            const isFirstInQueue = prev[0]?.mediaItem.Id === itemId
            if (isFirstInQueue && abortControllerRef.current) {
                abortControllerRef.current.abort('removeFromQueue')
                abortControllerRef.current = null
                ;(async () => {
                    if (isTauri()) {
                        await invoke('storage_abort_downloads').catch(err =>
                            console.error('Failed to abort download:', err)
                        )
                    }

                    processingRef.current = false
                })()
            }

            if (task.action === 'download') {
                patchMediaItem(itemId, item => ({ ...item, offlineState: undefined }))
            } else if (task.action === 'remove') {
                patchMediaItem(itemId, item => ({ ...item, offlineState: 'downloaded' }))
            }

            return prev.filter(t => t.mediaItem.Id !== itemId)
        })

        // Clear progress bar and download progress if we removed the currently downloading item
        if (progressBarRef.current) {
            progressBarRef.current.style.setProperty('--progress-percent', '0%')
        }
        setDownloadProgress(null)
    }

    return {
        addToDownloads,
        removeFromDownloads,
        storageStats,
        refreshStorageStats,
        queueCount: queue.length,
        clearQueue,
        queue,
        removeFromQueue,
        progressBarRef,
        currentDownloadingId,
        downloadProgress,
    }
}

export const DownloadContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <DownloadContext.Provider value={initialState}>{children}</DownloadContext.Provider>
}
