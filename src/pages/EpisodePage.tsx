import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import './DetailPages.css'

export const EpisodePage = () => {
    const { id } = useParams<{ id: string }>()
    const api = useJellyfinContext()

    const {
        data: episode,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['episode', id],
        queryFn: () => api.getItemById(id!),
        enabled: !!id,
    })

    if (isLoading) {
        return <Loader />
    }

    if (error || !episode) {
        return <div className="error">Failed to load episode</div>
    }

    return (
        <div className="episode-page">
            <MediaInfo item={episode} />
        </div>
    )
}
