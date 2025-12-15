import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinEpisodes } from '../hooks/Jellyfin/useJellyfinEpisodes'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const EpisodePage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: episode, isLoading, error } = useJellyfinMediaItem(id)

    const { episodes: seasonEpisodes, isLoading: isLoadingEpisodes } = useJellyfinEpisodes(episode?.SeasonId || null)

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
                        <div className="title">More from {episode.SeasonName || 'Season'}</div>
                    </div>
                    <MediaList
                        parentItem={episode}
                        items={seasonEpisodes || []}
                        isLoading={isLoadingEpisodes}
                        type="episode"
                    />
                </div>
            </div>
        </div>
    )
}
