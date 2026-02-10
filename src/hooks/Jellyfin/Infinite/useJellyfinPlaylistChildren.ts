import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPlaylistChildren = (itemId: string | undefined) => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['playlist-children', itemId],
        queryFn: async ({ pageParam = 0 }) => {
            if (!itemId) throw new Error('Item ID is required')
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getItemChildren(
                itemId,
                startIndex,
                itemsPerPage,
                [ItemSortBy.PremiereDate],
                [SortOrder.Ascending],
                false,
                undefined,
                [BaseItemKind.Audio]
            )
        },
        enabled: !!itemId,
    })
}
