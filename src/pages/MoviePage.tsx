import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const MoviePage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()

    const { mediaItem: movie, isLoading, error } = useJellyfinMediaItem(id)

    useEffect(() => {
        if (movie?.Name) {
            setPageTitle(movie.Name)
        }
    }, [movie?.Name, setPageTitle])

    if (isLoading) {
        return <Loader />
    }

    if (error || !movie) {
        return <div className="error">{error || 'Movie not found'}</div>
    }

    return (
        <div className="media-page movie">
            <MediaInfo item={movie} />
            <div className="media-content">
                <div className="section cast-crew">
                    <div className="container">
                        <div className="title">Cast & Crew</div>
                    </div>
                </div>
                <div className="section specials">
                    <div className="container">
                        <div className="title">Specials</div>
                    </div>
                </div>
                <div className="section recommended">
                    <div className="container">
                        <div className="title">Recommended</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
