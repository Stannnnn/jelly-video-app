import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const EpisodePage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()

    const { mediaItem: episode, isLoading, error } = useJellyfinMediaItem(id)

    useEffect(() => {
        if (episode?.Name) {
            setPageTitle(episode.Name)
        }
    }, [episode?.Name, setPageTitle])

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
                <div className="section more-episodes">
                    <div className="container">
                        <div className="title">More from Season x</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
