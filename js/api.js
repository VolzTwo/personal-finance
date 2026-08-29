const API = {
  async get(endpoint = "") {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  }
};