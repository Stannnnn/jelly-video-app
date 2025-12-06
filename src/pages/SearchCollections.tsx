import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinSearchCollectionsData } from '../hooks/Jellyfin/Infinite/useJellyfinSearchCollectionsData'

export const SearchCollections = () => {
    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const { items, isLoading, error, loadMore } = useJellyfinSearchCollectionsData(query || '')

    useEffect(() => {
        if (query) {
            setPageTitle(`Collections matching '${query}'`)
        }

        return () => setPageTitle('')
    }, [query, setPageTitle])

    if (isLoading && items.length === 0) return <Loader />
    if (error) return <div>{error}</div>
    if (!query) return <div>Enter a search query to see results.</div>

    return (
        <div className="search-results-page">
            <div className="search-content">
                {items.length > 0 && (
                    <div className="section collections">
                        <div className="title">Collections matching '{query}'</div>
                        <MediaList items={items} isLoading={isLoading} type="collection" loadMore={loadMore} />
                    </div>
                )}

                {items.length === 0 && !isLoading && <div>No collections found for '{query}'.</div>}
            </div>
        </div>
    )
}
