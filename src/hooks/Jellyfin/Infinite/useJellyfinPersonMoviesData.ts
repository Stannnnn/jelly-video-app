import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPersonMoviesData = (personId: string | undefined) => {
    const api = useJellyfinContext()
    const itemsPerPage = 42

    return useJellyfinInfiniteData({
        queryKey: ['person-movies', personId],
        queryFn: async ({ pageParam = 0 }) => {
            if (!personId || !api.auth.serverUrl || !api.auth.token || !api.auth.userId) {
                return []
            }
            const startIndex = (pageParam as number) * itemsPerPage
            return (await api.getPersonMovies(personId, startIndex, itemsPerPage)).items
        },
        enabled: !!personId,
    })
}
