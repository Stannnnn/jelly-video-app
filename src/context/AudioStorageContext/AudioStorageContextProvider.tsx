import { BaseItemKind, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { ReactNode, useCallback, useRef } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { AudioStorageContext } from './AudioStorageContext'

export type IAudioStorageContext = ReturnType<typeof useInitialState>
export type IStorageTrack =
    | { type: 'container'; timestamp: number; mediaItem: MediaItem; bitrate: number; thumbnail?: Blob }
    | {
          type: 'song'
          timestamp: number
          mediaItem: MediaItem
          bitrate: number
          blob: Blob
          containerId?: string
          mediaSources?: MediaSourceInfo[]
          thumbnail?: Blob
      }
    | {
          type: 'm3u8'
          timestamp: number
          mediaItem: MediaItem
          bitrate: number
          playlist: Blob
          ts: Blob[]
          containerId?: string
          thumbnail?: Blob
      }

const useInitialState = () => {
    const DB_NAME = 'OfflineAudioDB'
    const STORE_NAME = 'tracks'
    const DB_VERSION = 4

    const isInitialized = useRef(false)

    const dbRef = useRef(
        new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onupgradeneeded = event => {
                const db = request.result
                const oldVersion = event.oldVersion

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME)
                    store.createIndex('by_kind', 'mediaItem.Type', { unique: false })
                    store.createIndex('by_containerId', 'containerId', { unique: false })
                    store.createIndex('by_kind_timestamp', ['mediaItem.Type', 'timestamp'], { unique: false })
                } else {
                    if (oldVersion < 2) {
                        const store = request.transaction!.objectStore(STORE_NAME)
                        store.createIndex('by_kind', 'mediaItem.Type', { unique: false })
                    }

                    if (oldVersion < 3) {
                        const store = request.transaction!.objectStore(STORE_NAME)
                        store.createIndex('by_containerId', 'containerId', { unique: false })
                    }

                    if (oldVersion < 4) {
                        const store = request.transaction!.objectStore(STORE_NAME)
                        store.createIndex('by_kind_timestamp', ['mediaItem.Type', 'timestamp'], { unique: false })

                        // Migrate existing records to include timestamp
                        const cursorRequest = store.openCursor()
                        cursorRequest.onsuccess = event => {
                            const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result
                            if (cursor) {
                                const record = cursor.value as IStorageTrack
                                if (!record.timestamp) {
                                    // Set current timestamp for existing records
                                    record.timestamp = Date.now()
                                    store.put(record, cursor.primaryKey)
                                }
                                cursor.continue()
                            }
                        }
                    }
                }
            }

            request.onsuccess = () => {
                isInitialized.current = true
                resolve(request.result)
            }

            request.onerror = () => {
                console.error('IndexedDB error:', request.error)
                reject(request.error)
            }
        })
    )

    const saveTrack = useCallback(async (id: string, data: IStorageTrack) => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(data, id)
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        })
    }, [])

    const removeTrack = useCallback(async (id: string) => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)

        const getRequest = store.get(id)
        getRequest.onsuccess = () => {
            const record = getRequest.result as IStorageTrack | undefined
            store.delete(id)

            if (record?.type === 'container' && id) {
                const index = store.index('by_containerId')
                const keyRange = IDBKeyRange.only(id)
                const cursorRequest = index.openCursor(keyRange)
                cursorRequest.onsuccess = event => {
                    const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result
                    if (cursor) {
                        store.delete(cursor.primaryKey)
                        cursor.continue()
                    }
                }
            }
        }
        getRequest.onerror = () => {
            console.error('Error fetching record for deletion:', getRequest.error)
        }

        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        })
    }, [])

    const getTrack = useCallback(async (id: string) => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readonly')
        const request = tx.objectStore(STORE_NAME).get(id)
        return new Promise<IStorageTrack | null>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(request.error)
        })
    }, [])

    const hasTrack = useCallback(
        async (id: string) => {
            const track = await getTrack(id)
            return track !== null
        },
        [getTrack]
    )

    const getPlayableUrl = useCallback(
        async (id: string) => {
            const track = await getTrack(id)

            return track?.type === 'song'
                ? { type: 'song', url: URL.createObjectURL(track.blob) }
                : track?.type === 'm3u8'
                ? { type: 'm3u8', url: URL.createObjectURL(track.playlist) }
                : undefined
        },
        [getTrack]
    )

    const getTrackCount = useCallback(async () => {
        try {
            if (!dbRef.current) throw new Error('Database not initialized')
            const db = await dbRef.current
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const index = store.index('by_kind')
            const keyRange = IDBKeyRange.only(BaseItemKind.Audio)

            const request = index.count(keyRange)
            const trackCount = await new Promise<number>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            return trackCount
        } catch (error) {
            console.error('Failed to get storage stats:', error)
            throw error
        }
    }, [])

    const clearAllDownloads = useCallback(async () => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).clear()

        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        })
    }, [])

    const getPageFromIndexedDb = async (
        pageIndex: number,
        itemKind: BaseItemKind,
        itemsPerPage: number
    ): Promise<MediaItem[]> => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('by_kind_timestamp')
        const lower: [BaseItemKind, number] = [itemKind, 0]
        const upper: [BaseItemKind, number] = [itemKind, Number.MAX_SAFE_INTEGER]
        const keyRange = IDBKeyRange.bound(lower, upper)
        const direction: IDBCursorDirection = 'prev'

        return new Promise<MediaItem[]>((resolve, reject) => {
            const items: MediaItem[] = []
            let skipped = 0
            const needToSkip = pageIndex * itemsPerPage

            const cursorRequest = index.openCursor(keyRange, direction)
            cursorRequest.onerror = () => {
                reject(cursorRequest.error)
            }
            cursorRequest.onsuccess = event => {
                const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result
                if (!cursor) {
                    // No more matching entries
                    resolve(items)
                    return
                }

                if (skipped < needToSkip) {
                    // Skip ahead
                    const toSkip = needToSkip - skipped
                    try {
                        cursor.advance(toSkip)
                        skipped += toSkip
                    } catch (err) {
                        console.error('Failed to skip ahead in cursor:', err)
                        // If advance() fails (e.g. too far), continue one by one
                        skipped++
                        cursor.continue()
                    }
                    return
                }

                const record = cursor.value as Partial<IStorageTrack>

                // Legacy did not have `mediaItem` field, so we check if it exists
                if (record.mediaItem) {
                    if (record.type === 'song' && record.mediaItem && record.mediaSources) {
                        record.mediaItem.MediaSources = record.mediaSources
                    }

                    if (record.thumbnail) {
                        record.mediaItem.downloadedImageUrl = URL.createObjectURL(record.thumbnail)
                    }

                    items.push(record.mediaItem)
                }

                if (items.length < itemsPerPage) {
                    cursor.continue()
                } else {
                    resolve(items)
                }
            }
        })
    }

    const searchOfflineItems = async (searchTerm: string, limit = 50): Promise<MediaItem[]> => {
        if (!dbRef.current) throw new Error('Database not initialized')
        if (!searchTerm.trim()) return []

        const db = await dbRef.current
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('by_kind')
        const keyRange = IDBKeyRange.only(BaseItemKind.Audio)

        return new Promise<MediaItem[]>((resolve, reject) => {
            const items: MediaItem[] = []
            const searchTermLower = searchTerm.toLowerCase()

            const cursorRequest = index.openCursor(keyRange)
            cursorRequest.onerror = () => {
                reject(cursorRequest.error)
            }
            cursorRequest.onsuccess = event => {
                const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result
                if (!cursor) {
                    // No more matching entries
                    resolve(items)
                    return
                }

                const record = cursor.value as Partial<IStorageTrack>

                // Legacy did not have `mediaItem` field, so we check if it exists
                if (record.mediaItem && record.mediaItem.Name) {
                    const itemName = record.mediaItem.Name.toLowerCase()

                    // Check if the search term matches the song name
                    if (itemName.includes(searchTermLower)) {
                        if (record.type === 'song' && record.mediaSources) {
                            record.mediaItem.MediaSources = record.mediaSources
                        }

                        if (record.thumbnail) {
                            record.mediaItem.downloadedImageUrl = URL.createObjectURL(record.thumbnail)
                        }

                        items.push(record.mediaItem)
                    }
                }

                if (items.length < limit) {
                    cursor.continue()
                } else {
                    resolve(items)
                }
            }
        })
    }

    const audioStorage = {
        saveTrack,
        removeTrack,
        getTrack,
        hasTrack,
        getPlayableUrl,
        getTrackCount,
        clearAllDownloads,
        getPageFromIndexedDb,
        searchOfflineItems,
        isInitialized: () => isInitialized.current,
    }

    // We need the audioStorage in jellyfin API but we don't want to cause unnecessary re-renders since opening the IndexedDB shouldn't take long
    window.audioStorage = audioStorage

    return audioStorage
}

export const AudioStorageContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <AudioStorageContext.Provider value={initialState}>{children}</AudioStorageContext.Provider>
}
