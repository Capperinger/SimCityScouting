import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    loginUser,
    LoginConnectionError,
} from "../scripts/firebase";
import {
    continueRememberedLogin,
    getRememberedLogin,
    type RememberedLogin,
} from "../scripts/user";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [sent, setSent] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberedLogin, setRememberedLogin] =
        useState<RememberedLogin | null>(getRememberedLogin);
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [connectionUnavailable, setConnectionUnavailable] = useState(false);

    React.useEffect(() => {
        const updateConnection = () => setIsOnline(navigator.onLine);
        window.addEventListener("online", updateConnection);
        window.addEventListener("offline", updateConnection);
        return () => {
            window.removeEventListener("online", updateConnection);
            window.removeEventListener("offline", updateConnection);
        };
    }, []);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSent(false);
        setError("");
        setConnectionUnavailable(false);
        try {
            await loginUser(email, password);
        } catch (loginError) {
            if (loginError instanceof LoginConnectionError) {
                setConnectionUnavailable(true);
            }
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : "Sign-in failed. Please try again.",
            );
        } finally {
            setSent(true);
        }
    };

    const handleContinueOffline = () => {
        if (!continueRememberedLogin()) {
            setRememberedLogin(null);
            setError(
                "Your saved offline sign-in has expired. Connect to the internet to sign in again.",
            );
            return;
        }
        navigate("/");
    };

    const goToSignup = () => navigate("/signup");
    const goBack = () => {
        navigate("/");
    };

    const buttonStyle: string =
        "bg-sky-600 text-white font-semibold text-xl px-2 py-2 rounded-full hover:bg-sky-700 transition-colors h-15 w-35";

    return (
        <div className="flex flex-col items-center justify-start space-y-8 pt-20 min-h-screen">
            <button className={buttonStyle} onClick={goBack}>
                Back
            </button>
            <h1 className="font-bold text-white text-4xl">Login</h1>
            <h1 className="font-bold text-white text-xl">
                For security reasons, all users must log in
            </h1>
            <form
                className="flex flex-col space-y-6 w-80"
                onSubmit={handleLogin}
            >
                <input
                    type="email"
                    placeholder="Email"
                    required
                    autoComplete="email"
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!sent}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow"
                >
                    Log In
                </button>
            </form>
            {error && (
                <p className="text-red-400 text-center" role="alert">
                    {error}
                </p>
            )}
            {rememberedLogin && (!isOnline || connectionUnavailable) && (
                <div className="flex flex-col items-center space-y-3">
                    <p className="text-gray-200 text-center">
                        Continue with the saved session for{" "}
                        {rememberedLogin.name}. Passwords are not stored.
                    </p>
                    <button
                        type="button"
                        onClick={handleContinueOffline}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-2xl shadow"
                    >
                        Continue offline as {rememberedLogin.name}
                    </button>
                </div>
            )}
            <button
                className="text-blue-400 hover:text-blue-300 text-sm pt-2"
                onClick={goToSignup}
            >
                No account? Sign up
            </button>
            {!sent && (
                <p className="text-white text-lg font-semibold pt-4">
                    Logging you in...
                </p>
            )}
        </div>
    );
};

export default LoginPage;
