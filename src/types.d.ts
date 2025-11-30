declare global {
    interface Window {
        __NPM_LIFECYCLE_EVENT__: string
    }

    const __VERSION__: string
}

export {}
