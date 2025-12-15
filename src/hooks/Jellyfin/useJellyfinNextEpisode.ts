import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

interface NextEpisodeInfo {
    episodeId: string
    seasonNumber?: number
    episodeNumber?: number
}

export const useJellyfinNextEpisode = (item: MediaItem) => {
    const api = useJellyfinContext()
    const isSeries = item.Type === BaseItemKind.Series

    const { data, isLoading } = useQuery({
        queryKey: ['nextEpisode', item.Id],
        queryFn: async (): Promise<NextEpisodeInfo | null> => {
            if (!isSeries) {
                return null
            }

            // Get all seasons
            const seasons = await api.getSeasons(item.Id)

            if (seasons.length === 0) {
                return null
            }

            // Find the first episode that hasn't been fully watched
            for (const season of seasons) {
                const episodes = await api.getEpisodes(season.Id)

                for (const episode of episodes) {
                    const playedPercentage = episode.UserData?.PlayedPercentage || 0
                    const isPlayed = episode.UserData?.Played || false

                    // If episode is not fully watched (either in progress or unwatched)
                    if (!isPlayed && playedPercentage < 100) {
                        return {
                            episodeId: episode.Id,
                            seasonNumber: episode.ParentIndexNumber ?? undefined,
                            episodeNumber: episode.IndexNumber ?? undefined,
                        }
                    }
                }
            }

            // If all episodes are watched, return the first episode of the first season
            const firstSeasonEpisodes = await api.getEpisodes(seasons[0].Id, 0, 1)
            if (firstSeasonEpisodes.length > 0) {
                const firstEpisode = firstSeasonEpisodes[0]
                return {
                    episodeId: firstEpisode.Id,
                    seasonNumber: firstEpisode.ParentIndexNumber ?? undefined,
                    episodeNumber: firstEpisode.IndexNumber ?? undefined,
                }
            }

            return null
        },
        enabled: isSeries,
    })

    return {
        nextEpisode: data,
        isLoading,
    }
}
