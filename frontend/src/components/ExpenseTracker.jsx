import { useEffect, useState } from "react";

import {
    getExpenses,
    getExpenseCategories,
    addExpense,
    deleteExpense
} from "../services/api";

function ExpenseTracker({
    token,
    tripId,
    budget
}) {
    const [expenses, setExpenses] =
        useState([]);

    const [categories, setCategories] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    // ==================================================
    // FORM STATE
    // ==================================================

    const [categoryId, setCategoryId] =
        useState("");

    const [amount, setAmount] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [expenseDate, setExpenseDate] =
        useState(
            new Date()
                .toISOString()
                .split("T")[0]
        );

    // ==================================================
    // LOAD EXPENSE DATA
    // ==================================================

    async function loadExpenses() {
        try {
            setLoading(true);
            setError("");

            const [
                expenseData,
                categoryData
            ] = await Promise.all([
                getExpenses(
                    token,
                    tripId
                ),

                getExpenseCategories(
                    token
                )
            ]);

            setExpenses(
                expenseData.expenses
            );

            setCategories(
                categoryData
            );

        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadExpenses();
    }, [token, tripId]);

    // ==================================================
    // RESET FORM
    // ==================================================

    function resetForm() {
        setCategoryId("");
        setAmount("");
        setDescription("");

        setExpenseDate(
            new Date()
                .toISOString()
                .split("T")[0]
        );
    }

    // ==================================================
    // ADD EXPENSE
    // ==================================================

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (
            !amount ||
            Number(amount) <= 0
        ) {
            setError(
                "Please enter a valid amount"
            );

            return;
        }

        if (!expenseDate) {
            setError(
                "Please select an expense date"
            );

            return;
        }

        try {
            setSaving(true);

            await addExpense(
                token,
                tripId,
                {
                    categoryId:
                        categoryId
                            ? Number(
                                categoryId
                            )
                            : null,

                    amount:
                        Number(amount),

                    description:
                        description.trim(),

                    expenseDate
                }
            );

            resetForm();

            setShowForm(false);

            await loadExpenses();

        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setSaving(false);
        }
    }

    // ==================================================
    // DELETE EXPENSE
    // ==================================================

    async function handleDelete(
        expenseId
    ) {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this expense?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteExpense(
                token,
                expenseId
            );

            await loadExpenses();

        } catch (error) {
            setError(
                error.message
            );
        }
    }

    // ==================================================
    // TOTALS
    // ==================================================

    const totalExpenses =
        expenses.reduce(
            (
                total,
                expense
            ) =>
                total +
                Number(
                    expense.amount
                ),
            0
        );

    const remainingBudget =
        Number(budget) -
        totalExpenses;

    const budgetPercentage =
        Number(budget) > 0
            ? Math.min(
                (
                    totalExpenses /
                    Number(budget)
                ) * 100,
                100
            )
            : 0;

    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    function formatCurrency(
        value
    ) {
        return `₹${Number(
            value
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`;
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

                <p className="text-muted mt-2 mb-0">
                    Loading expenses...
                </p>

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
                        💰 Expenses
                    </h4>

                    <p className="text-muted mb-0">
                        Track your trip spending.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setError("");

                        setShowForm(
                            !showForm
                        );
                    }}
                >
                    {showForm
                        ? "Cancel"
                        : "+ Add Expense"}
                </button>

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
                SUMMARY CARDS
            ================================================== */}

            <div className="row g-3 mb-4">

                <div className="col-md-4">

                    <div className="card border-0 bg-light h-100">

                        <div className="card-body">

                            <div className="text-muted small">
                                Total Budget
                            </div>

                            <h4 className="fw-bold mt-2 mb-0">
                                {formatCurrency(
                                    budget
                                )}
                            </h4>

                        </div>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="card border-0 bg-light h-100">

                        <div className="card-body">

                            <div className="text-muted small">
                                Total Spent
                            </div>

                            <h4 className="fw-bold mt-2 mb-0">
                                {formatCurrency(
                                    totalExpenses
                                )}
                            </h4>

                        </div>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="card border-0 bg-light h-100">

                        <div className="card-body">

                            <div className="text-muted small">
                                Remaining
                            </div>

                            <h4
                                className={`fw-bold mt-2 mb-0 ${
                                    remainingBudget <
                                    0
                                        ? "text-danger"
                                        : "text-success"
                                }`}
                            >
                                {formatCurrency(
                                    remainingBudget
                                )}
                            </h4>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                PROGRESS
            ================================================== */}

            <div className="mb-4">

                <div className="d-flex justify-content-between mb-2">

                    <span className="small text-muted">
                        Budget used
                    </span>

                    <span className="small fw-semibold">
                        {budgetPercentage.toFixed(
                            1
                        )}
                        %
                    </span>

                </div>

                <div
                    className="progress"
                    style={{
                        height: "10px"
                    }}
                >

                    <div
                        className={`progress-bar ${
                            remainingBudget <
                            0
                                ? "bg-danger"
                                : ""
                        }`}
                        style={{
                            width:
                                `${budgetPercentage}%`
                        }}
                    />

                </div>

            </div>

            {/* ==================================================
                ADD EXPENSE FORM
            ================================================== */}

            {showForm && (
                <div className="card border-0 bg-light mb-4">

                    <div className="card-body p-4">

                        <h5 className="fw-bold mb-4">
                            Add Expense
                        </h5>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="row g-3">

                                {/* CATEGORY */}

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Category
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            categoryId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setCategoryId(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Select category
                                        </option>

                                        {categories.map(
                                            (
                                                category
                                            ) => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* AMOUNT */}

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Amount (₹)
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="2500"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            amount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setAmount(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                {/* DATE */}

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Expense Date
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={
                                            expenseDate
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setExpenseDate(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                {/* DESCRIPTION */}

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Description
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Hotel booking"
                                        value={
                                            description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDescription(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary mt-4"
                                disabled={
                                    saving
                                }
                            >
                                {saving
                                    ? "Adding..."
                                    : "Add Expense"}
                            </button>

                        </form>

                    </div>

                </div>
            )}

            {/* ==================================================
                EXPENSE LIST
            ================================================== */}

            {expenses.length === 0 ? (
                <div className="text-center py-5 bg-light rounded">

                    <div
                        style={{
                            fontSize: "45px"
                        }}
                    >
                        💸
                    </div>

                    <h5 className="fw-bold mt-3">
                        No expenses yet
                    </h5>

                    <p className="text-muted mb-0">
                        Start tracking your trip
                        expenses.
                    </p>

                </div>
            ) : (
                <div>

                    <h5 className="fw-bold mb-3">
                        Expense History
                    </h5>

                    <div className="d-flex flex-column gap-3">

                        {expenses.map(
                            (expense) => (
                                <div
                                    className="card border-0 shadow-sm"
                                    key={
                                        expense.id
                                    }
                                >

                                    <div className="card-body">

                                        <div className="d-flex justify-content-between align-items-start">

                                            <div className="d-flex gap-3">

                                                <div
                                                    className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width:
                                                            "45px",
                                                        height:
                                                            "45px",
                                                        flexShrink:
                                                            0
                                                    }}
                                                >
                                                    💰
                                                </div>

                                                <div>

                                                    <h6 className="fw-bold mb-1">
                                                        {expense.description ||
                                                            "Expense"}
                                                    </h6>

                                                    <div className="small text-muted">

                                                        {expense.categoryName ||
                                                            "Other"}

                                                        {" • "}

                                                        {
                                                            expense.expenseDate
                                                        }

                                                    </div>

                                                    <div className="small text-muted mt-1">
                                                        Added by{" "}
                                                        {
                                                            expense.username
                                                        }
                                                    </div>

                                                </div>

                                            </div>

                                            <div className="text-end">

                                                <div className="fw-bold">
                                                    {formatCurrency(
                                                        expense.amount
                                                    )}
                                                </div>

                                                <button
                                                    className="btn btn-sm btn-outline-danger mt-2"
                                                    onClick={() =>
                                                        handleDelete(
                                                            expense.id
                                                        )
                                                    }
                                                >
                                                    🗑️
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                </div>
            )}

        </div>
    );
}

export default ExpenseTracker;