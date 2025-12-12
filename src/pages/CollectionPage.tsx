import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/useJellyfinItemChildren'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const CollectionPage = () => {
    const { id } = useParams<{ id: string }>()
    const { setPageTitle } = usePageTitle()
    const [startIndex, setStartIndex] = useState(0)
    const limit = 42

    const { mediaItem: collection, isLoading: isLoadingCollection, error: collectionError } = useJellyfinMediaItem(id)

    useEffect(() => {
        if (collection?.Name) {
            setPageTitle(collection.Name)
        }
    }, [collection?.Name, setPageTitle])

    const {
        children,
        isLoading: isLoadingChildren,
        error: childrenError,
    } = useJellyfinItemChildren(id, startIndex, limit)

    if (isLoadingCollection) {
        return <Loader />
    }

    if (collectionError || !collection) {
        return <div className="error">{collectionError || 'Collection not found'}</div>
    }

    const loadMore = () => {
        if (children && children.length === limit) {
            setStartIndex(prev => prev + limit)
        }
    }

    return (
        <div className="media-page collection">
            <MediaInfo item={collection} />
            <div className="media-content">
                <div className="section movie">
                    <div className="container">
                        <div className="title">Movies</div>
                    </div>
                    <MediaList
                        items={children || []}
                        isLoading={isLoadingChildren}
                        type="collection"
                        loadMore={loadMore}
                    />
                    {childrenError && <div className="error">{childrenError || 'Collection items not found'}</div>}
                </div>

                <div className="section series">
                    <div className="container">
                        <div className="title">Series</div>
                    </div>
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
