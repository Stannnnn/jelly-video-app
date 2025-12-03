import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import './DetailPages.css'

export const CollectionPage = () => {
    const { id } = useParams<{ id: string }>()
    const api = useJellyfinContext()
    const [startIndex, setStartIndex] = useState(0)
    const limit = 40

    const {
        data: collection,
        isLoading: isLoadingCollection,
        error: collectionError,
    } = useQuery({
        queryKey: ['collection', id],
        queryFn: () => api.getItemById(id!),
        enabled: !!id,
    })

    const {
        data: children,
        isLoading: isLoadingChildren,
        error: childrenError,
    } = useQuery({
        queryKey: ['collection-children', id, startIndex],
        queryFn: () => api.getItemChildren(id!, startIndex, limit),
        enabled: !!id,
    })

    if (isLoadingCollection) {
        return <Loader />
    }

    if (collectionError || !collection) {
        return <div className="error">Failed to load collection</div>
    }

    const loadMore = () => {
        if (children && children.length === limit) {
            setStartIndex(prev => prev + limit)
        }
    }

    return (
        <div className="collection-page">
            <MediaInfo item={collection} />
            <div className="collection-children">
                <h2>Items in Collection</h2>
                <MediaList items={children || []} isLoading={isLoadingChildren} type="mixed" loadMore={loadMore} />
                {childrenError && <div className="error">Failed to load collection items</div>}
            </div>
        </div>
    )
}
