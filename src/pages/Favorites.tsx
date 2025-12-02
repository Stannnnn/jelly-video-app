import { MediaList } from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/Infinite/useJellyfinFavoritesData'

export const Favorites = () => {
    const { items, isLoading, error, loadMore } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            <MediaList items={items} isLoading={isLoading} type="movie" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
