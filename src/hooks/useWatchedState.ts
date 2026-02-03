import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQueryClient } from '@tanstack/react-query'
import { JELLYFIN_MAX_LIMIT, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePatchQueries } from './usePatchQueries'

export const useWatchedState = () => {
    const api = useJellyfinContext()
    const { patchMediaItem, patchMediaItems } = usePatchQueries()
    const queryClient = useQueryClient()

    // When the last item in a series is marked as played it'll affect the series' watched state, or when an episode was played the nextEpisode should be recalculated
    const invalidateRelated = async (item: MediaItem) => {
        // Update parent
        if (item.SeriesId) {
            queryClient.invalidateQueries({ queryKey: ['mediaItem', item.SeriesId] })
        }

        queryClient.invalidateQueries({ queryKey: ['nextEpisode'] })
        queryClient.invalidateQueries({ queryKey: ['sequentialNextEpisode'] })
        queryClient.invalidateQueries({ queryKey: ['series-seasons'] })
        queryClient.invalidateQueries({ queryKey: ['season-episodes'] })

        queryClient.invalidateQueries({ queryKey: ['recentlyPlayed'] })
        queryClient.invalidateQueries({ queryKey: ['nextUp'] })
    }

    return {
        markAsPlayed: async (item: MediaItem) => {
            const res = await api.markAsPlayed(item)

            patchMediaItem(item.Id, item => {
                return { ...item, UserData: res.data }
            })

            // Update children
            if (item.Type === BaseItemKind.Series || item.Type === BaseItemKind.BoxSet) {
                const cIds = (
                    await api.getItemChildren(item.Id, 0, JELLYFIN_MAX_LIMIT, undefined, undefined, true)
                ).map(i => i.Id)

                if (cIds.length) {
                    patchMediaItems(cIds, c => ({
                        ...c,
                        UserData: {
                            ...c.UserData,
                            PlaybackPositionTicks: 0,
                            PlayedPercentage: 100,
                            Played: true,
                        },
                    }))
                }
            }

            await invalidateRelated(item)

            return res
        },
        markAsUnplayed: async (item: MediaItem) => {
            const res = await api.markAsUnplayed(item)

            patchMediaItem(item.Id, item => {
                return { ...item, UserData: res.data }
            })

            // Update children
            if (item.Type === BaseItemKind.Series || item.Type === BaseItemKind.BoxSet) {
                const cIds = (
                    await api.getItemChildren(item.Id, 0, JELLYFIN_MAX_LIMIT, undefined, undefined, true)
                ).map(i => i.Id)

                if (cIds.length) {
                    patchMediaItems(cIds, c => ({
                        ...c,
                        UserData: {
                            ...c.UserData,
                            PlaybackPositionTicks: 0,
                            PlayedPercentage: 0,
                            Played: false,
                        },
                    }))
                }
            }

            await invalidateRelated(item)

            return res
        },
        markAsProgress: async (item: MediaItem, positionTicks: number, playedPercentage: number) => {
            patchMediaItem(item.Id, c => ({
                ...c,
                UserData: {
                    ...c.UserData,
                    PlaybackPositionTicks: positionTicks,
                    PlayedPercentage: playedPercentage,
                    Played: false,
                },
            }))

            await invalidateRelated(item)
        },
    }
}
