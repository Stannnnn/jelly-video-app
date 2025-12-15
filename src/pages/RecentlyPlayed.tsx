import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/Jellyfin/Infinite/useJellyfinRecentlyPlayedData'

export const RecentlyPlayed = () => {
    const { items, isLoading, error, loadMore } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-played-page">
            <MediaList items={items} isLoading={isLoading} type="mixedSmall" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
