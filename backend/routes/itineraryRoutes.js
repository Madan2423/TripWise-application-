const express = require("express");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// ==================================================
// CHECK TRIP MEMBERSHIP
// ==================================================

function checkTripMembership(
    tripId,
    userId,
    callback
) {
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
                !!member
            );
        }
    );
}

// ==================================================
// GET TRIP ITINERARY
// ==================================================

router.get(
    "/trips/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

        checkTripMembership(
            tripId,
            req.user.id,
            (membershipError, isMember) => {

                if (membershipError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!isMember) {
                    return res.status(403).json({
                        message:
                            "You are not a member of this trip"
                    });
                }

                db.all(
                    `
                    SELECT
                        id,
                        trip_id,
                        title,
                        description,
                        activity_date,
                        start_time,
                        end_time,
                        location,
                        completed,
                        created_at

                    FROM itinerary_items

                    WHERE trip_id = ?

                    ORDER BY
                        date(activity_date) ASC,
                        start_time ASC,
                        id ASC
                    `,
                    [tripId],
                    (error, items) => {

                        if (error) {

                            console.error(
                                "Get itinerary error:",
                                error.message
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to fetch itinerary"
                            });
                        }

                        res.json(
                            items
                        );
                    }
                );
            }
        );
    }
);

// ==================================================
// ADD ITINERARY ITEM
// ==================================================

router.post(
    "/trips/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

        const {
            title,
            description,
            activityDate,
            startTime,
            endTime,
            location
        } = req.body;

        if (!title || !activityDate) {
            return res.status(400).json({
                message:
                    "Title and activity date are required"
            });
        }

        checkTripMembership(
            tripId,
            req.user.id,
            (membershipError, isMember) => {

                if (membershipError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!isMember) {
                    return res.status(403).json({
                        message:
                            "You are not a member of this trip"
                    });
                }

                db.run(
                    `
                    INSERT INTO itinerary_items
                    (
                        trip_id,
                        title,
                        description,
                        activity_date,
                        start_time,
                        end_time,
                        location,
                        completed
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        tripId,
                        title,
                        description || "",
                        activityDate,
                        startTime || null,
                        endTime || null,
                        location || "",
                        0
                    ],
                    function (error) {

                        if (error) {

                            console.error(
                                "Add itinerary error:",
                                error.message
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to add itinerary item"
                            });
                        }

                        const itemId =
                            this.lastID;

                        // ==================================================
                        // GET CREATED ITEM
                        // ==================================================

                        db.get(
                            `
                            SELECT
                                id,
                                trip_id,
                                title,
                                description,
                                activity_date,
                                start_time,
                                end_time,
                                location,
                                completed,
                                created_at

                            FROM itinerary_items

                            WHERE id = ?
                            `,
                            [itemId],
                            (fetchError, item) => {

                                if (fetchError) {

                                    console.error(
                                        "Fetch itinerary item error:",
                                        fetchError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Activity created but could not be loaded"
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
                                        "itinerary-updated",
                                        {
                                            action:
                                                "created",

                                            item
                                        }
                                    );
                                }

                                // ==================================================
                                // RESPONSE
                                // ==================================================

                                res.status(201).json({
                                    message:
                                        "Itinerary item added successfully",

                                    item
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
// TOGGLE ITINERARY ITEM
// ==================================================

router.patch(
    "/:itemId/toggle",
    authenticateToken,
    (req, res) => {

        const {
            itemId
        } = req.params;

        // ==================================================
        // FIND ITEM
        // ==================================================

        db.get(
            `
            SELECT
                id,
                trip_id,
                completed

            FROM itinerary_items

            WHERE id = ?
            `,
            [itemId],
            (findError, item) => {

                if (findError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!item) {
                    return res.status(404).json({
                        message:
                            "Itinerary item not found"
                    });
                }

                // ==================================================
                // CHECK MEMBERSHIP
                // ==================================================

                checkTripMembership(
                    item.trip_id,
                    req.user.id,
                    (membershipError, isMember) => {

                        if (membershipError) {
                            return res.status(500).json({
                                message:
                                    "Database error"
                            });
                        }

                        if (!isMember) {
                            return res.status(403).json({
                                message:
                                    "You are not a member of this trip"
                            });
                        }

                        const newCompleted =
                            item.completed
                                ? 0
                                : 1;

                        // ==================================================
                        // UPDATE
                        // ==================================================

                        db.run(
                            `
                            UPDATE itinerary_items

                            SET completed = ?

                            WHERE id = ?
                            `,
                            [
                                newCompleted,
                                itemId
                            ],
                            function (updateError) {

                                if (updateError) {

                                    console.error(
                                        "Toggle itinerary error:",
                                        updateError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to update itinerary item"
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
                                        `trip:${item.trip_id}`
                                    ).emit(
                                        "itinerary-updated",
                                        {
                                            action:
                                                "toggled",

                                            itemId:
                                                Number(
                                                    itemId
                                                ),

                                            completed:
                                                newCompleted
                                        }
                                    );
                                }

                                res.json({
                                    message:
                                        "Itinerary item updated successfully",

                                    completed:
                                        newCompleted
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
// DELETE ITINERARY ITEM
// ==================================================

router.delete(
    "/:itemId",
    authenticateToken,
    (req, res) => {

        const {
            itemId
        } = req.params;

        // ==================================================
        // FIND ITEM
        // ==================================================

        db.get(
            `
            SELECT
                id,
                trip_id

            FROM itinerary_items

            WHERE id = ?
            `,
            [itemId],
            (findError, item) => {

                if (findError) {
                    return res.status(500).json({
                        message:
                            "Database error"
                    });
                }

                if (!item) {
                    return res.status(404).json({
                        message:
                            "Itinerary item not found"
                    });
                }

                // ==================================================
                // CHECK MEMBERSHIP
                // ==================================================

                checkTripMembership(
                    item.trip_id,
                    req.user.id,
                    (membershipError, isMember) => {

                        if (membershipError) {
                            return res.status(500).json({
                                message:
                                    "Database error"
                            });
                        }

                        if (!isMember) {
                            return res.status(403).json({
                                message:
                                    "You are not a member of this trip"
                            });
                        }

                        // ==================================================
                        // DELETE
                        // ==================================================

                        db.run(
                            `
                            DELETE FROM itinerary_items

                            WHERE id = ?
                            `,
                            [itemId],
                            function (deleteError) {

                                if (deleteError) {

                                    console.error(
                                        "Delete itinerary error:",
                                        deleteError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to delete itinerary item"
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
                                        `trip:${item.trip_id}`
                                    ).emit(
                                        "itinerary-updated",
                                        {
                                            action:
                                                "deleted",

                                            itemId:
                                                Number(
                                                    itemId
                                                )
                                        }
                                    );
                                }

                                res.json({
                                    message:
                                        "Itinerary item deleted successfully"
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

module.exports = router;