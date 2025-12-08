import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinEpisodes = (seasonId: string | null) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['season-episodes', seasonId],
        queryFn: async () => {
            if (!seasonId) throw new Error('Season ID is required')
            return await api.getEpisodes(seasonId)
        },
        enabled: !!seasonId,
    })

    return {
        episodes: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
