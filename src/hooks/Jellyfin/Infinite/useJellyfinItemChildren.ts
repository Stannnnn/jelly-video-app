import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinItemChildren = (
    itemId: string | undefined,
    itemTypes?: BaseItemKind[],
    sortBy: ItemSortBy[] = [ItemSortBy.PremiereDate],
    sortOrder: SortOrder[] = [SortOrder.Ascending]
) => {
    const api = useJellyfinContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['collection-children', itemId, itemTypes, sortBy, sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            if (!itemId) throw new Error('Item ID is required')
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getItemChildren(itemId, startIndex, itemsPerPage, sortBy, sortOrder, false, itemTypes)
        },
        enabled: !!itemId,
    })
}
