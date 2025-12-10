import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

interface JellyfinHomeData {
    recentlyPlayed: MediaItem[]
    recentlyAddedMovies: MediaItem[]
    recentlyAddedSeries: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinHomeData = () => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<JellyfinHomeData, Error>({
        queryKey: ['homeData'],
        queryFn: async () => {
            const [recentlyPlayed, recentlyAddedMovies, recentlyAddedSeries] = await Promise.all([
                api.getRecentlyPlayed(),
                api.getRecentlyAdded(0, 12, BaseItemKind.Movie),
                api.getRecentlyAdded(0, 12, BaseItemKind.Series),
            ])

            return {
                recentlyPlayed,
                recentlyAddedMovies,
                recentlyAddedSeries,
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
