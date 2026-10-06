const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// ==================================================
// REGISTER
// ==================================================

router.post("/register", async (req, res) => {
    const {
        username,
        email,
        password
    } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message:
                "Username, email and password are required"
        });
    }

    if (username.trim().length < 3) {
        return res.status(400).json({
            message:
                "Username must contain at least 3 characters"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message:
                "Password must contain at least 6 characters"
        });
    }

    try {
        const hashedPassword =
            await bcrypt.hash(password, 10);

        db.run(
            `
            INSERT INTO users
            (
                username,
                email,
                password
            )
            VALUES (?, ?, ?)
            `,
            [
                username.trim(),
                email.trim().toLowerCase(),
                hashedPassword
            ],
            function (error) {
                if (error) {
                    if (
                        error.message.includes("UNIQUE")
                    ) {
                        return res.status(409).json({
                            message:
                                "Username or email already exists"
                        });
                    }

                    console.error(
                        "Registration error:",
                        error.message
                    );

                    return res.status(500).json({
                        message:
                            "Registration failed"
                    });
                }

                res.status(201).json({
                    message:
                        "Registration successful",

                    user: {
                        id: this.lastID,
                        username:
                            username.trim(),
                        email:
                            email.trim().toLowerCase()
                    }
                });
            }
        );
    } catch (error) {
        console.error(
            "Password hashing error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});

// ==================================================
// LOGIN
// ==================================================

router.post("/login", (req, res) => {
    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message:
                "Email and password are required"
        });
    }

    db.get(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [
            email.trim().toLowerCase()
        ],
        async (error, user) => {
            if (error) {
                console.error(
                    "Login database error:",
                    error.message
                );

                return res.status(500).json({
                    message:
                        "Login failed"
                });
            }

            if (!user) {
                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });
            }

            const passwordCorrect =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordCorrect) {
                return res.status(401).json({
                    message:
                        "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            res.json({
                message:
                    "Login successful",

                token,

                user: {
                    id: user.id,
                    username:
                        user.username,
                    email:
                        user.email
                }
            });
        }
    );
});

// ==================================================
// CURRENT USER
// ==================================================

router.get(
    "/me",
    authenticateToken,
    (req, res) => {
        db.get(
            `
            SELECT
                id,
                username,
                email,
                created_at
            FROM users
            WHERE id = ?
            `,
            [req.user.id],
            (error, user) => {
                if (error) {
                    return res.status(500).json({
                        message:
                            "Failed to get user"
                    });
                }

                if (!user) {
                    return res.status(404).json({
                        message:
                            "User not found"
                    });
                }

                res.json(user);
            }
        );
    }
);

module.exports = router;