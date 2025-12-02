import { Jellyfin } from '@jellyfin/sdk'
import { ItemsApi } from '@jellyfin/sdk/lib/generated-client/api/items-api'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { SessionApi } from '@jellyfin/sdk/lib/generated-client/api/session-api'
import { SystemApi } from '@jellyfin/sdk/lib/generated-client/api/system-api'
import { UserApi } from '@jellyfin/sdk/lib/generated-client/api/user-api'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { PlayMethod } from '@jellyfin/sdk/lib/generated-client/models/play-method'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'

export class ApiError extends Error {
    constructor(message: string, public response: Response) {
        super(message)
        this.response = response
    }
}

const generateDeviceId = () => {
    const storedDeviceId = localStorage.getItem('deviceId')
    if (storedDeviceId) return storedDeviceId
    const newDeviceId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('deviceId', newDeviceId)
    return newDeviceId
}

const deviceId = generateDeviceId()

interface AuthResponse {
    AccessToken: string
    User: { Id: string; Name: string }
}

export type MediaItem = BaseItemDto & {
    Id: string
    Name: string
}

export type IJellyfinAuth = Parameters<typeof initJellyfinApi>[0]

export const loginToJellyfin = async (serverUrl: string, username: string, password: string) => {
    try {
        const response = await fetch(`${serverUrl}/Users/AuthenticateByName`, {
            method: 'POST',
            headers: {
                'X-Emby-Authorization': `MediaBrowser Client="Jelly Video App", Device="Web", DeviceId="${deviceId}", Version="${__VERSION__}"`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Username: username, Pw: password }),
            signal: AbortSignal.timeout(20000),
        })
        if (!response.ok) {
            throw new ApiError(`HTTP error! status: ${response.status}`, response)
        }
        const data: AuthResponse = await response.json()
        return {
            token: data.AccessToken,
            userId: data.User.Id,
            username: data.User.Name,
        }
    } catch (error) {
        throw new Error('Login failed: ' + (error as Error).message)
    }
}

export const JELLYFIN_MAX_LIMIT = 2000 // Safety fallback upper limit for API calls

export const initJellyfinApi = ({ serverUrl, userId, token }: { serverUrl: string; userId: string; token: string }) => {
    const jellyfin = new Jellyfin({
        clientInfo: {
            name: 'Jelly Video App',
            version: __VERSION__,
        },
        deviceInfo: {
            name: 'Web',
            id: deviceId,
        },
    })

    const parseItemDto = async (item: BaseItemDto) => {
        return {
            ...item,
            Id: item.Id || '',
            Name: item.Name || '',
        } as MediaItem
    }

    const parseItemDtos = async (items: BaseItemDto[] | undefined) => {
        return (await Promise.all((items || []).map(parseItemDto))) as MediaItem[]
    }

    const api = jellyfin.createApi(serverUrl, token)

    const getAllLibraries = async (
        startIndex = 0,
        limit = 40,
        sortBy: ItemSortBy[] = [ItemSortBy.DateCreated],
        sortOrder: SortOrder[] = [SortOrder.Descending]
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            startIndex,
            limit,
            sortBy,
            sortOrder,
            recursive: true, // false
            includeItemTypes: [BaseItemKind.Movie], // BaseItemKind.CollectionFolder
            fields: ['Trickplay'],
        })

        return await parseItemDtos(response.data.Items)
    }

    const fetchUserInfo = async () => {
        const usersApi = new UserApi(api.configuration)
        const response = await usersApi.getUserById({ userId })
        return response.data
    }

    const fetchClientIp = async () => {
        const sessionsApi = new SessionApi(api.configuration)
        const response = await sessionsApi.getSessions({})
        const sessions = response.data
        return sessions.find(s => s.UserId === userId)?.RemoteEndPoint || null
    }

    const measureLatency = async () => {
        const startTime = performance.now()
        const systemApi = new SystemApi(api.configuration)
        await systemApi.getPingSystem({})
        return Math.round(performance.now() - startTime)
    }

    const fetchServerInfo = async () => {
        const systemApi = new SystemApi(api.configuration)
        const response = await systemApi.getSystemInfo()
        return response.data
    }

    const fetchPlayCount = async () => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            recursive: true,
            includeItemTypes: [BaseItemKind.Audio],
            filters: [ItemFilter.IsPlayed],
            limit: JELLYFIN_MAX_LIMIT,
        })
        return response.data.TotalRecordCount || null
    }

    const reportPlaybackStart = async (trackId: string, signal: AbortSignal) => {
        const sessionsApi = new PlaystateApi(api.configuration)
        await sessionsApi.reportPlaybackStart(
            {
                playbackStartInfo: {
                    ItemId: trackId,
                    PlayMethod: PlayMethod.DirectStream,
                    PositionTicks: 0,
                    IsPaused: false,
                    CanSeek: true,
                    MediaSourceId: trackId,
                    AudioStreamIndex: 1,
                },
            },
            { signal }
        )
    }

    let lastProgress = new AbortController()

    const reportPlaybackProgress = async (trackId: string, position: number, isPaused: boolean) => {
        if (lastProgress) {
            lastProgress.abort()
            lastProgress = new AbortController()
        }

        const sessionsApi = new PlaystateApi(api.configuration)
        await sessionsApi.reportPlaybackProgress(
            {
                playbackProgressInfo: {
                    ItemId: trackId,
                    PositionTicks: Math.floor(position * 10000000),
                    IsPaused: isPaused,
                    PlayMethod: PlayMethod.DirectStream,
                    MediaSourceId: trackId,
                    AudioStreamIndex: 1,
                },
            },
            { signal: lastProgress.signal }
        )
    }

    const reportPlaybackStopped = async (trackId: string, position: number, signal?: AbortSignal) => {
        const sessionsApi = new PlaystateApi(api.configuration)
        await sessionsApi.reportPlaybackStopped(
            {
                playbackStopInfo: {
                    ItemId: trackId,
                    PositionTicks: Math.floor(position * 10000000),
                    MediaSourceId: trackId,
                },
            },
            { signal }
        )
    }

    const getImageUrl = (item: MediaItem, type: 'Primary' | 'Backdrop', size: { width: number; height: number }) => {
        if (item.ImageTags?.[type]) {
            return `${serverUrl}/Items/${item.Id}/Images/${type}?tag=${item.ImageTags[type]}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        if (item.AlbumId) {
            return `${serverUrl}/Items/${item.AlbumId}/Images/${type}?quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        return undefined
    }

    const getStreamUrl = (trackId: string, bitrate: number) => {
        return `${serverUrl}/Videos/${trackId}/stream?UserId=${userId}&api_key=${token}&static=true`
    }

    const getTrickplayUrl = (item: MediaItem, timestamp: number, preferredWidth?: number) => {
        if (!item.Trickplay) return null

        // Get the trickplay data - first key is the hash
        const trickplayHash = Object.keys(item.Trickplay)[0]
        if (!trickplayHash) return null

        const resolutions = item.Trickplay[trickplayHash]

        // Find the best matching width or use the first available
        const availableWidths = Object.keys(resolutions).map(Number)
        const selectedWidth = preferredWidth
            ? availableWidths.reduce((prev, curr) =>
                  Math.abs(curr - preferredWidth) < Math.abs(prev - preferredWidth) ? curr : prev
              )
            : availableWidths[0]

        const config = resolutions[selectedWidth]
        if (
            !config ||
            !config.Interval ||
            !config.ThumbnailCount ||
            !config.TileWidth ||
            !config.TileHeight ||
            !config.Width ||
            !config.Height
        )
            return null

        // Calculate which thumbnail we need based on timestamp and interval
        const intervalMs = config.Interval
        const thumbnailIndex = Math.floor((timestamp * 1000) / intervalMs)

        // Clamp to available thumbnails
        const clampedIndex = Math.min(Math.max(0, thumbnailIndex), config.ThumbnailCount - 1)

        // TileWidth and TileHeight are the grid dimensions (columns x rows per sprite sheet)
        // Calculate which sprite sheet image file we need
        const tilesPerSheet = config.TileWidth * config.TileHeight
        const sheetIndex = Math.floor(clampedIndex / tilesPerSheet)

        // Calculate position within that sprite sheet
        const indexInSheet = clampedIndex % tilesPerSheet
        const row = Math.floor(indexInSheet / config.TileWidth)
        const col = indexInSheet % config.TileWidth

        // Build the URL - format: /Videos/{itemId}/Trickplay/{width}/{sheetIndex}.jpg
        return {
            url: `${serverUrl}/Videos/${item.Id}/Trickplay/${selectedWidth}/${sheetIndex}.jpg?api_key=${token}`,
            tileWidth: config.Width,
            tileHeight: config.Height,
            col,
            row,
            tilesPerRow: config.TileWidth,
        }
    }

    return {
        loginToJellyfin,
        getAllLibraries,
        fetchUserInfo,
        fetchClientIp,
        measureLatency,
        fetchServerInfo,
        fetchPlayCount,
        reportPlaybackStart,
        reportPlaybackProgress,
        reportPlaybackStopped,
        getImageUrl,
        getStreamUrl,
        getTrickplayUrl,
    }
}
