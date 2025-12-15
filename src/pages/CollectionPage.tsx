import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const CollectionPage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()

    const { mediaItem: collection, isLoading: isLoadingCollection, error: collectionError } = useJellyfinMediaItem(id)

    useEffect(() => {
        if (collection?.Name) {
            setPageTitle(collection.Name)
        }
    }, [collection?.Name, setPageTitle])

    const {
        items: children,
        isLoading: isLoadingChildren,
        error: childrenError,
        loadMore,
    } = useJellyfinItemChildren(id)

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
            </div>
        </div>
    )
}
