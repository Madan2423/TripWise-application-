const express = require("express");

const db = require("../database/database");

const authenticateToken = require("../middleware/auth");

const router = express.Router();

// ==================================================
// GEOCODE DESTINATION
// ==================================================

async function getCoordinates(destination) {
    try {
        const url =
            "https://nominatim.openstreetmap.org/search?" +
            new URLSearchParams({
                q: destination,
                format: "jsonv2",
                limit: "1"
            });

        const response = await fetch(
            url,
            {
                headers: {
                    "User-Agent":
                        "TripWise/1.0 Travel Planning Application",
                    "Accept":
                        "application/json"
                }
            }
        );

        if (!response.ok) {
            console.error(
                "Geocoding API error:",
                response.status
            );

            return {
                latitude: null,
                longitude: null
            };
        }

        const data =
            await response.json();

        if (
            !data ||
            data.length === 0
        ) {
            console.log(
                `Location not found for: ${destination}`
            );

            return {
                latitude: null,
                longitude: null
            };
        }

        return {
            latitude: Number(data[0].lat),
            longitude: Number(data[0].lon)
        };

    } catch (error) {

        console.error(
            "Geocoding error:",
            error.message
        );

        return {
            latitude: null,
            longitude: null
        };
    }
}

// ==================================================
// CREATE TRIP
// ==================================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        const {
            title,
            destination,
            startDate,
            endDate,
            budget,
            description
        } = req.body;

        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (
            !title ||
            !destination ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                message:
                    "Title, destination, start date and end date are required"
            });
        }

        // --------------------------------------------------
        // DATE VALIDATION
        // --------------------------------------------------

        if (
            new Date(endDate) <
            new Date(startDate)
        ) {
            return res.status(400).json({
                message:
                    "End date cannot be before start date"
            });
        }

        // --------------------------------------------------
        // BUDGET VALIDATION
        // --------------------------------------------------

        const tripBudget =
            Number(budget) || 0;

        if (tripBudget < 0) {
            return res.status(400).json({
                message:
                    "Budget cannot be negative"
            });
        }

        // --------------------------------------------------
        // CLEAN INPUT
        // --------------------------------------------------

        const cleanTitle =
            title.trim();

        const cleanDestination =
            destination.trim();

        const cleanDescription =
            description
                ? description.trim()
                : null;

        // --------------------------------------------------
        // GET DESTINATION COORDINATES
        // --------------------------------------------------

        const coordinates =
            await getCoordinates(
                cleanDestination
            );

        console.log(
            `Destination: ${cleanDestination}`
        );

        console.log(
            "Coordinates:",
            coordinates
        );

        // --------------------------------------------------
        // INSERT TRIP
        // --------------------------------------------------

        db.run(
            `
            INSERT INTO trips
            (
                user_id,
                title,
                destination,
                start_date,
                end_date,
                budget,
                description,
                latitude,
                longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                cleanTitle,
                cleanDestination,
                startDate,
                endDate,
                tripBudget,
                cleanDescription,
                coordinates.latitude,
                coordinates.longitude
            ],
            function (error) {

                if (error) {

                    console.error(
                        "Create trip error:",
                        error.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to create trip"
                    });
                }

                const tripId =
                    this.lastID;

                // --------------------------------------------------
                // ADD CREATOR AS TRIP OWNER
                // --------------------------------------------------

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
                        req.user.id,
                        "owner"
                    ],
                    (memberError) => {

                        if (memberError) {

                            console.error(
                                "Trip member error:",
                                memberError.message
                            );

                            return res.status(500).json({
                                message:
                                    "Trip created but failed to add owner"
                            });
                        }

                        // --------------------------------------------------
                        // RESPONSE
                        // --------------------------------------------------

                        res.status(201).json({

                            message:
                                "Trip created successfully",

                            trip: {

                                id: tripId,

                                title:
                                    cleanTitle,

                                destination:
                                    cleanDestination,

                                startDate,

                                endDate,

                                budget:
                                    tripBudget,

                                description:
                                    cleanDescription,

                                latitude:
                                    coordinates.latitude,

                                longitude:
                                    coordinates.longitude
                            }

                        });
                    }
                );
            }
        );
    }
);

// ==================================================
// GET MY TRIPS
// ==================================================

router.get(
    "/",
    authenticateToken,
    (req, res) => {

        db.all(
            `
            SELECT
                t.id,
                t.title,
                t.destination,
                t.start_date,
                t.end_date,
                t.budget,
                t.description,
                t.latitude,
                t.longitude,
                t.created_at,

                COALESCE(
                    (
                        SELECT SUM(e.amount)
                        FROM expenses e
                        WHERE e.trip_id = t.id
                    ),
                    0
                ) AS total_expenses

            FROM trips t

            INNER JOIN trip_members tm
                ON t.id = tm.trip_id

            WHERE tm.user_id = ?

            ORDER BY
                t.start_date ASC
            `,
            [req.user.id],
            (error, trips) => {

                if (error) {

                    console.error(
                        "Get trips error:",
                        error.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch trips"
                    });
                }

                res.json(
                    trips.map((trip) => ({

                        id:
                            trip.id,

                        title:
                            trip.title,

                        destination:
                            trip.destination,

                        startDate:
                            trip.start_date,

                        endDate:
                            trip.end_date,

                        budget:
                            trip.budget,

                        description:
                            trip.description,

                        latitude:
                            trip.latitude,

                        longitude:
                            trip.longitude,

                        totalExpenses:
                            trip.total_expenses,

                        remainingBudget:
                            trip.budget -
                            trip.total_expenses

                    }))
                );
            }
        );
    }
);

// ==================================================
// GET SINGLE TRIP
// ==================================================

router.get(
    "/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

        // --------------------------------------------------
        // CHECK WHETHER USER BELONGS TO TRIP
        // --------------------------------------------------

        db.get(
            `
            SELECT
                tm.role

            FROM trip_members tm

            WHERE tm.trip_id = ?

            AND tm.user_id = ?
            `,
            [
                tripId,
                req.user.id
            ],
            (memberError, member) => {

                if (memberError) {

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

                // --------------------------------------------------
                // GET TRIP
                // --------------------------------------------------

                db.get(
                    `
                    SELECT
                        t.id,
                        t.title,
                        t.destination,
                        t.start_date,
                        t.end_date,
                        t.budget,
                        t.description,
                        t.latitude,
                        t.longitude,
                        t.created_at,

                        COALESCE(
                            (
                                SELECT SUM(e.amount)
                                FROM expenses e
                                WHERE e.trip_id = t.id
                            ),
                            0
                        ) AS total_expenses

                    FROM trips t

                    WHERE t.id = ?
                    `,
                    [tripId],
                    (error, trip) => {

                        if (error) {

                            return res.status(500).json({
                                message:
                                    "Failed to fetch trip"
                            });
                        }

                        if (!trip) {

                            return res.status(404).json({
                                message:
                                    "Trip not found"
                            });
                        }

                        // --------------------------------------------------
                        // GET TRIP MEMBERS
                        // --------------------------------------------------

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
                                u.username ASC
                            `,
                            [tripId],
                            (membersError, members) => {

                                if (membersError) {

                                    return res.status(500).json({
                                        message:
                                            "Failed to fetch trip members"
                                    });
                                }

                                // --------------------------------------------------
                                // RESPONSE
                                // --------------------------------------------------

                                res.json({

                                    id:
                                        trip.id,

                                    title:
                                        trip.title,

                                    destination:
                                        trip.destination,

                                    startDate:
                                        trip.start_date,

                                    endDate:
                                        trip.end_date,

                                    budget:
                                        trip.budget,

                                    description:
                                        trip.description,

                                    latitude:
                                        trip.latitude,

                                    longitude:
                                        trip.longitude,

                                    totalExpenses:
                                        trip.total_expenses,

                                    remainingBudget:
                                        trip.budget -
                                        trip.total_expenses,

                                    role:
                                        member.role,

                                    members

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