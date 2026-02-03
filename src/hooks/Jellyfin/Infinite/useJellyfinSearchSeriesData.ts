import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinSearchSeriesData = (searchQuery: string) => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['search-series', searchQuery],
        queryFn: async ({ pageParam = 0 }) => {
            if (!searchQuery || !api.auth.serverUrl || !api.auth.token || !api.auth.userId) {
                return []
            }
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.searchItems(searchQuery, itemsPerPage, [BaseItemKind.Series], startIndex)
        },
        enabled: !!searchQuery,
    })
}
