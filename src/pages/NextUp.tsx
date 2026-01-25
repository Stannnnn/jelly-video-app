import { MediaList } from '../components/MediaList'
import { useJellyfinNextUpData } from '../hooks/Jellyfin/Infinite/useJellyfinNextUpData'

export const NextUp = () => {
    const { items, isLoading, error, loadMore } = useJellyfinNextUpData()

    return (
        <div className="next-up-page">
            <MediaList items={items} isLoading={isLoading} type="mixedSmall" loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
