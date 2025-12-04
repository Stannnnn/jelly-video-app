import { ChevronDownIcon } from '@primer/octicons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { useThemeContext } from '../context/ThemeContext/ThemeContext'
import { persister } from '../queryClient'
import './Settings.css'

export const Settings = ({ onLogout }: { onLogout: () => void }) => {
    const navigate = useNavigate()
    const api = useJellyfinContext()

    const { theme, toggleTheme } = useThemeContext()

    const [lastLogin, setLastLogin] = useState<string | null>(null)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [latency, setLatency] = useState<number | null>(null)
    const [serverVersion, setServerVersion] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const [clearing, setClearing] = useState(false)

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
        if (!confirm('Are you sure you want to clear all downloads? This cannot be undone.')) {
            return
        }

        try {
            setClearing(true)
            queryClient.clear()
            await persister.removeClient()
        } catch (error) {
            console.error('Failed to clear downloads:', error)
        } finally {
            setClearing(false)
        }
    }, [queryClient])

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
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Seek back increment</div>
                            <div className="subdesc">Seconds to skip back (left arrow key)</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
                                >
                                    <option value="Movies">5 seconds</option>
                                    <option value="Series">10 seconds</option>
                                    <option value="Episodes">20 seconds</option>
                                    <option value="Collections">25 seconds</option>
                                    <option value="Collections">30 seconds</option>
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
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
                                >
                                    <option value="Movies">5 seconds</option>
                                    <option value="Series">10 seconds</option>
                                    <option value="Episodes">20 seconds</option>
                                    <option value="Collections">25 seconds</option>
                                    <option value="Collections">30 seconds</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section audio ui">
                <div className="title">Audio</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Language</div>
                            <div className="subdesc">Preferred audio language</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
                                >
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
                            <div className="subtitle">Default source audio</div>
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

            <div className="section subs ui">
                <div className="title">Subtitles</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Language</div>
                            <div className="subdesc">Preferred subtitle language</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
                                >
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
                            <div className="subtitle">Font size</div>
                            <div className="subdesc">Subtitle text size</div>
                        </div>
                        <div className="sorting">
                            <div className="filter">
                                <select
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
                                >
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
                                //onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                //value={filter.kind}
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
                            <div className="subtitle">Font position</div>
                            <div className="subdesc">Subtitles vertical position</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section misc ui">
                <div className="title">Misc</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Next episode</div>
                            <div className="subdesc">Play next episode automatically</div>
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
                                    //checked={playback.isPreloadActive}
                                    //onChange={e => playback.setIsPreloadActive(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section shortcuts">
                <div className="title">Shortcuts</div>
                <div className="desc">
                    <p>Left/right arrow keys to skip back/forward</p>
                    <p>Arrow up/down to adjust volume</p>
                    <p>Space bar pause/unpauses</p>
                    <p>F key to fullscreen</p>
                    <p>ESC key to exit fullscreen</p>
                </div>
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
