import { API_URL } from "./config.js";

async function request(action, options = {}) {
    const {
        method = "GET",
        body = null
    } = options;

    if (!API_URL) {
        throw new Error("API URL belum dikonfigurasi.");
    }

    const url = new URL(API_URL);
    url.searchParams.set("action", action);

    const requestOptions = {
        method,
        headers: {}
    };

    if (body !== null) {
        requestOptions.headers["Content-Type"] =
            "text/plain;charset=utf-8";

        requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
        url.toString(),
        requestOptions
    );

    if (!response.ok) {
        throw new Error(
            `API request gagal (${response.status})`
        );
    }

    const result = await response.json();

    if (result.success === false) {
    throw new Error(
        result.error?.message ||
        result.message ||
        "API mengembalikan error."
    );
}
    return result.data ?? result;
}

export const api = {

    getDashboard() {
        return request("dashboard");
    },

    getTransactions() {
        return request("transactions");
    },

    getBudgets() {
        return request("budgets");
    },

    getAnalytics() {
        return request("analytics");
    },

    
createTransaction(transaction, requestKey) {
    return request("transactions", {
        method: "POST",
        body: {
            action: "createTransaction",
            data: transaction,
            requestKey
        }
    });
},


    updateTransaction(transaction) {
    return request("transactions", {
        method: "POST",
        body: {
            action: "updateTransaction",
            id: transaction.id,
            data: transaction
        }
    });
},

    deleteTransaction(id) {
    return request("transactions", {
        method: "POST",
        body: {
            action: "deleteTransaction",
            id
        }
    });
},

    createBudget(budget) {
    return request("budgets", {
        method: "POST",
        body: {
            action: "createBudget",
            data: budget
        }
    });
},

    updateBudget(budget) {
    return request("budgets", {
        method: "POST",
        body: {
            action: "updateBudget",
            id: budget.id,
            data: budget
        }
    });
},

    deleteBudget(id) {
    return request("budgets", {
        method: "POST",
        body: {
            action: "deleteBudget",
            id
        }
    });
}
};