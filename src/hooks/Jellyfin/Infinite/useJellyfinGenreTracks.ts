import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ApiError } from '../../../api/jellyfin'
import { ___PAGE_PARAM_INDEX___ } from '../../../components/PlaybackManager'
import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinGenreTracks = (genre: string) => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const { jellySort } = useFilterContext()

    const { data: totals, error: totalsError } = useQuery<
        {
            totalTrackCount: number
            totalPlaytime: number
            totalPlays: number
        },
        ApiError
    >({
        queryKey: ['genreTotals', genre],
        queryFn: () => api.getGenreTotals(genre),
    })

    useEffect(() => {
        if (totalsError instanceof ApiError && totalsError.response?.status === 401) {
            localStorage.removeItem('auth')
            window.location.href = '/login'
        }
    }, [totalsError])

    const infiniteData = useJellyfinInfiniteData({
        queryKey: ['genreTracks', genre, jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getGenreTracks(genre, startIndex, itemsPerPage, jellySort.sortBy, jellySort.sortOrder)
        },
        queryFnReviver: {
            fn: 'getGenreTracks',
            params: [genre, ___PAGE_PARAM_INDEX___, itemsPerPage, jellySort.sortBy, jellySort.sortOrder],
        },
    })

    const totalPlaytime = totals?.totalPlaytime || 0
    const totalTrackCount = totals?.totalTrackCount || 0
    const totalPlays = totals?.totalPlays || 0

    return {
        ...infiniteData,
        totalPlaytime,
        totalTrackCount,
        totalPlays,
    }
}
