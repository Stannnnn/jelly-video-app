import { InfiniteData } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'
import { isMediaItem } from '../hooks/usePatchQueries'

export const getAllTracks = (
    data: InfiniteData<MediaItem[] | undefined, unknown> | undefined,
    allowDuplicates = false
) => {
    if (!data) {
        return []
    }

    const flattened = data.pages
        .map((page, pageIndex) => {
            if (!page) {
                console.error('getAllTracks: Page is undefined or null', data)
                console.trace()
                return []
            }

            if (!Array.isArray(page)) {
                console.error('getAllTracks: Page is not an array', data)
                console.trace()
                return []
            }

            if (page[0] && !isMediaItem(page[0])) {
                console.error('getAllTracks: Page does not contain MediaItem objects', data)
                console.trace()
                return []
            }

            return page.map(track => ({
                ...track,
                pageIndex,
            }))
        })
        .flat()

    if (allowDuplicates) {
        return flattened
    }

    const seenIds = new Set<string>()
    return flattened.filter(track => {
        if (seenIds.has(track.Id)) {
            return false
        }
        seenIds.add(track.Id)
        return true
    })
}
