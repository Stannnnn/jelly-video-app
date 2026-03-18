import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const LibraryPage = () => {
    const { id } = useParams<{ id: string }>()
    const { jellySort } = useFilterContext()
    const { setPageTitle } = usePageTitle()
    const { mediaItem: library } = useJellyfinMediaItem(id)

    useEffect(() => {
        if (library?.Name) {
            setPageTitle(library.Name)
        }
    }, [library?.Name, setPageTitle])

    const { items, isLoading, error, loadMore } = useJellyfinItemChildren(
        id,
        undefined,
        jellySort.sortBy,
        jellySort.sortOrder
    )

    const mediaListType = library?.CollectionType === 'playlists' ? 'playlist' : 'collection'

    return (
        <div className="library-page">
            <MediaList items={items || []} isLoading={isLoading} type={mediaListType} loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
