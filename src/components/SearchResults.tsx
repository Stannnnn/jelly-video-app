import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinSearchDetailed } from '../hooks/Jellyfin/useJellyfinSearchDetailed'

export const SearchResults = () => {
    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const { results, loading, error } = useJellyfinSearchDetailed(query)

    useEffect(() => {
        if (query) {
            setPageTitle(`Search results for '${query}'`)
        }

        return () => setPageTitle('')
    }, [query, setPageTitle])

    if (loading) return <Loader />
    if (error) return <div>{error}</div>
    if (!query) return <div>Enter a search query to see results.</div>

    return (
        <div className="search-results-page">
            {results.movies.length > 0 && (
                <div className="section movies">
                    <div className="container">
                        <div className="title">Movies</div>
                        {results.movies.length >= 12 && (
                            <Link to={`/search/${encodeURIComponent(query)}/movies`} className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={results.movies} isLoading={loading} type="movie" />
                </div>
            )}

            {results.series.length > 0 && (
                <div className="section series">
                    <div className="container">
                        <div className="title">Series</div>
                        {results.series.length >= 12 && (
                            <Link to={`/search/${encodeURIComponent(query)}/series`} className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={results.series} isLoading={loading} type="series" />
                </div>
            )}

            {results.collections.length > 0 && (
                <div className="section collections">
                    <div className="container">
                        <div className="title">Collections</div>
                        {results.collections.length >= 12 && (
                            <Link to={`/search/${encodeURIComponent(query)}/collections`} className="see-more noSelect">
                                See more
                            </Link>
                        )}
                    </div>
                    <MediaList items={results.collections} isLoading={loading} type="collection" />
                </div>
            )}

            {results.movies.length === 0 &&
                results.series.length === 0 &&
                results.collections.length === 0 && <div>No results found for '{query}'.</div>}
        </div>
    )
}
