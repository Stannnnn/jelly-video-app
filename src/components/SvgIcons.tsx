import { Component } from 'react'

interface IconProps {
    width?: number | string
    height?: number | string
    className?: string
}

export class SearchIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 15.4395 15.2246"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="15.2246" opacity="0" width="15.4395" x="0" y="0" />
                    <path d="M0 6.21094C0 9.63867 2.7832 12.4121 6.21094 12.4121C7.5293 12.4121 8.74023 12.002 9.74609 11.2988L13.3789 14.9414C13.584 15.1367 13.8379 15.2246 14.1016 15.2246C14.668 15.2246 15.0781 14.7949 15.0781 14.2285C15.0781 13.9551 14.9707 13.7109 14.8047 13.5254L11.1914 9.90234C11.9629 8.86719 12.4121 7.59766 12.4121 6.21094C12.4121 2.7832 9.63867 0 6.21094 0C2.7832 0 0 2.7832 0 6.21094ZM1.50391 6.21094C1.50391 3.60352 3.60352 1.50391 6.21094 1.50391C8.80859 1.50391 10.918 3.60352 10.918 6.21094C10.918 8.80859 8.80859 10.918 6.21094 10.918C3.60352 10.918 1.50391 8.80859 1.50391 6.21094Z" />
                </g>
            </svg>
        )
    }
}

export class SearchClearIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16.1328 15.7715"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="15.7715" opacity="0" width="16.1328" x="0" y="0" />
                    <path d="M15.7715 7.88086C15.7715 12.2266 12.2363 15.7617 7.88086 15.7617C3.53516 15.7617 0 12.2266 0 7.88086C0 3.53516 3.53516 0 7.88086 0C12.2363 0 15.7715 3.53516 15.7715 7.88086ZM9.98047 4.80469L7.88086 6.88477L5.81055 4.81445C5.67383 4.6875 5.51758 4.61914 5.3125 4.61914C4.92188 4.61914 4.59961 4.92188 4.59961 5.33203C4.59961 5.51758 4.67773 5.69336 4.80469 5.83008L6.86523 7.89062L4.80469 9.95117C4.67773 10.0879 4.59961 10.2637 4.59961 10.4492C4.59961 10.8594 4.92188 11.1816 5.3125 11.1816C5.51758 11.1816 5.70312 11.1133 5.83008 10.9766L7.88086 8.90625L9.94141 10.9766C10.0684 11.1133 10.2539 11.1816 10.4492 11.1816C10.8594 11.1816 11.1816 10.8594 11.1816 10.4492C11.1816 10.2539 11.1133 10.0781 10.9668 9.94141L8.90625 7.89062L10.9766 5.82031C11.1328 5.67383 11.1914 5.50781 11.1914 5.3125C11.1914 4.91211 10.8691 4.59961 10.4688 4.59961C10.2832 4.59961 10.127 4.66797 9.98047 4.80469Z" />
                </g>
            </svg>
        )
    }
}

export class MoreIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 12.1562 3"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="3" opacity="0" width="12.1562" x="0" y="0" />
                    <circle cx="10.5391" cy="1.5" r="1.3" />
                    <circle cx="5.875" cy="1.5" r="1.3" />
                    <circle cx="1.31094" cy="1.5" r="1.3" />
                </g>
            </svg>
        )
    }
}

export class PlaystateAnimationMedalist extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 20"
                width={width}
                height={height}
                className={className}
            >
                <rect x="2" y="12" width="2" height="8" rx="1" className="bar bar1"></rect>
                <rect x="6" y="10" width="2" height="10" rx="1" className="bar bar2"></rect>
                <rect x="10" y="14" width="2" height="6" rx="1" className="bar bar3"></rect>
                <rect x="14" y="11" width="2" height="9" rx="1" className="bar bar4"></rect>
                <rect x="18" y="13" width="2" height="7" rx="1" className="bar bar5"></rect>
                <rect x="22" y="12" width="2" height="8" rx="1" className="bar bar6"></rect>
            </svg>
        )
    }
}

export class PlaystateAnimationTracklist extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 18"
                width={width}
                height={height}
                className={className}
            >
                <rect x="1" y="10" width="3" height="8" rx="1.5" className="bar bar1"></rect>
                <rect x="5" y="9" width="3" height="9" rx="1.5" className="bar bar2"></rect>
                <rect x="9" y="11" width="3" height="7" rx="1.5" className="bar bar3"></rect>
                <rect x="13" y="10" width="3" height="8" rx="1.5" className="bar bar4"></rect>
            </svg>
        )
    }
}

export class PlaystateAnimationSearch extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 14 14"
                width={width}
                height={height}
                className={className}
            >
                <rect x="1" y="8" width="3" height="6" rx="1.5" className="bar bar1"></rect>
                <rect x="5.5" y="7" width="3" height="7" rx="1.5" className="bar bar2"></rect>
                <rect x="10" y="9" width="3" height="5" rx="1.5" className="bar bar3"></rect>
            </svg>
        )
    }
}

export class DownloadingIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13.0234 12.6172"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="12.6172" opacity="0" width="13.0234" x="0" y="0" />
                    <path d="M6.30469 12.6094C9.78906 12.6094 12.6172 9.78906 12.6172 6.30469C12.6172 2.82031 9.78906 0 6.30469 0C2.82812 0 0 2.82031 0 6.30469C0 9.78906 2.82812 12.6094 6.30469 12.6094ZM6.30469 11.4219C3.47656 11.4219 1.19531 9.13281 1.19531 6.30469C1.19531 3.47656 3.47656 1.1875 6.30469 1.1875C9.13281 1.1875 11.4219 3.47656 11.4219 6.30469C11.4219 9.13281 9.13281 11.4219 6.30469 11.4219Z" />
                    <path d="M6.30469 9.41406C6.45312 9.41406 6.57031 9.36719 6.71094 9.22656L8.71875 7.3125C8.82031 7.20312 8.88281 7.09375 8.88281 6.94531C8.88281 6.65625 8.66406 6.45312 8.375 6.45312C8.23438 6.45312 8.09375 6.50781 7.99219 6.61719L7.13281 7.55469L6.82031 7.89062L6.86719 6.96094L6.86719 3.73438C6.86719 3.44531 6.60938 3.19531 6.30469 3.19531C6.00781 3.19531 5.75 3.44531 5.75 3.73438L5.75 6.96094L5.79688 7.89062L5.47656 7.55469L4.61719 6.61719C4.52344 6.50781 4.36719 6.45312 4.23438 6.45312C3.94531 6.45312 3.73438 6.65625 3.73438 6.94531C3.73438 7.09375 3.78906 7.20312 3.89844 7.3125L5.89844 9.22656C6.04688 9.36719 6.16406 9.41406 6.30469 9.41406Z" />
                </g>
            </svg>
        )
    }
}

export class DownloadedIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13.0234 12.6172"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="12.6172" opacity="0" width="13.0234" x="0" y="0" />
                    <path d="M12.6172 6.30469C12.6172 9.78125 9.78906 12.6094 6.30469 12.6094C2.82812 12.6094 0 9.78125 0 6.30469C0 2.82812 2.82812 0 6.30469 0C9.78906 0 12.6172 2.82812 12.6172 6.30469ZM5.73438 3.64062L5.73438 6.98438L5.78125 7.95312L5.45312 7.60156L4.5625 6.63281C4.46094 6.51562 4.30469 6.46094 4.16406 6.46094C3.85938 6.46094 3.64062 6.67188 3.64062 6.96875C3.64062 7.125 3.70312 7.24219 3.8125 7.35156L5.89844 9.33594C6.04688 9.48438 6.16406 9.53125 6.3125 9.53125C6.46875 9.53125 6.58594 9.48438 6.73438 9.33594L8.8125 7.35156C8.92969 7.24219 8.98438 7.125 8.98438 6.96875C8.98438 6.67188 8.75781 6.46094 8.46094 6.46094C8.32031 6.46094 8.16406 6.51562 8.07031 6.63281L7.17188 7.60156L6.85156 7.95312L6.89062 6.98438L6.89062 3.64062C6.89062 3.32812 6.63281 3.07812 6.3125 3.07812C6 3.07812 5.73438 3.32812 5.73438 3.64062Z" />
                </g>
            </svg>
        )
    }
}

export class DeletingIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13.0234 12.6172"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="12.6172" opacity="0" width="13.0234" x="0" y="0" />
                    <path d="M12.6172 6.30469C12.6172 9.78125 9.78906 12.6094 6.30469 12.6094C2.82812 12.6094 0 9.78125 0 6.30469C0 2.82812 2.82812 0 6.30469 0C9.78906 0 12.6172 2.82812 12.6172 6.30469ZM3.92969 5.70312C3.5 5.70312 3.22656 5.92188 3.22656 6.32031C3.22656 6.71094 3.51562 6.92188 3.92969 6.92188L8.69531 6.92188C9.10938 6.92188 9.38281 6.71094 9.38281 6.32031C9.38281 5.92188 9.125 5.70312 8.69531 5.70312Z" />
                </g>
            </svg>
        )
    }
}

export class SortingIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 15.4834 11.9011"
                width={width}
                height={height}
                className={className}
            >
                <g>
                    <rect height="11.9011" opacity="0" width="15.4834" x="0" y="0" />
                    <path
                        className="arrow up"
                        d="M11.7615 11.6415L14.8371 8.475C14.9816 8.32516 15.0771 8.09791 15.0771 7.90475C15.0771 7.4428 14.7523 7.12324 14.2956 7.12324C14.0787 7.12324 13.8987 7.19816 13.7542 7.34765L12.5485 8.6051L11.9198 9.3617L11.9624 8.13288L11.9624 0.79319C11.9624 0.339051 11.6326 0.00919333 11.1784 0.00919333C10.7243 0.00919333 10.3891 0.339051 10.3891 0.79319L10.3891 8.13288L10.4371 9.3617L9.80302 8.6051L8.59741 7.34765C8.45823 7.19816 8.27288 7.12324 8.05593 7.12324C7.59931 7.12324 7.27975 7.4428 7.27975 7.90475C7.27975 8.09791 7.36993 8.32516 7.51978 8.475L10.5901 11.6415C10.9178 11.9849 11.4337 11.9902 11.7615 11.6415Z"
                    />
                    <path
                        className="arrow down"
                        d="M3.31567 0.262005L0.24003 3.42607C0.0955153 3.57591 0 3.79783 0 3.99631C0 4.45827 0.324889 4.77783 0.781512 4.77783C0.998465 4.77783 1.17848 4.70291 1.32299 4.55342L2.5286 3.29597L3.15733 2.53404L3.10938 3.76818L3.10938 11.1079C3.10938 11.5698 3.44456 11.8997 3.8987 11.8997C4.35284 11.8997 4.68802 11.5698 4.68802 11.1079L4.68802 3.76818L4.64007 2.53404L5.2688 3.29597L6.47441 4.55342C6.61892 4.70291 6.79893 4.77783 7.01589 4.77783C7.47251 4.77783 7.7974 4.45827 7.7974 3.99631C7.7974 3.79783 7.70188 3.57591 7.55737 3.42607L4.48706 0.262005C4.15932-0.0760251 3.6434-0.0813533 3.31567 0.262005Z"
                    />
                </g>
            </svg>
        )
    }
}

export class ExpandIcon extends Component<IconProps> {
    static defaultProps = {
        width: '100%',
        height: '100%',
    }

    render() {
        const { width, height, className } = this.props
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="87.48 32.45 93.07 93.16"
                width={width}
                height={height}
                className={className}
            >
                <path d="M91.969 71.954c2.587 0 4.443-1.953 4.443-4.54v-4.102l-.977-17.041 12.842 13.525 15.04 15.137c.83.879 1.903 1.27 3.075 1.27 2.784 0 4.834-1.807 4.834-4.542 0-1.318-.44-2.49-1.318-3.369L114.82 53.253l-13.525-12.842 17.09.977h4.052c2.588 0 4.59-1.807 4.59-4.443 0-2.637-1.953-4.492-4.59-4.492h-27.1c-4.98 0-7.86 2.88-7.86 7.86v27.1c0 2.54 1.904 4.541 4.492 4.541Zm53.564 53.663h27.1c4.98 0 7.91-2.881 7.91-7.862v-27.1c0-2.538-1.905-4.54-4.54-4.54-2.54 0-4.445 1.953-4.445 4.54v4.102l1.026 17.041-12.89-13.525-14.991-15.137c-.83-.879-1.953-1.27-3.125-1.27-2.734 0-4.834 1.807-4.834 4.542 0 1.318.488 2.49 1.367 3.369l15.04 15.039 13.573 12.842-17.09-.977h-4.101c-2.588 0-4.59 1.807-4.59 4.443 0 2.637 2.002 4.493 4.59 4.493Z" />
            </svg>
        )
    }
}
