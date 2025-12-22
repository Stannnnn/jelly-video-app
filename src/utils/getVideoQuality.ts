import { MediaItem } from '../api/jellyfin'

/**
 * Get quality label from video resolution
 * @param height Video height in pixels
 * @param width Video width in pixels (optional, for better 4K detection)
 * @param shortCode If true, returns short codes: 4K, HD, or SD
 * @returns Quality label (4K, 1080p, 720p, 480p, SD) or short code (4K, HD, SD)
 */
export const getQualityLabel = (
    height: number | undefined,
    width?: number | undefined,
    shortCode?: boolean
): string => {
    if (!height) return 'SD'

    const mp = width && height ? (width * height) / 1_000_000 : 0

    // 4K / UHD detection
    if ((width && width >= 3800 && height >= 1600) || mp >= 7.5) {
        return '4K'
    }

    // 1080p / Full HD
    if (height >= 1080 || mp >= 2) {
        return shortCode ? 'HD' : '1080p'
    }

    // 720p / HD
    if (height >= 720) {
        return shortCode ? 'HD' : '720p'
    }

    // 480p / SD
    if (height >= 480) {
        return shortCode ? 'SD' : '480p'
    }

    return 'SD'
}

/**
 * Extract video quality from MediaItem's MediaStreams
 * @param item MediaItem from Jellyfin
 * @param shortCode If true, returns short codes: 4K, HD, or SD
 * @returns Quality label (4K, 1080p, 720p, 480p, SD) or short code (4K, HD, SD), or null if no video stream found
 */
export const getVideoQuality = (item: MediaItem | undefined, shortCode?: boolean): string | null => {
    if (!item) {
        return null
    }

    let videoStreams: any[] = []

    if (item.MediaSources && item.MediaSources.length > 0) {
        videoStreams = item.MediaSources.flatMap(
            source => source.MediaStreams?.filter(stream => stream.Type === 'Video') || []
        )
    } else if (item.MediaStreams && item.MediaStreams.length > 0) {
        videoStreams = item.MediaStreams.filter(stream => stream.Type === 'Video')
    }

    if (videoStreams.length === 0) {
        return null
    }

    let highestHeight = 0
    let highestWidth = 0
    let highestDisplayTitle: string | null = null

    // Loop through all video streams and find the highest resolution
    for (const videoStream of videoStreams) {
        const height = videoStream.Height ?? 0
        const width = videoStream.Width ?? 0

        if (height > highestHeight || (height === highestHeight && width > highestWidth)) {
            highestHeight = height
            highestWidth = width
            highestDisplayTitle = videoStream.DisplayTitle || null
        }
    }

    if (highestHeight === 0) {
        return null
    }

    const displayTitleMatch = highestDisplayTitle?.match(new RegExp('[0-9]+[pk]'))?.[0]

    if (shortCode && displayTitleMatch) {
        // Convert displayTitle match to short code
        const height = parseInt(displayTitleMatch)
        if (height >= 2160) return '4K'
        if (height >= 720) return 'HD'
        return 'SD'
    }

    return displayTitleMatch || getQualityLabel(highestHeight, highestWidth, shortCode)
}
