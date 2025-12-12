import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinSpecials = (parentId: string | undefined) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['specials', parentId],
        queryFn: async () => {
            if (!parentId) throw new Error('Parent ID is required')
            return await api.getSpecials(parentId)
        },
        enabled: !!parentId,
    })

    return {
        specials: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
