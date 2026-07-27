import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinUserViews = () => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[]>({
        queryKey: ['user-views'],
        queryFn: () => api.getUserViews(),
    })

    return {
        views: data || [],
        isLoading,
        error: error ? (error as Error).message : null,
    }
}
