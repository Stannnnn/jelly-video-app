import { useQuery } from '@tanstack/react-query'
import { JELLYFIN_MAX_LIMIT } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinPlaylists = () => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['playlists', 'all'],
        queryFn: async () => {
            return await api.getPlaylists(0, JELLYFIN_MAX_LIMIT)
        },
    })

    return {
        playlists: data || [],
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
