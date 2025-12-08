import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import './MediaPages.css'

export const MoviePage = () => {
    const { id } = useParams<{ id: string }>()
    const api = useJellyfinContext()

    const {
        data: movie,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['movie', id],
        queryFn: () => api.getItemById(id!),
        enabled: !!id,
    })

    if (isLoading) {
        return <Loader />
    }

    if (error || !movie) {
        return <div className="error">Failed to load movie</div>
    }

    return (
        <div className="media-page movie">
            <MediaInfo item={movie} />
            <div className="media-content">
                <div className="section movie"></div>
            </div>
        </div>
    )
}
