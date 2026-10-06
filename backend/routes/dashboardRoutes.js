const express = require("express");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// ==================================================
// DASHBOARD SUMMARY
// ==================================================

router.get(
    "/summary",
    authenticateToken,
    (req, res) => {

        const userId = req.user.id;

        console.log(
            "Dashboard request for user:",
            userId
        );

        // ==================================================
        // TOTAL TRIPS
        // ==================================================

        db.get(
            `
            SELECT
                COUNT(*) AS total_trips

            FROM trip_members

            WHERE user_id = ?
            `,
            [userId],
            (tripError, tripResult) => {

                if (tripError) {

                    console.error(
                        "TOTAL TRIPS ERROR:",
                        tripError.message
                    );

                    return res.status(500).json({
                        message:
                            `Dashboard error: ${tripError.message}`
                    });
                }

                // ==================================================
                // TOTAL BUDGET
                // ==================================================

                db.get(
                    `
                    SELECT
                        COALESCE(
                            SUM(budget),
                            0
                        ) AS total_budget

                    FROM trips

                    WHERE id IN (

                        SELECT
                            trip_id

                        FROM trip_members

                        WHERE user_id = ?

                    )
                    `,
                    [userId],
                    (budgetError, budgetResult) => {

                        if (budgetError) {

                            console.error(
                                "TOTAL BUDGET ERROR:",
                                budgetError.message
                            );

                            return res.status(500).json({
                                message:
                                    `Dashboard error: ${budgetError.message}`
                            });
                        }

                        // ==================================================
                        // TOTAL EXPENSES
                        // ==================================================

                        db.get(
                            `
                            SELECT
                                COALESCE(
                                    SUM(amount),
                                    0
                                ) AS total_expenses

                            FROM expenses

                            WHERE trip_id IN (

                                SELECT
                                    trip_id

                                FROM trip_members

                                WHERE user_id = ?

                            )
                            `,
                            [userId],
                            (expenseError, expenseResult) => {

                                if (expenseError) {

                                    console.error(
                                        "TOTAL EXPENSES ERROR:",
                                        expenseError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            `Dashboard error: ${expenseError.message}`
                                    });
                                }

                                // ==================================================
                                // CALCULATE SUMMARY
                                // ==================================================

                                const totalTrips =
                                    Number(
                                        tripResult.total_trips ||
                                        0
                                    );

                                const totalBudget =
                                    Number(
                                        budgetResult.total_budget ||
                                        0
                                    );

                                const totalExpenses =
                                    Number(
                                        expenseResult.total_expenses ||
                                        0
                                    );

                                const remainingBudget =
                                    totalBudget -
                                    totalExpenses;

                                // ==================================================
                                // UPCOMING TRIPS
                                // ==================================================

                                db.all(
                                    `
                                    SELECT
                                        id,
                                        title,
                                        destination,
                                        start_date,
                                        end_date,
                                        budget

                                    FROM trips

                                    WHERE id IN (

                                        SELECT
                                            trip_id

                                        FROM trip_members

                                        WHERE user_id = ?

                                    )

                                    ORDER BY
                                        date(start_date) ASC

                                    LIMIT 5
                                    `,
                                    [userId],
                                    (upcomingError, trips) => {

                                        if (upcomingError) {

                                            console.error(
                                                "UPCOMING TRIPS ERROR:",
                                                upcomingError.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    `Dashboard error: ${upcomingError.message}`
                                            });
                                        }

                                        // ==================================================
                                        // RESPONSE
                                        // ==================================================

                                        res.json({

                                            totalTrips:
                                                totalTrips,

                                            totalBudget:
                                                totalBudget,

                                            totalExpenses:
                                                totalExpenses,

                                            remainingBudget:
                                                remainingBudget,

                                            upcomingTrips:
                                                trips.map(
                                                    (trip) => ({

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
                                                            Number(
                                                                trip.budget ||
                                                                0
                                                            )

                                                    })
                                                )

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

module.exports = router;