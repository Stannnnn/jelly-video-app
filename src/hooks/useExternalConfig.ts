import { useQuery } from '@tanstack/react-query'

function isNullOrUndefined(v: unknown) {
    return v === null || v === undefined
}

interface ExternalConfiguration {
    defaultJellyfinUrl?: string
    lockJellyfinUrl?: boolean
}

export function useExternalConfig() {
    return useQuery<ExternalConfiguration, Error>({
        queryKey: ['config'],
        queryFn: async () => {
            try {
                const result = await fetch('/config.json')
                const data = await result.json()

                const newConfig: ExternalConfiguration = {}

                if (isNullOrUndefined(newConfig.defaultJellyfinUrl))
                    newConfig.defaultJellyfinUrl = data.DEFAULT_JELLYFIN_URL
                if (isNullOrUndefined(newConfig.lockJellyfinUrl))
                    newConfig.lockJellyfinUrl = data.LOCK_JELLYFIN_URL === 'true' || data.LOCK_JELLYFIN_URL === true

                return newConfig
            } catch (e) {
                console.error(e)
            }

            return {}
        },
    })
}
