import { Loader } from '../components/Loader'
import { useJellyfinHomeData } from '../hooks/Jellyfin/useJellyfinHomeData'
import VideoPlayer from '../VideoPlayer'

export const Home = () => {
    const { recentlyPlayed, frequentlyPlayed, recentlyAdded, recentGenres, isLoading, error } = useJellyfinHomeData()

    if (isLoading) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            <VideoPlayer />
        </div>
    )
}
