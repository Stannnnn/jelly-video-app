import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SidenavContext } from './SidenavContext'

export type ISidenavContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [showSidenav, setShowSidenav] = useState(false)
    const location = useLocation()

    // Close sidenav on route change if location is provided
    useEffect(() => {
        if (location?.pathname) {
            setShowSidenav(false)
        }
    }, [location?.pathname])

    // Toggle lockscroll on body
    useEffect(() => {
        if (showSidenav) {
            document.body.classList.add('lockscroll')
        } else {
            document.body.classList.remove('lockscroll')
        }

        return () => {
            document.body.classList.remove('lockscroll')
        }
    }, [showSidenav])

    const toggleSidenav = () => {
        setShowSidenav(current => !current)
    }

    const closeSidenav = () => {
        setShowSidenav(false)
    }

    // Playlist link toggle
    const [enablePlaylists, setEnablePlaylists] = useState(localStorage.getItem('enablePlaylists') === 'on')
    useEffect(() => {
        localStorage.setItem('enablePlaylists', enablePlaylists ? 'on' : 'off')
    }, [enablePlaylists])

    return { showSidenav, toggleSidenav, closeSidenav, enablePlaylists, setEnablePlaylists }
}

export const SidenavContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <SidenavContext.Provider value={initialState}>{children}</SidenavContext.Provider>
}
