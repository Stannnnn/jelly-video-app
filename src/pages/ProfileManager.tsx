import { CopyIcon, PersonIcon, PlusIcon, TrashIcon } from '@primer/octicons-react'
import { ask } from '@tauri-apps/plugin-dialog'
import { FormEvent, useCallback, useState } from 'react'
import { ApiError, loginToJellyfin } from '../api/jellyfin'
import { SavedProfile, addProfile, cloneProfile, deleteProfile, getProfiles } from '../utils/profileStorage'
import './ProfileManager.css'

export const ProfileManager = ({
    currentAuth,
    onSwitch,
}: {
    currentAuth: { serverUrl: string; token: string; userId: string; username: string }
    onSwitch: (auth: { serverUrl: string; token: string; userId: string; username: string }) => void
}) => {
    const [profiles, setProfiles] = useState<SavedProfile[]>(getProfiles)
    const [showAddForm, setShowAddForm] = useState(false)
    const [serverUrl, setServerUrl] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const refreshProfiles = useCallback(() => {
        setProfiles(getProfiles())
    }, [])

    const handleSwitch = (profile: SavedProfile) => {
        if (profile.userId === currentAuth.userId && profile.serverUrl === currentAuth.serverUrl) return
        onSwitch({
            serverUrl: profile.serverUrl,
            token: profile.token,
            userId: profile.userId,
            username: profile.username,
        })
    }

    const handleDelete = async (profile: SavedProfile) => {
        const confirmed = await ask(
            `Delete profile "${profile.username}" on ${profile.serverUrl}? This cannot be undone.`,
            {
                title: 'Delete Profile',
                kind: 'warning',
            }
        )
        if (!confirmed) return
        deleteProfile(profile.id)
        refreshProfiles()
    }

    const handleClone = (id: string) => {
        cloneProfile(id)
        refreshProfiles()
    }

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!serverUrl) {
            setError('Please enter a server URL.')
            setLoading(false)
            return
        }

        let trimmedServerUrl = serverUrl.toLowerCase().replace(/\/+$/, '')
        const urlPattern = /^https?:\/\/.+/
        if (!urlPattern.test(trimmedServerUrl)) {
            setError('Invalid URL format. Use http:// or https://')
            setLoading(false)
            return
        }

        try {
            let result
            try {
                result = await loginToJellyfin(trimmedServerUrl, username, password)
            } catch (firstErr) {
                const formattedServerUrl = trimmedServerUrl.split('/').slice(0, 3).join('/')
                if (trimmedServerUrl !== formattedServerUrl) {
                    trimmedServerUrl = formattedServerUrl
                    result = await loginToJellyfin(trimmedServerUrl, username, password)
                } else {
                    throw firstErr
                }
            }

            const { token, userId, username: fetchedUsername } = result!
            addProfile({ serverUrl: trimmedServerUrl, token, userId, username: fetchedUsername })
            refreshProfiles()
            setShowAddForm(false)
            setServerUrl('')
            setUsername('')
            setPassword('')
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.response?.status === 401) {
                    setError('Invalid credentials.')
                } else if (err.response?.status === 404) {
                    setError('Server not found.')
                } else {
                    setError(`Login failed (status ${err.response?.status}).`)
                }
            } else {
                setError('Connection failed. Check URL and try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profiles-page">
            <div className="listing">
                {profiles.length === 0 && !showAddForm && (
                    <div className="empty">
                        <div className="avatar">
                            <PersonIcon size={16} />
                        </div>
                        <div className="text">No saved profiles were found</div>
                    </div>
                )}
                {profiles.map(profile => {
                    const isCurrent =
                        profile.userId === currentAuth.userId && profile.serverUrl === currentAuth.serverUrl
                    return (
                        <div key={profile.id} className={`item ${isCurrent ? 'current' : ''}`}>
                            <div
                                className="info"
                                onClick={() => handleSwitch(profile)}
                                title={isCurrent ? 'Current profile' : `Switch to ${profile.username}`}
                            >
                                <div className="avatar">
                                    <PersonIcon size={16} />
                                </div>
                                <div className="details">
                                    <div className="name">{profile.username}</div>
                                    <div className="server">{profile.serverUrl}</div>
                                </div>
                            </div>
                            <div className="actions">
                                <button className="btn clone" onClick={() => handleClone(profile.id)} title="Clone">
                                    <CopyIcon size={14} />
                                </button>
                                {!isCurrent && (
                                    <button className="btn delete" onClick={() => handleDelete(profile)} title="Delete">
                                        <TrashIcon size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {showAddForm ? (
                <form className="add-profile" onSubmit={handleAdd}>
                    <input
                        type="text"
                        placeholder="Server URL (http://localhost:8096)"
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)}
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <div className="actions">
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? 'Validating...' : 'Add Profile'}
                        </button>
                        <button
                            type="button"
                            className="btn cancel"
                            onClick={() => {
                                setShowAddForm(false)
                                setError('')
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                    {error && <div className="error">{error}</div>}
                </form>
            ) : (
                <button className="btn profile" onClick={() => setShowAddForm(true)}>
                    <PlusIcon size={14} />
                    <span>Add Profile</span>
                </button>
            )}
        </div>
    )
}
