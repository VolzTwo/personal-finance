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


function renderCashFlow(monthly) {

    const labels =
        monthly.map(item =>
            getMonthLabel(item.month)
        );

    const income =
        monthly.map(item =>
            Number(item.income) || 0
        );

    const expense =
        monthly.map(item =>
            Number(item.expense) || 0
        );

    const canvas =
        document.getElementById(
            "cashFlowAnalytics"
        );

    if (!canvas) return;

    if (
        cashFlowChart &&
        typeof cashFlowChart.destroy === "function"
    ) {
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

                                return `${
                                    context.dataset.label
                                }: ${
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

function renderCategories(categories) {

    const entries =
        (categories || [])
            .map(item => [
                item.category || "Other",
                Number(item.amount) || 0
            ])
            .sort(
                ([, a], [, b]) => b - a
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

    if (!canvas) return;

    if (
        categoryChart &&
        typeof categoryChart.destroy === "function"
    ) {
        categoryChart.destroy();
    }

    if (!entries.length) {

        renderTopCategory([]);

        return;
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

                                return `${
                                    context.label
                                }: ${
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


function renderStatistics(summary, highestExpense) {

    elements.average.textContent =
        formatRupiah(
            Number(summary?.averageExpense) || 0
        );

    elements.highest.textContent =
        formatRupiah(
            Number(
                highestExpense?.amount
            ) || 0
        );

    elements.count.textContent =
        Number(
            summary?.transactionCount
        ) || 0;
}

let analyticsData = null;

function render() {

    if (!analyticsData) return;

    renderSummary(
        analyticsData.summary
    );

    renderCashFlow(
        analyticsData.monthly || []
    );

    renderCategories(
        analyticsData.expenseByCategory || []
    );

    renderStatistics(
    analyticsData.summary,
    analyticsData.summary.highestExpense
);
}


async function loadAnalytics() {

    try {

        const months =
            Number(elements.period.value) || 6;

        const response =
            await api.getAnalytics(months);

        console.log(
            "Analytics API response:",
            response
        );

        analyticsData = response;

        render();

    } catch (error) {

        console.error(
            "Analytics load error:",
            error
        );

        showToast(
            error.message ||
            "Failed to load analytics."
        );
    }
}

elements.period.addEventListener(
    "change",
    loadAnalytics
);


loadAnalytics();