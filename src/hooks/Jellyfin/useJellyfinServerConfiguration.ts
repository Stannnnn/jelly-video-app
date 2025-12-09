import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinServerConfiguration = () => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['serverConfiguration'],
        queryFn: async () => {
            return await api.fetchServerConfiguration()
        },
    })

    return {
        configuration: {
            ...data,
            minResumePercentage: data?.MinResumePct ?? 5,
            maxResumePercentage: data?.MaxResumePct ?? 95,
        },
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
