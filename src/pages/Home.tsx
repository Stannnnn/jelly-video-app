import { Link } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/Jellyfin/useJellyfinHomeData'

export const Home = () => {
    const { recentlyPlayed, recentlyAddedMovies, recentlyAddedSeries, isLoading, error } = useJellyfinHomeData()

    if (isLoading) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            {recentlyPlayed && recentlyPlayed.length > 0 && (
                <div className="section continue-watching">
                    <div className="container">
                        <div className="title">Continue Watching</div>
                        {recentlyPlayed && recentlyPlayed.length >= 12 && (
                            <Link to="/recently-played" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={recentlyPlayed} isLoading={false} type="mixed" virtuosoType="horizontal" />
                </div>
            )}

            {recentlyAddedMovies && recentlyAddedMovies.length > 0 && (
                <div className="section">
                    <div className="container">
                        <div className="title">Latest Movies</div>
                        {recentlyAddedMovies && recentlyAddedMovies.length >= 18 && (
                            <Link to="/recently-added-movies" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={recentlyAddedMovies} isLoading={false} type="movie" />
                </div>
            )}

            {recentlyAddedSeries && recentlyAddedSeries.length > 0 && (
                <div className="section">
                    <div className="container">
                        <div className="title">Latest Series</div>
                        {recentlyAddedSeries && recentlyAddedSeries.length >= 18 && (
                            <Link to="/recently-added-series" className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={recentlyAddedSeries} isLoading={false} type="series" />
                </div>
            )}
        </div>
    )
}
