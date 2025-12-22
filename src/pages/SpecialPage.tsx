import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaFooter } from '../components/MediaFooter'
import { MediaInfo } from '../components/MediaInfo'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const SpecialPage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: special, isLoading, error } = useJellyfinMediaItem(id)

    if (isLoading) {
        return <Loader />
    }

    if (error || !special) {
        return <div className="error">{error || 'Special not found'}</div>
    }

    return (
        <div className="media-page special">
            <MediaInfo item={special} />
            <MediaFooter item={special} />
        </div>
    )
}
