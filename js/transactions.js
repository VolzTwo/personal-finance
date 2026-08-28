import { api } from "./api.js";
import {
    formatRupiah,
    formatDate,
    escapeHTML
} from "./utils.js";

let transactions = [];
let editingId = null;

const elements = {
    tableBody:
        document.getElementById("transactionTableBody"),

    empty:
        document.getElementById("transactionEmpty"),

    count:
        document.getElementById("transactionCount"),

    search:
        document.getElementById("searchInput"),

    typeFilter:
        document.getElementById("typeFilter"),

    categoryFilter:
        document.getElementById("categoryFilter"),

    sortFilter:
        document.getElementById("sortFilter"),

    addButton:
        document.getElementById("addTransactionButton"),

    modal:
        document.getElementById("transactionModal"),

    overlay:
        document.getElementById("modalOverlay"),

    closeModal:
        document.getElementById("closeModal"),

    cancel:
        document.getElementById("cancelButton"),

    form:
        document.getElementById("transactionForm"),

    modalTitle:
        document.getElementById("modalTitle"),

    id:
        document.getElementById("transactionId"),

    type:
        document.getElementById("transactionType"),

    amount:
        document.getElementById("amount"),

    category:
        document.getElementById("category"),

    description:
        document.getElementById("description"),

    date:
        document.getElementById("date")
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


function getToday() {

    const date = new Date();

    const offset =
        date.getTimezoneOffset();

    const localDate =
        new Date(
            date.getTime() -
            offset * 60 * 1000
        );

    return localDate
        .toISOString()
        .split("T")[0];
}


function openModal(transaction = null) {

    editingId =
        transaction?.id || null;

    elements.form.reset();

    if (transaction) {

        elements.modalTitle.textContent =
            "Edit Transaction";

        elements.id.value =
            transaction.id || "";

        elements.type.value =
            transaction.type || "expense";

        elements.amount.value =
            transaction.amount || "";

        elements.category.value =
            transaction.category || "";

        elements.description.value =
            transaction.description || "";

        elements.date.value =
            transaction.date || getToday();

        updateTypeButtons(
            transaction.type || "expense"
        );

    } else {

        elements.modalTitle.textContent =
            "Add Transaction";

        elements.type.value =
            "expense";

        elements.date.value =
            getToday();

        updateTypeButtons("expense");
    }

    elements.modal.classList.remove("hidden");
}


function closeModal() {

    elements.modal.classList.add("hidden");

    editingId = null;
}


function updateTypeButtons(type) {

    document
        .querySelectorAll(".type-option")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.type === type
            );

        });
}


function getFilteredTransactions() {

    let result = [...transactions];

    const search =
        elements.search.value
            .trim()
            .toLowerCase();

    const type =
        elements.typeFilter.value;

    const category =
        elements.categoryFilter.value;

    const sort =
        elements.sortFilter.value;


    if (search) {

        result = result.filter(transaction => {

            const text = [
                transaction.description,
                transaction.category,
                transaction.type
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }


    if (type !== "all") {

        result = result.filter(
            transaction =>
                transaction.type === type
        );
    }


    if (category !== "all") {

        result = result.filter(
            transaction =>
                transaction.category === category
        );
    }


    result.sort((a, b) => {

        if (sort === "newest") {
            return new Date(b.date) -
                new Date(a.date);
        }

        if (sort === "oldest") {
            return new Date(a.date) -
                new Date(b.date);
        }

        if (sort === "highest") {
            return Number(b.amount) -
                Number(a.amount);
        }

        if (sort === "lowest") {
            return Number(a.amount) -
                Number(b.amount);
        }

        return 0;
    });


    return result;
}


function renderTransactions() {

    const result =
        getFilteredTransactions();

    elements.count.textContent =
        `${result.length} transaction${
            result.length === 1 ? "" : "s"
        }`;


    if (!result.length) {

        elements.tableBody.innerHTML = "";

        elements.empty.style.display =
            "grid";

        return;
    }


    elements.empty.style.display =
        "none";


    elements.tableBody.innerHTML =
        result.map(transaction => {

            const isIncome =
                transaction.type === "income";

            const sign =
                isIncome ? "+" : "-";

            return `
                <tr>

                    <td>
                        <div class="transaction-description">
                            ${escapeHTML(
                                transaction.description ||
                                "Transaction"
                            )}
                        </div>
                    </td>

                    <td>
                        <span class="transaction-category">
                            ${escapeHTML(
                                transaction.category ||
                                "Other"
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="transaction-date">
                            ${formatDate(
                                transaction.date
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="${
                            isIncome
                                ? "amount-income"
                                : "amount-expense"
                        }">
                            ${sign}${formatRupiah(
                                transaction.amount
                            )}
                        </span>
                    </td>

                    <td>

                        <div class="row-actions">

                            <button
                                class="row-action"
                                data-action="edit"
                                data-id="${transaction.id}"
                                title="Edit"
                            >
                                ✎
                            </button>

                            <button
                                class="row-action"
                                data-action="delete"
                                data-id="${transaction.id}"
                                title="Delete"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        }).join("");
}


function updateCategoryFilter() {

    const categories =
        [...new Set(
            transactions
                .map(item => item.category)
                .filter(Boolean)
        )]
        .sort();


    elements.categoryFilter.innerHTML = `
        <option value="all">
            All categories
        </option>

        ${categories.map(category => `
            <option value="${escapeHTML(category)}">
                ${escapeHTML(category)}
            </option>
        `).join("")}
    `;
}


async function loadTransactions() {

    try {

        const response =
            await api.getTransactions();

        transactions =
            Array.isArray(response)
                ? response
                : (
                    response.transactions ||
                    response.data ||
                    []
                );

        updateCategoryFilter();

        renderTransactions();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to load transactions."
        );

        transactions = [];

        renderTransactions();
    }
}


async function saveTransaction(event) {

    event.preventDefault();


    const transaction = {

        id:
            elements.id.value ||
            undefined,

        type:
            elements.type.value,

        amount:
            Number(elements.amount.value),

        category:
            elements.category.value,

        description:
            elements.description.value.trim(),

        date:
            elements.date.value
    };


    if (
        !transaction.amount ||
        transaction.amount <= 0
    ) {
        showToast(
            "Amount must be greater than zero."
        );

        return;
    }


    try {

        if (editingId) {

            await api.updateTransaction(
                transaction
            );

            showToast(
                "Transaction updated."
            );

        } else {

            await api.createTransaction(
                transaction
            );

            showToast(
                "Transaction added."
            );
        }


        closeModal();

        await loadTransactions();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to save transaction."
        );
    }
}


async function deleteTransaction(id) {

    const transaction =
        transactions.find(
            item => item.id === id
        );

    if (!transaction) return;


    const confirmed =
        window.confirm(
            `Delete "${transaction.description || "this transaction"}"?`
        );


    if (!confirmed) return;


    try {

        await api.deleteTransaction(id);

        showToast(
            "Transaction deleted."
        );

        await loadTransactions();

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to delete transaction."
        );
    }
}


document
    .querySelectorAll(".type-option")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.type;

                elements.type.value =
                    type;

                updateTypeButtons(type);
            }
        );
    });


elements.addButton
    .addEventListener(
        "click",
        () => openModal()
    );


elements.closeModal
    .addEventListener(
        "click",
        closeModal
    );


elements.cancel
    .addEventListener(
        "click",
        closeModal
    );


elements.overlay
    .addEventListener(
        "click",
        closeModal
    );


elements.form
    .addEventListener(
        "submit",
        saveTransaction
    );


elements.search
    .addEventListener(
        "input",
        renderTransactions
    );


elements.typeFilter
    .addEventListener(
        "change",
        renderTransactions
    );


elements.categoryFilter
    .addEventListener(
        "change",
        renderTransactions
    );


elements.sortFilter
    .addEventListener(
        "change",
        renderTransactions
    );


elements.tableBody
    .addEventListener(
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

                const transaction =
                    transactions.find(
                        item => item.id === id
                    );

                if (transaction) {
                    openModal(transaction);
                }
            }


            if (action === "delete") {
                deleteTransaction(id);
            }
        }
    );


loadTransactions();