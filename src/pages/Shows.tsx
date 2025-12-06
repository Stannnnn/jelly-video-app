import { MediaList } from '../components/MediaList'
import { useJellyfinShowsData } from '../hooks/Jellyfin/Infinite/useJellyfinShowsData'

export const Shows = () => {
    const { items, isLoading, error, loadMore } = useJellyfinShowsData()

    return (
        <div className="shows-page">
            <MediaList items={items} isLoading={isLoading} type="series" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
