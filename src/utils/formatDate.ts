export const formatDate = (date?: string | null) => {
    if (!date) return 'Unknown Date'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const formatDateYear = (date?: string | null) => {
    if (!date) return 'Unknown Date'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric' })
}
