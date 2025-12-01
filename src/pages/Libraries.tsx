import { MediaList } from '../components/MediaList'
import { useJellyfinLibrariesData } from '../hooks/Jellyfin/Infinite/useJellyfinLibrariesData'

export const Libraries = () => {
    const { items, isLoading, error, loadMore } = useJellyfinLibrariesData()

    return (
        <div className="albums-page">
            <MediaList items={items} isLoading={isLoading} type="album" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
