import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { useQuery } from '@tanstack/react-query'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'

export const useJellyfinItemChildren = (itemId: string | undefined, startIndex: number, limit: number) => {
    const api = useJellyfinContext()

    const { data, isFetching, isPending, error } = useQuery({
        queryKey: ['collection-children', itemId, startIndex],
        queryFn: async () => {
            if (!itemId) throw new Error('Item ID is required')
            return await api.getItemChildren(
                itemId,
                startIndex,
                limit,
                [ItemSortBy.PremiereDate],
                [SortOrder.Ascending]
            )
        },
        enabled: !!itemId,
    })

    return {
        children: data,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
