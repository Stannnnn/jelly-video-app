import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaFooter } from '../components/MediaFooter'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import { useJellyfinCastCrew } from '../hooks/Jellyfin/useJellyfinCastCrew'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const CollectionPage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: collection, isLoading: isLoadingCollection, error: collectionError } = useJellyfinMediaItem(id)

    const {
        items: children,
        isLoading: isLoadingChildren,
        error: childrenError,
        loadMore,
    } = useJellyfinItemChildren(id)

    const { people, isLoading: isLoadingCastCrew } = useJellyfinCastCrew(id)

    if (isLoadingCollection) {
        return <Loader />
    }

    if (collectionError || !collection) {
        return <div className="error">{collectionError || 'Collection not found'}</div>
    }

    return (
        <div className="media-page collection">
            <MediaInfo item={collection} />
            <div className="media-content">
                <div className="section items">
                    <MediaList
                        items={children || []}
                        isLoading={isLoadingChildren}
                        type="collection"
                        loadMore={loadMore}
                    />
                    {childrenError && <div className="error">{childrenError || 'Collection items not found'}</div>}
                </div>
                {people && people.length > 0 && (
                    <div className="section cast-crew">
                        <div className="container">
                            <div className="title">Cast & Crew</div>
                        </div>
                        <MediaList items={people} isLoading={isLoadingCastCrew} type="person" />
                    </div>
                )}
            </div>
            <MediaFooter item={collection} />
        </div>
    )
}
