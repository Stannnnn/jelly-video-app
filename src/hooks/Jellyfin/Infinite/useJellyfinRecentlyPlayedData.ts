import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinRecentlyPlayedData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40

    return useJellyfinInfiniteData({
        queryKey: ['recentlyPlayed'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getRecentlyPlayed(startIndex, itemsPerPage)
        },
    })
}
