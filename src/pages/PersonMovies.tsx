import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinPersonMoviesData } from '../hooks/Jellyfin/Infinite/useJellyfinPersonMoviesData'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'

export const PersonMovies = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()
    const { mediaItem: person, isLoading: isLoadingPerson } = useJellyfinMediaItem(id)
    const { items, isLoading, error, loadMore } = useJellyfinPersonMoviesData(id)

    useEffect(() => {
        if (person?.Name) {
            setPageTitle(`${person.Name} - Movies & Series`)
        }
    }, [person?.Name, setPageTitle])

    if (isLoadingPerson) {
        return <Loader />
    }

    if (error) return <div>{error}</div>
    if (!id) return <div>Person not found.</div>

    return (
        <div className="search-results-page">
            <div className="search-content">
                {(isLoading || items.length > 0) && (
                    <div className="section movies">
                        <div className="title">{person?.Name} - Movies & Series</div>
                        <MediaList items={items} isLoading={isLoading} type="mixed" loadMore={loadMore} />
                    </div>
                )}

                {items.length === 0 && !isLoading && <div>No movies or series found.</div>}
            </div>
        </div>
    )
}
