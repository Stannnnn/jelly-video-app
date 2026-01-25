import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinNextUpData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['nextUp'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getNextUp(startIndex, itemsPerPage)
        },
    })
}
