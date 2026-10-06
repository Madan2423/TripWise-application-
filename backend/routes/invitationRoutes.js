const express = require("express");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// ==================================================
// CHECK TRIP OWNER
// ==================================================

function checkTripOwner(
    tripId,
    userId,
    callback
) {
    db.get(
        `
        SELECT
            role

        FROM trip_members

        WHERE trip_id = ?
        AND user_id = ?
        `,
        [
            tripId,
            userId
        ],
        (error, member) => {

            if (error) {
                return callback(
                    error,
                    null
                );
            }

            callback(
                null,
                member &&
                member.role === "owner"
            );
        }
    );
}

// ==================================================
// CREATE INVITATION
// ==================================================

router.post(
    "/",
    authenticateToken,
    (req, res) => {

        const {
            tripId,
            email
        } = req.body;

        if (!tripId || !email) {
            return res.status(400).json({
                message:
                    "Trip ID and email are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // ==================================================
        // CHECK OWNER
        // ==================================================

        checkTripOwner(
            tripId,
            req.user.id,
            (ownerError, isOwner) => {

                if (ownerError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!isOwner) {
                    return res.status(403).json({
                        message:
                            "Only the trip owner can send invitations"
                    });
                }

                // ==================================================
                // CHECK USER
                // ==================================================

                db.get(
                    `
                    SELECT
                        id,
                        username,
                        email

                    FROM users

                    WHERE email = ?
                    `,
                    [normalizedEmail],
                    (userError, user) => {

                        if (userError) {
                            return res.status(500).json({
                                message:
                                    "Database error"
                            });
                        }

                        if (!user) {
                            return res.status(404).json({
                                message:
                                    "No TripWise user found with this email"
                            });
                        }

                        // ==================================================
                        // OWNER CANNOT INVITE THEMSELVES
                        // ==================================================

                        if (
                            user.id ===
                            req.user.id
                        ) {
                            return res.status(400).json({
                                message:
                                    "You cannot invite yourself"
                            });
                        }

                        // ==================================================
                        // CHECK EXISTING MEMBER
                        // ==================================================

                        db.get(
                            `
                            SELECT
                                id

                            FROM trip_members

                            WHERE trip_id = ?
                            AND user_id = ?
                            `,
                            [
                                tripId,
                                user.id
                            ],
                            (memberError, member) => {

                                if (memberError) {
                                    return res.status(500).json({
                                        message:
                                            "Database error"
                                    });
                                }

                                if (member) {
                                    return res.status(409).json({
                                        message:
                                            "This user is already a member of the trip"
                                    });
                                }

                                // ==================================================
                                // CHECK EXISTING INVITATION
                                // ==================================================

                                db.get(
                                    `
                                    SELECT
                                        id,
                                        status

                                    FROM trip_invitations

                                    WHERE trip_id = ?
                                    AND invited_user_id = ?
                                    `,
                                    [
                                        tripId,
                                        user.id
                                    ],
                                    (invitationError, invitation) => {

                                        if (invitationError) {
                                            return res.status(500).json({
                                                message:
                                                    "Database error"
                                            });
                                        }

                                        // ==================================================
                                        // EXISTING PENDING INVITATION
                                        // ==================================================

                                        if (
                                            invitation &&
                                            invitation.status ===
                                                "pending"
                                        ) {
                                            return res.status(409).json({
                                                message:
                                                    "A pending invitation already exists"
                                            });
                                        }

                                        // ==================================================
                                        // REUSE REJECTED INVITATION
                                        // ==================================================

                                        if (
                                            invitation &&
                                            invitation.status ===
                                                "rejected"
                                        ) {

                                            db.run(
                                                `
                                                UPDATE trip_invitations

                                                SET
                                                    status = 'pending',
                                                    invited_by = ?,
                                                    created_at = CURRENT_TIMESTAMP

                                                WHERE id = ?
                                                `,
                                                [
                                                    req.user.id,
                                                    invitation.id
                                                ],
                                                function (updateError) {

                                                    if (updateError) {
                                                        return res.status(500).json({
                                                            message:
                                                                "Failed to resend invitation"
                                                        });
                                                    }

                                                    sendInvitationEvent(
                                                        req,
                                                        tripId,
                                                        user.id,
                                                        user.username
                                                    );

                                                    return res.status(200).json({
                                                        message:
                                                            "Invitation sent successfully"
                                                    });
                                                }
                                            );

                                            return;
                                        }

                                        // ==================================================
                                        // CREATE NEW INVITATION
                                        // ==================================================

                                        db.run(
                                            `
                                            INSERT INTO trip_invitations
                                            (
                                                trip_id,
                                                invited_user_id,
                                                invited_by,
                                                status
                                            )

                                            VALUES (?, ?, ?, ?)
                                            `,
                                            [
                                                tripId,
                                                user.id,
                                                req.user.id,
                                                "pending"
                                            ],
                                            function (insertError) {

                                                if (insertError) {

                                                    console.error(
                                                        "Invitation insert error:",
                                                        insertError.message
                                                    );

                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to create invitation"
                                                    });
                                                }

                                                sendInvitationEvent(
                                                    req,
                                                    tripId,
                                                    user.id,
                                                    user.username
                                                );

                                                res.status(201).json({
                                                    message:
                                                        "Invitation sent successfully",

                                                    invitationId:
                                                        this.lastID
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);

// ==================================================
// REAL-TIME INVITATION EVENT
// ==================================================

function sendInvitationEvent(
    req,
    tripId,
    userId,
    username
) {

    const io =
        req.app.get(
            "io"
        );

    if (!io) {
        return;
    }

    io.emit(
        "invitation-received",
        {
            tripId:
                Number(tripId),

            userId:
                Number(userId),

            username
        }
    );
}

// ==================================================
// GET MY INVITATIONS
// ==================================================

router.get(
    "/",
    authenticateToken,
    (req, res) => {

        db.all(
            `
            SELECT
                ti.id,
                ti.trip_id,
                ti.status,
                ti.created_at,

                t.name AS trip_name,
                t.destination,

                u.username AS invited_by_username,
                u.email AS invited_by_email

            FROM trip_invitations ti

            INNER JOIN trips t
                ON ti.trip_id = t.id

            INNER JOIN users u
                ON ti.invited_by = u.id

            WHERE ti.invited_user_id = ?
            AND ti.status = 'pending'

            ORDER BY
                ti.created_at DESC
            `,
            [
                req.user.id
            ],
            (error, invitations) => {

                if (error) {

                    console.error(
                        "Get invitations error:",
                        error.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch invitations"
                    });
                }

                res.json(
                    invitations
                );
            }
        );
    }
);

// ==================================================
// ACCEPT INVITATION
// ==================================================

router.patch(
    "/:invitationId/accept",
    authenticateToken,
    (req, res) => {

        const {
            invitationId
        } = req.params;

        db.get(
            `
            SELECT
                id,
                trip_id,
                invited_user_id,
                status

            FROM trip_invitations

            WHERE id = ?
            `,
            [
                invitationId
            ],
            (error, invitation) => {

                if (error) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!invitation) {
                    return res.status(404).json({
                        message:
                            "Invitation not found"
                    });
                }

                if (
                    invitation.invited_user_id !==
                    req.user.id
                ) {
                    return res.status(403).json({
                        message:
                            "This invitation does not belong to you"
                    });
                }

                if (
                    invitation.status !==
                    "pending"
                ) {
                    return res.status(400).json({
                        message:
                            "This invitation is no longer pending"
                    });
                }

                // ==================================================
                // ADD USER TO TRIP
                // ==================================================

                db.run(
                    `
                    INSERT INTO trip_members
                    (
                        trip_id,
                        user_id,
                        role
                    )

                    VALUES (?, ?, ?)
                    `,
                    [
                        invitation.trip_id,
                        req.user.id,
                        "member"
                    ],
                    (memberError) => {

                        if (memberError) {

                            if (
                                memberError.message.includes(
                                    "UNIQUE"
                                )
                            ) {
                                return res.status(409).json({
                                    message:
                                        "You are already a member of this trip"
                                });
                            }

                            console.error(
                                "Accept invitation member error:",
                                memberError.message
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to join trip"
                            });
                        }

                        // ==================================================
                        // UPDATE INVITATION
                        // ==================================================

                        db.run(
                            `
                            UPDATE trip_invitations

                            SET status = 'accepted'

                            WHERE id = ?
                            `,
                            [
                                invitationId
                            ],
                            (updateError) => {

                                if (updateError) {
                                    return res.status(500).json({
                                        message:
                                            "Failed to update invitation"
                                    });
                                }

                                // ==================================================
                                // REAL-TIME MEMBER EVENT
                                // ==================================================

                                const io =
                                    req.app.get(
                                        "io"
                                    );

                                if (io) {

                                    io.to(
                                        `trip:${invitation.trip_id}`
                                    ).emit(
                                        "member-updated",
                                        {
                                            action:
                                                "added",

                                            userId:
                                                req.user.id
                                        }
                                    );
                                }

                                res.json({
                                    message:
                                        "Invitation accepted successfully",

                                    tripId:
                                        invitation.trip_id
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

// ==================================================
// REJECT INVITATION
// ==================================================

router.patch(
    "/:invitationId/reject",
    authenticateToken,
    (req, res) => {

        const {
            invitationId
        } = req.params;

        db.get(
            `
            SELECT
                id,
                invited_user_id,
                status

            FROM trip_invitations

            WHERE id = ?
            `,
            [
                invitationId
            ],
            (error, invitation) => {

                if (error) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!invitation) {
                    return res.status(404).json({
                        message:
                            "Invitation not found"
                    });
                }

                if (
                    invitation.invited_user_id !==
                    req.user.id
                ) {
                    return res.status(403).json({
                        message:
                            "This invitation does not belong to you"
                    });
                }

                if (
                    invitation.status !==
                    "pending"
                ) {
                    return res.status(400).json({
                        message:
                            "This invitation is no longer pending"
                    });
                }

                db.run(
                    `
                    UPDATE trip_invitations

                    SET status = 'rejected'

                    WHERE id = ?
                    `,
                    [
                        invitationId
                    ],
                    (updateError) => {

                        if (updateError) {
                            return res.status(500).json({
                                message:
                                    "Failed to reject invitation"
                            });
                        }

                        res.json({
                            message:
                                "Invitation rejected successfully"
                        });
                    }
                );
            }
        );
    }
);

module.exports = router;