import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinPlayableItemId = (item: MediaItem) => {
    const api = useJellyfinContext()
    const isContainer = item.Type === BaseItemKind.Series || item.Type === BaseItemKind.BoxSet

    const { data: playableItemId, isLoading } = useQuery({
        queryKey: ['playableItem', item.Id],
        queryFn: async () => {
            if (!isContainer) {
                return item.Id
            }

            if (item.Type === BaseItemKind.Series) {
                const seasons = await api.getSeasons(item.Id, 0, 1)

                if (seasons.length === 0) {
                    return null
                }

                const firstSeason = seasons[0]
                const episodes = await api.getEpisodes(firstSeason.Id, 0, 1)

                const episodeId = episodes.length > 0 ? episodes[0].Id : null
                return episodeId
            }

            const children = await api.getItemChildren(item.Id, 0, 1)
            return children.length > 0 ? children[0].Id : null
        },
        enabled: isContainer,
    })

    return {
        playableItemId: isContainer ? playableItemId : item.Id,
        isLoading,
    }
}
