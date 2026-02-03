import { MediaItem } from '../api/jellyfin'
import { useJellyfinMediaItem } from './Jellyfin/useJellyfinMediaItem'
import { useJellyfinSortedVideoSources } from './useJellyfinSortedVideoSources'

export const useJellyfinHighestQualitySource = (item: MediaItem | undefined) => {
    const { sortedVideoSources } = useJellyfinSortedVideoSources(item)

    const highestQualitySourceId =
        item?.MediaSources?.[0]?.Id !== sortedVideoSources[0]?.Id ? sortedVideoSources[0]?.Id || undefined : undefined

    const { mediaItem } = useJellyfinMediaItem(highestQualitySourceId)

    return {
        highestQualityUserData: highestQualitySourceId ? mediaItem?.UserData : item?.UserData,
    }
}
