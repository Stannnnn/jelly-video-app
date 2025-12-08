import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinItemChildren = (itemId: string | undefined, startIndex: number, limit: number) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['collection-children', itemId, startIndex],
        queryFn: async () => {
            if (!itemId) throw new Error('Item ID is required')
            return await api.getItemChildren(itemId, startIndex, limit)
        },
        enabled: !!itemId,
    })

    return {
        children: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
