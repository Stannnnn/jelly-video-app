import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyAddedMoviesData } from '../hooks/Jellyfin/Infinite/useJellyfinRecentlyAddedMoviesData'

export const RecentlyAddedMovies = () => {
    const { items, isLoading, error, loadMore } = useJellyfinRecentlyAddedMoviesData()

    return (
        <div className="recently-added-movies-page">
            <MediaList items={items} isLoading={isLoading} type="movie" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
