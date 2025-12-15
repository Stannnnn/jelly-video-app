import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { useJellyfinPersonMovies } from '../hooks/Jellyfin/useJellyfinPersonMovies'

export const PersonPage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()

    const { mediaItem: person, isLoading: isLoadingPerson, error: personError } = useJellyfinMediaItem(id)
    const { items, totalCount, isLoading: isLoadingMovies } = useJellyfinPersonMovies(id, 0, 12)

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
            {totalCount > 0 && (
                <div className="section items">
                    <MediaList items={items || []} isLoading={isLoadingMovies} type="collection" />
                </div>
            )}
        </div>
    )
}
