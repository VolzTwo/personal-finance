import { api } from "./api.js";
import { formatRupiah, escapeHTML } from "./utils.js";


let transactions = [];

let cashFlowChart = null;
let categoryChart = null;


const elements = {

    income:
        document.getElementById("analyticsIncome"),

    expense:
        document.getElementById("analyticsExpense"),

    savings:
        document.getElementById("analyticsSavings"),

    savingsRate:
        document.getElementById("analyticsSavingsRate"),

    average:
        document.getElementById("averageExpense"),

    highest:
        document.getElementById("highestExpense"),

    count:
        document.getElementById("transactionCount"),

    topCategory:
        document.getElementById("topCategory"),

    period:
        document.getElementById("periodSelector")
};


function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function getPeriodTransactions(months) {

    const now = new Date();

    const start =
        new Date(
            now.getFullYear(),
            now.getMonth() - months + 1,
            1
        );


    return transactions.filter(transaction => {

        const date =
            new Date(transaction.date);

        return date >= start && date <= now;
    });
}


function getMonthKey(date) {

    const d = new Date(date);

    return `${d.getFullYear()}-${String(
        d.getMonth() + 1
    ).padStart(2, "0")}`;
}


function getMonthLabel(monthKey) {

    const [year, month] =
        monthKey.split("-");

    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            1
        );

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


function buildMonthlyData(data) {

    const months = new Map();

    data.forEach(transaction => {

        const key =
            getMonthKey(transaction.date);

        if (!months.has(key)) {

            months.set(key, {
                income: 0,
                expense: 0
            });

        }

        const month =
            months.get(key);

        const amount =
            Number(transaction.amount) || 0;


        if (transaction.type === "income") {
            month.income += amount;
        } else {
            month.expense += amount;
        }

    });


    return [...months.entries()]
        .sort(([a], [b]) =>
            a.localeCompare(b)
        )
        .map(([month, values]) => ({
            month,
            ...values
        }));
}


function renderSummary(summary) {

    const income =
        Number(summary?.income) || 0;

    const expense =
        Number(summary?.expense) || 0;

    const savings =
        Number(summary?.savings) || 0;

    const rate =
        Number(summary?.savingsRate) || 0;

    elements.income.textContent =
        formatRupiah(income);

    elements.expense.textContent =
        formatRupiah(expense);

    elements.savings.textContent =
        formatRupiah(savings);

    elements.savingsRate.textContent =
        `${rate.toFixed(1)}%`;
}


function renderCashFlow(data) {

    const monthly =
        buildMonthlyData(data);


    const labels =
        monthly.map(item =>
            getMonthLabel(item.month)
        );


    const income =
        monthly.map(item =>
            item.income
        );


    const expense =
        monthly.map(item =>
            item.expense
        );


    const canvas =
        document.getElementById(
            "cashFlowAnalytics"
        );


    if (cashFlowChart) {
        cashFlowChart.destroy();
    }


    cashFlowChart =
        new Chart(canvas, {

            type: "line",

            data: {
                labels,

                datasets: [
                    {
                        label: "Income",
                        data: income,

                        borderWidth: 2,

                        tension: 0.35
                    },

                    {
                        label: "Expense",
                        data: expense,

                        borderWidth: 2,

                        tension: 0.35
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label(context) {

                                return `${context.dataset.label}: ${
                                    formatRupiah(
                                        context.parsed.y
                                    )
                                }`;
                            }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback(value) {
                                return formatRupiah(
                                    value
                                );
                            }
                        }
                    }
                }
            }
        });
}


function renderCategories(data) {

    const categoryTotals = {};


    data
        .filter(
            transaction =>
                transaction.type === "expense"
        )
        .forEach(transaction => {

            const category =
                transaction.category ||
                "Other";

            categoryTotals[category] =
                (
                    categoryTotals[category] ||
                    0
                ) +
                Number(transaction.amount || 0);
        });


    const entries =
        Object.entries(categoryTotals)
            .sort(
                ([, a], [, b]) =>
                    b - a
            );


    const labels =
        entries.map(([category]) =>
            category
        );


    const values =
        entries.map(([, amount]) =>
            amount
        );


    const canvas =
        document.getElementById(
            "expenseCategoryChart"
        );


    if (categoryChart) {
        categoryChart.destroy();
    }


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels,

                datasets: [
                    {
                        data: values,

                        borderWidth: 0
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "68%",

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label(context) {

                                return `${context.label}: ${
                                    formatRupiah(
                                        context.parsed
                                    )
                                }`;
                            }
                        }
                    }
                }
            }
        });


    renderTopCategory(entries);
}


function renderTopCategory(entries) {

    if (!entries.length) {

        elements.topCategory.innerHTML = `
            <span class="top-category-icon">
                —
            </span>

            <div>
                <strong>No data</strong>
                <small>No expense recorded</small>
            </div>
        `;

        return;
    }


    const [
        category,
        amount
    ] = entries[0];


    elements.topCategory.innerHTML = `
        <span class="top-category-icon">
            ◉
        </span>

        <div>

            <strong>
                ${escapeHTML(category)}
            </strong>

            <small>
                ${formatRupiah(amount)}
                spent
            </small>

        </div>
    `;
}


function renderStatistics(data) {

    const expenses =
        data.filter(
            t => t.type === "expense"
        );


    const expenseAmounts =
        expenses.map(
            t => Number(t.amount || 0)
        );


    const total =
        expenseAmounts.reduce(
            (sum, amount) =>
                sum + amount,
            0
        );


    const average =
        expenseAmounts.length
            ? total / expenseAmounts.length
            : 0;


    const highest =
        Math.max(
            0,
            ...expenseAmounts
        );


    elements.average.textContent =
        formatRupiah(average);

    elements.highest.textContent =
        formatRupiah(highest);

    elements.count.textContent =
        data.length;
}


function render() {

    const months =
        Number(elements.period.value);

    const data =
        getPeriodTransactions(months);


    renderSummary(data);

    renderCashFlow(data);

    renderCategories(data);

    renderStatistics(data);
}


async function loadAnalytics() {

    try {

        const response =
    await api.getAnalytics();

console.log(
    "Analytics API response:",
    response
);


        /*
         * If GAS already provides analytics,
         * use its transactions when available.
         * Otherwise fall back to the
         * transactions endpoint.
         */

        if (
            response &&
            Array.isArray(response.transactions)
        ) {

            transactions =
                response.transactions;

        } else {

            const transactionResponse =
                await api.getTransactions();

            transactions =
                Array.isArray(transactionResponse)
                    ? transactionResponse
                    : (
                        transactionResponse
                            .transactions ||
                        transactionResponse.data ||
                        []
                    );
        }


        render();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to load analytics."
        );
    }
}


elements.period.addEventListener(
    "change",
    render
);


loadAnalytics();