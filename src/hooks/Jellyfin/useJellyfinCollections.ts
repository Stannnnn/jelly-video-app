import { useQuery } from '@tanstack/react-query'
import { JELLYFIN_MAX_LIMIT } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinCollections = () => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['collections', 'all'], // Second param is lame
        queryFn: async () => {
            return await api.getCollections(0, JELLYFIN_MAX_LIMIT)
        },
    })

    return {
        collections: data || [],
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
