import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

function App() {
    const [user, setUser] =
        useState(() => {
            const savedUser =
                localStorage.getItem(
                    "user"
                );

            return savedUser
                ? JSON.parse(savedUser)
                : null;
        });

    const [showRegister, setShowRegister] =
        useState(false);

    function handleLogin(loggedInUser) {
        setUser(loggedInUser);
    }

    function handleLogout() {
        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        setUser(null);
    }

    if (user) {
        return (
            <Dashboard
                user={user}
                onLogout={handleLogout}
            />
        );
    }

    if (showRegister) {
        return (
            <Register
                onSwitchToLogin={() =>
                    setShowRegister(false)
                }
            />
        );
    }

    return (
        <Login
            onLogin={handleLogin}
            onSwitchToRegister={() =>
                setShowRegister(true)
            }
        />
    );
}

export default App;