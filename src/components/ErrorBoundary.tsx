import React, { ErrorInfo, ReactNode } from 'react'
import { persister, queryClient } from '../queryClient'
import './ErrorBoundary.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    showDetails: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        showDetails: false,
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info)
    }

    toggleDetails = () => {
        this.setState(({ showDetails }) => ({ showDetails: !showDetails }))
    }

    reloadPage = async () => {
        queryClient.clear()
        await persister.removeClient()

        if (navigator.onLine) {
            await Promise.all(((await navigator.serviceWorker?.getRegistrations()) || []).map(r => r.unregister()))
            await Promise.all(((await window.caches?.keys()) || []).map(c => window.caches.delete(c)))
        }

        window.location.reload()
    }

    render() {
        const { hasError, error, showDetails } = this.state

        if (hasError) {
            return (
                <div className="error-page">
                    <div className="error_header">
                        <div className="logo"></div>
                    </div>
                    <div className="error-content">
                        <div className="container">
                            <div className="title">Something went wrong</div>
                            <div className="description">
                                Try clearing cache and refreshing. If that fails, reveal the error details below and
                                report them on{' '}
                                <a
                                    href="https://github.com/Stannnnn/jelly-app/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="textlink"
                                >
                                    GitHub.
                                </a>{' '}
                                Consider removing sensitive info (like IP or URL) before sharing.
                            </div>
                            <div className="error-actions noSelect">
                                <button onClick={this.toggleDetails} className="btn-details">
                                    {showDetails ? 'Hide Details' : 'Show Error'}
                                </button>
                                <button onClick={this.reloadPage} className="btn-reload">
                                    Clear & Refresh
                                </button>
                            </div>
                        </div>
                        <pre className={`error-details ${showDetails && error ? 'visible' : 'hidden'}`}>
                            {error?.stack || error?.toString()}
                        </pre>
                    </div>
                    <div className="disclaimer">Jelly Video App - Version {__VERSION__}</div>
                </div>
            )
        }

        return this.props.children
    }
}
