import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinRecentlyPlayed = (startIndex = 0, limit = 42) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['recentlyPlayed', startIndex, limit],
        queryFn: async () => {
            return await api.getRecentlyPlayed(startIndex, limit)
        },
    })

    return {
        recentlyPlayed: data,
        isLoading,
        error: error ? error.message : null,
    }
}
