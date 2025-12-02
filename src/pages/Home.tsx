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
                <section className="home-section">
                    <h2 className="section-title">Continue Watching</h2>
                    <MediaList items={recentlyPlayed} isLoading={false} type="series" />
                </section>
            )}
            {recentlyAdded && recentlyAdded.length > 0 && (
                <section className="home-section">
                    <h2 className="section-title">Recently Added</h2>
                    <MediaList items={recentlyAdded} isLoading={false} type="series" />
                </section>
            )}
        </div>
    )
}
