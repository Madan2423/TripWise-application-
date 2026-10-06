import { useState } from "react";

import { registerUser } from "../services/api";

function Register({ onSwitchToLogin }) {
    const [username, setUsername] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match"
            );

            return;
        }

        try {
            setLoading(true);

            await registerUser({
                username,
                email,
                password
            });

            alert(
                "Registration successful. Please login."
            );

            onSwitchToLogin();
        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="text-center mb-4">
                    <h1 className="fw-bold">
                        TripWise
                    </h1>

                    <p className="text-muted">
                        Create your account
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                >

                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Email
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"}
                    </button>

                </form>

                <div className="text-center mt-4">
                    <span className="text-muted">
                        Already have an account?
                    </span>

                    <button
                        className="btn btn-link"
                        onClick={
                            onSwitchToLogin
                        }
                    >
                        Login
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Register;