import { BaseItemKind, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { invoke } from '@tauri-apps/api/core'
import { ReactNode, useCallback, useRef } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { AudioStorageContext } from './AudioStorageContext'

export type IAudioStorageContext = ReturnType<typeof useInitialState>
export type IStorageTrack =
    | { type: 'container'; timestamp: number; mediaItem: MediaItem; bitrate: number; thumbnail?: Blob }
    | {
          type: 'video'
          timestamp: number
          mediaItem: MediaItem
          bitrate: number
          blob: Blob
          containerId?: string
          mediaSources?: MediaSourceInfo[]
          mediaSourceId?: string
          thumbnail?: Blob
      }

const useInitialState = () => {
    const isInitialized = useRef(true) // Tauri is always ready

    const saveTrack = useCallback(
        async (
            id: string,
            data: {
                type: 'container' | 'video'
                timestamp: number
                mediaItem: MediaItem
                bitrate: number
                containerId?: string
                mediaSources?: MediaSourceInfo[]
                mediaSourceId?: string
            },
            videoUrl?: string,
            thumbnailUrl?: string
        ) => {
            try {
                // Prepare track data without blobs
                const trackData = {
                    type: data.type,
                    timestamp: data.timestamp,
                    mediaItem: data.mediaItem,
                    bitrate: data.bitrate,
                    containerId: data.containerId,
                    mediaSources: data.mediaSources,
                    mediaSourceId: data.mediaSourceId,
                }

                await invoke('storage_save_track', {
                    id,
                    data: trackData,
                    videoUrl,
                    thumbnailUrl,
                })
            } catch (error) {
                console.error('Failed to download and save track:', error)
                throw error
            }
        },
        []
    )

    const removeTrack = useCallback(async (id: string) => {
        try {
            await invoke('storage_remove_track', { id })
        } catch (error) {
            console.error('Failed to remove track:', error)
            throw error
        }
    }, [])

    const getTrack = useCallback(async (id: string): Promise<IStorageTrack | null> => {
        try {
            const track = await invoke<IStorageTrack | null>('storage_get_track', { id })
            return track
        } catch (error) {
            console.error('Failed to get track:', error)
            return null
        }
    }, [])

    const hasTrack = useCallback(async (id: string) => {
        try {
            const exists = await invoke<boolean>('storage_has_track', { id })
            return exists
        } catch (error) {
            console.error('Failed to check track:', error)
            return false
        }
    }, [])

    const getFilePath = useCallback(async (id: string): Promise<string | undefined> => {
        try {
            const filePath = await invoke<string | null>('storage_get_file_path', { id })
            return filePath || undefined
        } catch (error) {
            console.error('Failed to get file path:', error)
            return undefined
        }
    }, [])

    const getTrackCount = useCallback(async () => {
        try {
            const count = await invoke<number>('storage_get_track_count', { kind: BaseItemKind.Audio })
            return count
        } catch (error) {
            console.error('Failed to get track count:', error)
            return 0
        }
    }, [])

    const clearAllDownloads = useCallback(async () => {
        try {
            await invoke('storage_clear_all')
        } catch (error) {
            console.error('Failed to clear downloads:', error)
            throw error
        }
    }, [])

    const getPageFromIndexedDb = async (
        pageIndex: number,
        itemKind: BaseItemKind,
        itemsPerPage: number
    ): Promise<MediaItem[]> => {
        try {
            const items = await invoke<MediaItem[]>('storage_get_page', {
                pageIndex,
                itemKind,
                itemsPerPage,
            })

            // Load thumbnails for items that have them
            for (const item of items) {
                if ((item as any).hasThumbnail) {
                    try {
                        const thumbnailData = await invoke<number[] | null>('storage_get_thumbnail', { id: item.Id })
                        if (thumbnailData) {
                            const blob = new Blob([new Uint8Array(thumbnailData)])
                            item.downloadedImageUrl = URL.createObjectURL(blob)
                        }
                    } catch (error) {
                        console.warn('Failed to load thumbnail for', item.Id, error)
                    }
                    delete (item as any).hasThumbnail
                }
            }

            return items
        } catch (error) {
            console.error('Failed to get page:', error)
            return []
        }
    }

    const searchOfflineItems = async (searchTerm: string, limit = 50): Promise<MediaItem[]> => {
        try {
            if (!searchTerm.trim()) return []

            const items = await invoke<MediaItem[]>('storage_search_items', {
                searchTerm,
                limit,
            })

            // Load thumbnails for items that have them
            for (const item of items) {
                if ((item as any).hasThumbnail) {
                    try {
                        const thumbnailData = await invoke<number[] | null>('storage_get_thumbnail', { id: item.Id })
                        if (thumbnailData) {
                            const blob = new Blob([new Uint8Array(thumbnailData)])
                            item.downloadedImageUrl = URL.createObjectURL(blob)
                        }
                    } catch (error) {
                        console.warn('Failed to load thumbnail for', item.Id, error)
                    }
                    delete (item as any).hasThumbnail
                }
            }

            return items
        } catch (error) {
            console.error('Failed to search items:', error)
            return []
        }
    }

    const audioStorage = {
        saveTrack,
        removeTrack,
        getTrack,
        hasTrack,
        getFilePath,
        getTrackCount,
        clearAllDownloads,
        getPageFromIndexedDb,
        searchOfflineItems,
        isInitialized: () => isInitialized.current,
    }

    // We need the audioStorage in jellyfin API but we don't want to cause unnecessary re-renders since Tauri is always ready
    window.audioStorage = audioStorage

    return audioStorage
}

export const AudioStorageContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <AudioStorageContext.Provider value={initialState}>{children}</AudioStorageContext.Provider>
}
