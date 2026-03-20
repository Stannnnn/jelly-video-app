import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { useAudioStorageContext } from '../../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

interface SearchResults {
    movies: MediaItem[]
    series: MediaItem[]
    collections: MediaItem[]
    persons: MediaItem[]
}

export const useJellyfinSearchDetailed = (searchQuery: string | undefined) => {
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

    const { data, isFetching, error } = useQuery<SearchResults, Error>({
        queryKey: ['search-detailed', debouncedSearchQuery],
        queryFn: async () => {
            if (!debouncedSearchQuery || !api.auth.serverUrl || !api.auth.token || !api.auth.userId) {
                return {
                    movies: [],
                    series: [],
                    collections: [],
                    persons: [],
                }
            }

            if (navigator.onLine) {
                // Fetch each type separately with specific limits
                const [movies, series, collections, persons] = await Promise.all([
                    api.searchItems(debouncedSearchQuery, 12, [BaseItemKind.Movie]),
                    api.searchItems(debouncedSearchQuery, 12, [BaseItemKind.Series]),
                    api.searchItems(debouncedSearchQuery, 12, [BaseItemKind.BoxSet]),
                    api.searchPeople(debouncedSearchQuery, 12),
                ])

                return {
                    movies,
                    series,
                    collections,
                    persons,
                }
            } else {
                const offlineSongs = await audioStorage.searchOfflineItems(debouncedSearchQuery, 50)
                return {
                    movies: offlineSongs,
                    series: [],
                    collections: [],
                    persons: [],
                }
            }
        },
    })

    return {
        results: data || {
            movies: [],
            series: [],
            collections: [],
            persons: [],
        },
        loading: isFetching,
        error: error ? error.message : null,
    }
}
