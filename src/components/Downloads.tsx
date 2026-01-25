import { XCircleIcon } from '@primer/octicons-react'
import { MediaList } from '../components/MediaList'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useIndexedDbDownloadsData } from '../hooks/useIndexedDbDownloadsData'
import { formatFileSize } from '../utils/formatFileSize'
import { formatTimeRemaining } from '../utils/formatTimeRemaining'
import './Downloads.css'

export const Downloads = () => {
    const { items, isLoading, error, loadMore } = useIndexedDbDownloadsData()
    const { queue, removeFromQueue, progressBarRef, currentDownloadingId, downloadProgress } = useDownloadContext()
    const { jellyItemKind } = useFilterContext()

    const queueItems = queue.map(task => ({
        ...task.mediaItem,
        offlineState: (task.action === 'remove' ? 'deleting' : 'downloading') as 'downloading' | 'deleting',
    }))

    console.log(jellyItemKind)

    return (
        <div className="downloads-page">
            {error && <div className="error">{error}</div>}

            {queueItems.length > 0 && (
                <div className="queue-list">
                    {downloadProgress && currentDownloadingId && (
                        <div className="download-info">
                            <div className="download-stats">
                                <span className="download-speed">{formatFileSize(downloadProgress.speed)}/s</span>
                                <span className="download-separator">•</span>
                                <span className="download-size">
                                    {formatFileSize(downloadProgress.downloaded)} of{' '}
                                    {formatFileSize(downloadProgress.total)}
                                </span>
                                <span className="download-separator">•</span>
                                <span className="download-time">
                                    {formatTimeRemaining(downloadProgress.timeRemaining)} left
                                </span>
                            </div>
                        </div>
                    )}
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
                type={jellyItemKind === 'Episode' ? 'episode' : 'movie'}
                loadMore={loadMore}
                disableActions={true}
            />
        </div>
    )
}
