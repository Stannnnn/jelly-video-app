import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQueryClient } from '@tanstack/react-query'
import { JELLYFIN_MAX_LIMIT, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePatchQueries } from './usePatchQueries'

export const useWatchedState = () => {
    const api = useJellyfinContext()
    const { patchMediaItem, patchMediaItems } = usePatchQueries()
    const queryClient = useQueryClient()

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

            // Update parent
            if (item.SeriesId) {
                queryClient.invalidateQueries({ queryKey: ['mediaItem', item.SeriesId] })
            }

            // Clear nextEpisode cache, preferably with id but we don't know which parent
            queryClient.invalidateQueries({ queryKey: ['nextEpisode'] })

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

            // Update parent
            if (item.SeriesId) {
                queryClient.invalidateQueries({ queryKey: ['mediaItem', item.SeriesId] })
            }

            // Clear nextEpisode cache, preferably with id but we don't know which parent
            queryClient.invalidateQueries({ queryKey: ['nextEpisode'] })

            return res
        },
    }
}
