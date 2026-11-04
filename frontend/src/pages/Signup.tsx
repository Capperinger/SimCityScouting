import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    registerUser,
    LoginConnectionError,
} from "../scripts/firebase";

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [sent, setSent] = useState(true);
    const [error, setError] = useState("");

    const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (password.length <= 6) {
            setError("Password must be longer than 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSent(false);
        setError("");
        try {
            await registerUser(email, password, name);
        } catch (signupError) {
            setError(
                signupError instanceof LoginConnectionError
                    ? signupError.message
                    : signupError instanceof Error
                      ? signupError.message
                      : "Account creation failed. Please try again.",
            );
        } finally {
            setSent(true);
        }
    };

    const buttonStyle =
        "bg-sky-600 text-white font-semibold text-xl px-2 py-2 rounded-full hover:bg-sky-700 transition-colors h-15 w-35";

    return (
        <div className="flex flex-col items-center justify-start space-y-8 pt-20 min-h-screen">
            <button className={buttonStyle} onClick={() => navigate("/")}>
                Back
            </button>
            <h1 className="font-bold text-white text-4xl">Sign Up</h1>
            <p className="font-bold text-white text-xl pl-4 pr-4 text-center">
                Use your real, full name. You cannot change it after creating
                your account.
            </p>
            <p className="font-bold text-white text-xl pl-4 pr-4 text-center">
                Submissions under a false name will not be counted.
            </p>
            <form
                className="flex flex-col space-y-6 w-80"
                onSubmit={handleSignup}
            >
                <input
                    type="text"
                    placeholder="Name"
                    autoComplete="name"
                    required
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    required
                    className="bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                    type="submit"
                    disabled={!sent}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow"
                >
                    Create Account
                </button>
            </form>
            {error && (
                <p className="text-red-400 text-center" role="alert">
                    {error}
                </p>
            )}
            <button
                className="text-blue-400 hover:text-blue-300 text-sm pt-2"
                onClick={() => navigate("/login")}
            >
                Already have an account? Log in
            </button>
            {!sent && (
                <p className="text-white text-lg font-semibold pt-4">
                    Creating your account...
                </p>
            )}
        </div>
    );
};

export default SignupPage;
