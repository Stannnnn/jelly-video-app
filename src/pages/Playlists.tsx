import { MediaList } from '../components/MediaList'
import { useJellyfinPlaylistsData } from '../hooks/Jellyfin/Infinite/useJellyfinPlaylistsData'

export const Playlists = () => {
    const { items, isLoading, error, loadMore } = useJellyfinPlaylistsData()

    return (
        <div className="playlists-page">
            <MediaList items={items} isLoading={isLoading} type="playlist" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
