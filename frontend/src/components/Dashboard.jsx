import { useEffect, useState } from "react";

import CreateTrip from "./CreateTrip";
import TripList from "./TripList";
import TripDetails from "./TripDetails";
import InvitationList from "./InvitationList";

import {
    getDashboardSummary,
    getMyInvitations
} from "../services/api";

function Dashboard({
    user,
    onLogout
}) {
    const token =
        localStorage.getItem(
            "token"
        );

    const [showCreateTrip, setShowCreateTrip] =
        useState(false);

    const [selectedTripId, setSelectedTripId] =
        useState(null);

    const [refreshTrips, setRefreshTrips] =
        useState(0);

    // ==================================================
    // DASHBOARD STATE
    // ==================================================

    const [summary, setSummary] =
        useState(null);

    const [loadingSummary, setLoadingSummary] =
        useState(true);

    const [summaryError, setSummaryError] =
        useState("");

    // ==================================================
    // INVITATION STATE
    // ==================================================

    const [invitationCount, setInvitationCount] =
        useState(0);

    // ==================================================
    // LOAD DASHBOARD SUMMARY
    // ==================================================

    useEffect(() => {

        async function loadDashboard() {

            try {

                setLoadingSummary(true);

                setSummaryError("");

                const data =
                    await getDashboardSummary(
                        token
                    );

                setSummary(data);

            } catch (error) {

                setSummaryError(
                    error.message
                );

            } finally {

                setLoadingSummary(false);

            }
        }

        loadDashboard();

    }, [
        token,
        refreshTrips
    ]);

    // ==================================================
    // LOAD INVITATIONS
    // ==================================================

    async function loadInvitations() {

        try {

            const data =
                await getMyInvitations(
                    token
                );

            setInvitationCount(
                data.length
            );

        } catch (error) {

            console.error(
                "Failed to load invitations:",
                error.message
            );

        }
    }

    useEffect(() => {

        loadInvitations();

    }, [token]);

    // ==================================================
    // TRIP CREATED
    // ==================================================

    function handleTripCreated() {

        setShowCreateTrip(
            false
        );

        setRefreshTrips(
            (value) =>
                value + 1
        );
    }

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
    // SCROLL TO INVITATIONS
    // ==================================================

    function scrollToInvitations() {

        const invitationSection =
            document.getElementById(
                "trip-invitations"
            );

        if (invitationSection) {

            invitationSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }

    // ==================================================
    // INVITATION ACCEPTED
    // ==================================================

    async function handleInvitationAccepted() {

        await loadInvitations();

        setRefreshTrips(
            (value) =>
                value + 1
        );

    }

    // ==================================================
    // TRIP DETAILS PAGE
    // ==================================================

    if (selectedTripId) {

        return (

            <div className="dashboard-page">

                {/* ==================================================
                    NAVBAR
                ================================================== */}

                <nav className="navbar bg-white shadow-sm">

                    <div className="container">

                        <span className="navbar-brand fw-bold text-primary">
                            ✈️ TripWise
                        </span>

                        <div className="d-flex align-items-center gap-3">

                            {/* INVITATION BUTTON */}

                            <button
                                type="button"
                                className="btn btn-light position-relative"
                                onClick={
                                    scrollToInvitations
                                }
                                title="Trip invitations"
                            >
                                🔔

                                {invitationCount >
                                    0 && (

                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    >
                                        {
                                            invitationCount
                                        }
                                    </span>

                                )}

                            </button>

                            <span className="text-muted">

                                👋{" "}
                                {
                                    user.username
                                }

                            </span>

                            <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={
                                    onLogout
                                }
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </nav>

                {/* ==================================================
                    TRIP DETAILS
                ================================================== */}

                <main className="container py-5">

                    <TripDetails
                        token={token}
                        tripId={
                            selectedTripId
                        }
                        onBack={() =>
                            setSelectedTripId(
                                null
                            )
                        }
                        currentUserId={
                            user.id
                        }
                    />

                </main>

            </div>

        );
    }

    // ==================================================
    // MAIN DASHBOARD
    // ==================================================

    return (

        <div className="dashboard-page">

            {/* ==================================================
                NAVBAR
            ================================================== */}

            <nav className="navbar bg-white shadow-sm">

                <div className="container">

                    <span className="navbar-brand fw-bold text-primary">
                        ✈️ TripWise
                    </span>

                    <div className="d-flex align-items-center gap-3">

                        {/* ==================================================
                            INVITATION NOTIFICATION
                        ================================================== */}

                        <button
                            type="button"
                            className="btn btn-light position-relative"
                            onClick={
                                scrollToInvitations
                            }
                            title="Trip invitations"
                        >

                            🔔

                            {invitationCount >
                                0 && (

                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                >
                                    {
                                        invitationCount
                                    }
                                </span>

                            )}

                        </button>

                        {/* ==================================================
                            USER
                        ================================================== */}

                        <span className="text-muted">

                            👋{" "}
                            {
                                user.username
                            }

                        </span>

                        {/* ==================================================
                            LOGOUT
                        ================================================== */}

                        <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={
                                onLogout
                            }
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </nav>

            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="container py-5">

                {/* ==================================================
                    CREATE TRIP
                ================================================== */}

                {showCreateTrip ? (

                    <CreateTrip
                        token={token}
                        onTripCreated={
                            handleTripCreated
                        }
                        onCancel={() =>
                            setShowCreateTrip(
                                false
                            )
                        }
                    />

                ) : (

                    <>

                        {/* ==================================================
                            HEADER
                        ================================================== */}

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>

                                <h1 className="fw-bold mb-1">
                                    My Trips
                                </h1>

                                <p className="text-muted mb-0">
                                    Plan, organize and track
                                    your adventures.
                                </p>

                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() =>
                                    setShowCreateTrip(
                                        true
                                    )
                                }
                            >
                                + Create Trip
                            </button>

                        </div>

                        {/* ==================================================
                            TRIP INVITATIONS
                        ================================================== */}

                        <div
                            id="trip-invitations"
                            className="mb-4"
                        >

                            <InvitationList
                                token={token}
                                onInvitationAccepted={
                                    handleInvitationAccepted
                                }
                            />

                        </div>

                        {/* ==================================================
                            DASHBOARD STATISTICS
                        ================================================== */}

                        {loadingSummary ? (

                            <div className="text-center py-4">

                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                />

                                <p className="text-muted mt-2">
                                    Loading dashboard...
                                </p>

                            </div>

                        ) : summaryError ? (

                            <div className="alert alert-danger">

                                {summaryError}

                            </div>

                        ) : summary ? (

                            <div className="row g-4 mb-5">

                                {/* TOTAL TRIPS */}

                                <div className="col-md-6 col-lg-3">

                                    <div className="card border-0 shadow-sm h-100">

                                        <div className="card-body">

                                            <div className="d-flex justify-content-between align-items-start">

                                                <div>

                                                    <div className="text-muted small">
                                                        Total Trips
                                                    </div>

                                                    <h3 className="fw-bold mt-2 mb-0">

                                                        {
                                                            summary.totalTrips
                                                        }

                                                    </h3>

                                                </div>

                                                <div className="dashboard-stat-icon">
                                                    ✈️
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* TOTAL BUDGET */}

                                <div className="col-md-6 col-lg-3">

                                    <div className="card border-0 shadow-sm h-100">

                                        <div className="card-body">

                                            <div className="d-flex justify-content-between align-items-start">

                                                <div>

                                                    <div className="text-muted small">
                                                        Total Budget
                                                    </div>

                                                    <h3 className="fw-bold mt-2 mb-0">

                                                        {formatCurrency(
                                                            summary.totalBudget
                                                        )}

                                                    </h3>

                                                </div>

                                                <div className="dashboard-stat-icon">
                                                    💰
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* TOTAL EXPENSES */}

                                <div className="col-md-6 col-lg-3">

                                    <div className="card border-0 shadow-sm h-100">

                                        <div className="card-body">

                                            <div className="d-flex justify-content-between align-items-start">

                                                <div>

                                                    <div className="text-muted small">
                                                        Total Spent
                                                    </div>

                                                    <h3 className="fw-bold mt-2 mb-0">

                                                        {formatCurrency(
                                                            summary.totalExpenses
                                                        )}

                                                    </h3>

                                                </div>

                                                <div className="dashboard-stat-icon">
                                                    💸
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* REMAINING */}

                                <div className="col-md-6 col-lg-3">

                                    <div className="card border-0 shadow-sm h-100">

                                        <div className="card-body">

                                            <div className="d-flex justify-content-between align-items-start">

                                                <div>

                                                    <div className="text-muted small">
                                                        Remaining
                                                    </div>

                                                    <h3
                                                        className={
                                                            `fw-bold mt-2 mb-0 ${
                                                                summary.remainingBudget <
                                                                0
                                                                    ? "text-danger"
                                                                    : "text-success"
                                                            }`
                                                        }
                                                    >

                                                        {formatCurrency(
                                                            summary.remainingBudget
                                                        )}

                                                    </h3>

                                                </div>

                                                <div className="dashboard-stat-icon">
                                                    📊
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ) : null}

                        {/* ==================================================
                            UPCOMING TRIPS
                        ================================================== */}

                        {summary &&
                            summary.upcomingTrips &&
                            summary.upcomingTrips.length >
                                0 && (

                                <div className="card border-0 shadow-sm mb-5">

                                    <div className="card-body p-4">

                                        <div className="d-flex justify-content-between align-items-center mb-4">

                                            <div>

                                                <h4 className="fw-bold mb-1">
                                                    🗓️ Upcoming Trips
                                                </h4>

                                                <p className="text-muted mb-0">
                                                    Your next adventures.
                                                </p>

                                            </div>

                                        </div>

                                        <div className="row g-3">

                                            {summary.upcomingTrips.map(
                                                (trip) => (

                                                    <div
                                                        className="col-md-6 col-lg-4"
                                                        key={
                                                            trip.id
                                                        }
                                                    >

                                                        <div
                                                            className="border rounded p-3 h-100"
                                                            style={{
                                                                cursor:
                                                                    "pointer"
                                                            }}
                                                            onClick={() =>
                                                                setSelectedTripId(
                                                                    trip.id
                                                                )
                                                            }
                                                        >

                                                            <div className="d-flex justify-content-between">

                                                                <div>

                                                                    <h5 className="fw-bold mb-1">

                                                                        {
                                                                            trip.title
                                                                        }

                                                                    </h5>

                                                                    <div className="text-muted small">

                                                                        📍{" "}
                                                                        {
                                                                            trip.destination
                                                                        }

                                                                    </div>

                                                                </div>

                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "28px"
                                                                    }}
                                                                >
                                                                    ✈️
                                                                </span>

                                                            </div>

                                                            <div className="small text-muted mt-3">

                                                                {
                                                                    trip.startDate
                                                                }

                                                                {" → "}

                                                                {
                                                                    trip.endDate
                                                                }

                                                            </div>

                                                            <div className="d-flex justify-content-between mt-3">

                                                                <span className="small text-muted">
                                                                    Budget
                                                                </span>

                                                                <strong>

                                                                    {formatCurrency(
                                                                        trip.budget
                                                                    )}

                                                                </strong>

                                                            </div>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                </div>

                            )}

                        {/* ==================================================
                            ALL TRIPS
                        ================================================== */}

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>

                                <h3 className="fw-bold mb-1">
                                    All Trips
                                </h3>

                                <p className="text-muted mb-0">
                                    Manage your travel plans.
                                </p>

                            </div>

                        </div>

                        <TripList
                            token={token}
                            refresh={
                                refreshTrips
                            }
                            onSelectTrip={
                                setSelectedTripId
                            }
                        />

                    </>

                )}

            </main>

        </div>

    );
}

export default Dashboard;