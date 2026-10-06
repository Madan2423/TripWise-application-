import { useEffect, useState } from "react";

import {
    getMyInvitations,
    acceptTripInvitation,
    rejectTripInvitation
} from "../services/api";

function InvitationList({
    token,
    onInvitationAccepted
}) {

    const [invitations, setInvitations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [processingId, setProcessingId] =
        useState(null);

    // ==================================================
    // LOAD INVITATIONS
    // ==================================================

    async function loadInvitations() {

        try {

            setLoading(true);
            setError("");

            const data =
                await getMyInvitations(
                    token
                );

            setInvitations(data);

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    }

    useEffect(() => {

        loadInvitations();

    }, [token]);

    // ==================================================
    // ACCEPT
    // ==================================================

    async function handleAccept(
        invitationId
    ) {

        try {

            setProcessingId(
                invitationId
            );

            setError("");

            await acceptTripInvitation(
                token,
                invitationId
            );

            setInvitations(
                (previous) =>
                    previous.filter(
                        (invitation) =>
                            invitation.id !==
                            invitationId
                    )
            );

            if (
                onInvitationAccepted
            ) {
                onInvitationAccepted();
            }

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setProcessingId(null);
        }
    }

    // ==================================================
    // REJECT
    // ==================================================

    async function handleReject(
        invitationId
    ) {

        try {

            setProcessingId(
                invitationId
            );

            setError("");

            await rejectTripInvitation(
                token,
                invitationId
            );

            setInvitations(
                (previous) =>
                    previous.filter(
                        (invitation) =>
                            invitation.id !==
                            invitationId
                    )
            );

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setProcessingId(null);
        }
    }

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (
            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4 text-center">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    />

                    <div className="text-muted mt-2">
                        Loading invitations...
                    </div>

                </div>

            </div>
        );
    }

    // ==================================================
    // NO INVITATIONS
    // ==================================================

    if (
        invitations.length === 0
    ) {

        return null;
    }

    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <h4 className="fw-bold mb-1">
                            🔔 Trip Invitations
                        </h4>

                        <p className="text-muted mb-0">
                            You have been invited to collaborate on a trip.
                        </p>

                    </div>

                    <span className="badge bg-primary rounded-pill px-3 py-2">

                        {invitations.length}

                        {" "}

                        {invitations.length === 1
                            ? "Invitation"
                            : "Invitations"}

                    </span>

                </div>

                {error && (

                    <div className="alert alert-danger">

                        {error}

                    </div>

                )}

                <div>

                    {invitations.map(
                        (invitation) => {

                            const processing =
                                processingId ===
                                invitation.id;

                            return (

                                <div
                                    key={
                                        invitation.id
                                    }
                                    className="border rounded-3 p-3 mb-3"
                                >

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <h5 className="fw-bold mb-1">

                                                {invitation.trip_name}

                                            </h5>

                                            <div className="text-muted small mb-2">

                                                📍{" "}
                                                {invitation.destination}

                                            </div>

                                            <div className="small">

                                                📅{" "}
                                                {invitation.start_date}
                                                {" → "}
                                                {invitation.end_date}

                                            </div>

                                            <div className="small text-muted mt-2">

                                                Invited by{" "}
                                                <strong>
                                                    {
                                                        invitation.invited_by_username
                                                    }
                                                </strong>

                                            </div>

                                            <div className="small text-muted">

                                                {
                                                    invitation.invited_by_email
                                                }

                                            </div>

                                        </div>

                                        <span className="badge bg-warning text-dark">

                                            Pending

                                        </span>

                                    </div>

                                    <div className="d-flex gap-2 mt-3">

                                        <button
                                            className="btn btn-success"
                                            disabled={
                                                processing
                                            }
                                            onClick={() =>
                                                handleAccept(
                                                    invitation.id
                                                )
                                            }
                                        >

                                            {processing
                                                ? "Processing..."
                                                : "✓ Accept"}

                                        </button>

                                        <button
                                            className="btn btn-outline-danger"
                                            disabled={
                                                processing
                                            }
                                            onClick={() =>
                                                handleReject(
                                                    invitation.id
                                                )
                                            }
                                        >

                                            ✕ Reject

                                        </button>

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </div>

        </div>
    );
}

export default InvitationList;