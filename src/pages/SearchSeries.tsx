import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinSearchSeriesData } from '../hooks/Jellyfin/Infinite/useJellyfinSearchSeriesData'

export const SearchSeries = () => {
    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const { items, isLoading, error, loadMore } = useJellyfinSearchSeriesData(query || '')

    useEffect(() => {
        if (query) {
            setPageTitle(`Series matching '${query}'`)
        }

        return () => setPageTitle('')
    }, [query, setPageTitle])

    if (isLoading && items.length === 0) return <Loader />
    if (error) return <div>{error}</div>
    if (!query) return <div>Enter a search query to see results.</div>

    return (
        <div className="search-results-page">
            <div className="search-content">
                {(isLoading || items.length > 0) && (
                    <MediaList items={items} isLoading={isLoading} type="series" loadMore={loadMore} />
                )}

                {items.length === 0 && !isLoading && <div>No series found for '{query}'.</div>}
            </div>
        </div>
    )
}
