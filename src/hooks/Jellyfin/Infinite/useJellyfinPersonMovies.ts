import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPersonMoviesData = (personId: string | undefined) => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    if (!personId) {
        throw new Error('Person ID is required')
    }

    return useJellyfinInfiniteData({
        queryKey: ['personMovies', personId],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            const response = await api.getPersonMovies(personId, startIndex, itemsPerPage)
            return response.items
        },
    })
}
