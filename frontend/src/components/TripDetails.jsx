import { useEffect, useState } from "react";

import {
    getTrip
} from "../services/api";

import Itinerary from "./Itinerary";
import ExpenseTracker from "./ExpenseTracker";
import TripMembers from "./TripMembers";

import {
    createSocket,
    joinTrip,
    leaveTrip,
    disconnectSocket
} from "../services/socket";

function TripDetails({
    token,
    tripId,
    onBack,
    currentUserId
}) {

    // ==================================================
    // TRIP STATE
    // ==================================================

    const [trip, setTrip] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // ==================================================
    // REAL-TIME REFRESH
    // ==================================================

    const [realtimeRefresh, setRealtimeRefresh] =
        useState(0);

    // ==================================================
    // LOAD TRIP
    // ==================================================

    async function loadTrip() {

        try {

            setLoading(true);

            setError("");

            const data =
                await getTrip(
                    token,
                    tripId
                );

            setTrip(data);

        } catch (error) {

            console.error(
                "Failed to load trip:",
                error.message
            );

            setError(
                error.message
            );

        } finally {

            setLoading(false);

        }

    }

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        loadTrip();

    }, [
        token,
        tripId
    ]);

    // ==================================================
    // SOCKET.IO
    // ==================================================

    useEffect(() => {

        if (
            !token ||
            !tripId
        ) {
            return;
        }

        console.log(
            "Creating TripWise socket connection..."
        );

        const socket =
            createSocket(
                token
            );

        // ==================================================
        // SOCKET CONNECTED
        // ==================================================

        socket.on(
            "connect",
            () => {

                console.log(
                    "Connected to TripWise real-time server"
                );

                console.log(
                    "Socket ID:",
                    socket.id
                );

                joinTrip(
                    socket,
                    tripId
                );

            }
        );

        // ==================================================
        // TRIP ROOM JOINED
        // ==================================================

        socket.on(
            "trip-joined",
            (data) => {

                console.log(
                    "Joined trip room:",
                    data
                );

            }
        );

        // ==================================================
        // REAL-TIME TRIP UPDATE
        // ==================================================
        //
        // These events will be emitted by the backend
        // when we update itinerary, expenses or members.
        //
        // ==================================================

        socket.on(
            "trip-updated",
            (data) => {

                console.log(
                    "Trip updated:",
                    data
                );

                setRealtimeRefresh(
                    (value) =>
                        value + 1
                );

                loadTrip();

            }
        );

        // ==================================================
        // EXPENSE UPDATED
        // ==================================================

        socket.on(
            "expense-updated",
            (data) => {

                console.log(
                    "Expense updated:",
                    data
                );

                setRealtimeRefresh(
                    (value) =>
                        value + 1
                );

                loadTrip();

            }
        );

        // ==================================================
        // ITINERARY UPDATED
        // ==================================================

        socket.on(
            "itinerary-updated",
            (data) => {

                console.log(
                    "Itinerary updated:",
                    data
                );

                setRealtimeRefresh(
                    (value) =>
                        value + 1
                );

            }
        );

        // ==================================================
        // MEMBER UPDATED
        // ==================================================

        socket.on(
            "member-updated",
            (data) => {

                console.log(
                    "Member updated:",
                    data
                );

                setRealtimeRefresh(
                    (value) =>
                        value + 1
                );

            }
        );

        // ==================================================
        // SOCKET ERROR
        // ==================================================

        socket.on(
            "connect_error",
            (error) => {

                console.error(
                    "Socket connection error:",
                    error.message
                );

            }
        );

        // ==================================================
        // SOCKET DISCONNECTED
        // ==================================================

        socket.on(
            "disconnect",
            (reason) => {

                console.log(
                    "Socket disconnected:",
                    reason
                );

            }
        );

        // ==================================================
        // CLEANUP
        // ==================================================

        return () => {

            console.log(
                "Leaving trip room:",
                tripId
            );

            leaveTrip(
                socket,
                tripId
            );

            disconnectSocket(
                socket
            );

        };

    }, [
        token,
        tripId
    ]);

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (

            <div className="text-center py-5">

                <div
                    className="spinner-border text-primary"
                    role="status"
                />

                <p className="text-muted mt-3">
                    Loading trip...
                </p>

            </div>

        );

    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error) {

        return (

            <div>

                <button
                    className="btn btn-outline-secondary mb-4"
                    onClick={onBack}
                >
                    ← Back to Trips
                </button>

                <div className="alert alert-danger">

                    {error}

                </div>

            </div>

        );

    }

    // ==================================================
    // TRIP NOT FOUND
    // ==================================================

    if (!trip) {

        return (

            <div>

                <button
                    className="btn btn-outline-secondary mb-4"
                    onClick={onBack}
                >
                    ← Back to Trips
                </button>

                <div className="alert alert-warning">

                    Trip not found.

                </div>

            </div>

        );

    }

    // ==================================================
    // TRIP VALUES
    // ==================================================

    const budget =
        Number(
            trip.budget || 0
        );

    const totalExpenses =
        Number(
            trip.totalExpenses || 0
        );

    const remainingBudget =
        budget -
        totalExpenses;

    const expensePercentage =
        budget > 0
            ? Math.min(
                  (
                      totalExpenses /
                      budget
                  ) *
                      100,
                  100
              )
            : 0;

    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    function formatCurrency(
        value
    ) {

        return `₹${Number(
            value || 0
        ).toLocaleString(
            "en-IN"
        )}`;

    }

    // ==================================================
    // UI
    // ==================================================

    return (

        <div>

            {/* ==================================================
                BACK BUTTON
            ================================================== */}

            <button
                className="btn btn-outline-secondary mb-4"
                onClick={onBack}
            >
                ← Back to Trips
            </button>

            {/* ==================================================
                TRIP HEADER
            ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                    <div className="d-flex justify-content-between align-items-start">

                        <div>

                            <div className="badge bg-primary-subtle text-primary mb-2">

                                ✈️ Trip

                            </div>

                            <h1 className="fw-bold mb-2">

                                {trip.title}

                            </h1>

                            <p className="text-muted fs-5 mb-3">

                                📍{" "}
                                {trip.destination}

                            </p>

                        </div>

                        <div
                            className="display-5"
                        >
                            ✈️
                        </div>

                    </div>

                    {/* ==================================================
                        TRIP INFORMATION
                    ================================================== */}

                    <div className="row g-3 mt-2">

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3 h-100">

                                <div className="small text-muted">
                                    Start Date
                                </div>

                                <div className="fw-bold mt-1">
                                    📅{" "}
                                    {
                                        trip.start_date
                                    }
                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3 h-100">

                                <div className="small text-muted">
                                    End Date
                                </div>

                                <div className="fw-bold mt-1">
                                    📅{" "}
                                    {
                                        trip.end_date
                                    }
                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3 h-100">

                                <div className="small text-muted">
                                    Budget
                                </div>

                                <div className="fw-bold mt-1">
                                    💰{" "}
                                    {formatCurrency(
                                        budget
                                    )}
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                REAL-TIME STATUS
            ================================================== */}

            <div className="alert alert-success d-flex align-items-center gap-2 mb-4">

                <span>
                    🟢
                </span>

                <div>

                    <strong>
                        Real-time collaboration enabled
                    </strong>

                    <div className="small">
                        Changes from other trip members
                        will appear automatically.

                    </div>

                </div>

            </div>

            {/* ==================================================
                ITINERARY
            ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                    <Itinerary
                        key={
                            `itinerary-${realtimeRefresh}`
                        }
                        token={token}
                        tripId={tripId}
                    />

                </div>

            </div>

            {/* ==================================================
                EXPENSE TRACKER
            ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                    <ExpenseTracker
                        key={
                            `expenses-${realtimeRefresh}`
                        }
                        token={token}
                        tripId={tripId}
                        budget={budget}
                    />

                </div>

            </div>

            {/* ==================================================
                TRIP MEMBERS
            ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                    <TripMembers
                        key={
                            `members-${realtimeRefresh}`
                        }
                        token={token}
                        tripId={tripId}
                        currentUserId={
                            currentUserId
                        }
                    />

                </div>

            </div>

            {/* ==================================================
                BUDGET SUMMARY
            ================================================== */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                            <h4 className="fw-bold mb-1">
                                💰 Budget Summary
                            </h4>

                            <p className="text-muted mb-0">
                                Track your spending for this trip.
                            </p>

                        </div>

                    </div>

                    <div className="row g-3">

                        {/* BUDGET */}

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3">

                                <div className="small text-muted">
                                    Total Budget
                                </div>

                                <h4 className="fw-bold mt-2 mb-0">

                                    {formatCurrency(
                                        budget
                                    )}

                                </h4>

                            </div>

                        </div>

                        {/* SPENT */}

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3">

                                <div className="small text-muted">
                                    Total Spent
                                </div>

                                <h4 className="fw-bold mt-2 mb-0 text-danger">

                                    {formatCurrency(
                                        totalExpenses
                                    )}

                                </h4>

                            </div>

                        </div>

                        {/* REMAINING */}

                        <div className="col-md-4">

                            <div className="border rounded-3 p-3">

                                <div className="small text-muted">
                                    Remaining
                                </div>

                                <h4
                                    className={
                                        `fw-bold mt-2 mb-0 ${
                                            remainingBudget <
                                            0
                                                ? "text-danger"
                                                : "text-success"
                                        }`
                                    }
                                >

                                    {formatCurrency(
                                        remainingBudget
                                    )}

                                </h4>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        PROGRESS
                    ================================================== */}

                    <div className="mt-4">

                        <div className="d-flex justify-content-between mb-2">

                            <span className="small text-muted">
                                Budget Used
                            </span>

                            <span className="small fw-bold">

                                {Math.round(
                                    expensePercentage
                                )}
                                %

                            </span>

                        </div>

                        <div
                            className="progress"
                            style={{
                                height:
                                    "10px"
                            }}
                        >

                            <div
                                className={
                                    `progress-bar ${
                                        expensePercentage >=
                                        100
                                            ? "bg-danger"
                                            : expensePercentage >=
                                              80
                                            ? "bg-warning"
                                            : "bg-success"
                                    }`
                                }
                                role="progressbar"
                                style={{
                                    width:
                                        `${expensePercentage}%`
                                }}
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default TripDetails;