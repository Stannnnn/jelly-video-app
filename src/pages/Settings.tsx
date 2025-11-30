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
                    <div className="options primary noSelect">
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

            <div className="section about">
                <div className="title">About</div>
                <div className="desc">
                    <p className="subtitle">Jelly Video App - Version {__VERSION__}</p>
                    <p>An open source music player for Jellyfin</p>
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
                            href="https://github.com/Stannnnn/jelly-app"
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
