import { useEffect, useState } from "react";

import { getTrips } from "../services/api";

function TripList({
    token,
    onSelectTrip,
    refresh
}) {
    const [trips, setTrips] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadTrips() {
            try {
                setLoading(true);

                const data =
                    await getTrips(
                        token
                    );

                setTrips(data);
            } catch (error) {
                setError(
                    error.message
                );
            } finally {
                setLoading(false);
            }
        }

        loadTrips();
    }, [token, refresh]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div
                    className="spinner-border text-primary"
                    role="status"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                {error}
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="text-center py-5">

                <div
                    style={{
                        fontSize: "60px"
                    }}
                >
                    ✈️
                </div>

                <h4 className="fw-bold mt-3">
                    No trips yet
                </h4>

                <p className="text-muted">
                    Create your first trip
                    and start planning.
                </p>

            </div>
        );
    }

    return (
        <div className="row g-4">

            {trips.map((trip) => (
                <div
                    className="col-md-6 col-lg-4"
                    key={trip.id}
                >

                    <div
                        className="card border-0 shadow-sm h-100 trip-card"
                        onClick={() =>
                            onSelectTrip(
                                trip.id
                            )
                        }
                    >

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>
                                    <span className="badge bg-primary-subtle text-primary">
                                        Trip
                                    </span>

                                    <h4 className="fw-bold mt-3 mb-1">
                                        {trip.title}
                                    </h4>

                                    <p className="text-muted">
                                        📍 {trip.destination}
                                    </p>
                                </div>

                                <span
                                    style={{
                                        fontSize:
                                            "32px"
                                    }}
                                >
                                    ✈️
                                </span>

                            </div>

                            <div className="mt-3">

                                <div className="small text-muted">
                                    Travel Dates
                                </div>

                                <div className="fw-semibold">
                                    {trip.startDate}
                                    {" → "}
                                    {trip.endDate}
                                </div>

                            </div>

                            <div className="mt-3">

                                <div className="d-flex justify-content-between">

                                    <span>
                                        Budget
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            trip.budget
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </strong>

                                </div>

                                <div className="d-flex justify-content-between mt-1">

                                    <span className="text-muted">
                                        Spent
                                    </span>

                                    <span>
                                        ₹
                                        {Number(
                                            trip.totalExpenses
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div className="progress mt-3">

                                <div
                                    className="progress-bar"
                                    style={{
                                        width:
                                            `${
                                                trip.budget > 0
                                                    ? Math.min(
                                                        (
                                                            trip.totalExpenses /
                                                            trip.budget
                                                        ) *
                                                        100,
                                                        100
                                                    )
                                                    : 0
                                            }%`
                                    }}
                                />

                            </div>

                            <div className="d-flex justify-content-between mt-2">

                                <small className="text-muted">
                                    Remaining
                                </small>

                                <small className="fw-semibold">
                                    ₹
                                    {Number(
                                        trip.remainingBudget
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </small>

                            </div>

                        </div>

                    </div>

                </div>
            ))}

        </div>
    );
}

export default TripList;