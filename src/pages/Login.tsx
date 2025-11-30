import { AuthForm } from '../components/AuthForm'

export const Login = ({
    onLogin,
}: {
    onLogin: (authData: { serverUrl: string; token: string; userId: string; username: string }) => void
}) => {
    return (
        <div className="login">
            <div className="login_header">
                <div className="logo"></div>
            </div>
            <AuthForm onLogin={onLogin} />
            <div className="disclaimer">Jelly Video App - Version {__VERSION__}</div>
        </div>
    )
}
