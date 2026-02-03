import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

interface GitHubRelease {
    tag_name: string
    html_url: string
    name: string
    published_at: string
}

export const useUpdateChecker = (enabled: boolean) => {
    const {
        data: latestRelease,
        isLoading: isCheckingUpdate,
        isError: updateCheckError,
    } = useQuery<GitHubRelease | null, Error>({
        queryKey: ['appUpdate'],
        queryFn: async () => {
            const response = await fetch('https://api.github.com/repos/Stannnnn/jelly-video-app/releases/latest')

            if (!response.ok) {
                throw new Error('Failed to fetch release info')
            }

            const data: GitHubRelease = await response.json()
            return data
        },
        staleTime: 24 * 60 * 60 * 1000, // 1 day
        enabled,
    })

    // Compare versions and determine update status
    const updateStatus = useMemo(() => {
        if (!enabled) return null
        if (isCheckingUpdate) return 'checking'
        if (updateCheckError) return 'error'
        if (!latestRelease) return null

        const tagName = latestRelease.tag_name || ''
        const latestVersionClean = tagName.replace(/^v/, '')
        const currentVersionClean = __VERSION__.replace(/^v/, '')

        // Simple version comparison (works for semantic versioning)
        const compareParts = (a: string, b: string): number => {
            const aParts = a.split('.').map(Number)
            const bParts = b.split('.').map(Number)

            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aNum = aParts[i] || 0
                const bNum = bParts[i] || 0
                if (aNum > bNum) return 1
                if (aNum < bNum) return -1
            }
            return 0
        }

        const comparison = compareParts(latestVersionClean, currentVersionClean)
        return comparison > 0 ? 'available' : 'current'
    }, [enabled, isCheckingUpdate, updateCheckError, latestRelease])

    return {
        latestRelease,
        isCheckingUpdate,
        updateCheckError,
        updateStatus,
    }
}
