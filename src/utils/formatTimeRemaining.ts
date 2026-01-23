export const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 0 || !isFinite(seconds)) return 'calculating...'
    if (seconds < 60) return `${Math.round(seconds)}s`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}min${minutes !== 1 ? 's' : ''}`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}hr${hours !== 1 ? 's' : ''}`

    return `${hours}hr${hours !== 1 ? 's' : ''} ${remainingMinutes}min`
}
