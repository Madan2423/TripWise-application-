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

            if (
                !member ||
                member.role !== "owner"
            ) {
                return callback(
                    null,
                    false
                );
            }

            callback(
                null,
                true
            );
        }
    );
}

// ==================================================
// GET TRIP MEMBERS
// ==================================================

router.get(
    "/trips/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

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
                req.user.id
            ],
            (membershipError, member) => {

                if (membershipError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!member) {
                    return res.status(403).json({
                        message:
                            "You are not a member of this trip"
                    });
                }

                db.all(
                    `
                    SELECT
                        tm.user_id,
                        tm.role,
                        u.username,
                        u.email

                    FROM trip_members tm

                    INNER JOIN users u
                        ON tm.user_id = u.id

                    WHERE tm.trip_id = ?

                    ORDER BY
                        tm.role DESC,
                        u.username ASC
                    `,
                    [tripId],
                    (error, members) => {

                        if (error) {
                            return res.status(500).json({
                                message:
                                    "Failed to fetch members"
                            });
                        }

                        res.json(
                            members
                        );
                    }
                );
            }
        );
    }
);

// ==================================================
// ADD MEMBER
// ==================================================

router.post(
    "/trips/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

        const {
            email
        } = req.body;

        if (!email) {
            return res.status(400).json({
                message:
                    "Email is required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

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
                            "Only the trip owner can add members"
                    });
                }

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

                        if (
                            user.id ===
                            req.user.id
                        ) {
                            return res.status(400).json({
                                message:
                                    "You are already the owner of this trip"
                            });
                        }

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
                                tripId,
                                user.id,
                                "member"
                            ],
                            function (insertError) {

                                if (insertError) {

                                    if (
                                        insertError.message.includes(
                                            "UNIQUE"
                                        )
                                    ) {
                                        return res.status(409).json({
                                            message:
                                                "This user is already a member of the trip"
                                        });
                                    }

                                    console.error(
                                        "Add member error:",
                                        insertError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to add member"
                                    });
                                }

                                // ==================================================
                                // REAL-TIME EVENT
                                // ==================================================

                                const io =
                                    req.app.get(
                                        "io"
                                    );

                                if (io) {

                                    io.to(
                                        `trip:${tripId}`
                                    ).emit(
                                        "member-updated",
                                        {
                                            action:
                                                "added",

                                            member: {
                                                user_id:
                                                    user.id,

                                                username:
                                                    user.username,

                                                email:
                                                    user.email,

                                                role:
                                                    "member"
                                            }
                                        }
                                    );
                                }

                                // ==================================================
                                // RESPONSE
                                // ==================================================

                                res.status(201).json({
                                    message:
                                        "Member added successfully",

                                    member: {
                                        id:
                                            user.id,

                                        username:
                                            user.username,

                                        email:
                                            user.email,

                                        role:
                                            "member"
                                    }
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
// REMOVE MEMBER
// ==================================================

router.delete(
    "/trips/:tripId/:userId",
    authenticateToken,
    (req, res) => {

        const {
            tripId,
            userId
        } = req.params;

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
                            "Only the trip owner can remove members"
                    });
                }

                if (
                    Number(userId) ===
                    req.user.id
                ) {
                    return res.status(400).json({
                        message:
                            "The trip owner cannot be removed"
                    });
                }

                db.run(
                    `
                    DELETE FROM trip_members

                    WHERE trip_id = ?
                    AND user_id = ?
                    `,
                    [
                        tripId,
                        userId
                    ],
                    function (error) {

                        if (error) {
                            return res.status(500).json({
                                message:
                                    "Failed to remove member"
                            });
                        }

                        if (
                            this.changes ===
                            0
                        ) {
                            return res.status(404).json({
                                message:
                                    "Member not found"
                            });
                        }

                        // ==================================================
                        // REAL-TIME EVENT
                        // ==================================================

                        const io =
                            req.app.get(
                                "io"
                            );

                        if (io) {

                            io.to(
                                `trip:${tripId}`
                            ).emit(
                                "member-updated",
                                {
                                    action:
                                        "removed",

                                    userId:
                                        Number(
                                            userId
                                        )
                                }
                            );
                        }

                        // ==================================================
                        // RESPONSE
                        // ==================================================

                        res.json({
                            message:
                                "Member removed successfully"
                        });
                    }
                );
            }
        );
    }
);

module.exports = router;