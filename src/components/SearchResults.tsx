import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinSearchDetailed } from '../hooks/Jellyfin/useJellyfinSearchDetailed'
import './SearchResults.css'

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
            <div className="search-content">
                {results.movies.length > 0 && (
                    <div className="section movies">
                        <div className="title">Movies</div>
                        <MediaList items={results.movies} isLoading={loading} type="movie" />
                        {results.movies.length >= 10 && (
                            <div className="view-all">
                                <Link to={`/search/${encodeURIComponent(query)}/movies`} className="textlink">
                                    View all movies
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {results.series.length > 0 && (
                    <div className="section series">
                        <div className="title">Series</div>
                        <MediaList items={results.series} isLoading={loading} type="series" />
                        {results.series.length >= 10 && (
                            <div className="view-all">
                                <Link to={`/search/${encodeURIComponent(query)}/series`} className="textlink">
                                    View all series
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {results.episodes.length > 0 && (
                    <div className="section episodes">
                        <div className="title">Episodes</div>
                        <MediaList items={results.episodes} isLoading={loading} type="episode" />
                        {results.episodes.length >= 10 && (
                            <div className="view-all">
                                <Link to={`/search/${encodeURIComponent(query)}/episodes`} className="textlink">
                                    View all episodes
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {results.collections.length > 0 && (
                    <div className="section collections">
                        <div className="title">Collections</div>
                        <MediaList items={results.collections} isLoading={loading} type="collection" />
                        {results.collections.length >= 10 && (
                            <div className="view-all">
                                <Link to={`/search/${encodeURIComponent(query)}/collections`} className="textlink">
                                    View all collections
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {results.movies.length === 0 &&
                    results.series.length === 0 &&
                    results.episodes.length === 0 &&
                    results.collections.length === 0 && <div>No results found for '{query}'.</div>}
            </div>
        </div>
    )
}
