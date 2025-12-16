import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { useEffect, useMemo } from 'react'
import { MediaItem } from '../api/jellyfin'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'

export const useDisplayTitle = (item: MediaItem | null | undefined) => {
    const { setPageTitle } = usePageTitle()

    const displayTitle = useMemo(() => {
        if (!item) return 'Unknown Title'

        if (item.Type === BaseItemKind.Episode) {
            const season = String(item.ParentIndexNumber || 0).padStart(2, '0')
            const episode = String(item.IndexNumber || 0).padStart(2, '0')
            return `S${season} E${episode} - ${item.Name}`
        }

        if (item.PremiereDate) {
            const year = new Date(item.PremiereDate).getFullYear()
            return `${item.Name} (${year})`
        }

        return item.Name || 'Unknown Title'
    }, [item])

    useEffect(() => {
        if (displayTitle) {
            setPageTitle(displayTitle)
        }
    }, [displayTitle, setPageTitle])

    return displayTitle
}
