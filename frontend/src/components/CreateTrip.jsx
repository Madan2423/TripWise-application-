import { useState } from "react";

import { createTrip } from "../services/api";

function CreateTrip({
    token,
    onTripCreated,
    onCancel
}) {
    const [title, setTitle] =
        useState("");

    const [destination, setDestination] =
        useState("");

    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [budget, setBudget] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(
        event
    ) {
        event.preventDefault();

        setError("");

        try {
            setLoading(true);

            const data =
                await createTrip(
                    token,
                    {
                        title,
                        destination,
                        startDate,
                        endDate,
                        budget:
                            Number(budget) ||
                            0,
                        description
                    }
                );

            onTripCreated(
                data.trip
            );
        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>
                        <h3 className="fw-bold mb-1">
                            Create New Trip
                        </h3>

                        <p className="text-muted mb-0">
                            Start planning your adventure
                        </p>
                    </div>

                    <button
                        className="btn btn-outline-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="row g-3">

                        <div className="col-md-6">

                            <label className="form-label">
                                Trip Name
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Goa Adventure"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Destination
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Goa, India"
                                value={
                                    destination
                                }
                                onChange={(event) =>
                                    setDestination(
                                        event.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Start Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={
                                    startDate
                                }
                                onChange={(event) =>
                                    setStartDate(
                                        event.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                End Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={
                                    endDate
                                }
                                onChange={(event) =>
                                    setEndDate(
                                        event.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Budget (₹)
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                placeholder="30000"
                                min="0"
                                value={budget}
                                onChange={(event) =>
                                    setBudget(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="col-12">

                            <label className="form-label">
                                Description
                            </label>

                            <textarea
                                className="form-control"
                                rows="4"
                                placeholder="Tell us about your trip..."
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
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "Create Trip"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default CreateTrip;