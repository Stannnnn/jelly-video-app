import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinNextUp = (startIndex = 0, limit = 12) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['nextUp', startIndex, limit],
        queryFn: async () => {
            return await api.getNextUp(startIndex, limit)
        },
    })

    return {
        nextUp: data,
        isLoading,
        error: error ? error.message : null,
    }
}
