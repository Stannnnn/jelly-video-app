declare global {
    interface Window {
        __NPM_LIFECYCLE_EVENT__: string
        audioStorage: IAudioStorageContext
    }

    const __VERSION__: string
}

export {}
