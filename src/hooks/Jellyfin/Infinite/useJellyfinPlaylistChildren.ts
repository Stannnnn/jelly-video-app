import { useFilterContextUnsafe } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPlaylistChildren = (itemId: string | undefined, sortBy?: 'Inherit') => {
    const api = useJellyfinContext()
    const filterContext = useFilterContextUnsafe()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: [
            'playlist-children',
            itemId,
            sortBy || filterContext?.jellySort.sortBy,
            filterContext?.jellySort.sortOrder,
        ],
        queryFn: async ({ pageParam = 0 }) => {
            if (!itemId) throw new Error('Item ID is required')
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getPlaylistItems(
                itemId,
                startIndex,
                itemsPerPage,
                sortBy || filterContext?.jellySort.sortBy,
                filterContext?.jellySort.sortOrder
            )
        },
        enabled: !!itemId,
    })
}
