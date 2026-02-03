import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinSimilarItems = (itemId: string | undefined, limit = 12) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['similarItems', itemId, limit],
        queryFn: async () => {
            if (!itemId) throw new Error('Item ID is required')
            return await api.getSimilarItems(itemId, limit)
        },
        enabled: !!itemId,
    })

    return {
        similarItems: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
