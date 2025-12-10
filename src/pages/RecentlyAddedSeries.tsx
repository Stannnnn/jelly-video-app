import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyAddedSeriesData } from '../hooks/Jellyfin/Infinite/useJellyfinRecentlyAddedSeriesData'

export const RecentlyAddedSeries = () => {
    const { items, isLoading, error, loadMore } = useJellyfinRecentlyAddedSeriesData()

    return (
        <div className="recently-added-series-page">
            <MediaList items={items} isLoading={isLoading} type="series" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
