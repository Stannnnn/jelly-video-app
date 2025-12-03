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
                    <div className="section-header">
                        <div className="container">
                            <div className="section_title">Continue Watching</div>
                            <div className="section_desc">Pick up where you left off</div>
                        </div>
                        <Link to="/recently-played" className="see-more noSelect">
                            See more
                        </Link>
                    </div>
                    <MediaList items={recentlyPlayed} isLoading={false} type="series" />
                </div>
            )}
            {recentlyAdded && recentlyAdded.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <div className="container">
                            <div className="section_title">Recently Added</div>
                            <div className="section_desc">Newly added to your library</div>
                        </div>
                        <Link to="/recently-added" className="see-more noSelect">
                            See more
                        </Link>
                    </div>
                    <MediaList items={recentlyAdded} isLoading={false} type="series" />
                </div>
            )}
        </div>
    )
}
