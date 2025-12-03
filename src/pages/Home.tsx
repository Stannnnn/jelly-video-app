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
                    <div className="title">Continue Watching</div>
                    <MediaList items={recentlyPlayed} isLoading={false} type="series" />
                </div>
            )}
            {recentlyAdded && recentlyAdded.length > 0 && (
                <div className="section">
                    <div className="title">Recently Added</div>
                    <MediaList items={recentlyAdded} isLoading={false} type="series" />
                </div>
            )}
        </div>
    )
}
