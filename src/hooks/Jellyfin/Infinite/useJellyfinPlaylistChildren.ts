import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPlaylistChildren = (itemId: string | undefined) => {
    const api = useJellyfinContext()
    const { jellySort } = useFilterContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['playlist-children', itemId, jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            if (!itemId) throw new Error('Item ID is required')
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getPlaylistItems(itemId, startIndex, itemsPerPage, jellySort.sortBy, jellySort.sortOrder)
        },
        enabled: !!itemId,
    })
}
