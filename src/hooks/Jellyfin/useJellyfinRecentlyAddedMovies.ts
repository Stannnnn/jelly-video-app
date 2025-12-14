import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinRecentlyAddedMovies = (startIndex = 0, limit = 18) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['recentlyAddedMovies', startIndex, limit],
        queryFn: async () => {
            return await api.getRecentlyAdded(startIndex, limit, BaseItemKind.Movie)
        },
    })

    return {
        recentlyAddedMovies: data,
        isLoading,
        error: error ? error.message : null,
    }
}
