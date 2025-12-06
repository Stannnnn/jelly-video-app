import { MediaList } from '../components/MediaList'
import { KindState, useFilterContext } from '../context/FilterContext/FilterContext'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/Infinite/useJellyfinFavoritesData'

export const Favorites = () => {
    const { items, isLoading, error, loadMore } = useJellyfinFavoritesData()
    const { filter } = useFilterContext()

    const getMediaListType = () => {
        switch (filter.kind) {
            case KindState.Movies:
                return 'movie'
            case KindState.Series:
                return 'series'
            case KindState.Episodes:
                return 'episode'
            case KindState.Collections:
                return 'collection'
            default:
                return 'mixed'
        }
    }

    return (
        <div className="favorites-page">
            <MediaList items={items} isLoading={isLoading} type={getMediaListType()} loadMore={loadMore} />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
