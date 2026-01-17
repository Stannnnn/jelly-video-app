import { Link } from 'react-router-dom'
import { HorizontalScroller } from '../components/HorizontalScroller'
import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyAddedMovies } from '../hooks/Jellyfin/useJellyfinRecentlyAddedMovies'
import { useJellyfinRecentlyAddedSeries } from '../hooks/Jellyfin/useJellyfinRecentlyAddedSeries'
import { useJellyfinRecentlyPlayed } from '../hooks/Jellyfin/useJellyfinRecentlyPlayed'

export const Home = () => {
    const {
        recentlyPlayed,
        isLoading: isLoadingRecentlyPlayed,
        error: errorRecentlyPlayed,
    } = useJellyfinRecentlyPlayed()
    const { recentlyAddedMovies, isLoading: isLoadingMovies, error: errorMovies } = useJellyfinRecentlyAddedMovies()
    const { recentlyAddedSeries, isLoading: isLoadingSeries, error: errorSeries } = useJellyfinRecentlyAddedSeries()

    const error = errorRecentlyPlayed || errorMovies || errorSeries

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            {(isLoadingRecentlyPlayed || (recentlyPlayed && recentlyPlayed.length > 0)) && (
                <div className="section continue-watching">
                    <div className="container">
                        <div className="title">Continue Watching</div>
                        {recentlyPlayed && recentlyPlayed.length >= 12 && (
                            <Link to="/recently-played" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <HorizontalScroller
                        items={recentlyPlayed}
                        isLoading={isLoadingRecentlyPlayed}
                        type="mixed"
                        itemWidth={304}
                    />
                </div>
            )}

            {(isLoadingMovies || (recentlyAddedMovies && recentlyAddedMovies.length > 0)) && (
                <div className="section">
                    <div className="container">
                        <div className="title">Latest Movies</div>
                        {recentlyAddedMovies && recentlyAddedMovies.length >= 18 && (
                            <Link to="/recently-added-movies" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={recentlyAddedMovies} isLoading={isLoadingMovies} type="movie" />
                </div>
            )}

            {(isLoadingSeries || (recentlyAddedSeries && recentlyAddedSeries.length > 0)) && (
                <div className="section">
                    <div className="container">
                        <div className="title">Latest Series</div>
                        {recentlyAddedSeries && recentlyAddedSeries.length >= 18 && (
                            <Link to="/recently-added-series" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={recentlyAddedSeries} isLoading={isLoadingSeries} type="series" />
                </div>
            )}
        </div>
    )
}
