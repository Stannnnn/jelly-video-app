import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyAddedData } from '../hooks/Jellyfin/Infinite/useJellyfinRecentlyAddedData'

export const RecentlyAdded = () => {
    const { items, isLoading, error, loadMore } = useJellyfinRecentlyAddedData()

    return (
        <div className="recently-added-page">
            <MediaList items={items} isLoading={isLoading} type="series" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
