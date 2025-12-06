import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinSearch = (searchQuery: string) => {
    const api = useJellyfinContext()
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

            // Fetch each type separately
            const [movies, series, episodes, collections] = await Promise.all([
                api.searchItems(debouncedSearchQuery, 4, [BaseItemKind.Movie]),
                api.searchItems(debouncedSearchQuery, 4, [BaseItemKind.Series]),
                api.searchItems(debouncedSearchQuery, 4, [BaseItemKind.Episode]),
                api.searchItems(debouncedSearchQuery, 4, [BaseItemKind.BoxSet]),
            ])

            const limitedResults = [...movies, ...series, ...episodes, ...collections]
            return limitedResults
        },
    })

    return {
        searchResults: data || [],
        searchLoading: isFetching,
        searchError: error ? error.message : null,
        searchAttempted: searchQuery.length > 0,
    }
}
