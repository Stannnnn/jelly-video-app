import { Location } from 'react-router-dom'

export const getPageTitle = (pageTitle: string, location: Location): string => {
    // Return pageTitle if set (e.g., by SearchResults), otherwise fallback to defaults
    if (pageTitle) return pageTitle

    if (location.pathname.startsWith('/album/')) return 'Album'
    if (location.pathname.startsWith('/artist/')) {
        if (location.pathname.includes('/tracks')) return 'Tracks'
        return 'Artist'
    }
    if (location.pathname.startsWith('/genre/')) return 'Genre'
    if (location.pathname.startsWith('/playlist/')) return 'Playlist'
    if (location.pathname.startsWith('/search/')) {
        const query = decodeURIComponent(location.pathname.split('/search/')[1])
        return `Search results for '${query}'`
    }
    if (location.pathname.startsWith('/instantmix/')) return 'Instant Mix'

    switch (location.pathname) {
        case '/':
            return 'Home'
        case '/tracks':
            return 'Tracks'
        case '/lyrics':
            return 'Lyrics'
        case '/albums':
            return 'Albums'
        case '/artists':
            return 'Artists'
        case '/albumartists':
            return 'Album Artists'
        case '/genres':
            return 'Genres'
        case '/favorites':
            return 'Favorites'
        case '/settings':
            return 'Settings'
        case '/synced':
            return 'Synced'
        case '/nowplaying':
            return 'Now Playing'
        case '/nowplaying/lyrics':
            return 'Now Playing / Lyrics'
        case '/recently':
            return 'Recently Played'
        case '/frequently':
            return 'Frequently Played'
        default:
            return 'Home'
    }
}
