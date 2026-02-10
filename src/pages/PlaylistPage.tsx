import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaFooter } from '../components/MediaFooter'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinPlaylistChildren } from '../hooks/Jellyfin/Infinite/useJellyfinPlaylistChildren'
import { useJellyfinCastCrew } from '../hooks/Jellyfin/useJellyfinCastCrew'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const PlaylistPage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: playlist, isLoading: isLoadingPlaylist, error: playlistError } = useJellyfinMediaItem(id)

    const {
        items: children,
        isLoading: isLoadingChildren,
        error: childrenError,
        loadMore,
    } = useJellyfinPlaylistChildren(id)

    const { people, isLoading: isLoadingCastCrew } = useJellyfinCastCrew(id)

    if (isLoadingPlaylist) {
        return <Loader />
    }

    if (playlistError || !playlist) {
        return <div className="error">{playlistError || 'Playlist not found'}</div>
    }

    return (
        <div className="media-page playlist">
            <MediaInfo item={playlist} />
            <div className="media-content">
                <div className="section items">
                    <MediaList
                        items={children || []}
                        isLoading={isLoadingChildren}
                        type="mixedSmall"
                        loadMore={loadMore}
                    />
                    {childrenError && <div className="error">{childrenError || 'Playlist items not found'}</div>}
                </div>
                {(isLoadingCastCrew || (people && people.length > 0)) && (
                    <div className="section cast-crew">
                        <div className="container">
                            <div className="title">Cast & Crew</div>
                        </div>
                        <MediaList items={people} isLoading={isLoadingCastCrew} type="person" />
                    </div>
                )}
            </div>
            <MediaFooter item={playlist} />
        </div>
    )
}
