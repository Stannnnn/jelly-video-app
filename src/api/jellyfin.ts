import { Jellyfin } from '@jellyfin/sdk'
import { UserLibraryApi } from '@jellyfin/sdk/lib/generated-client'
import { CollectionApi } from '@jellyfin/sdk/lib/generated-client/api/collection-api'
import { ConfigurationApi } from '@jellyfin/sdk/lib/generated-client/api/configuration-api'
import { ItemsApi } from '@jellyfin/sdk/lib/generated-client/api/items-api'
import { LibraryApi } from '@jellyfin/sdk/lib/generated-client/api/library-api'
import { PlaylistsApi } from '@jellyfin/sdk/lib/generated-client/api/playlists-api'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { SessionApi } from '@jellyfin/sdk/lib/generated-client/api/session-api'
import { SystemApi } from '@jellyfin/sdk/lib/generated-client/api/system-api'
import { TvShowsApi } from '@jellyfin/sdk/lib/generated-client/api/tv-shows-api'
import { UserApi } from '@jellyfin/sdk/lib/generated-client/api/user-api'
import { BaseItemDto, BaseItemKind, ItemFields } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { PlayMethod } from '@jellyfin/sdk/lib/generated-client/models/play-method'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'

export class ApiError extends Error {
    constructor(
        message: string,
        public response: Response
    ) {
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

const blobToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

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

const extraFields: ItemFields[] = ['Trickplay', 'MediaStreams', 'Chapters']

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
        const isDownloaded = item.Id ? await window.audioStorage.hasTrack(item.Id) : false
        const downloadState = item.Id ? window.getDownloadState(item.Id) : undefined

        return {
            ...item,
            Id: item.Id || '',
            Name: item.Name || '',
            offlineState: downloadState || (isDownloaded ? 'downloaded' : undefined),
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

    const getNextUp = async (startIndex = 0, limit = 36) => {
        const tvShowsApi = new TvShowsApi(api.configuration)
        const response = await tvShowsApi.getNextUp({
            userId,
            startIndex,
            limit,
            fields: extraFields,
            imageTypeLimit: 1,
            enableImageTypes: ['Primary', 'Backdrop', 'Banner', 'Thumb'],
            enableTotalRecordCount: false,
            disableFirstEpisode: false,
            enableResumable: false,
            enableRewatching: false,
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

    const reportPlaybackStart = async (trackId: string, signal: AbortSignal, mediaSourceId?: string) => {
        const sessionsApi = new PlaystateApi(api.configuration)
        await sessionsApi.reportPlaybackStart(
            {
                playbackStartInfo: {
                    ItemId: trackId,
                    PlayMethod: PlayMethod.DirectStream,
                    PositionTicks: 0,
                    IsPaused: false,
                    CanSeek: true,
                    MediaSourceId: mediaSourceId || trackId,
                    AudioStreamIndex: 1,
                },
            },
            { signal }
        )
    }

    let lastProgress = new AbortController()

    const reportPlaybackProgress = async (
        trackId: string,
        position: number,
        isPaused: boolean,
        mediaSourceId?: string
    ) => {
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
                    MediaSourceId: mediaSourceId || trackId,
                    AudioStreamIndex: 1,
                },
            },
            { signal: lastProgress.signal }
        )
    }

    const reportPlaybackStopped = async (
        trackId: string,
        position: number,
        signal?: AbortSignal,
        mediaSourceId?: string
    ) => {
        const sessionsApi = new PlaystateApi(api.configuration)
        await sessionsApi.reportPlaybackStopped(
            {
                playbackStopInfo: {
                    ItemId: trackId,
                    PositionTicks: Math.floor(position * 10000000),
                    MediaSourceId: mediaSourceId || trackId,
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

        // Fallback for 'Continue watching'
        if (type === 'Backdrop' && !item.ImageTags?.[type] && item.ImageTags?.['Thumb'] && size.width <= 280) {
            const type = 'Thumb'
            return `${serverUrl}/Items/${item.Id}/Images/${type}?tag=${item.ImageTags[type]}&quality=100&fillWidth=${size.width}&fillHeight=${size.height}&format=webp&api_key=${token}`
        }

        return undefined
    }

    const getStreamUrl = (trackId: string, bitrate: number, mediaSourceId?: string) => {
        return `${serverUrl}/Videos/${trackId}/stream?MediaSourceId=${
            mediaSourceId || trackId
        }&UserId=${userId}&api_key=${token}&static=true`
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

    const getItemById = async (itemId: string, mediaSourceId?: string) => {
        const userLibraryApi = new UserLibraryApi(api.configuration)
        const response = await userLibraryApi.getItem(
            {
                userId,
                itemId: mediaSourceId || itemId,
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
        itemTypes?: BaseItemKind[],
        excludeItemTypes?: BaseItemKind[]
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
            excludeItemTypes: excludeItemTypes,
        })

        return await parseItemDtos(response.data.Items)
    }

    const getPlaylistItems = async (
        playlistId: string,
        startIndex = 0,
        limit = 36,
        sortBy: 'Inherit' | ItemSortBy[] = [ItemSortBy.DateCreated],
        sortOrder: SortOrder[] = [SortOrder.Descending]
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const playlistsApi = new PlaylistsApi(api.configuration)

        const response =
            sortBy === 'Inherit'
                ? await playlistsApi.getPlaylistItems(
                      {
                          userId,
                          playlistId,
                          startIndex,
                          limit,
                      },
                      { signal: AbortSignal.timeout(20000) }
                  )
                : await itemsApi.getItems(
                      {
                          userId,
                          parentId: playlistId,
                          includeItemTypes: [BaseItemKind.Video, BaseItemKind.Movie, BaseItemKind.Episode],
                          sortBy,
                          sortOrder,
                          startIndex,
                          limit,
                      },
                      { signal: AbortSignal.timeout(20000) }
                  )

        const items = await parseItemDtos(response.data.Items)

        return items
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

    const getEpisodes = async (
        seasonId: string,
        startIndex?: number,
        limit?: number,
        sortBy?: ItemSortBy[],
        sortOrder?: SortOrder[]
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            parentId: seasonId,
            includeItemTypes: [BaseItemKind.Episode],
            sortBy: sortBy || [ItemSortBy.SortName],
            sortOrder: sortOrder || [SortOrder.Ascending],
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
        const peopleAsItems = (item.People || []).slice(0, 16).map(person => ({
            Id: person.Id || '',
            Name: person.Name || '',
            Type: 'Person' as const,
            Role: person.Role || person.Type,
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
            sortBy: [ItemSortBy.PremiereDate],
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

        return (await parseItemDtos(response.data.Items)).slice(0, 12)
    }

    const addToCollection = async (collectionId: string, items: MediaItem[]) => {
        const collectionApi = new CollectionApi(api.configuration)
        const itemIds = items.map(item => item.Id)
        await collectionApi.addToCollection({
            collectionId,
            ids: itemIds,
        })
    }

    const removeFromCollection = async (collectionId: string, item: MediaItem) => {
        const collectionApi = new CollectionApi(api.configuration)
        await collectionApi.removeFromCollection({
            collectionId,
            ids: [item.Id],
        })
    }

    const createCollection = async (name: string, sourceItemId?: string) => {
        const collectionApi = new CollectionApi(api.configuration)
        const response = await collectionApi.createCollection({
            name,
            isLocked: false,
        })

        // If a source item is provided, copy its Primary image to the collection
        if (sourceItemId && response.data.Id) {
            try {
                await setCollectionImage(response.data.Id, sourceItemId)
            } catch (error) {
                console.error('Failed to set collection image:', error)
                // Don't fail collection creation if image copy fails
            }
        }

        return response.data
    }

    const setCollectionImage = async (collectionId: string, sourceItemId: string) => {
        const sourceItem = await getItemById(sourceItemId)

        const imageTypes: Array<'Primary' | 'Thumb' | 'Backdrop'> = ['Primary', 'Thumb', 'Backdrop']

        // First, find a valid image
        let validImageUrl: string | undefined
        let validImageBlob: Blob | undefined
        let validContentType: string | undefined

        for (const imageType of imageTypes) {
            const imageUrl = getImageUrl(sourceItem, imageType, { width: 1000, height: 1000 })

            if (!imageUrl) continue

            try {
                const imageResponse = await fetch(imageUrl)

                if (!imageResponse.ok) continue

                validImageBlob = await imageResponse.blob()
                validContentType = imageResponse.headers.get('content-type') || 'image/webp'
                validImageUrl = imageUrl
                break
            } catch {
                continue
            }
        }

        if (!validImageUrl || !validImageBlob || !validContentType) {
            throw new Error('No valid images found on source item')
        }

        const base64 = await blobToBase64(validImageBlob)

        const uploadUrl = `${serverUrl}/Items/${collectionId}/Images/Primary`
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                authorization: `MediaBrowser Client="Jelly Video App", Device="Web", DeviceId="${deviceId}", Version="${__VERSION__}", Token="${token}"`,
                'content-type': validContentType,
            },
            body: base64,
        })

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`)
        }
    }

    const renameCollection = async (collectionId: string, newName: string) => {
        const item = await getItemById(collectionId)

        // Jellyfin doesn't have a direct API for renaming. We need to use the raw API endpoint
        await fetch(`${serverUrl}/Items/${collectionId}`, {
            method: 'POST',
            headers: {
                authorization: `MediaBrowser Client="Jelly Video App", Device="Web", DeviceId="${deviceId}", Version="${__VERSION__}", Token="${token}"`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...item,
                Name: newName,
            }),
        })
    }

    const deleteCollection = async (collectionId: string) => {
        const libraryApi = new LibraryApi(api.configuration)
        await libraryApi.deleteItem({
            itemId: collectionId,
        })
    }

    const addToPlaylist = async (playlistId: string, items: MediaItem[]) => {
        const playlistApi = new PlaylistsApi(api.configuration)
        const batchSize = 200

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize)
            await playlistApi.addItemToPlaylist(
                {
                    userId,
                    playlistId,
                    ids: batch.map(item => item.Id),
                },
                { signal: AbortSignal.timeout(20000) }
            )
        }

        return true
    }

    const removeFromPlaylist = async (playlistId: string, item: MediaItem) => {
        const playlistApi = new PlaylistsApi(api.configuration)

        const response = await playlistApi.removeItemFromPlaylist(
            {
                playlistId,
                entryIds: [item.Id],
            },
            { signal: AbortSignal.timeout(20000) }
        )

        return response.data
    }

    const createPlaylist = async (name: string) => {
        const playlistApi = new PlaylistsApi(api.configuration)

        const response = await playlistApi.createPlaylist(
            {
                // Seems to be bugged, need to pass both
                createPlaylistDto: {
                    Name: name,
                    IsPublic: false,
                    MediaType: 'Video',
                },
                name,
                mediaType: 'Video',
            },
            { signal: AbortSignal.timeout(20000) }
        )

        return response.data
    }

    const renamePlaylist = async (playlistId: string, newName: string) => {
        const playlistApi = new PlaylistsApi(api.configuration)

        const response = await playlistApi.updatePlaylist({
            playlistId,
            // Seems to be bugged, need to pass both
            updatePlaylistDto: {
                Name: newName,
                IsPublic: false,
            },
        })

        return response.data
    }

    const deletePlaylist = async (playlistId: string) => {
        const libraryApi = new LibraryApi(api.configuration)
        await libraryApi.deleteItem({
            itemId: playlistId,
        })
    }

    const getPlaylists = async (
        startIndex = 0,
        limit = 36,
        sortBy: ItemSortBy[] = [ItemSortBy.SortName],
        sortOrder: SortOrder[] = [SortOrder.Ascending]
    ) => {
        const itemsApi = new ItemsApi(api.configuration)
        const response = await itemsApi.getItems({
            userId,
            startIndex,
            limit,
            sortBy,
            sortOrder,
            recursive: true,
            includeItemTypes: [BaseItemKind.Playlist],
            fields: extraFields,
            mediaTypes: ['Video'],
        })

        return await parseItemDtos(response.data.Items)
    }

    return {
        loginToJellyfin,
        getMovies,
        getSeries,
        getCollections,
        getPlaylists,
        getFavorites,
        getRecentlyPlayed,
        getNextUp,
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
        addToCollection,
        removeFromCollection,
        createCollection,
        renameCollection,
        deleteCollection,
        addToPlaylist,
        removeFromPlaylist,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        getPlaylistItems,
    }
}
