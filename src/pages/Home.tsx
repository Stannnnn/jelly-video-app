import { Link } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/Jellyfin/useJellyfinHomeData'

export const Home = () => {
    const { recentlyPlayed, recentlyAdded, isLoading, error } = useJellyfinHomeData()

    if (isLoading) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            {recentlyPlayed && recentlyPlayed.length > 0 && (
                <div className="section">
                    <div className="container">
                        <div className="title">Continue Watching</div>
                        <Link to="/recently-played" className="see-more noSelect">
                            See more
                        </Link>
                    </div>
                    <MediaList items={recentlyPlayed} isLoading={false} type="mixed" virtuosoType="horizontal" />
                </div>
            )}
            {recentlyAdded && recentlyAdded.length > 0 && (
                <div className="section">
                    <div className="container">
                        <div className="title">Recently Added</div>
                        <Link to="/recently-added" className="see-more noSelect">
                            See more
                        </Link>
                    </div>
                    <MediaList items={recentlyAdded} isLoading={false} type="mixed" />
                </div>
            )}
        </div>
    )
}
