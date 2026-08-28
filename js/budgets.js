import { api } from "./api.js";
import {
    formatRupiah,
    escapeHTML
} from "./utils.js";


let budgets = [];
let transactions = [];
let editingId = null;


const elements = {

    totalBudget:
        document.getElementById("totalBudget"),

    totalSpent:
        document.getElementById("totalSpent"),

    remaining:
        document.getElementById("remainingBudget"),

    percentage:
        document.getElementById("spentPercentage"),

    list:
        document.getElementById("budgetList"),

    month:
        document.getElementById("monthSelector"),

    add:
        document.getElementById("addBudgetButton"),

    modal:
        document.getElementById("budgetModal"),

    overlay:
        document.getElementById("budgetOverlay"),

    close:
        document.getElementById("closeBudgetModal"),

    cancel:
        document.getElementById("cancelBudget"),

    form:
        document.getElementById("budgetForm"),

    modalTitle:
        document.getElementById("budgetModalTitle"),

    id:
        document.getElementById("budgetId"),

    category:
        document.getElementById("budgetCategory"),

    amount:
        document.getElementById("budgetAmount"),

    budgetMonth:
        document.getElementById("budgetMonth")
};


function currentMonth() {

    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
}


function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function openModal(budget = null) {

    editingId =
        budget?.id || null;

    elements.form.reset();


    if (budget) {

        elements.modalTitle.textContent =
            "Edit Budget";

        elements.id.value =
            budget.id || "";

        elements.category.value =
            budget.category || "";

        elements.amount.value =
            budget.amount || "";

        elements.budgetMonth.value =
            budget.month || elements.month.value;

    } else {

        elements.modalTitle.textContent =
            "Add Budget";

        elements.budgetMonth.value =
            elements.month.value;

    }


    elements.modal.classList.remove(
        "hidden"
    );
}


function closeModal() {

    elements.modal.classList.add(
        "hidden"
    );

    editingId = null;
}


function getSpent(category, month) {

    return transactions
        .filter(transaction => {

            return (
                transaction.type === "expense" &&
                transaction.category === category &&
                String(transaction.date)
                    .startsWith(month)
            );

        })
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.amount || 0),
            0
        );
}


function renderSummary() {

    const selectedMonth =
        elements.month.value;

    const monthlyBudgets =
        budgets.filter(
            budget =>
                budget.month === selectedMonth
        );


    const totalBudget =
        monthlyBudgets.reduce(
            (total, budget) =>
                total +
                Number(budget.amount || 0),
            0
        );


    const totalSpent =
        monthlyBudgets.reduce(
            (total, budget) =>
                total +
                getSpent(
                    budget.category,
                    selectedMonth
                ),
            0
        );


    const remaining =
        totalBudget - totalSpent;


    const percentage =
        totalBudget > 0
            ? (totalSpent / totalBudget) * 100
            : 0;


    elements.totalBudget.textContent =
        formatRupiah(totalBudget);

    elements.totalSpent.textContent =
        formatRupiah(totalSpent);

    elements.remaining.textContent =
        formatRupiah(remaining);

    elements.percentage.textContent =
        `${percentage.toFixed(1)}% used`;
}


function renderBudgets() {

    const selectedMonth =
        elements.month.value;


    const monthlyBudgets =
        budgets.filter(
            budget =>
                budget.month === selectedMonth
        );


    if (!monthlyBudgets.length) {

        elements.list.innerHTML = `
            <div class="empty-state">
                No budgets for this month.
            </div>
        `;

        renderSummary();

        return;
    }


    elements.list.innerHTML =
        monthlyBudgets
            .map(budget => {

                const limit =
                    Number(budget.amount || 0);

                const spent =
                    getSpent(
                        budget.category,
                        selectedMonth
                    );

                const percentage =
                    limit > 0
                        ? (spent / limit) * 100
                        : 0;

                const progress =
                    Math.min(
                        Math.max(
                            percentage,
                            0
                        ),
                        100
                    );


                let progressClass = "";

                if (percentage >= 100) {
                    progressClass = "danger";
                } else if (percentage >= 80) {
                    progressClass = "warning";
                }


                const remaining =
                    limit - spent;


                let status =
                    `${formatRupiah(
                        Math.max(remaining, 0)
                    )} remaining`;

                if (remaining < 0) {
                    status =
                        `${formatRupiah(
                            Math.abs(remaining)
                        )} over budget`;
                }


                return `
                    <div class="budget-item">

                        <div class="budget-item-header">

                            <div>
                                <div class="budget-category">
                                    ${escapeHTML(
                                        budget.category
                                    )}
                                </div>
                            </div>

                            <div class="budget-numbers">
                                <strong>
                                    ${formatRupiah(spent)}
                                </strong>
                                /
                                ${formatRupiah(limit)}
                            </div>

                        </div>


                        <div class="progress-track">

                            <div
                                class="progress-bar ${progressClass}"
                                style="width: ${progress}%"
                            ></div>

                        </div>


                        <div class="budget-footer">

                            <span class="budget-status">
                                ${status}
                            </span>


                            <div class="budget-actions">

                                <button
                                    class="budget-action"
                                    data-action="edit"
                                    data-id="${budget.id}"
                                >
                                    ✎
                                </button>

                                <button
                                    class="budget-action"
                                    data-action="delete"
                                    data-id="${budget.id}"
                                >
                                    ×
                                </button>

                            </div>

                        </div>

                    </div>
                `;
            })
            .join("");


    renderSummary();
}


async function loadData() {

    try {

        const [
            budgetResponse,
            transactionResponse
        ] = await Promise.all([
            api.getBudgets(),
            api.getTransactions()
        ]);


        budgets =
            Array.isArray(budgetResponse)
                ? budgetResponse
                : (
                    budgetResponse.budgets ||
                    budgetResponse.data ||
                    []
                );


        transactions =
            Array.isArray(transactionResponse)
                ? transactionResponse
                : (
                    transactionResponse.transactions ||
                    transactionResponse.data ||
                    []
                );


        renderBudgets();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to load budget data."
        );
    }
}


async function saveBudget(event) {

    event.preventDefault();


    const budget = {

        id:
            elements.id.value ||
            undefined,

        category:
            elements.category.value,

        amount:
            Number(elements.amount.value),

        month:
            elements.budgetMonth.value
    };


    if (
        !budget.amount ||
        budget.amount <= 0
    ) {

        showToast(
            "Budget must be greater than zero."
        );

        return;
    }


    try {

        if (editingId) {

            await api.updateBudget(
                budget
            );

            showToast(
                "Budget updated."
            );

        } else {

            await api.createBudget(
                budget
            );

            showToast(
                "Budget created."
            );
        }


        closeModal();

        await loadData();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to save budget."
        );
    }
}


async function deleteBudget(id) {

    const budget =
        budgets.find(
            item => item.id === id
        );

    if (!budget) return;


    const confirmed =
        window.confirm(
            `Delete ${budget.category} budget?`
        );


    if (!confirmed) return;


    try {

        await api.deleteBudget(id);

        showToast(
            "Budget deleted."
        );

        await loadData();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to delete budget."
        );
    }
}


/* Events */

elements.add.addEventListener(
    "click",
    () => openModal()
);


elements.close.addEventListener(
    "click",
    closeModal
);


elements.cancel.addEventListener(
    "click",
    closeModal
);


elements.overlay.addEventListener(
    "click",
    closeModal
);


elements.form.addEventListener(
    "submit",
    saveBudget
);


elements.month.addEventListener(
    "change",
    renderBudgets
);


elements.list.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        if (action === "edit") {

            const budget =
                budgets.find(
                    item => item.id === id
                );

            if (budget) {
                openModal(budget);
            }
        }


        if (action === "delete") {
            deleteBudget(id);
        }

    }
);


/* Initial */

elements.month.value =
    currentMonth();

elements.budgetMonth.value =
    currentMonth();

loadData();