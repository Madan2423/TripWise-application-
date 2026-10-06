import { io } from "socket.io-client";

// ==================================================
// SOCKET SERVER URL
// ==================================================

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:5000";

// ==================================================
// CREATE SOCKET CONNECTION
// ==================================================

export function createSocket(
    token
) {

    const socket =
        io(
            SOCKET_URL,
            {
                auth: {
                    token
                },

                autoConnect:
                    true,

                transports: [
                    "websocket",
                    "polling"
                ]
            }
        );

    return socket;
}

// ==================================================
// JOIN TRIP
// ==================================================

export function joinTrip(
    socket,
    tripId
) {

    if (
        !socket ||
        !tripId
    ) {
        return;
    }

    socket.emit(
        "join-trip",
        tripId
    );
}

// ==================================================
// LEAVE TRIP
// ==================================================

export function leaveTrip(
    socket,
    tripId
) {

    if (
        !socket ||
        !tripId
    ) {
        return;
    }

    socket.emit(
        "leave-trip",
        tripId
    );
}

// ==================================================
// DISCONNECT SOCKET
// ==================================================

export function disconnectSocket(
    socket
) {

    if (!socket) {
        return;
    }

    socket.disconnect();
}