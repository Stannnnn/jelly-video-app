import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { getPageTitle } from '../utils/titleUtils'

export const useDocumentTitle = () => {
    const { pageTitle } = usePageTitle()
    const location = useLocation()

    useEffect(() => {
        document.title = `${getPageTitle(pageTitle, location)} - Jelly Video App`
    }, [pageTitle, location.pathname, location])
}
