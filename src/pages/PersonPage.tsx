import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinPersonMoviesData } from '../hooks/Jellyfin/Infinite/useJellyfinPersonMoviesData'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'

export const PersonPage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()

    const { mediaItem: person, isLoading: isLoadingPerson, error: personError } = useJellyfinMediaItem(id)
    const { items, isLoading, error, loadMore } = useJellyfinPersonMoviesData(id)

    useEffect(() => {
        if (person?.Name) {
            setPageTitle(person.Name)
        }
    }, [person?.Name, setPageTitle])

    if (isLoadingPerson) {
        return <Loader />
    }

    if (personError || !person) {
        return <div className="error">{personError || 'Person not found'}</div>
    }

    return (
        <div className="person-page">
            <MediaList items={items} isLoading={isLoading} type="collection" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
