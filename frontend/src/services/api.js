const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// ==================================================
// GENERIC REQUEST FUNCTION
// ==================================================

async function request(
    endpoint,
    options = {}
) {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {})
            }
        }
    );

    const data =
        await response
            .json()
            .catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            "Request failed"
        );
    }

    return data;
}

// ==================================================
// AUTHENTICATION
// ==================================================

export async function registerUser(
    username,
    email,
    password
) {
    return request(
        "/auth/register",
        {
            method: "POST",

            body: JSON.stringify({
                username,
                email,
                password
            })
        }
    );
}

export async function loginUser(
    email,
    password
) {
    return request(
        "/auth/login",
        {
            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        }
    );
}

export async function getCurrentUser(
    token
) {
    return request(
        "/auth/me",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function getMe(
    token
) {
    return getCurrentUser(token);
}

// ==================================================
// TRIPS
// ==================================================

export async function createTrip(
    token,
    trip
) {
    return request(
        "/trips",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify(
                trip
            )
        }
    );
}

export async function getTrips(
    token
) {
    return request(
        "/trips",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function getTrip(
    token,
    tripId
) {
    return request(
        `/trips/${tripId}`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// ==================================================
// ITINERARY
// ==================================================

export async function getItinerary(
    token,
    tripId
) {
    return request(
        `/itinerary/trips/${tripId}`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function addItineraryItem(
    token,
    tripId,
    item
) {
    return request(
        `/itinerary/trips/${tripId}`,
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify(
                item
            )
        }
    );
}

export async function createItineraryItem(
    token,
    tripId,
    item
) {
    return addItineraryItem(
        token,
        tripId,
        item
    );
}

export async function toggleItineraryItem(
    token,
    itemId
) {
    return request(
        `/itinerary/${itemId}/toggle`,
        {
            method: "PATCH",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function deleteItineraryItem(
    token,
    itemId
) {
    return request(
        `/itinerary/${itemId}`,
        {
            method: "DELETE",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// ==================================================
// EXPENSES
// ==================================================

export async function getExpenseCategories(
    token
) {
    return request(
        "/expenses/categories",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// Main expense GET function
export async function getExpenses(
    token,
    tripId
) {
    return request(
        `/expenses/trips/${tripId}`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// Compatibility name
export async function getTripExpenses(
    token,
    tripId
) {
    return getExpenses(
        token,
        tripId
    );
}

// ==================================================
// ADD EXPENSE
// ==================================================

export async function addExpense(
    token,
    tripId,
    expense
) {
    return request(
        `/expenses/trips/${tripId}`,
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify(
                expense
            )
        }
    );
}

// Compatibility name
export async function createExpense(
    token,
    tripId,
    expense
) {
    return addExpense(
        token,
        tripId,
        expense
    );
}

// ==================================================
// DELETE EXPENSE
// ==================================================

export async function deleteExpense(
    token,
    expenseId
) {
    return request(
        `/expenses/${expenseId}`,
        {
            method: "DELETE",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// ==================================================
// DASHBOARD
// ==================================================

export async function getDashboardSummary(
    token
) {
    return request(
        "/dashboard/summary",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// ==================================================
// TRIP MEMBERS
// ==================================================

export async function getTripMembers(
    token,
    tripId
) {
    return request(
        `/members/trips/${tripId}`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function addTripMember(
    token,
    tripId,
    email
) {
    return request(
        `/members/trips/${tripId}`,
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify({
                email
            })
        }
    );
}

export async function removeTripMember(
    token,
    tripId,
    userId
) {
    return request(
        `/members/trips/${tripId}/${userId}`,
        {
            method: "DELETE",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

// ==================================================
// TRIP INVITATIONS
// ==================================================

export async function createTripInvitation(
    token,
    tripId,
    email
) {
    return request(
        "/invitations",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify({
                tripId,
                email
            })
        }
    );
}

export async function getMyInvitations(
    token
) {
    return request(
        "/invitations",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function acceptTripInvitation(
    token,
    invitationId
) {
    return request(
        `/invitations/${invitationId}/accept`,
        {
            method: "PATCH",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}

export async function rejectTripInvitation(
    token,
    invitationId
) {
    return request(
        `/invitations/${invitationId}/reject`,
        {
            method: "PATCH",

            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );
}