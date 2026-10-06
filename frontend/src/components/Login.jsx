import { useState } from "react";

import { loginUser } from "../services/api";

function Login({
    onLogin,
    onSwitchToRegister
}) {
    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        try {
            setLoading(true);

            const data =
                await loginUser({
                    email,
                    password
                });

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );

            onLogin(data.user);

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
                        Plan your next adventure
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

                    <div className="mb-4">
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

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                <div className="text-center mt-4">
                    <span className="text-muted">
                        Don't have an account?
                    </span>

                    <button
                        className="btn btn-link"
                        onClick={
                            onSwitchToRegister
                        }
                    >
                        Register
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Login;