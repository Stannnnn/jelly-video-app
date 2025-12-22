import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaFooter } from '../components/MediaFooter'
import { MediaList } from '../components/MediaList'
import { useJellyfinCastCrew } from '../hooks/Jellyfin/useJellyfinCastCrew'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { useJellyfinSimilarItems } from '../hooks/Jellyfin/useJellyfinSimilarItems'
import { useJellyfinSpecials } from '../hooks/Jellyfin/useJellyfinSpecials'
import './MediaPages.css'

export const MoviePage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: movie, isLoading, error } = useJellyfinMediaItem(id)
    const { specials, isLoading: isLoadingSpecials } = useJellyfinSpecials(id)
    const { people, isLoading: isLoadingCastCrew } = useJellyfinCastCrew(id)
    const { similarItems, isLoading: isLoadingSimilar } = useJellyfinSimilarItems(id)

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
                {specials && specials.length > 0 && (
                    <div className="section specials">
                        <div className="container">
                            <div className="title">Specials</div>
                        </div>
                        <MediaList items={specials} isLoading={isLoadingSpecials} type="specials" />
                    </div>
                )}
                {people && people.length > 0 && (
                    <div className="section cast-crew">
                        <div className="container">
                            <div className="title">Cast & Crew</div>
                        </div>
                        <MediaList items={people} isLoading={isLoadingCastCrew} type="person" />
                    </div>
                )}
                {similarItems && similarItems.length > 0 && (
                    <div className="section recommended">
                        <div className="container">
                            <div className="title">Recommended</div>
                        </div>
                        <MediaList items={similarItems} isLoading={isLoadingSimilar} type="movie" />
                    </div>
                )}
            </div>
            <MediaFooter item={movie} />
        </div>
    )
}
