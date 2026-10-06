import { useEffect, useState } from "react";

import {
    getTripMembers,
    createTripInvitation,
    removeTripMember
} from "../services/api";

function TripMembers({
    token,
    tripId,
    currentUserId
}) {
    const [members, setMembers] =
        useState([]);

    const [email, setEmail] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ==================================================
    // LOAD MEMBERS
    // ==================================================

    async function loadMembers() {
        try {
            setLoading(true);
            setError("");

            const data =
                await getTripMembers(
                    token,
                    tripId
                );

            setMembers(data);

        } catch (error) {

            setError(
                error.message ||
                "Failed to load members"
            );

        } finally {

            setLoading(false);
        }
    }

    // ==================================================
    // LOAD ON MOUNT
    // ==================================================

    useEffect(() => {

        if (!token || !tripId) {
            return;
        }

        loadMembers();

    }, [
        token,
        tripId
    ]);

    // ==================================================
    // CHECK CURRENT USER
    // ==================================================

    const currentMember =
        members.find(
            (member) =>
                Number(member.user_id) ===
                Number(currentUserId)
        );

    const isOwner =
        currentMember?.role ===
        "owner";

    // ==================================================
    // SEND INVITATION
    // ==================================================

    async function handleSendInvitation(
        event
    ) {
        event.preventDefault();

        if (!email.trim()) {

            setError(
                "Please enter an email address."
            );

            return;
        }

        try {

            setSending(true);

            setError("");
            setSuccess("");

            await createTripInvitation(
                token,
                tripId,
                email.trim()
            );

            setEmail("");

            setSuccess(
                "Invitation sent successfully."
            );

        } catch (error) {

            setError(
                error.message ||
                "Failed to send invitation"
            );

        } finally {

            setSending(false);
        }
    }

    // ==================================================
    // REMOVE MEMBER
    // ==================================================

    async function handleRemoveMember(
        userId
    ) {
        const confirmed =
            window.confirm(
                "Are you sure you want to remove this member?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            await removeTripMember(
                token,
                tripId,
                userId
            );

            setSuccess(
                "Member removed successfully."
            );

            await loadMembers();

        } catch (error) {

            setError(
                error.message ||
                "Failed to remove member"
            );
        }
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

                <div className="text-muted mt-2">
                    Loading members...
                </div>

            </div>
        );
    }

    // ==================================================
    // UI
    // ==================================================

    return (
        <div>

            {/* ==================================================
                HEADER
                ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h4 className="fw-bold mb-1">
                        👥 Trip Members
                    </h4>

                    <p className="text-muted mb-0">
                        Collaborate with people on this trip
                    </p>

                </div>

                <span className="badge bg-primary rounded-pill px-3 py-2">

                    {members.length}

                    {" "}

                    {members.length === 1
                        ? "Member"
                        : "Members"}

                </span>

            </div>

            {/* ==================================================
                ERROR
                ================================================== */}

            {error && (

                <div className="alert alert-danger">
                    {error}
                </div>

            )}

            {/* ==================================================
                SUCCESS
                ================================================== */}

            {success && (

                <div className="alert alert-success">
                    {success}
                </div>

            )}

            {/* ==================================================
                SEND INVITATION
                ================================================== */}

            {isOwner && (

                <div className="card bg-light border-0 mb-4">

                    <div className="card-body">

                        <h6 className="fw-bold">
                            Invite a collaborator
                        </h6>

                        <p className="small text-muted">
                            Send an invitation to an existing
                            TripWise user.
                        </p>

                        <form
                            onSubmit={
                                handleSendInvitation
                            }
                            className="d-flex gap-2"
                        >

                            <input
                                type="email"
                                className="form-control"
                                placeholder="friend@example.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                disabled={sending}
                            />

                            <button
                                type="submit"
                                className="btn btn-primary px-4"
                                disabled={sending}
                            >

                                {sending
                                    ? "Sending..."
                                    : "Send Invitation"}

                            </button>

                        </form>

                    </div>

                </div>

            )}

            {/* ==================================================
                MEMBER LIST
                ================================================== */}

            <div>

                {members.length === 0 ? (

                    <div className="text-center text-muted py-4">
                        No members found.
                    </div>

                ) : (

                    members.map(
                        (member) => {

                            const isCurrentUser =
                                Number(
                                    member.user_id
                                ) ===
                                Number(
                                    currentUserId
                                );

                            return (

                                <div
                                    key={
                                        member.user_id
                                    }
                                    className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3"
                                >

                                    {/* ==================================================
                                        USER
                                        ================================================== */}

                                    <div className="d-flex align-items-center gap-3">

                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                            style={{
                                                width:
                                                    "45px",

                                                height:
                                                    "45px"
                                            }}
                                        >
                                            {member.username
                                                ?.charAt(
                                                    0
                                                )
                                                .toUpperCase()}
                                        </div>

                                        <div>

                                            <div className="fw-bold">

                                                {
                                                    member.username
                                                }

                                                {isCurrentUser && (

                                                    <span className="text-muted small ms-2">
                                                        (You)
                                                    </span>

                                                )}

                                            </div>

                                            <div className="small text-muted">
                                                {
                                                    member.email
                                                }
                                            </div>

                                        </div>

                                    </div>

                                    {/* ==================================================
                                        ROLE + ACTION
                                        ================================================== */}

                                    <div className="d-flex align-items-center gap-2">

                                        {member.role ===
                                        "owner" ? (

                                            <span className="badge bg-warning text-dark">
                                                👑 Owner
                                            </span>

                                        ) : (

                                            <span className="badge bg-light text-dark border">
                                                Member
                                            </span>

                                        )}

                                        {isOwner &&
                                            member.role !==
                                                "owner" && (

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.user_id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>

                                            )}

                                    </div>

                                </div>

                            );
                        }
                    )

                )}

            </div>

        </div>
    );
}

export default TripMembers;