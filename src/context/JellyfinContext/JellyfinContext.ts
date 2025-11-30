import { createContext, useContext } from 'react'
import { IJellyfinContext } from './JellyfinContextProvider'

export const JellyfinContext = createContext<IJellyfinContext>({} as IJellyfinContext)

export const useJellyfinContext = () => useContext(JellyfinContext)
