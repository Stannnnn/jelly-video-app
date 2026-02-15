import '@fontsource-variable/inter'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { Downloads } from './components/Downloads'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Main } from './components/Main'
import './components/MediaList.css'
import { SearchResults } from './components/SearchResults'
import { Sidenav } from './components/Sidenav'
import { AudioStorageContextProvider } from './context/AudioStorageContext/AudioStorageContextProvider'
import { DownloadContextProvider } from './context/DownloadContext/DownloadContextProvider'
import { HistoryContextProvider } from './context/HistoryContext/HistoryContextProvider'
import { JellyfinContextProvider } from './context/JellyfinContext/JellyfinContextProvider'
import { PageTitleProvider } from './context/PageTitleContext/PageTitleProvider'
import { PlaybackContextProvider } from './context/PlaybackContext/PlaybackContextProvider'
import { ScrollContextProvider } from './context/ScrollContext/ScrollContextProvider'
import { useSidenavContext } from './context/SidenavContext/SidenavContext'
import { SidenavContextProvider } from './context/SidenavContext/SidenavContextProvider'
import { ThemeContextProvider } from './context/ThemeContext/ThemeContextProvider'
import { CollectionPage } from './pages/CollectionPage'
import { Collections } from './pages/Collections'
import { EpisodePage } from './pages/EpisodePage'
import { Favorites } from './pages/Favorites'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MoviePage } from './pages/MoviePage'
import { Movies } from './pages/Movies'
import { NextUp } from './pages/NextUp'
import { PersonMovies } from './pages/PersonMovies'
import { PersonPage } from './pages/PersonPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { Playlists } from './pages/Playlists'
import { RecentlyAddedMovies } from './pages/RecentlyAddedMovies'
import { RecentlyAddedSeries } from './pages/RecentlyAddedSeries'
import { RecentlyPlayed } from './pages/RecentlyPlayed'
import { SearchCollections } from './pages/SearchCollections'
import { SearchMovies } from './pages/SearchMovies'
import { SearchSeries } from './pages/SearchSeries'
import { Series } from './pages/Series'
import { SeriesPage } from './pages/SeriesPage'
import { Settings } from './pages/Settings'
import { SpecialPage } from './pages/SpecialPage'
import { VideoPlayerPage } from './pages/VideoPlayerPage'
import { persister, queryClient } from './queryClient'

export const App = () => {
    useEffect(() => {
        getCurrentWindow().show()
    }, [])

    return (
        <ErrorBoundary>
            {window.__NPM_LIFECYCLE_EVENT__ === 'dev:nocache' ||
            window.__NPM_LIFECYCLE_EVENT__ === 'tauri:dev:nocache' ? (
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
        if (isWindows && (isChromium || isEdge)) {
            document.getElementsByTagName('html')[0].classList.add('winOS')
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
                                            <DownloadContextProvider>
                                                <MainLayout auth={auth} handleLogout={handleLogout} />
                                            </DownloadContextProvider>
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
                <ScrollContextProvider>
                    <ThemeContextProvider>{actualApp}</ThemeContextProvider>
                </ScrollContextProvider>
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
    const { showSidenav, toggleSidenav } = useSidenavContext()
    const location = useLocation()

    useEffect(() => {
        const onKeyDown = async (e: KeyboardEvent) => {
            if (location.pathname.startsWith('/play/')) {
                return
            }

            if (e.key === 'F11') {
                e.preventDefault()
                try {
                    if (!document.fullscreenElement) {
                        await document.documentElement.requestFullscreen()
                    } else {
                        await document.exitFullscreen()
                    }
                } catch (error) {
                    console.error('Failed to toggle fullscreen:', error)
                }
            } else if (e.key === 'Escape' && document.fullscreenElement) {
                e.preventDefault()
                try {
                    await document.exitFullscreen()
                } catch (error) {
                    console.error('Failed to exit fullscreen:', error)
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [location.pathname])

    const memoSettings = useCallback(() => {
        return <Settings onLogout={handleLogout} />
    }, [handleLogout])

    return (
        <Routes>
            <Route
                path="/play/:id/:mediaSourceId?"
                element={
                    <PageTitleProvider pageTitle="Playing">
                        <VideoPlayerPage />
                    </PageTitleProvider>
                }
            />
            <Route
                path="*"
                element={
                    <div className={'interface'}>
                        <div
                            className={showSidenav || false ? 'dimmer active noSelect' : 'dimmer noSelect'}
                            onClick={showSidenav ? toggleSidenav : undefined}
                        />

                        <Sidenav username={auth.username} />

                        <Routes>
                            <Route path="/" element={<Main pageTitle="Home" content={Home}></Main>} />
                            <Route path="/settings" element={<Main pageTitle="Settings" content={memoSettings} />} />
                            <Route
                                path="/downloads"
                                element={<Main pageTitle="Downloads" content={Downloads} filterType={'favorites'} />}
                            />
                            <Route
                                path="/movies"
                                element={<Main pageTitle="Movies" content={Movies} filterType={'movies'} />}
                            />
                            <Route path="/movie/:id" element={<Main pageTitle="Movie" content={MoviePage} />} />
                            <Route
                                path="/series"
                                element={<Main pageTitle="Series" content={Series} filterType={'movies'} />}
                            />
                            <Route path="/series/:id" element={<Main pageTitle="Serie" content={SeriesPage} />} />
                            <Route path="/episode/:id" element={<Main pageTitle="Episode" content={EpisodePage} />} />
                            <Route path="/special/:id" element={<Main pageTitle="Special" content={SpecialPage} />} />
                            <Route path="/person/:id" element={<Main pageTitle="Person" content={PersonPage} />} />
                            <Route
                                path="/person/:id/movies"
                                element={<Main pageTitle="Person Movies" content={PersonMovies} />}
                            />
                            <Route
                                path="/collections"
                                element={<Main pageTitle="Collections" content={Collections} filterType={'movies'} />}
                            />
                            <Route
                                path="/collection/:id"
                                element={<Main pageTitle="Collection" content={CollectionPage} />}
                            />
                            <Route
                                path="/playlists"
                                element={<Main pageTitle="Playlists" content={Playlists} filterType={'movies'} />}
                            />
                            <Route
                                path="/playlist/:id"
                                element={
                                    <Main pageTitle="Playlist" content={PlaylistPage} filterType={'moviesPlaylist'} />
                                }
                            />
                            <Route
                                path="/favorites"
                                element={<Main pageTitle="Favorites" content={Favorites} filterType={'favorites'} />}
                            />
                            <Route
                                path="/recently-played"
                                element={<Main pageTitle="Continue Watching" content={RecentlyPlayed} />}
                            />
                            <Route
                                path="/recently-added-movies"
                                element={<Main pageTitle="Latest Movies" content={RecentlyAddedMovies} />}
                            />
                            <Route
                                path="/recently-added-series"
                                element={<Main pageTitle="Latest Series" content={RecentlyAddedSeries} />}
                            />
                            <Route path="/next-up" element={<Main pageTitle="Next Up" content={NextUp} />} />
                            <Route
                                path="/search/:query"
                                element={<Main pageTitle="Search" content={SearchResults} />}
                            />
                            <Route
                                path="/search/:query/movies"
                                element={<Main pageTitle="Search Movies" content={SearchMovies} />}
                            />
                            <Route
                                path="/search/:query/series"
                                element={<Main pageTitle="Search Series" content={SearchSeries} />}
                            />
                            <Route
                                path="/search/:query/collections"
                                element={<Main pageTitle="Search Collections" content={SearchCollections} />}
                            />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                }
            />
        </Routes>
    )
}
