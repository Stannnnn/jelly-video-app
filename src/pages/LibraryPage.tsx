import { useParams } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import './MediaPages.css'

export const LibraryPage = () => {
    const { id } = useParams<{ id: string }>()
    const { jellySort } = useFilterContext()

    const { items, isLoading, error, loadMore } = useJellyfinItemChildren(
        id,
        undefined,
        jellySort.sortBy,
        jellySort.sortOrder
    )

    return (
        <div className="library-page">
            <MediaList items={items || []} isLoading={isLoading} type="collection" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
