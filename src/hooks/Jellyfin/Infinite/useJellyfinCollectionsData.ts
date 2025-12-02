import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinCollectionsData = () => {
    const api = useJellyfinContext()
    const { jellySort } = useFilterContext()
    const itemsPerPage = 40

    return useJellyfinInfiniteData({
        queryKey: ['collections', jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getCollections(startIndex, itemsPerPage, jellySort.sortBy, jellySort.sortOrder)
        },
    })
}
