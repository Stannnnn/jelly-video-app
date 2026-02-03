import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinSeasons = (seriesId: string | undefined) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['series-seasons', seriesId],
        queryFn: async () => {
            if (!seriesId) throw new Error('Series ID is required')
            return await api.getSeasons(seriesId)
        },
        enabled: !!seriesId,
    })

    return {
        seasons: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
