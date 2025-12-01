import { createContext, useContext } from 'react'
import { IPlaybackContext } from './PlaybackContextProvider'

export const PlaybackContext = createContext<IPlaybackContext>({} as IPlaybackContext)

export const usePlaybackContext = () => useContext(PlaybackContext)
