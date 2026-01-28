import { MediaItem } from '../api/jellyfin'

export const useJellyfinSortedVideoSources = (item: MediaItem | undefined) => {
    const videoSources = item?.MediaSources || []

    const sortedVideoSources = [...videoSources].sort((a, b) => {
        const heightA = a.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        const heightB = b.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        return heightB - heightA
    })

    return {
        sortedVideoSources,
    }
}
