import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinRecentlyAddedMoviesData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 12

    return useJellyfinInfiniteData({
        queryKey: ['recentlyAddedMovies'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getRecentlyAdded(startIndex, itemsPerPage, BaseItemKind.Movie)
        },
    })
}
