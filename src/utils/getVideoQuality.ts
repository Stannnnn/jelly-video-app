import { MediaItem } from '../api/jellyfin'

/**
 * Get quality label from video resolution
 * @param height Video height in pixels
 * @param width Video width in pixels (optional, for better 4K detection)
 * @returns Quality label (4K, 1080p, 720p, 480p, SD)
 */
export const getQualityLabel = (height: number | undefined, width?: number | undefined): string => {
    if (!height) return 'SD'

    const mp = width && height ? (width * height) / 1_000_000 : 0

    // 4K / UHD detection
    if ((width && width >= 3800 && height >= 1600) || mp >= 7.5) {
        return '4K'
    }

    // 1080p / Full HD
    if (height >= 1080 || mp >= 2) {
        return '1080p'
    }

    // 720p / HD
    if (height >= 720) {
        return '720p'
    }

    // 480p / SD
    if (height >= 480) {
        return '480p'
    }

    return 'SD'
}

/**
 * Extract video quality from MediaItem's MediaStreams
 * @param item MediaItem from Jellyfin
 * @returns Quality label (4K, 1080p, 720p, 480p, SD) or null if no video stream found
 */
export const getVideoQuality = (item: MediaItem): string | null => {
    if (!item.MediaStreams || item.MediaStreams.length === 0) {
        return null
    }

    // Find the first video stream
    const videoStream = item.MediaStreams.find(stream => stream.Type === 'Video')

    if (!videoStream) {
        return null
    }

    return getQualityLabel(videoStream.Height ?? undefined, videoStream.Width ?? undefined)
}
