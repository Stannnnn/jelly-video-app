import { createContext, useContext } from 'react'
import { IThemeContext } from './ThemeContextProvider'

export const ThemeContext = createContext<IThemeContext>({} as IThemeContext)

export const useThemeContext = () => useContext(ThemeContext)
