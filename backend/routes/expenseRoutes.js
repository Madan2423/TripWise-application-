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
// GET EXPENSE CATEGORIES
// ==================================================

router.get(
    "/categories",
    authenticateToken,
    (req, res) => {

        db.all(
            `
            SELECT
                id,
                name

            FROM expense_categories

            ORDER BY
                name ASC
            `,
            [],
            (error, categories) => {

                if (error) {

                    console.error(
                        "Get categories error:",
                        error.message
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch expense categories"
                    });

                }

                res.json(
                    categories
                );

            }
        );

    }
);

// ==================================================
// GET TRIP EXPENSES
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
                        e.id,
                        e.trip_id,
                        e.user_id,
                        e.category_id,
                        e.amount,
                        e.description,
                        e.expense_date,

                        ec.name AS category_name,

                        u.username

                    FROM expenses e

                    LEFT JOIN expense_categories ec
                        ON e.category_id =
                           ec.id

                    LEFT JOIN users u
                        ON e.user_id =
                           u.id

                    WHERE e.trip_id = ?

                    ORDER BY
                        date(e.expense_date) DESC,
                        e.id DESC
                    `,
                    [tripId],
                    (error, expenses) => {

                        if (error) {

                            console.error(
                                "Get expenses error:",
                                error.message
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to fetch expenses"
                            });

                        }

                        res.json(
                            expenses
                        );

                    }
                );

            }
        );

    }
);

// ==================================================
// ADD EXPENSE
// ==================================================

router.post(
    "/trips/:tripId",
    authenticateToken,
    (req, res) => {

        const {
            tripId
        } = req.params;

        const {
            categoryId,
            amount,
            description,
            expenseDate
        } = req.body;

        if (
            !categoryId ||
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return res.status(400).json({
                message:
                    "Category and amount are required"
            });

        }

        const numericAmount =
            Number(amount);

        if (
            Number.isNaN(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            return res.status(400).json({
                message:
                    "Amount must be greater than zero"
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
                    INSERT INTO expenses
                    (
                        trip_id,
                        user_id,
                        category_id,
                        amount,
                        description,
                        expense_date
                    )

                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        tripId,
                        req.user.id,
                        categoryId,
                        numericAmount,
                        description || "",
                        expenseDate ||
                            new Date()
                                .toISOString()
                                .split("T")[0]
                    ],
                    function (error) {

                        if (error) {

                            console.error(
                                "Add expense error:",
                                error.message
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to add expense"
                            });

                        }

                        const expenseId =
                            this.lastID;

                        // ==================================================
                        // GET CREATED EXPENSE
                        // ==================================================

                        db.get(
                            `
                            SELECT
                                e.id,
                                e.trip_id,
                                e.user_id,
                                e.category_id,
                                e.amount,
                                e.description,
                                e.expense_date,

                                ec.name AS category_name,

                                u.username

                            FROM expenses e

                            LEFT JOIN expense_categories ec
                                ON e.category_id =
                                   ec.id

                            LEFT JOIN users u
                                ON e.user_id =
                                   u.id

                            WHERE e.id = ?
                            `,
                            [expenseId],
                            (fetchError, expense) => {

                                if (fetchError) {

                                    console.error(
                                        "Fetch created expense error:",
                                        fetchError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Expense created but could not be loaded"
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
                                        "expense-updated",
                                        {
                                            action:
                                                "created",

                                            expense
                                        }
                                    );

                                }

                                // ==================================================
                                // RESPONSE
                                // ==================================================

                                res.status(201).json({
                                    message:
                                        "Expense added successfully",

                                    expense
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
// DELETE EXPENSE
// ==================================================

router.delete(
    "/:expenseId",
    authenticateToken,
    (req, res) => {

        const {
            expenseId
        } = req.params;

        // ==================================================
        // FIND EXPENSE
        // ==================================================

        db.get(
            `
            SELECT
                id,
                trip_id,
                user_id

            FROM expenses

            WHERE id = ?
            `,
            [expenseId],
            (findError, expense) => {

                if (findError) {

                    return res.status(500).json({
                        message:
                            "Database error"
                    });

                }

                if (!expense) {

                    return res.status(404).json({
                        message:
                            "Expense not found"
                    });

                }

                // ==================================================
                // CHECK MEMBERSHIP
                // ==================================================

                checkTripMembership(
                    expense.trip_id,
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
                            DELETE FROM expenses

                            WHERE id = ?
                            `,
                            [expenseId],
                            function (deleteError) {

                                if (deleteError) {

                                    console.error(
                                        "Delete expense error:",
                                        deleteError.message
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to delete expense"
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
                                        `trip:${expense.trip_id}`
                                    ).emit(
                                        "expense-updated",
                                        {
                                            action:
                                                "deleted",

                                            expenseId:
                                                Number(
                                                    expenseId
                                                )
                                        }
                                    );

                                }

                                res.json({
                                    message:
                                        "Expense deleted successfully"
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