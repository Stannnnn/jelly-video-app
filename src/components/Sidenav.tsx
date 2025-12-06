import { GearIcon } from '@primer/octicons-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import '../App.css'
import { useScrollContext } from '../context/ScrollContext/ScrollContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { useJellyfinSearch } from '../hooks/Jellyfin/useJellyfinSearch'
import { InlineLoader } from './InlineLoader'
import { JellyImg } from './JellyImg'
import './Sidenav.css'
import { DownloadingIcon, SearchClearIcon, SearchIcon } from './SvgIcons'

export const Sidenav = (props: { username: string }) => {
    const navigate = useNavigate()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { showSidenav, closeSidenav } = useSidenavContext()

    const { disabled, setDisabled } = useScrollContext()
    const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('search') || '')
    const { searchResults, searchLoading, searchError, searchAttempted } = useJellyfinSearch(searchQuery)

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleClearSearch = () => {
        setSearchQuery('')
    }

    const handleItemClick = (item: MediaItem) => {
        if (item.Type === 'Movie') {
            navigate(`/movie/${item.Id}`)
        } else if (item.Type === 'Series') {
            navigate(`/series/${item.Id}`)
        } else if (item.Type === 'Episode') {
            navigate(`/episode/${item.Id}`)
        } else if (item.Type === 'BoxSet') {
            navigate(`/collection/${item.Id}`)
        }
        closeSidenav()
    }

    // Debounced URL update for search query
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            const params = new URLSearchParams(location.search)

            if (searchQuery) {
                params.set('search', searchQuery)
            } else {
                params.delete('search')
            }

            const newSearch = params.toString()
            const newUrl = newSearch ? `?${newSearch}` : location.pathname
            const currentUrl = location.search || location.pathname

            if (newUrl !== currentUrl) {
                navigate(newUrl, { replace: true })
            }
        }, 200)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery, navigate])

    useEffect(() => {
        const focusSearch = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', focusSearch)
        return () => window.removeEventListener('keydown', focusSearch)
    }, [])

    return (
        <aside className="sidenav">
            <div className={'sidenav_wrapper' + (showSidenav ? ' active' : '') + (disabled ? ' lockscroll' : '')}>
                <div className="sidenav_header">
                    <NavLink to="/" onClick={closeSidenav} className="logo"></NavLink>
                </div>
                <nav className="sidenav_content">
                    <div className="search">
                        <div className="search_header">
                            <div className={`input_container ${searchQuery ? 'active' : ''}`}>
                                <div className="search-icon noSelect">
                                    <SearchIcon width={13} height={13} />
                                </div>
                                <input
                                    type="search"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    ref={searchInputRef}
                                />
                                {!searchLoading && (
                                    <div className="search-clear" onClick={handleClearSearch}>
                                        <SearchClearIcon width={13} height={13} />
                                    </div>
                                )}
                                {searchLoading && (
                                    <div className="search-loading noSelect">
                                        <InlineLoader />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="search_results">
                            {searchQuery && (
                                <>
                                    {searchError && <div className="indicator error">{searchError}</div>}
                                    {!searchLoading &&
                                        searchAttempted &&
                                        !searchError &&
                                        searchResults.length === 0 && (
                                            <div className="empty">
                                                Search for <span className="keyword">'{searchQuery}'</span> yields no
                                                results
                                            </div>
                                        )}
                                    {!searchLoading && !searchError && searchResults.length > 0 && (
                                        <div className="results noSelect">
                                            {searchResults.map(item => {
                                                const itemClass = ''

                                                return (
                                                    <div
                                                        key={`${item.Type}-${item.Id}`}
                                                        onClick={() => handleItemClick(item)}
                                                        className={`result ${itemClass}`}
                                                    >
                                                        <div className="result_image">
                                                            <JellyImg
                                                                item={item}
                                                                type="Primary"
                                                                width={60}
                                                                height={60}
                                                            />
                                                        </div>
                                                        <div className="result_info">
                                                            <div className="result_name">{item.Name}</div>
                                                            <div className="result_type">
                                                                {item.Type === 'Movie' && 'Movie'}
                                                                {item.Type === 'Series' && 'Series'}
                                                                {item.Type === 'Episode' &&
                                                                    `Episode • ${item.SeriesName || ''}`}
                                                                {item.Type === 'BoxSet' && 'Collection'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div className="additional">
                                                <div
                                                    className="see-all"
                                                    onClick={() => {
                                                        navigate(`/search/${encodeURIComponent(searchQuery)}`)
                                                        closeSidenav()
                                                    }}
                                                >
                                                    See all results for '{searchQuery}'
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <ul className="links noSelect">
                        <li>
                            <NavLink to="/" onClick={closeSidenav}>
                                Home
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/movies" onClick={closeSidenav}>
                                Movies
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/shows" onClick={closeSidenav}>
                                Shows
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/favorites" onClick={closeSidenav}>
                                Favorites
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/collections" onClick={closeSidenav}>
                                Collections
                            </NavLink>
                        </li>
                    </ul>
                </nav>
                <div className="sidenav_footer">
                    <div className="account">
                        <div className="status">
                            <div className="indicator">Connected</div>
                            <div className="username" title={props.username}>
                                {props.username}
                            </div>
                        </div>
                        <div className="actions">
                            <NavLink to="/synced" className="icon synced" onClick={closeSidenav} title="Synced">
                                <DownloadingIcon width={16} height={16} />
                            </NavLink>
                            <NavLink to="/settings" className="icon settings" onClick={closeSidenav} title="Settings">
                                <GearIcon size={16} />
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
