import { XCircleIcon } from '@primer/octicons-react'
import { MediaList } from '../components/MediaList'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useIndexedDbDownloadsData } from '../hooks/useIndexedDbDownloadsData'
import './Downloads.css'

export const Downloads = () => {
    const { items, isLoading, error, loadMore } = useIndexedDbDownloadsData()
    const { jellyItemKind } = useFilterContext()
    const { queue, removeFromQueue, progressBarRef, currentDownloadingId } = useDownloadContext()

    const queueItems = queue
        .filter(task => task.mediaItem.Type === jellyItemKind)
        .map(task => ({
            ...task.mediaItem,
            offlineState: (task.action === 'remove' ? 'deleting' : 'downloading') as 'downloading' | 'deleting',
        }))
        .reverse()

    return (
        <div className="favorites-page downloads-page">
            {error && <div className="error">{error}</div>}

            {queueItems.length > 0 && (
                <div className="queue-list">
                    <MediaList
                        items={queueItems}
                        isLoading={false}
                        type={'movie'}
                        disableActions={true}
                        disableEvents={true}
                        progressBarRef={progressBarRef}
                        currentDownloadingId={currentDownloadingId}
                        removeButton={item => (
                            <div
                                className="icon remove"
                                onClick={() => removeFromQueue(item.Id)}
                                title="Remove from queue"
                            >
                                <XCircleIcon size={16} />
                            </div>
                        )}
                    />
                </div>
            )}

            <MediaList
                items={items}
                isLoading={isLoading && queueItems.length === 0}
                type={'movie'}
                loadMore={loadMore}
                disableActions={true}
            />
        </div>
    )
}
