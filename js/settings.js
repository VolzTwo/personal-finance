const STORAGE_KEY = "personal_finance_settings";

const DEFAULT_SETTINGS = {
    theme: "system",
    currency: "IDR"
};


const elements = {

    theme:
        document.getElementById("themeSelect"),

    currency:
        document.getElementById("currencySelect"),

    exportButton:
        document.getElementById("exportButton"),

    importInput:
        document.getElementById("importInput")
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


function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

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


function saveSettings(settings) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
    );
}


function applyTheme(theme) {

    let resolvedTheme = theme;


    if (theme === "system") {

        resolvedTheme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";
    }


    document.documentElement
        .dataset.theme =
        resolvedTheme;
}


function initialize() {

    const settings =
        loadSettings();


    elements.theme.value =
        settings.theme;

    elements.currency.value =
        settings.currency;


    applyTheme(
        settings.theme
    );
}


elements.theme.addEventListener(
    "change",
    () => {

        const settings =
            loadSettings();

        settings.theme =
            elements.theme.value;

        saveSettings(settings);

        applyTheme(
            settings.theme
        );

        showToast(
            "Theme updated."
        );
    }
);


elements.currency.addEventListener(
    "change",
    () => {

        const settings =
            loadSettings();

        settings.currency =
            elements.currency.value;

        saveSettings(settings);

        showToast(
            "Currency updated."
        );
    }
);


/* Export */

elements.exportButton.addEventListener(
    "click",
    () => {

        const settings =
            loadSettings();


        const exportData = {

            exportedAt:
                new Date().toISOString(),

            version:
                "1.0.0",

            settings

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportData,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `personal-finance-backup-${
                new Date()
                    .toISOString()
                    .slice(0, 10)
            }.json`;

        link.click();


        URL.revokeObjectURL(url);


        showToast(
            "Backup exported."
        );
    }
);


/* Import */

elements.importInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;


        const reader =
            new FileReader();


        reader.onload = () => {

            try {

                const data =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !data ||
                    typeof data !== "object"
                ) {
                    throw new Error(
                        "Invalid backup"
                    );
                }


                if (data.settings) {

                    const settings = {
                        ...DEFAULT_SETTINGS,
                        ...data.settings
                    };

                    saveSettings(
                        settings
                    );

                    initialize();

                    showToast(
                        "Settings imported."
                    );

                } else {

                    showToast(
                        "Backup contains no settings."
                    );
                }

            } catch (error) {

                console.error(error);

                showToast(
                    "Invalid backup file."
                );
            }
        };


        reader.readAsText(file);

        event.target.value = "";
    }
);


initialize();