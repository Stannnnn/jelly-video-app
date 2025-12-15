import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinFavoritesData = () => {
    const api = useJellyfinContext()
    const { jellySort, jellyItemKind } = useFilterContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['favorites', jellyItemKind, jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getFavorites(
                startIndex,
                itemsPerPage,
                jellySort.sortBy,
                jellySort.sortOrder,
                jellyItemKind
            )
        },
    })
}
