import { Location } from 'react-router-dom'

export const getPageTitle = (pageTitle: string, location: Location): string => {
    // Return pageTitle if set (e.g., by SearchResults), otherwise fallback to defaults
    if (pageTitle) return pageTitle

    if (location.pathname.startsWith('/search/')) {
        const query = decodeURIComponent(location.pathname.split('/search/')[1])
        return `Search results for '${query}'`
    }
    //if (location.pathname.startsWith('/instantmix/')) return 'Instant Mix'

    switch (location.pathname) {
        case '/':
            return 'Home'
        case '/movies':
            return 'Movies'
        case '/series':
            return 'Series'
        case '/favorites':
            return 'Favorites'
        case '/collections':
            return 'Collections'
        case '/settings':
            return 'Settings'
        case '/synced':
            return 'Synced'
        default:
            return 'Home'
    }
}
