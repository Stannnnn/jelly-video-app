import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaFooter } from '../components/MediaFooter'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinItemChildren } from '../hooks/Jellyfin/Infinite/useJellyfinItemChildren'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import './MediaPages.css'

export const LibraryPage = () => {
    const { id } = useParams<{ id: string }>()

    const { mediaItem: library, isLoading: isLoadingLibrary, error: libraryError } = useJellyfinMediaItem(id)

    const {
        items: children,
        isLoading: isLoadingChildren,
        error: childrenError,
        loadMore,
    } = useJellyfinItemChildren(id)

    if (isLoadingLibrary) {
        return <Loader />
    }

    if (libraryError || !library) {
        return <div className="error">{libraryError || 'Library not found'}</div>
    }

    return (
        <div className="media-page collection">
            <MediaInfo item={library} playParentId={id} />
            <div className="media-content">
                <div className="section items">
                    <MediaList
                        items={children || []}
                        isLoading={isLoadingChildren}
                        type="collection"
                        loadMore={loadMore}
                    />
                    {childrenError && <div className="error">{childrenError || 'Library items not found'}</div>}
                </div>
            </div>
            <MediaFooter item={library} />
        </div>
    )
}
