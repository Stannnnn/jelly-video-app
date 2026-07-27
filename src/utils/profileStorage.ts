export interface SavedProfile {
    id: string
    serverUrl: string
    username: string
    token: string
    userId: string
}

const PROFILES_KEY = 'savedProfiles'

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

export const getProfiles = (): SavedProfile[] => {
    try {
        const raw = localStorage.getItem(PROFILES_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export const saveProfiles = (profiles: SavedProfile[]) => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export const addProfile = (profile: Omit<SavedProfile, 'id'>): SavedProfile => {
    const profiles = getProfiles()
    const newProfile = { ...profile, id: generateId() }
    profiles.push(newProfile)
    saveProfiles(profiles)
    return newProfile
}

export const deleteProfile = (id: string) => {
    const profiles = getProfiles().filter(p => p.id !== id)
    saveProfiles(profiles)
}

export const cloneProfile = (id: string): SavedProfile | null => {
    const profiles = getProfiles()
    const source = profiles.find(p => p.id === id)
    if (!source) return null
    const cloned = { ...source, id: generateId(), username: `${source.username} (copy)` }
    profiles.push(cloned)
    saveProfiles(profiles)
    return cloned
}

export const syncCurrentProfile = (auth: { serverUrl: string; token: string; userId: string; username: string }) => {
    const profiles = getProfiles()
    const existing = profiles.find(p => p.userId === auth.userId && p.serverUrl === auth.serverUrl)
    if (existing) {
        existing.token = auth.token
        existing.username = auth.username
        saveProfiles(profiles)
    } else {
        addProfile(auth)
    }
}
