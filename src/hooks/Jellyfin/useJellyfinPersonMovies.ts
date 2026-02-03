import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinPersonMovies = (personId: string | undefined, startIndex: number = 0, limit: number = 36) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['personMovies', personId, startIndex, limit],
        queryFn: async () => {
            if (!personId) throw new Error('Person ID is required')
            return await api.getPersonMovies(personId, startIndex, limit)
        },
        enabled: !!personId,
    })

    return {
        items: data?.items || [],
        totalCount: data?.totalCount || 0,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
