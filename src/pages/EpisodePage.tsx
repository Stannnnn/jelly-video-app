import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const EpisodePage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: episode, isLoading, error } = useJellyfinMediaItem(id)

    if (isLoading) {
        return <Loader />
    }

    if (error || !episode) {
        return <div className="error">{error || 'Episode not found'}</div>
    }

    return (
        <div className="media-page episode">
            <MediaInfo item={episode} />
            <div className="media-content">
                <div className="section episode"></div>
            </div>
        </div>
    )
}
