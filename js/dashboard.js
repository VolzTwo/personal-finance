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
    const summary = data.summary || {};

    const income = Number(summary.income) || 0;
    const expense = Number(summary.expense) || 0;
    const balance =
        Number(summary.balance ?? income - expense);

    const savings =
        Number(summary.savings ?? income - expense);

    const savingsRate =
        income > 0
            ? (savings / income) * 100
            : 0;

    setText(
        elements.balance,
        formatRupiah(balance)
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
        "Current balance"
    );

    renderTransactions(
        data.transactions || []
    );

    renderBreakdown(
        data.expenses || []
    );

    setText(
        elements.month,
        data.currentMonth || "-"
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


async function loadDashboard() {

    try {

        elements.refresh?.classList.add("loading");

        const data =
            await api.getDashboard();

        renderDashboard(data);

    } catch (error) {

        console.error(error);

        showToast(
            "Dashboard belum terhubung ke API."
        );

    } finally {

        elements.refresh?.classList.remove(
            "loading"
        );
    }
}


elements.refresh?.addEventListener(
    "click",
    loadDashboard
);


loadDashboard();