const STORAGE_KEY = "personal_finance_settings";

const DEFAULT_SETTINGS = {
    theme: "system",
    currency: "IDR"
};

function loadThemeSettings() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY);

        return saved
            ? {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(saved)
            }
            : {
                ...DEFAULT_SETTINGS
            };

    } catch {
        return {
            ...DEFAULT_SETTINGS
        };
    }
}

function applyTheme(theme) {

    if (theme === "system") {

        const isDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        document.documentElement.dataset.theme =
            isDark ? "dark" : "light";

        return;
    }

    document.documentElement.dataset.theme =
        theme;
}

function initializeTheme() {

    const settings =
        loadThemeSettings();

    applyTheme(
        settings.theme
    );
}

initializeTheme();