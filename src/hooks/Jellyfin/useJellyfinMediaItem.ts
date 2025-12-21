import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinMediaItem = (itemId: string | undefined, mediaSourceId?: string) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['mediaItem', itemId, mediaSourceId],
        queryFn: async () => {
            if (!itemId) throw new Error('Item ID is required')
            return await api.getItemById(itemId, mediaSourceId)
        },
        enabled: !!itemId,
    })

    return {
        mediaItem: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
