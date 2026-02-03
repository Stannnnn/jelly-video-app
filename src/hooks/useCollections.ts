import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePatchQueries } from './usePatchQueries'

export const useCollections = () => {
    const api = useJellyfinContext()
    const { prependItemsToQueryData, removeItemFromQueryData, patchMediaItem } = usePatchQueries()

    return {
        addToCollection: async (item: MediaItem, collectionId: string) => {
            await api.addToCollection(collectionId, [item])
            prependItemsToQueryData(['collection-children', collectionId], [item])
        },
        addItemsToCollection: async (items: MediaItem[], collectionId: string) => {
            await api.addToCollection(collectionId, items)
            prependItemsToQueryData(['collection-children', collectionId], items)
        },
        removeFromCollection: async (item: MediaItem, collectionId: string) => {
            await api.removeFromCollection(collectionId, item)
            removeItemFromQueryData(['collection-children', collectionId], item.Id)
        },
        createCollection: async (name: string, sourceItemId?: string) => {
            const res = await api.createCollection(name, sourceItemId)
            const collection = await api.getItemById(res.Id!)
            prependItemsToQueryData(['collections'], [collection])
            return collection
        },
        renameCollection: async (collectionId: string, newName: string) => {
            await api.renameCollection(collectionId, newName)
            patchMediaItem(collectionId, item => ({ ...item, Name: newName }))
        },
        deleteCollection: async (collectionId: string) => {
            await api.deleteCollection(collectionId)
            removeItemFromQueryData(['collections'], collectionId)
        },
    }
}
