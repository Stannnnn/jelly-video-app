import { MediaList } from '../components/MediaList'
import { useJellyfinMoviesData } from '../hooks/Jellyfin/Infinite/useJellyfinMoviesData'

export const Movies = () => {
    const { items, isLoading, error, loadMore } = useJellyfinMoviesData()

    return (
        <div className="movies-page">
            <MediaList items={items} isLoading={isLoading} type="movie" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
