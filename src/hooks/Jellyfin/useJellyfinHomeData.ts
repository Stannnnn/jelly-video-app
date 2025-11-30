import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

interface JellyfinHomeData {
    recentlyPlayed: MediaItem[]
    frequentlyPlayed: MediaItem[]
    recentlyAdded: MediaItem[]
    recentGenres: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinHomeData = () => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<JellyfinHomeData, Error>({
        queryKey: ['homeData'],
        queryFn: async () => {
            const [recentlyPlayed, frequentlyPlayed, recentlyAdded, recentGenres] = await Promise.all([
                api.getRecentlyPlayed(),
                api.getFrequentlyPlayed(),
                api.getRecentlyAdded(),
                api.getRecentGenres(),
            ])
            return {
                recentlyPlayed: recentlyPlayed.filter(item => item.Type === 'Audio'),
                frequentlyPlayed: frequentlyPlayed.filter(item => item.Type === 'Audio'),
                recentlyAdded: recentlyAdded.filter(item => item.Type === 'MusicAlbum'),
                recentGenres,
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
