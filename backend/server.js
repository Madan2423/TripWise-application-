const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();

require("./database/database");

const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const itineraryRoutes = require("./routes/itineraryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const memberRoutes = require("./routes/memberRoutes");
const invitationRoutes = require("./routes/invitationRoutes");

const app = express();

// ==================================================
// PORT
// ==================================================

const PORT =
    process.env.PORT || 5000;

// ==================================================
// HTTP SERVER
// ==================================================

const server =
    http.createServer(app);

// ==================================================
// SOCKET.IO
// ==================================================

const io =
    new Server(
        server,
        {
            cors: {
                origin: "*",

                methods: [
                    "GET",
                    "POST",
                    "PATCH",
                    "DELETE"
                ]
            }
        }
    );

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
    cors()
);

app.use(
    express.json()
);

// ==================================================
// HOME
// ==================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "TripWise API is running"
        });

    }
);

// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            status: "OK",

            message:
                "TripWise backend is healthy"
        });

    }
);

// ==================================================
// AUTH ROUTES
// ==================================================

app.use(
    "/api/auth",
    authRoutes
);

// ==================================================
// TRIP ROUTES
// ==================================================

app.use(
    "/api/trips",
    tripRoutes
);

// ==================================================
// ITINERARY ROUTES
// ==================================================

app.use(
    "/api/itinerary",
    itineraryRoutes
);

// ==================================================
// EXPENSE ROUTES
// ==================================================

app.use(
    "/api/expenses",
    expenseRoutes
);

// ==================================================
// DASHBOARD ROUTES
// ==================================================

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// ==================================================
// MEMBER ROUTES
// ==================================================

app.use(
    "/api/members",
    memberRoutes
);

// ==================================================
// INVITATION ROUTES
// ==================================================

app.use(
    "/api/invitations",
    invitationRoutes
);

// ==================================================
// SOCKET AUTHENTICATION
// ==================================================

io.use(
    (socket, next) => {

        try {

            const token =
                socket.handshake.auth.token;

            if (!token) {

                return next(
                    new Error(
                        "Authentication required"
                    )
                );

            }

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            socket.user =
                decoded;

            next();

        } catch (error) {

            console.error(
                "Socket authentication error:",
                error.message
            );

            next(
                new Error(
                    "Invalid or expired token"
                )
            );

        }

    }
);

// ==================================================
// SOCKET CONNECTION
// ==================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            `Socket connected: user ${socket.user.id}`
        );

        // ==================================================
        // JOIN TRIP ROOM
        // ==================================================

        socket.on(
            "join-trip",
            (tripId) => {

                if (!tripId) {
                    return;
                }

                const room =
                    `trip:${tripId}`;

                socket.join(
                    room
                );

                console.log(
                    `User ${socket.user.id} joined ${room}`
                );

                socket.emit(
                    "trip-joined",
                    {
                        tripId:
                            Number(tripId),

                        message:
                            "Connected to trip updates"
                    }
                );

            }
        );

        // ==================================================
        // LEAVE TRIP ROOM
        // ==================================================

        socket.on(
            "leave-trip",
            (tripId) => {

                if (!tripId) {
                    return;
                }

                const room =
                    `trip:${tripId}`;

                socket.leave(
                    room
                );

                console.log(
                    `User ${socket.user.id} left ${room}`
                );

            }
        );

        // ==================================================
        // DISCONNECT
        // ==================================================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `Socket disconnected: user ${socket.user.id}`
                );

            }
        );

    }
);

// ==================================================
// START SERVER
// ==================================================

server.listen(
    PORT,
    () => {

        console.log(
            `TripWise server running on http://localhost:${PORT}`
        );

        console.log(
            "Socket.IO server is ready"
        );

    }
);