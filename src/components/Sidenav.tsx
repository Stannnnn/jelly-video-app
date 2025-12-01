import { GearIcon } from '@primer/octicons-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import '../App.css'
import { useScrollContext } from '../context/ScrollContext/ScrollContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import './Sidenav.css'
import { SearchIcon } from './SvgIcons'

export const Sidenav = (props: { username: string }) => {
    const navigate = useNavigate()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { showSidenav, closeSidenav } = useSidenavContext()

    const { disabled, setDisabled } = useScrollContext()
    const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('search') || '')

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
                            <NavLink to="/a" onClick={closeSidenav}>
                                Libraries
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/b" onClick={closeSidenav}>
                                Collections
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/c" onClick={closeSidenav}>
                                Favorites
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
                            </div>
                        </div>
                        <div className="search_results">{searchQuery && <></>}</div>
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
