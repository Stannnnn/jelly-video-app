import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinSearchEpisodesData } from '../hooks/Jellyfin/Infinite/useJellyfinSearchEpisodesData'

export const SearchEpisodes = () => {
    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const { items, isLoading, error, loadMore } = useJellyfinSearchEpisodesData(query || '')

    useEffect(() => {
        if (query) {
            setPageTitle(`Episodes matching '${query}'`)
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
                    <div className="section episodes">
                        <div className="title">Episodes matching '{query}'</div>
                        <MediaList items={items} isLoading={isLoading} type="episode" loadMore={loadMore} />
                    </div>
                )}

                {items.length === 0 && !isLoading && <div>No episodes found for '{query}'.</div>}
            </div>
        </div>
    )
}
