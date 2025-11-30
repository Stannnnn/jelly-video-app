export const formatDurationReadable = (ticks?: number) => {
    if (!ticks || ticks <= 0) return '0m'

    const seconds = Math.floor(ticks / 10_000_000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const parts: string[] = []

    if (hours > 0) {
        parts.push(`${hours}h`)
    }

    if (minutes > 0 || hours > 0) {
        parts.push(`${minutes}m`)
    }

    if (hours === 0 && minutes === 0 && remainingSeconds > 0) {
        parts.push(`${remainingSeconds}s`)
    }

    return parts.join(' ') || '0m'
}
