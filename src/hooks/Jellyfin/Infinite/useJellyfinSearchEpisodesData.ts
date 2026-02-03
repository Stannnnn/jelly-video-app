import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinSearchEpisodesData = (searchQuery: string) => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['search-episodes', searchQuery],
        queryFn: async ({ pageParam = 0 }) => {
            if (!searchQuery || !api.auth.serverUrl || !api.auth.token || !api.auth.userId) {
                return []
            }
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.searchItems(searchQuery, itemsPerPage, [BaseItemKind.Episode], startIndex)
        },
        enabled: !!searchQuery,
    })
}
