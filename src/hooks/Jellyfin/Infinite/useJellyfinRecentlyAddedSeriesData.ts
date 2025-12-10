import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinRecentlyAddedSeriesData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 12

    return useJellyfinInfiniteData({
        queryKey: ['recentlyAddedSeries'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getRecentlyAdded(startIndex, itemsPerPage, BaseItemKind.Series)
        },
    })
}
