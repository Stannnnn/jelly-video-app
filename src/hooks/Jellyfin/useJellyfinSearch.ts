import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { useAudioStorageContext } from '../../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinSearch = (searchQuery: string) => {
    const api = useJellyfinContext()
    const audioStorage = useAudioStorageContext()
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

    // Debounce the search query
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 200)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    const { data, isFetching, error } = useQuery<MediaItem[], Error>({
        queryKey: ['search', debouncedSearchQuery],
        queryFn: async () => {
            if (!debouncedSearchQuery || !api.auth.serverUrl || !api.auth.token || !api.auth.userId) {
                return []
            }

            if (navigator.onLine) {
                // Fetch each type separately
                const [movies, series, collections] = await Promise.all([
                    api.searchItems(debouncedSearchQuery, 6, [BaseItemKind.Movie]),
                    api.searchItems(debouncedSearchQuery, 6, [BaseItemKind.Series]),
                    api.searchItems(debouncedSearchQuery, 6, [BaseItemKind.BoxSet]),
                ])

                const limitedResults = [...movies, ...series, ...collections]
                return limitedResults
            } else {
                // Use offline search when no network
                const offlineResults = await audioStorage.searchOfflineItems(debouncedSearchQuery, 10)
                return offlineResults
            }
        },
    })

    return {
        searchResults: data || [],
        searchLoading: isFetching,
        searchError: error ? error.message : null,
        searchAttempted: searchQuery.length > 0,
    }
}
