import { MediaItem } from '../api/jellyfin'

export const MediaFooter = ({ item }: { item: MediaItem }) => {
    const videoSources = item.MediaSources || []

    const sortedVideoSources = [...videoSources].sort((a, b) => {
        const heightA = a.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        const heightB = b.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        return heightB - heightA
    })

    return (
        <div className="media-footer">
            {sortedVideoSources.map((source, index) => {
                const fileName = source.Path?.split(/[\\/]/).pop() || source.Name || `Version ${index + 1}`
                const fileSize = source.Size
                    ? source.Size >= 1e9
                        ? `${(source.Size / 1e9).toFixed(2)}GB`
                        : `${(source.Size / 1e6).toFixed(0)}MB`
                    : null
                const videoStream = source.MediaStreams?.find(s => s.Type === 'Video')
                const vcodec =
                    videoStream?.DisplayTitle?.split('-').slice(-3).join('-').trim() ||
                    (videoStream
                        ? `${videoStream.Codec?.toUpperCase()} ${
                              videoStream.BitDepth ? `${videoStream.BitDepth}bit` : ''
                          } ${videoStream.VideoRange === 'HDR' ? 'HDR' : ''}`.trim()
                        : '')

                return fileName || vcodec || fileSize ? (
                    <div key={source.Id || index} className="fileinfo">
                        <div className="name" title={fileName}>
                            {fileName}
                        </div>
                        {(vcodec || fileSize) && (
                            <div className="container">
                                {vcodec && <div className="vcodec">{vcodec}</div>}
                                <div className="divider">-</div>
                                {fileSize && <div className="size">{fileSize}</div>}
                            </div>
                        )}
                    </div>
                ) : null
            })}
        </div>
    )
}
