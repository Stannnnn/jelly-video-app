import '@fontsource-variable/inter'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Main } from './components/Main'
import './components/MediaList.css'
import { Sidenav } from './components/Sidenav'
import { AudioStorageContextProvider } from './context/AudioStorageContext/AudioStorageContextProvider'
import { HistoryContextProvider } from './context/HistoryContext/HistoryContextProvider'
import { JellyfinContextProvider } from './context/JellyfinContext/JellyfinContextProvider'
import { PageTitleProvider } from './context/PageTitleContext/PageTitleProvider'
import { usePlaybackContext } from './context/PlaybackContext/PlaybackContext'
import { PlaybackContextProvider } from './context/PlaybackContext/PlaybackContextProvider'
import { ScrollContextProvider } from './context/ScrollContext/ScrollContextProvider'
import { useSidenavContext } from './context/SidenavContext/SidenavContext'
import { SidenavContextProvider } from './context/SidenavContext/SidenavContextProvider'
import { ThemeContextProvider } from './context/ThemeContext/ThemeContextProvider'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { Collections } from './pages/Collections'
import { Favorites } from './pages/Favorites'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Movies } from './pages/Movies'
import { Settings } from './pages/Settings'
import { Shows } from './pages/Shows'
import { persister, queryClient } from './queryClient'
import { VideoPlayer } from './VideoPlayer'

export const App = () => {
    return (
        <ErrorBoundary>
            {window.__NPM_LIFECYCLE_EVENT__ === 'dev:nocache' ? (
                <QueryClientProvider client={queryClient}>
                    <RoutedApp />
                </QueryClientProvider>
            ) : (
                <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
                    <RoutedApp />
                </PersistQueryClientProvider>
            )}
        </ErrorBoundary>
    )
}

const RoutedApp = () => {
    const [auth, setAuth] = useState<AuthData | null>(() => {
        const savedAuth = localStorage.getItem('auth')
        return savedAuth ? JSON.parse(savedAuth) : null
    })
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const queryClient = useQueryClient()

    const handleLogin = (authData: AuthData) => {
        setAuth(authData)
        localStorage.setItem('auth', JSON.stringify(authData))
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        localStorage.removeItem('repeatMode')
        setAuth(null)
        localStorage.removeItem('auth')
        setIsLoggingOut(false)
        queryClient.clear()
        await persister.removeClient()
    }

    useEffect(() => {
        if (!auth) {
            localStorage.removeItem('auth')
        }
    }, [auth])

    useEffect(() => {
        const isWindows = /Win/.test(navigator.userAgent)
        const isChromium = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        const isEdge = /Edg/.test(navigator.userAgent) && /Microsoft Corporation/.test(navigator.vendor)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream // eslint-disable-line @typescript-eslint/no-explicit-any
        const isAndroidPWA =
            /Android/.test(navigator.userAgent) &&
            (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) // eslint-disable-line @typescript-eslint/no-explicit-any

        if (isWindows && (isChromium || isEdge)) {
            document.getElementsByTagName('html')[0].classList.add('winOS')
        }

        if (isIOS) {
            document.getElementsByTagName('html')[0].classList.add('iOS')
        }

        // env safe area inset not supported or unreliable in android pwa?
        if (isAndroidPWA) {
            document.getElementsByTagName('html')[0].classList.add('safeAreaFallback')
        }

        // Needed for iOS, else you need to refresh page after changing orientation mode
        const updateOrientation = () => {
            const isIOSSafariNonPWA =
                isIOS &&
                !window.matchMedia('(display-mode: standalone)').matches &&
                !(navigator as any).standalone && // eslint-disable-line @typescript-eslint/no-explicit-any
                !window.matchMedia('(orientation: landscape)').matches
            const htmlElement = document.getElementsByTagName('html')[0]

            if (isIOS) {
                if (isIOSSafariNonPWA) {
                    htmlElement.classList.add('safeAreaFallback')
                } else {
                    htmlElement.classList.remove('safeAreaFallback')
                }
            }
        }

        updateOrientation()
        window.matchMedia('(orientation: landscape)').addEventListener('change', updateOrientation)

        return () => {
            window.matchMedia('(orientation: landscape)').removeEventListener('change', updateOrientation)
        }
    }, [])

    const actualApp = (
        <div className="video-app">
            <Routes>
                <Route path="/login" element={auth ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
                <Route
                    path="/*"
                    element={
                        auth ? (
                            <JellyfinContextProvider auth={auth}>
                                <AudioStorageContextProvider>
                                    <SidenavContextProvider>
                                        <PlaybackContextProvider initialVolume={0.5} clearOnLogout={isLoggingOut}>
                                            <MainLayout auth={auth} handleLogout={handleLogout} />
                                        </PlaybackContextProvider>
                                    </SidenavContextProvider>
                                </AudioStorageContextProvider>
                            </JellyfinContextProvider>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
            </Routes>
        </div>
    )

    return (
        <Router basename={import.meta.env.BASE_URL}>
            <HistoryContextProvider>
                <PageTitleProvider>
                    <ScrollContextProvider>
                        <ThemeContextProvider>{actualApp}</ThemeContextProvider>
                    </ScrollContextProvider>
                </PageTitleProvider>
            </HistoryContextProvider>
        </Router>
    )
}

interface AuthData {
    serverUrl: string
    token: string
    userId: string
    username: string
}

const MainLayout = ({ auth, handleLogout }: { auth: AuthData; handleLogout: () => void }) => {
    useDocumentTitle()

    const playback = usePlaybackContext()
    const { showSidenav, toggleSidenav } = useSidenavContext()

    const memoSettings = useCallback(() => {
        return <Settings onLogout={handleLogout} />
    }, [handleLogout])

    return (
        <Routes>
            <Route
                path="*"
                element={
                    <>
                        {playback.currentTrack && <VideoPlayer />}
                        {!playback.currentTrack && (
                            <div className={`interface` + (false ? ' touchBlocked' : '')}>
                                <>
                                    <div
                                        className={showSidenav || false ? 'dimmer active noSelect' : 'dimmer noSelect'}
                                        onClick={showSidenav ? toggleSidenav : undefined}
                                    />

                                    <Sidenav username={auth.username} />

                                    <Routes>
                                        <Route path="/" element={<Main content={Home}></Main>} />
                                        <Route path="/settings" element={<Main content={memoSettings} />} />
                                        <Route path="/movies" element={<Main content={Movies} />} />
                                        <Route path="/shows" element={<Main content={Shows} />} />
                                        <Route path="/collections" element={<Main content={Collections} />} />
                                        <Route path="/favorites" element={<Main content={Favorites} />} />
                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                </>
                            </div>
                        )}
                    </>
                }
            />
        </Routes>
    )
}
