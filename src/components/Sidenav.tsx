import { GearIcon } from '@primer/octicons-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import '../App.css'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { buildUrlWithSavedFilters } from '../context/FilterContext/FilterContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useScrollContext } from '../context/ScrollContext/ScrollContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { useJellyfinSearch } from '../hooks/Jellyfin/useJellyfinSearch'
import { useUpdateChecker } from '../hooks/useUpdateChecker'
import { InlineLoader } from './InlineLoader'
import { JellyImg } from './JellyImg'
import './Sidenav.css'
import { Squircle } from './Squircle'
import { DownloadingIcon, SearchClearIcon, SearchIcon } from './SvgIcons'

export const Sidenav = (props: { username: string }) => {
    const navigate = useNavigate()
    const { checkForUpdates } = usePlaybackContext()

    const { updateStatus } = useUpdateChecker(checkForUpdates)
    const location = useLocation()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { showSidenav, closeSidenav } = useSidenavContext()

    const { disabled, setDisabled } = useScrollContext()
    const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('search') || '')
    const { searchResults, searchLoading, searchError, searchAttempted } = useJellyfinSearch(searchQuery)
    const { storageStats, queueCount } = useDownloadContext()

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleClearSearch = () => {
        setSearchQuery('')
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
                    <ul className="links noSelect">
                        <li>
                            <NavLink to="/" onClick={closeSidenav}>
                                Home
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to={buildUrlWithSavedFilters('/movies')} onClick={closeSidenav}>
                                Movies
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to={buildUrlWithSavedFilters('/series')} onClick={closeSidenav} end>
                                Series
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to={buildUrlWithSavedFilters('/favorites')} onClick={closeSidenav}>
                                Favorites
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to={buildUrlWithSavedFilters('/collections')} onClick={closeSidenav}>
                                Collections
                            </NavLink>
                        </li>
                    </ul>
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
                                                return (
                                                    <NavLink
                                                        key={`${item.Type}-${item.Id}`}
                                                        to={
                                                            item.Type === 'Movie'
                                                                ? `/movie/${item.Id}`
                                                                : item.Type === 'Series'
                                                                  ? `/series/${item.Id}`
                                                                  : item.Type === 'Episode'
                                                                    ? `/episode/${item.Id}`
                                                                    : item.Type === 'BoxSet'
                                                                      ? `/collection/${item.Id}`
                                                                      : '#'
                                                        }
                                                        onClick={closeSidenav}
                                                        className="result"
                                                    >
                                                        <Squircle
                                                            width={36}
                                                            height={54}
                                                            cornerRadius={5}
                                                            className="thumbnail-container"
                                                        >
                                                            <JellyImg
                                                                item={item}
                                                                type="Primary"
                                                                width={36}
                                                                height={54}
                                                            />
                                                        </Squircle>
                                                        <div className="details">
                                                            <div className="title" title={item.Name}>
                                                                {item.Name}
                                                            </div>
                                                            <div className="container">
                                                                <div className="type">
                                                                    {item.Type === 'Movie' && 'Movie'}
                                                                    {item.Type === 'Series' && 'Series'}
                                                                    {item.Type === 'Episode' &&
                                                                        `Episode - ${item.SeriesName || ''}`}
                                                                    {item.Type === 'BoxSet' && 'Collection'}
                                                                </div>
                                                                <div className="divider"></div>
                                                                <div
                                                                    className="date"
                                                                    title={
                                                                        item.PremiereDate &&
                                                                        !isNaN(Date.parse(item.PremiereDate))
                                                                            ? new Date(item.PremiereDate)
                                                                                  .getFullYear()
                                                                                  .toString()
                                                                            : ''
                                                                    }
                                                                >
                                                                    {item.PremiereDate
                                                                        ? new Date(item.PremiereDate).getFullYear()
                                                                        : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </NavLink>
                                                )
                                            })}
                                            <div className="additional">
                                                <Link
                                                    to={`/search/${encodeURIComponent(searchQuery)}`}
                                                    className="textlink"
                                                >
                                                    See all results for <span className="keyword">'{searchQuery}'</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
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
                            <NavLink
                                to="/downloads"
                                className={`icon downloads ${queueCount > 0 ? 'downloading' : ''}`}
                                onClick={closeSidenav}
                                title={`Downloads - ${storageStats.trackCount} Video${
                                    storageStats.trackCount === 1 ? '' : 's'
                                }${
                                    queueCount > 0
                                        ? ` (${queueCount} video${queueCount === 1 ? '' : 's'} in queue)`
                                        : ''
                                }`}
                            >
                                <DownloadingIcon width={16} height={16} />
                            </NavLink>
                            <NavLink
                                to="/settings"
                                className="icon settings"
                                onClick={closeSidenav}
                                title={updateStatus === 'available' ? 'Settings - Update available!' : 'Settings'}
                            >
                                <GearIcon size={16} />
                                {updateStatus === 'available' && (
                                    <div className="update-checker">
                                        <div className="dot" />
                                    </div>
                                )}
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
