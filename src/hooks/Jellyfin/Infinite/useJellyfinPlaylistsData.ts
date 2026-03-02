import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinPlaylistsData = () => {
    const api = useJellyfinContext()
    const { jellySort } = useFilterContext()
    const itemsPerPage = 36

    return useJellyfinInfiniteData({
        queryKey: ['playlists', jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getPlaylists(startIndex, itemsPerPage, jellySort.sortBy, jellySort.sortOrder)
        },
    })
}
