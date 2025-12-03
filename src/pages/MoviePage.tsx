import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import './DetailPages.css'

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
        <div className="movie-page">
            <MediaInfo item={movie} />
        </div>
    )
}
