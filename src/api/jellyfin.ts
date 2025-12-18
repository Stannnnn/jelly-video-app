import { Jellyfin } from '@jellyfin/sdk'
import { UserLibraryApi } from '@jellyfin/sdk/lib/generated-client'
import { ConfigurationApi } from '@jellyfin/sdk/lib/generated-client/api/configuration-api'
import { ItemsApi } from '@jellyfin/sdk/lib/generated-client/api/items-api'
import { LibraryApi } from '@jellyfin/sdk/lib/generated-client/api/library-api'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { SessionApi } from '@jellyfin/sdk/lib/generated-client/api/session-api'
import { SystemApi } from '@jellyfin/sdk/lib/generated-client/api/system-api'
import { UserApi } from '@jellyfin/sdk/lib/generated-client/api/user-api'
import { BaseItemDto, BaseItemKind, ItemFields } from '@jellyfin/sdk/lib/generated-client/models'
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
    offlineState?: 'downloading' | 'downloaded' | 'deleting'
    downloadedImageUrl?: string
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

const extraFields: ItemFields[] = ['Trickplay', 'MediaStreams']

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

    const getMovies = async (
        startIndex = 0,
        limit = 36,
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
            recursive: true,
            includeItemTypes: [BaseItemKind.Movie],
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getSeries = async (
        startIndex = 0,
        limit = 36,
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
            recursive: true,
            includeItemTypes: [BaseItemKind.Series],
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getCollections = async (
        startIndex = 0,
        limit = 36,
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
            recursive: true,
            includeItemTypes: [BaseItemKind.BoxSet],
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getFavorites = async (
        startIndex = 0,
        limit = 36,
        sortBy: ItemSortBy[] = [ItemSortBy.DateCreated],
        sortOrder: SortOrder[] = [SortOrder.Descending],
        itemKind: BaseItemKind = BaseItemKind.Movie
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            startIndex,
            limit,
            sortBy,
            sortOrder,
            recursive: true,
            filters: [ItemFilter.IsFavorite],
            includeItemTypes: [itemKind],
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getRecentlyPlayed = async (startIndex = 0, limit = 36) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getResumeItems({
            userId,
            startIndex,
            limit,
            fields: extraFields,
            includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Episode],
        })

        return await parseItemDtos(response.data.Items)
    }

    const getRecentlyAdded = async (startIndex = 0, limit = 12, itemKind: BaseItemKind) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            startIndex,
            limit,
            sortBy: [ItemSortBy.DateCreated],
            sortOrder: [SortOrder.Descending],
            recursive: true,
            fields: extraFields,
            includeItemTypes: [itemKind],
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

    const fetchServerConfiguration = async () => {
        const configurationApi = new ConfigurationApi(api.configuration)
        const response = await configurationApi.getConfiguration()
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

    const getImageUrl = (
        item: MediaItem,
        type: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb',
        size: { width: number; height: number }
    ) => {
        if (item.ImageTags?.[type]) {
            return `${serverUrl}/Items/${item.Id}/Images/${type}?tag=${item.ImageTags[type]}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        if (item.AlbumId) {
            return `${serverUrl}/Items/${item.AlbumId}/Images/${type}?quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        if (type === 'Backdrop' && item.BackdropImageTags && item.BackdropImageTags.length > 0) {
            return `${serverUrl}/Items/${item.Id}/Images/Backdrop/0?tag=${item.BackdropImageTags[0]}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        if (type === 'Thumb') {
            const thumbId = item.ImageTags?.Thumb ? item.Id : item.ParentThumbItemId || item.SeriesId
            const tag = item.ImageTags?.Thumb || item.ParentThumbImageTag

            if (thumbId && tag) {
                return `${serverUrl}/Items/${thumbId}/Images/Thumb?tag=${tag}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
            }
        }

        if (item.Type === 'Person') {
            return `${serverUrl}/Items/${item.Id}/Images/${type}?quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        if (item.Type === 'Episode' && item.SeriesId) {
            const seriesThumbId = item.SeriesId
            const seriesTag = item.SeriesPrimaryImageTag

            if (seriesThumbId && seriesTag) {
                return `${serverUrl}/Items/${seriesThumbId}/Images/${type}?tag=${seriesTag}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
            }
        }

        if (item.Type === 'Video') {
            return `${serverUrl}/Items/${item.ParentLogoItemId}/Images/${type}?tag=${item.ParentLogoItemId}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
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

    const addToFavorites = async (item: MediaItem) => {
        const userLibraryApi = new UserLibraryApi(api.configuration)

        const r = await userLibraryApi.markFavoriteItem(
            { itemId: item.Id, userId },
            { signal: AbortSignal.timeout(20000) }
        )

        // await syncDownloadsById('JMA_CUSTOM_FAVORITES', [item])

        return r
    }

    const removeFromFavorites = async (item: MediaItem) => {
        const userLibraryApi = new UserLibraryApi(api.configuration)

        const r = await userLibraryApi.unmarkFavoriteItem(
            { itemId: item.Id, userId },
            { signal: AbortSignal.timeout(20000) }
        )

        // await unsyncDownloadsById('JMA_CUSTOM_FAVORITES', [item])

        return r
    }

    const markAsPlayed = async (item: MediaItem) => {
        const playstateApi = new PlaystateApi(api.configuration)

        const r = await playstateApi.markPlayedItem({ itemId: item.Id, userId }, { signal: AbortSignal.timeout(20000) })

        return r
    }

    const markAsUnplayed = async (item: MediaItem) => {
        const playstateApi = new PlaystateApi(api.configuration)

        const r = await playstateApi.markUnplayedItem(
            { itemId: item.Id, userId },
            { signal: AbortSignal.timeout(20000) }
        )

        return r
    }

    const getItemById = async (itemId: string) => {
        const userLibraryApi = new UserLibraryApi(api.configuration)
        const response = await userLibraryApi.getItem(
            {
                userId,
                itemId,
            },
            { signal: AbortSignal.timeout(20000) }
        )

        return parseItemDto(response.data)
    }

    const getItemChildren = async (
        parentId: string,
        startIndex = 0,
        limit = 36,
        sortBy: ItemSortBy[] = [ItemSortBy.PremiereDate],
        sortOrder: SortOrder[] = [SortOrder.Ascending],
        recursive = false,
        itemTypes?: BaseItemKind[]
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            parentId,
            startIndex,
            limit,
            sortBy,
            sortOrder,
            fields: extraFields,
            recursive,
            includeItemTypes: itemTypes,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getSeasons = async (seriesId: string, startIndex?: number, limit?: number) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            parentId: seriesId,
            includeItemTypes: [BaseItemKind.Season],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            fields: extraFields,
            startIndex,
            limit,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getEpisodes = async (seasonId: string, startIndex?: number, limit?: number) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            parentId: seasonId,
            includeItemTypes: [BaseItemKind.Episode],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            fields: extraFields,
            startIndex,
            limit,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getSpecials = async (itemId: string) => {
        const userLibraryApi = new UserLibraryApi(api.configuration)
        const response = await userLibraryApi.getSpecialFeatures({
            userId,
            itemId,
        })

        return await parseItemDtos(response.data)
    }

    const searchItems = async (searchQuery: string, limit = 36, includeItemTypes?: BaseItemKind[], startIndex = 0) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            searchTerm: searchQuery,
            recursive: true,
            limit,
            startIndex,
            includeItemTypes: includeItemTypes || [
                BaseItemKind.Movie,
                BaseItemKind.Series,
                BaseItemKind.Episode,
                BaseItemKind.BoxSet,
            ],
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getCastCrew = async (itemId: string) => {
        const item = await getItemById(itemId)

        // Convert People to MediaItem format for rendering
        const peopleAsItems = (item.People || []).map(person => ({
            Id: person.Id || '',
            Name: person.Name || '',
            Type: 'Person' as const,
            Role: person.Role,
            PrimaryImageTag: person.PrimaryImageTag,
        }))

        return {
            item: await parseItemDto(item),
            people: peopleAsItems as MediaItem[],
        }
    }

    const getPersonMovies = async (personId: string, startIndex = 0, limit = 36) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            personIds: [personId],
            recursive: true,
            startIndex,
            limit,
            includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            fields: extraFields,
        })

        return {
            items: await parseItemDtos(response.data.Items),
            totalCount: response.data.TotalRecordCount || 0,
        }
    }

    const getSimilarItems = async (itemId: string, limit = 12) => {
        const libraryApi = new LibraryApi(api.configuration)
        const response = await libraryApi.getSimilarItems({
            itemId,
            userId,
            limit,
            fields: extraFields,
        })

        return await parseItemDtos(response.data.Items)
    }

    return {
        loginToJellyfin,
        getMovies,
        getSeries,
        getCollections,
        getFavorites,
        getRecentlyPlayed,
        getRecentlyAdded,
        fetchUserInfo,
        fetchClientIp,
        measureLatency,
        fetchServerInfo,
        fetchServerConfiguration,
        fetchPlayCount,
        reportPlaybackStart,
        reportPlaybackProgress,
        reportPlaybackStopped,
        getImageUrl,
        getStreamUrl,
        getTrickplayUrl,
        addToFavorites,
        removeFromFavorites,
        markAsPlayed,
        markAsUnplayed,
        getItemById,
        getItemChildren,
        getSeasons,
        getEpisodes,
        getSpecials,
        searchItems,
        getCastCrew,
        getPersonMovies,
        getSimilarItems,
    }
}
