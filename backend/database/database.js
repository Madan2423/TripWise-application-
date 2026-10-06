const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(
    __dirname,
    "tripwise.db"
);

const db = new sqlite3.Database(
    databasePath,
    (error) => {
        if (error) {
            console.error(
                "Database connection failed:",
                error.message
            );
        } else {
            console.log(
                "SQLite database connected"
            );
        }
    }
);

// --------------------------------------------------
// DATABASE TABLES
// --------------------------------------------------

db.serialize(() => {

    db.run(`
        PRAGMA foreign_keys = ON
    `);

    // --------------------------------------------------
    // USERS
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // --------------------------------------------------
    // TRIPS
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            destination TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            budget REAL DEFAULT 0,
            description TEXT,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);

    // --------------------------------------------------
    // TRIP LOCATION MIGRATION
    // --------------------------------------------------
    // Adds latitude/longitude to existing databases
    // without deleting existing trips.

    db.all(
        `PRAGMA table_info(trips)`,
        (error, columns) => {

            if (error) {
                console.error(
                    "Unable to check trips table:",
                    error.message
                );

                return;
            }

            const columnNames =
                columns.map(
                    (column) => column.name
                );

            if (
                !columnNames.includes(
                    "latitude"
                )
            ) {
                db.run(
                    `
                    ALTER TABLE trips
                    ADD COLUMN latitude REAL
                    `,
                    (alterError) => {

                        if (alterError) {
                            console.error(
                                "Unable to add latitude:",
                                alterError.message
                            );
                        } else {
                            console.log(
                                "Added latitude column to trips"
                            );
                        }
                    }
                );
            }

            if (
                !columnNames.includes(
                    "longitude"
                )
            ) {
                db.run(
                    `
                    ALTER TABLE trips
                    ADD COLUMN longitude REAL
                    `,
                    (alterError) => {

                        if (alterError) {
                            console.error(
                                "Unable to add longitude:",
                                alterError.message
                            );
                        } else {
                            console.log(
                                "Added longitude column to trips"
                            );
                        }
                    }
                );
            }
        }
    );

    // --------------------------------------------------
    // TRIP MEMBERS
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS trip_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',

            UNIQUE(trip_id, user_id),

            FOREIGN KEY (trip_id)
                REFERENCES trips(id)
                ON DELETE CASCADE,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);

    // --------------------------------------------------
    // TRIP INVITATIONS
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS trip_invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            trip_id INTEGER NOT NULL,

            invited_user_id INTEGER NOT NULL,

            invited_by INTEGER NOT NULL,

            status TEXT NOT NULL DEFAULT 'pending',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(
                trip_id,
                invited_user_id
            ),

            FOREIGN KEY (trip_id)
                REFERENCES trips(id)
                ON DELETE CASCADE,

            FOREIGN KEY (invited_user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            FOREIGN KEY (invited_by)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);

    // --------------------------------------------------
    // ITINERARY ITEMS
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS itinerary_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            day_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            location TEXT,
            start_time TEXT,
            end_time TEXT,
            completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (trip_id)
                REFERENCES trips(id)
                ON DELETE CASCADE
        )
    `);

    // --------------------------------------------------
    // EXPENSE CATEGORIES
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS expense_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

    // --------------------------------------------------
    // EXPENSES
    // --------------------------------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            category_id INTEGER,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            expense_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (trip_id)
                REFERENCES trips(id)
                ON DELETE CASCADE,

            FOREIGN KEY (category_id)
                REFERENCES expense_categories(id)
                ON DELETE SET NULL,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);

    // --------------------------------------------------
    // DEFAULT EXPENSE CATEGORIES
    // --------------------------------------------------

    const categories = [
        "Hotel",
        "Food",
        "Transport",
        "Activities",
        "Shopping",
        "Other"
    ];

    categories.forEach((category) => {

        db.run(
            `
            INSERT OR IGNORE INTO expense_categories
            (name)
            VALUES (?)
            `,
            [category]
        );

    });

    console.log(
        "TripWise database tables ready"
    );
});

module.exports = db;