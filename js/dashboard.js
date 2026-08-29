import { api } from "./api.js";
import {
    formatRupiah,
    formatDate,
    escapeHTML
} from "./utils.js";

const elements = {
    balance: document.getElementById("totalBalance"),
    income: document.getElementById("totalIncome"),
    expense: document.getElementById("totalExpense"),
    savings: document.getElementById("totalSavings"),
    savingsRate: document.getElementById("savingsRate"),
    balanceStatus: document.getElementById("balanceStatus"),
    transactions: document.getElementById("recentTransactions"),
    breakdown: document.getElementById("expenseBreakdown"),
    month: document.getElementById("currentMonth"),
    refresh: document.getElementById("refreshButton")
};


function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}


function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function renderDashboard(data) {

    console.log("Rendering dashboard data:", data);

    const balance = data.balance || {};
    const monthly = data.monthly || {};

    const income =
        Number(monthly.income) || 0;

    const expense =
        Number(monthly.expense) || 0;

    const savings =
        Number(monthly.savings) || 0;

    const savingsRate =
        Number(monthly.savingsRate) || 0;

    const totalBalance =
        Number(balance.total) || 0;

    setText(
        elements.balance,
        formatRupiah(totalBalance)
    );

    setText(
        elements.income,
        formatRupiah(income)
    );

    setText(
        elements.expense,
        formatRupiah(expense)
    );

    setText(
        elements.savings,
        formatRupiah(savings)
    );

    setText(
        elements.savingsRate,
        `${savingsRate.toFixed(1)}%`
    );

    setText(
        elements.balanceStatus,
        totalBalance >= 0
            ? "Current balance"
            : "Negative balance"
    );

    renderTransactions(
        data.recentTransactions || []
    );

    renderBreakdown(
        data.expenseBreakdown || []
    );

    setText(
        elements.month,
        data.period?.month || "-"
    );
}

function renderTransactions(transactions) {

    if (!transactions.length) {
        elements.transactions.innerHTML = `
            <div class="empty-state">
                No transactions yet.
            </div>
        `;

        return;
    }

    const recent =
        transactions.slice(0, 5);

    elements.transactions.innerHTML =
        recent.map(transaction => {

            const isIncome =
                transaction.type === "income";

            const sign =
                isIncome ? "+" : "-";

            return `
                <div class="transaction-row">

                    <div class="transaction-main">

                        <div class="transaction-icon">
                            ${isIncome ? "↗" : "↘"}
                        </div>

                        <div>
                            <div class="transaction-description">
                                ${escapeHTML(
                                    transaction.description ||
                                    transaction.category ||
                                    "Transaction"
                                )}
                            </div>

                            <div class="transaction-category">
                                ${escapeHTML(
                                    transaction.category || "Other"
                                )}
                                ·
                                ${formatDate(transaction.date)}
                            </div>
                        </div>

                    </div>

                    <div
                        class="transaction-amount ${
                            isIncome
                                ? "income"
                                : "expense"
                        }"
                    >
                        ${sign}${formatRupiah(
                            transaction.amount
                        )}
                    </div>

                </div>
            `;
        }).join("");
}


function renderBreakdown(expenses) {

    if (!expenses.length) {
        elements.breakdown.innerHTML = `
            <div class="empty-state">
                No expense data
            </div>
        `;

        return;
    }

    elements.breakdown.innerHTML =
        expenses.map(item => `
            <div class="expense-item">

                <div class="expense-info">

                    <span class="expense-dot"></span>

                    <span class="expense-name">
                        ${escapeHTML(
                            item.category || "Other"
                        )}
                    </span>

                </div>

                <span class="expense-value">
                    ${formatRupiah(item.amount)}
                </span>

            </div>
        `).join("");
}

function renderCashFlow(cashFlow) {

    const canvas =
        document.getElementById("cashFlowChart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (window.cashFlowChart) {
        window.cashFlowChart.destroy();
    }

    const labels = cashFlow.map(item => item.date);

    const income = cashFlow.map(item =>
        Number(item.income || 0)
    );

    const expense = cashFlow.map(item =>
        Number(item.expense || 0)
    );

    window.cashFlowChart = new Chart(ctx, {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: "Income",
                    data: income,
                    tension: 0.35,
                    borderWidth: 2
                },

                {
                    label: "Expense",
                    data: expense,
                    tension: 0.35,
                    borderWidth: 2
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadDashboard() {
    try {
        elements.refresh?.classList.add("loading");

        const data = await api.getDashboard();

        console.log("Dashboard API response:", data);

        if (!data) {
            throw new Error("Dashboard API mengembalikan data kosong.");
        }

        renderDashboard(data);

    } catch (error) {
        console.error("Dashboard error:", error);

        showToast(
            error.message || "Dashboard belum terhubung ke API."
        );

    } finally {
        elements.refresh?.classList.remove("loading");
    }
}

elements.refresh?.addEventListener(
    "click",
    loadDashboard
);

loadDashboard();