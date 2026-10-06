import { useEffect, useState } from "react";

import {
    getItinerary,
    addItineraryItem,
    toggleItineraryItem,
    deleteItineraryItem
} from "../services/api";

function Itinerary({
    token,
    tripId,
    startDate,
    endDate
}) {
    const [activities, setActivities] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    // ==================================================
    // FORM STATE
    // ==================================================

    const [dayNumber, setDayNumber] =
        useState(1);

    const [title, setTitle] =
        useState("");

    const [location, setLocation] =
        useState("");

    const [startTime, setStartTime] =
        useState("");

    const [endTime, setEndTime] =
        useState("");

    const [description, setDescription] =
        useState("");

    // ==================================================
    // CALCULATE TRIP DAYS
    // ==================================================

    function calculateTripDays() {
        if (!startDate || !endDate) {
            return 1;
        }

        const start =
            new Date(startDate);

        const end =
            new Date(endDate);

        const difference =
            end.getTime() -
            start.getTime();

        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1;

        return Math.max(
            days,
            1
        );
    }

    const tripDays =
        calculateTripDays();

    // ==================================================
    // LOAD ITINERARY
    // ==================================================

    async function loadItinerary() {
        try {
            setLoading(true);
            setError("");

            const data =
                await getItinerary(
                    token,
                    tripId
                );

            setActivities(data);
        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadItinerary();
    }, [token, tripId]);

    // ==================================================
    // RESET FORM
    // ==================================================

    function resetForm() {
        setDayNumber(1);
        setTitle("");
        setLocation("");
        setStartTime("");
        setEndTime("");
        setDescription("");
    }

    // ==================================================
    // ADD ACTIVITY
    // ==================================================

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (!title.trim()) {
            setError(
                "Activity title is required"
            );

            return;
        }

        try {
            setSaving(true);

            await addItineraryItem(
                token,
                tripId,
                {
                    dayNumber:
                        Number(dayNumber),

                    title:
                        title.trim(),

                    location:
                        location.trim(),

                    startTime,

                    endTime,

                    description:
                        description.trim()
                }
            );

            resetForm();

            setShowForm(false);

            await loadItinerary();

        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setSaving(false);
        }
    }

    // ==================================================
    // TOGGLE ACTIVITY
    // ==================================================

    async function handleToggle(
        itemId
    ) {
        try {
            await toggleItineraryItem(
                token,
                itemId
            );

            await loadItinerary();

        } catch (error) {
            setError(
                error.message
            );
        }
    }

    // ==================================================
    // DELETE ACTIVITY
    // ==================================================

    async function handleDelete(
        itemId
    ) {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this activity?"
            );

        if (!confirmed) {
            return;
        }

        try {
            await deleteItineraryItem(
                token,
                itemId
            );

            await loadItinerary();

        } catch (error) {
            setError(
                error.message
            );
        }
    }

    // ==================================================
    // GROUP ACTIVITIES BY DAY
    // ==================================================

    function getActivitiesForDay(
        day
    ) {
        return activities.filter(
            (activity) =>
                activity.dayNumber ===
                day
        );
    }

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="text-center py-4">

                <div
                    className="spinner-border text-primary"
                    role="status"
                />

                <p className="text-muted mt-2 mb-0">
                    Loading itinerary...
                </p>

            </div>
        );
    }

    // ==================================================
    // UI
    // ==================================================

    return (
        <div>

            {/* HEADER */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h4 className="fw-bold mb-1">
                        🗺️ Itinerary
                    </h4>

                    <p className="text-muted mb-0">
                        Plan your activities day by day.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setError("");
                        setShowForm(
                            !showForm
                        );
                    }}
                >
                    {showForm
                        ? "Cancel"
                        : "+ Add Activity"}
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* ADD ACTIVITY FORM */}

            {showForm && (
                <div className="card border-0 bg-light mb-4">

                    <div className="card-body p-4">

                        <h5 className="fw-bold mb-4">
                            Add Activity
                        </h5>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="row g-3">

                                {/* DAY */}

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Day
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            dayNumber
                                        }
                                        onChange={(event) =>
                                            setDayNumber(
                                                event.target.value
                                            )
                                        }
                                    >
                                        {Array.from(
                                            {
                                                length:
                                                    tripDays
                                            },
                                            (
                                                _,
                                                index
                                            ) => (
                                                <option
                                                    key={
                                                        index +
                                                        1
                                                    }
                                                    value={
                                                        index +
                                                        1
                                                    }
                                                >
                                                    Day{" "}
                                                    {index +
                                                        1}
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* TITLE */}

                                <div className="col-md-8">

                                    <label className="form-label">
                                        Activity
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Visit Baga Beach"
                                        value={
                                            title
                                        }
                                        onChange={(event) =>
                                            setTitle(
                                                event.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                {/* LOCATION */}

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Baga Beach"
                                        value={
                                            location
                                        }
                                        onChange={(event) =>
                                            setLocation(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                                {/* START TIME */}

                                <div className="col-md-3">

                                    <label className="form-label">
                                        Start Time
                                    </label>

                                    <input
                                        type="time"
                                        className="form-control"
                                        value={
                                            startTime
                                        }
                                        onChange={(event) =>
                                            setStartTime(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                                {/* END TIME */}

                                <div className="col-md-3">

                                    <label className="form-label">
                                        End Time
                                    </label>

                                    <input
                                        type="time"
                                        className="form-control"
                                        value={
                                            endTime
                                        }
                                        onChange={(event) =>
                                            setEndTime(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                                {/* DESCRIPTION */}

                                <div className="col-12">

                                    <label className="form-label">
                                        Description
                                    </label>

                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="What do you want to do?"
                                        value={
                                            description
                                        }
                                        onChange={(event) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary mt-4"
                                disabled={
                                    saving
                                }
                            >
                                {saving
                                    ? "Adding..."
                                    : "Add Activity"}
                            </button>

                        </form>

                    </div>

                </div>
            )}

            {/* DAYS */}

            {Array.from(
                {
                    length: tripDays
                },
                (_, index) => {

                    const day =
                        index + 1;

                    const dayActivities =
                        getActivitiesForDay(
                            day
                        );

                    return (
                        <div
                            className="mb-4"
                            key={day}
                        >

                            <div className="d-flex align-items-center gap-2 mb-3">

                                <span className="badge bg-primary rounded-pill">
                                    Day {day}
                                </span>

                                <div
                                    className="flex-grow-1"
                                    style={{
                                        height:
                                            "1px",
                                        background:
                                            "#dee2e6"
                                    }}
                                />

                            </div>

                            {dayActivities.length ===
                            0 ? (
                                <div className="text-center py-4 bg-light rounded">

                                    <div
                                        style={{
                                            fontSize:
                                                "30px"
                                        }}
                                    >
                                        📅
                                    </div>

                                    <p className="text-muted mb-0 mt-2">
                                        No activities planned
                                        for Day {day}
                                    </p>

                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">

                                    {dayActivities.map(
                                        (
                                            activity
                                        ) => (
                                            <div
                                                className={`card border-0 shadow-sm ${
                                                    activity.completed
                                                        ? "activity-completed"
                                                        : ""
                                                }`}
                                                key={
                                                    activity.id
                                                }
                                            >

                                                <div className="card-body p-3">

                                                    <div className="d-flex gap-3">

                                                        {/* CHECKBOX */}

                                                        <div>

                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input mt-1"
                                                                checked={
                                                                    activity.completed
                                                                }
                                                                onChange={() =>
                                                                    handleToggle(
                                                                        activity.id
                                                                    )
                                                                }
                                                                style={{
                                                                    width:
                                                                        "20px",
                                                                    height:
                                                                        "20px"
                                                                }}
                                                            />

                                                        </div>

                                                        {/* ACTIVITY INFO */}

                                                        <div className="flex-grow-1">

                                                            <div className="d-flex justify-content-between align-items-start">

                                                                <div>

                                                                    <h5
                                                                        className={`fw-bold mb-1 ${
                                                                            activity.completed
                                                                                ? "text-decoration-line-through text-muted"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {
                                                                            activity.title
                                                                        }
                                                                    </h5>

                                                                    {activity.location && (
                                                                        <div className="text-muted small">
                                                                            📍{" "}
                                                                            {
                                                                                activity.location
                                                                            }
                                                                        </div>
                                                                    )}

                                                                    {(activity.startTime ||
                                                                        activity.endTime) && (
                                                                        <div className="text-muted small mt-1">
                                                                            🕐{" "}
                                                                            {
                                                                                activity.startTime
                                                                            }

                                                                            {activity.endTime &&
                                                                                ` - ${activity.endTime}`}
                                                                        </div>
                                                                    )}

                                                                </div>

                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            activity.id
                                                                        )
                                                                    }
                                                                >
                                                                    🗑️
                                                                </button>

                                                            </div>

                                                            {activity.description && (
                                                                <p className="text-muted small mt-2 mb-0">
                                                                    {
                                                                        activity.description
                                                                    }
                                                                </p>
                                                            )}

                                                            {activity.completed && (
                                                                <span className="badge bg-success-subtle text-success mt-2">
                                                                    ✓ Completed
                                                                </span>
                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </div>
                    );
                }
            )}

        </div>
    );
}

export default Itinerary;