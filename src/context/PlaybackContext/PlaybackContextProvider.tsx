import { ReactNode } from 'react'
import { PlaybackManagerProps, usePlaybackManager } from '../../components/PlaybackManager'
import { PlaybackContext } from './PlaybackContext'

export type IPlaybackContext = ReturnType<typeof useInitialState>

const useInitialState = (props: PlaybackManagerProps) => {
    const playbackManager = usePlaybackManager(props)

    return playbackManager
}

export const PlaybackContextProvider = (props: { children: ReactNode } & PlaybackManagerProps) => {
    const { children, ...rest } = props
    const initialState = useInitialState(rest)

    return <PlaybackContext.Provider value={initialState}>{children}</PlaybackContext.Provider>
}
