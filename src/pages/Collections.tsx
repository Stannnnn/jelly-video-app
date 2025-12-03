import { MediaList } from '../components/MediaList'
import { useJellyfinCollectionsData } from '../hooks/Jellyfin/Infinite/useJellyfinCollectionsData'

export const Collections = () => {
    const { items, isLoading, error, loadMore } = useJellyfinCollectionsData()

    return (
        <div className="collections-page">
            <MediaList items={items} isLoading={isLoading} type="collection" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
