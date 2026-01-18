import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

/**
 * Gets the sequential next episode for autoplay functionality.
 * Unlike useJellyfinNextEpisode, this doesn't check watched state - it just gets
 * the next episode in the series order.
 */
export const useJellyfinSequentialNextEpisode = (item: MediaItem) => {
    const api = useJellyfinContext()
    const isEpisode = item.Type === BaseItemKind.Episode

    const { data, isLoading } = useQuery({
        queryKey: ['sequentialNextEpisode', item.Id],
        queryFn: async (): Promise<MediaItem | null> => {
            if (!isEpisode) {
                return null
            }

            const seriesId = item.SeriesId
            const currentSeasonNumber = item.ParentIndexNumber
            const currentEpisodeNumber = item.IndexNumber

            if (
                !seriesId ||
                currentSeasonNumber === undefined ||
                currentSeasonNumber === null ||
                currentEpisodeNumber === undefined ||
                currentEpisodeNumber === null
            ) {
                return null
            }

            // Get all seasons for the series
            const seasons = await api.getSeasons(seriesId)

            if (seasons.length === 0) {
                return null
            }

            // Find the current season
            const currentSeasonIndex = seasons.findIndex(s => s.IndexNumber === currentSeasonNumber)

            if (currentSeasonIndex === -1) {
                return null
            }

            const currentSeason = seasons[currentSeasonIndex]

            // Get all episodes in the current season
            const currentSeasonEpisodes = await api.getEpisodes(currentSeason.Id)

            // Find the next episode in the current season (skip if it's the same episode)
            const nextEpisodeInSeason = currentSeasonEpisodes.find(
                ep => (ep.IndexNumber ?? 0) === currentEpisodeNumber + 1 && ep.Id !== item.Id
            )

            if (nextEpisodeInSeason) {
                return nextEpisodeInSeason
            }

            // If no next episode in current season, check next season
            const nextSeasonIndex = currentSeasonIndex + 1
            if (nextSeasonIndex < seasons.length) {
                const nextSeason = seasons[nextSeasonIndex]
                const nextSeasonEpisodes = await api.getEpisodes(nextSeason.Id, 0, 1)

                if (nextSeasonEpisodes.length > 0) {
                    const firstEpisode = nextSeasonEpisodes[0]
                    // Skip if it's the same episode (can happen with episodes in multiple seasons)
                    if (firstEpisode.Id !== item.Id) {
                        return firstEpisode
                    }
                }
            }

            // No next episode found
            return null
        },
        enabled: isEpisode,
    })

    return {
        nextEpisode: data,
        isLoading,
    }
}
