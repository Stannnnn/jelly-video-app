import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

interface JellyfinHomeData {
    recentlyPlayed: MediaItem[]
    recentlyAdded: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinHomeData = () => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<JellyfinHomeData, Error>({
        queryKey: ['homeData'],
        queryFn: async () => {
            const [recentlyPlayed, recentlyAdded] = await Promise.all([api.getRecentlyPlayed(), api.getRecentlyAdded()])
            return {
                recentlyPlayed,
                recentlyAdded,
                loading: false,
                error: null,
            }
        },
    })

    return {
        ...data,
        isLoading,
        error: error ? error.message : null,
    }
}
