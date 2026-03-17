import { useParams } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const LibraryPage = () => {
    const { id } = useParams<{ id: string }>()
    const { jellySort } = useFilterContext()

    const { mediaItem: library } = useJellyfinMediaItem(id)
    const { items, isLoading, error, loadMore } = useJellyfinItemChildren(
        id,
        undefined,
        jellySort.sortBy,
        jellySort.sortOrder
    )

    return (
        <div className="media-page library">
            <div className="media-content">
                <div className="section items">
                    {library && (
                        <div className="container">
                            <div className="title">{library.Name}</div>
                        </div>
                    )}
                    <MediaList items={items || []} isLoading={isLoading} type="collection" loadMore={loadMore} />
                    {error && <div className="error">{error}</div>}
                </div>
            </div>
        </div>
    )
}
