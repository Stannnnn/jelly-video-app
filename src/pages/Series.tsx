import { MediaList } from '../components/MediaList'
import { useJellyfinSeriesData } from '../hooks/Jellyfin/Infinite/useJellyfinSeriesData'

export const Series = () => {
    const { items, isLoading, error, loadMore } = useJellyfinSeriesData()

    return (
        <div className="series-page">
            <MediaList items={items} isLoading={isLoading} type="series" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
