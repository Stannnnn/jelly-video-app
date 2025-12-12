import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinCastCrew = (itemId: string | undefined) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['castCrew', itemId],
        queryFn: async () => {
            if (!itemId) throw new Error('Item ID is required')
            return await api.getCastCrew(itemId)
        },
        enabled: !!itemId,
    })

    return {
        castCrew: data,
        people: data?.people || [],
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
