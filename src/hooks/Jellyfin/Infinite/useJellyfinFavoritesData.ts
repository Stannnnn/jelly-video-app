import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinFavoritesData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40

    return useJellyfinInfiniteData({
        queryKey: ['favorites'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getFavorites(startIndex, itemsPerPage)
        },
    })
}
