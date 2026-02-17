import {
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    BellFillIcon,
    CheckIcon,
    ChevronDownIcon,
    CloudOfflineIcon,
    SyncIcon,
} from '@primer/octicons-react'
import { useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { ask } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-shell'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { useThemeContext } from '../context/ThemeContext/ThemeContext'
import { useUpdateChecker } from '../hooks/useUpdateChecker'
import { persister } from '../queryClient'
import { formatFileSize } from '../utils/formatFileSize'
import './Settings.css'

export const Settings = ({ onLogout }: { onLogout: () => void }) => {
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const audioStorage = useAudioStorageContext()
    const {
        autoplayNextEpisode,
        setAutoplayNextEpisode,
        skipIntro,
        setSkipIntro,
        skipOutro,
        setSkipOutro,
        checkForUpdates,
        setCheckForUpdates,
        subtitleFontSize,
        setSubtitleFontSize,
        subtitleFontWeight,
        setSubtitleFontWeight,
        subtitleFontColor,
        setSubtitleFontColor,
        subtitlePosition,
        setSubtitlePosition,
        seekBackIncrement,
        setSeekBackIncrement,
        seekForwardIncrement,
        setSeekForwardIncrement,
        rememberSubtitleTrack,
        setRememberSubtitleTrack,
        rememberAudioTrack,
        setRememberAudioTrack,
        rememberFilters,
        setRememberFilters,
    } = usePlaybackContext()

    const { enablePlaylists, setEnablePlaylists } = useSidenavContext()

    const { theme, toggleTheme } = useThemeContext()

    const [lastLogin, setLastLogin] = useState<string | null>(null)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [latency, setLatency] = useState<number | null>(null)
    const [serverVersion, setServerVersion] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const { storageStats, refreshStorageStats, queueCount, clearQueue } = useDownloadContext()

    const [clearing, setClearing] = useState(false)
    const { latestRelease, updateStatus } = useUpdateChecker(checkForUpdates)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, clientIp, latencyMs, serverInfo] = await Promise.all([
                    api.fetchUserInfo(),
                    api.fetchClientIp(),
                    api.measureLatency(),
                    api.fetchServerInfo(),
                ])

                if (user.LastLoginDate) {
                    const date = new Date(user.LastLoginDate)
                    const formatted = date
                        .toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            year: 'numeric',
                            hour12: true,
                        })
                        .replace(/,/, '')
                    setLastLogin(formatted)
                } else {
                    setLastLogin(null)
                }

                setClientIp(clientIp)
                setLatency(latencyMs)
                setServerVersion(serverInfo.Version || null)
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }

        fetchData()
    }, [api])

    const handleLogout = () => {
        onLogout()
        navigate('/login')
    }

    const handleClearAll = useCallback(async () => {
        const confirmed = await ask('Are you sure you want to clear all downloads? This cannot be undone.', {
            title: 'Clear All Downloads',
            kind: 'warning',
        })

        if (!confirmed) {
            return
        }

        try {
            setClearing(true)
            await audioStorage.clearAllDownloads()
            queryClient.clear()
            await persister.removeClient()
            clearQueue()
            await refreshStorageStats()
        } catch (error) {
            console.error('Failed to clear downloads:', error)
        } finally {
            setClearing(false)
        }
    }, [audioStorage, clearQueue, queryClient, refreshStorageStats])

    const handleOpenDownloadsFolder = useCallback(async () => {
        try {
            const storagePath = await invoke<string>('get_storage_path')
            await open(storagePath)
        } catch (error) {
            console.error('Failed to open downloads folder:', error)
        }
    }, [])

    const reloadApp = async () => {
        queryClient.clear()
        await persister.removeClient()

        if (navigator.onLine) {
            await Promise.all(((await navigator.serviceWorker?.getRegistrations()) || []).map(r => r.unregister()))
            await Promise.all(((await window.caches?.keys()) || []).map(c => window.caches.delete(c)))
        }

        window.location.reload()
    }

    return (
        <div className="settings-page">
            <div className="section appearance">
                <div className="title">Appearance</div>
                <div className="container">
                    <div className="options noSelect">
                        <div
                            className={`option light ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => toggleTheme('light')}
                        >
                            <div className="visual" />
                            <div className="desc">Light</div>
                        </div>
                        <div
                            className={`option dark ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => toggleTheme('dark')}
                        >
                            <div className="visual" />
                            <div className="desc">Dark</div>
                        </div>
                        <div
                            className={`option system ${theme === 'system' ? 'active' : ''}`}
                            onClick={() => toggleTheme('system')}
                        >
                            <div className="visual" />
                            <div className="desc">System</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section player ui">
                <div className="title">Player</div>
                {/*
                <div className="inner row">
                    <div className="container">
                    
                        <div className="desc">
                            <div className="subtitle">Trickplay</div>
                            <div className="subdesc">Display preview images while scrubbing</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    //checked={playback.isPreloadActive}
                                    //onChange={e => playback.setIsPreloadActive(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                */}
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Next episode</div>
                            <div className="subdesc">Automatically play next episode when the current one ends</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={autoplayNextEpisode}
                                    onChange={e => setAutoplayNextEpisode(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Skip outro</div>
                            <div className="subdesc">Show next episode overlay during end credits when available</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={skipOutro}
                                    onChange={e => setSkipOutro(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Skip intro</div>
                            <div className="subdesc">
                                Show skip button for opening/intro/recap segments when available
                            </div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={skipIntro}
                                    onChange={e => setSkipIntro(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Remember audio track</div>
                            <div className="subdesc">
                                Set audio track based on the previous title, choosing closest match
                            </div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rememberAudioTrack}
                                    onChange={e => setRememberAudioTrack(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Remember subtitle track</div>
                            <div className="subdesc">
                                Set subtitle track based on the previous title, choosing closest match
                            </div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rememberSubtitleTrack}
                                    onChange={e => setRememberSubtitleTrack(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Seek back increment</div>
                            <div className="subdesc">Seconds to skip back (left arrow key)</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                    onChange={e => setSeekBackIncrement(Number(e.target.value))}
                                    value={seekBackIncrement}
                                >
                                    <option value="5">5 seconds</option>
                                    <option value="10">10 seconds</option>
                                    <option value="15">15 seconds</option>
                                    <option value="30">30 seconds</option>
                                    <option value="60">60 seconds</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Seek forward increment</div>
                            <div className="subdesc">Seconds to skip forward (right arrow key)</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                    onChange={e => setSeekForwardIncrement(Number(e.target.value))}
                                    value={seekForwardIncrement}
                                >
                                    <option value="5">5 seconds</option>
                                    <option value="10">10 seconds</option>
                                    <option value="15">15 seconds</option>
                                    <option value="30">30 seconds</option>
                                    <option value="60">60 seconds</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*
            <div className="section audio ui">
                <div className="title">Audio</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Remember audio track</div>
                            <div className="subdesc">
                                Set audio track based on previous item. Try to set the audio track to the closest match
                                to the last video
                            </div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rememberAudioTrack}
                                    onChange={e => setRememberAudioTrack(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Language</div>
                            <div className="subdesc">Preferred audio language</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select>
                                    <option value="eng">English</option>
                                    <option value="nob">Norwegian</option>
                                    <option value="dut">Dutch</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Default audio source</div>
                            <div className="subdesc">Play default audio track regardless of language</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    //checked={playback.isPreloadActive}
                                    //onChange={e => playback.setIsPreloadActive(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
            </div>
            */}

            <div className="section subs ui">
                <div className="title">Subtitles</div>
                {/*
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Remember subtitle track</div>
                            <div className="subdesc">
                                Set subtitle track based on previous item. Try to set the subtitle track to the closest
                                match to the last video
                            </div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rememberSubtitleTrack}
                                    onChange={e => setRememberSubtitleTrack(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                {/*
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Language</div>
                            <div className="subdesc">Preferred subtitle language</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select onChange={e => setSubtitleLanguage(e.target.value)} value={subtitleLanguage}>
                                    <option value="eng">English</option>
                                    <option value="nob">Norwegian</option>
                                    <option value="dut">Dutch</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                */}
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Font size</div>
                            <div className="subdesc">Subtitle text size</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select onChange={e => setSubtitleFontSize(e.target.value)} value={subtitleFontSize}>
                                    <option value="smaller">Smaller</option>
                                    <option value="small">Small</option>
                                    <option value="normal">Normal</option>
                                    <option value="large">Large</option>
                                    <option value="larger">Larger</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Font weight</div>
                            <div className="subdesc">Subtitle text thickness</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                    onChange={e => setSubtitleFontWeight(e.target.value)}
                                    value={subtitleFontWeight}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Font color</div>
                            <div className="subdesc">Subtitle text color</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select onChange={e => setSubtitleFontColor(e.target.value)} value={subtitleFontColor}>
                                    <option value="white">White</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="green">Green</option>
                                    <option value="blue">Blue</option>
                                    <option value="red">Red</option>
                                    <option value="magenta">Magenta</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Font position</div>
                            <div className="subdesc">Subtitle vertical position</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                    onChange={e => setSubtitlePosition(Number(e.target.value))}
                                    value={subtitlePosition}
                                >
                                    <option value="90">90%</option>
                                    <option value="95">95%</option>
                                    <option value="100">100%</option>
                                    <option value="105">105%</option>
                                    <option value="110">110%</option>
                                    <option value="115">115%</option>
                                    <option value="120">120%</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="desc">
                    <div className="note">
                        Subtitle formats are rendered differently; position and styling may vary. Values above 100% may
                        fit image-based subtitles (PGS, DVD) while pushing text subtitles (SRT, ASS) outside the
                        viewport
                    </div>
                </div>
            </div>

            <div className="section misc ui">
                <div className="title">Miscellaneous</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Filters</div>
                            <div className="subdesc">Remember selected filters for a consistent experience</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rememberFilters}
                                    onChange={e => setRememberFilters(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Playlists</div>
                            <div className="subdesc">Enable playlist view and functionality</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={enablePlaylists}
                                    onChange={e => setEnablePlaylists(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section downloads">
                <div className="primary">
                    <div className="container">
                        <div className="title">Downloads</div>
                        <div className="desc">
                            <span className="number">{storageStats.trackCount}</span> Video
                            {storageStats.trackCount === 1 ? '' : 's'}
                            {queueCount > 0 && (
                                <>
                                    {' '}
                                    (<span className="number">{queueCount}</span> in queue)
                                </>
                            )}{' '}
                            /{' '}
                            <span className="number">
                                {formatFileSize(storageStats.trackCount === 0 ? 0 : storageStats?.usage || 0)}
                            </span>
                        </div>
                    </div>
                    <div className="actions noSelect">
                        {(storageStats.trackCount > 0 || queueCount > 0 || !audioStorage.isInitialized()) && (
                            <button className="btn clear" onClick={handleClearAll} disabled={clearing}>
                                {clearing ? 'Clearing...' : 'Clear All'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="desc">
                    <div className="info">
                        Download your video library for seamless offline playback. Supports movies, tv shows, and
                        episodes.{' '}
                        <Link to="/downloads" className="textlink">
                            View downloads
                        </Link>{' '}
                        - Storage folder location can be found{' '}
                        <Link to="" onClick={handleOpenDownloadsFolder} className="textlink">
                            here
                        </Link>
                    </div>
                    <div className="note">
                        Note: Refreshing the app window while downloads are in progress will reset the progress
                    </div>
                </div>
            </div>

            <div className="section shortcuts">
                <div className="title">Shortcuts</div>
                <div className="desc">
                    <div className="subtitle">Available shortcuts in the video player</div>
                    <div className="keys">
                        <div className="container">
                            <div className="key">
                                <ArrowLeftIcon size={14} />
                            </div>{' '}
                            <div className="key">
                                <ArrowRightIcon size={14} />
                            </div>{' '}
                            to skip back or forward by{' '}
                            {seekBackIncrement === seekForwardIncrement
                                ? seekBackIncrement
                                : `${seekBackIncrement} / ${seekForwardIncrement}`}{' '}
                            seconds
                        </div>
                        <div className="container">
                            <div className="key">J</div> <div className="key">L</div> to skip back or forward by{' '}
                            {seekBackIncrement === seekForwardIncrement
                                ? seekBackIncrement * 2
                                : `${seekBackIncrement * 2} / ${seekForwardIncrement * 2}`}{' '}
                            seconds
                        </div>
                        <div className="container">
                            <div className="key">
                                <ArrowUpIcon size={14} />
                            </div>{' '}
                            <div className="key">
                                <ArrowDownIcon size={14} />
                            </div>{' '}
                            to adjust volume by 5%
                        </div>
                        <div className="container">
                            <div className="key">Space</div> <div className="key">K</div> to pause or unpause
                        </div>
                        <div className="container">
                            <div className="key">M</div> to mute or unmute
                        </div>
                        <div className="container">
                            <div className="key">F11</div> to toggle borderless fullscreen
                        </div>
                        <div className="container">
                            <div className="key">F</div> to toggle fullscreen in video player
                        </div>
                        <div className="container">
                            <div className="key">ESC</div> to exit fullscreen
                        </div>
                    </div>
                </div>
            </div>

            <div className="section updates">
                <div className="title">Updates</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Check for updates</div>
                            <div className="subdesc">Automatically check for new versions (once daily)</div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={checkForUpdates}
                                onChange={e => setCheckForUpdates(e.target.checked)}
                            ></input>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
                {checkForUpdates && updateStatus && (
                    <div className="inner row update-status">
                        {updateStatus === 'checking' && (
                            <div className="container">
                                <div className="subdesc">
                                    <div className="icon checking">
                                        <SyncIcon size={14} />
                                    </div>
                                    <span className="text">Checking for updates...</span>
                                </div>
                            </div>
                        )}
                        {updateStatus === 'current' && (
                            <div className="container">
                                <div className="subdesc">
                                    <div className="icon success">
                                        <CheckIcon size={16} />
                                    </div>
                                    <span className="text">You're up to date (v{__VERSION__})</span>
                                </div>
                            </div>
                        )}
                        {updateStatus === 'available' && latestRelease && (
                            <div className="container">
                                <div className="subdesc">
                                    <div className="icon available">
                                        <BellFillIcon size={14} />
                                    </div>
                                    <span className="text">
                                        Update available: {latestRelease.tag_name} <span className="divider">-</span>{' '}
                                        <a
                                            href={latestRelease.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="textlink"
                                        >
                                            Download
                                        </a>
                                    </span>
                                </div>
                            </div>
                        )}
                        {updateStatus === 'error' && (
                            <div className="container">
                                <div className="subdesc">
                                    <div className="icon error">
                                        <CloudOfflineIcon size={14} />
                                    </div>
                                    <span className="text">Unable to check for updates</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="section about">
                <div className="title">About</div>
                <div className="desc">
                    <p className="subtitle">Jelly Video App - Version {__VERSION__}</p>
                    <p>An open source video player for Jellyfin</p>
                    <p>
                        Carefully crafted with great attention to detail, aiming to reduce noise and distractions with a
                        minimalistic & lightweight interface:
                        <span className="mantra"> "the quieter you become, the more you are able to hear"</span>
                    </p>
                    <p className="subfooter">
                        <span>Source code is freely available on </span>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="textlink"
                            href="https://github.com/Stannnnn/jelly-video-app"
                        >
                            GitHub
                        </a>
                        <span> and is licensed under the MIT license</span>
                    </p>
                </div>
            </div>
            <div className="section session">
                <div className="title">Session</div>
                <div className="desc">
                    <p>
                        Currently connected to{' '}
                        <a target="_blank" rel="noopener noreferrer" className="textlink" href={api.auth.serverUrl}>
                            {api.auth.serverUrl}
                        </a>{' '}
                        {latency !== null && (
                            <span>
                                <span>with {latency}ms latency</span>
                                {serverVersion && <> (Jellyfin v{serverVersion})</>}
                            </span>
                        )}
                    </p>
                    <p>
                        Last login: {lastLogin} {clientIp ? ` from ${clientIp}` : ''}
                    </p>
                </div>
                <div className="actions noSelect">
                    <button onClick={handleLogout} className="btn logout">
                        Logout
                    </button>

                    <button
                        onClick={reloadApp}
                        className="btn reload"
                        title="Reloading can help with issues like outdated cache or version conflicts."
                    >
                        Reload App
                    </button>
                </div>
            </div>
        </div>
    )
}
