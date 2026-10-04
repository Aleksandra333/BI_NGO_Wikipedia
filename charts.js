
/*
 * WYKRESY RAPORTU
 * Dane pochodzą z plików CSV używanych w wikipedia.ipynb.
 *
 * Wymagane pliki:
 *
 * data/
 * ├── 1-ogladalnosc_monthly.csv
 * ├── 2-nowe_artykuly_monthly.csv
 * ├── 4-aktywni_edytorzy_monthly.csv
 * └── 8-edycje_uzytkownikow_monthly.csv
 *
 * Jeżeli CSV są w katalogu głównym, zmień DATA_PATH na "".
 */


const DATA_PATH = "data/";


/* =========================================================
   PALETA STRONY
   ========================================================= */

const COLORS = {
    green: "#039600",
    blue: "#0063BF",
    red: "#900000",

    // Ciemniejsze warianty z palety AAA
    greenAAA: "#246342",
    blueAAA: "#0C57A8",
    redAAA: "#970302",

    // Dodatkowy kolor pomocniczy.
    // Używany tylko tam, gdzie potrzebujemy czwartego koloru.
    orange: "#C77C00",

    text: "#FFFFFF",
    muted: "#B8B8B8",
    grid: "rgba(255, 255, 255, 0.10)"
};


/* =========================================================
   GLOBALNY STYL CHART.JS
   ========================================================= */

Chart.defaults.font.family =
    "Georgia, 'Times New Roman', serif";

Chart.defaults.font.size = 12;

Chart.defaults.color = COLORS.text;

Chart.defaults.borderColor = COLORS.grid;


/* =========================================================
   FORMATOWANIE LICZB
   ========================================================= */

function formatNumber(value) {
    return new Intl.NumberFormat("pl-PL").format(value);
}


function formatMillions(value) {
    return `${Math.round(value / 1000000)} mln`;
}


function formatThousands(value) {
    return `${Math.round(value / 1000)} tys.`;
}


/* =========================================================
   FORMATOWANIE DAT
   ========================================================= */

function formatMonth(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("pl-PL", {
        month: "short",
        year: "numeric"
    }).format(date);
}


/* =========================================================
   CSV — PROSTY PARSER
   ========================================================= */

async function loadCSV(filename) {

    const response = await fetch(DATA_PATH + filename);

    if (!response.ok) {
        throw new Error(
            `Nie udało się wczytać pliku: ${filename}`
        );
    }

    const text = await response.text();

    const lines = text
        .trim()
        .split(/\r?\n/);

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCSVLine(lines[0]);

    return lines.slice(1).map(line => {

        const values = parseCSVLine(line);

        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });

        return row;
    });
}


/*
 * Obsługa przecinków wewnątrz wartości CSV.
 */
function parseCSVLine(line) {

    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {

        const char = line[i];

        if (char === '"') {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }

        } else if (
            char === "," &&
            !insideQuotes
        ) {
            result.push(current);
            current = "";

        } else {
            current += char;
        }
    }

    result.push(current);

    return result;
}


/* =========================================================
   POMOCNICZE
   ========================================================= */

function numberOrZero(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function parseDate(value) {

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}


/* =========================================================
   WSPÓLNE OPCJE
   ========================================================= */

function baseOptions() {

    return {

        responsive: true,

        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false
        },

        plugins: {

            legend: {
                display: true,

                position: "bottom",

                labels: {
                    color: COLORS.text,

                    usePointStyle: true,

                    pointStyle: "line",

                    padding: 20,

                    font: {
                        family:
                            "Georgia, 'Times New Roman', serif",

                        size: 12
                    }
                }
            },

            tooltip: {

                backgroundColor: "#111111",

                borderColor: "rgba(255,255,255,0.25)",

                borderWidth: 1,

                titleColor: COLORS.text,

                bodyColor: COLORS.text,

                padding: 12,

                displayColors: true
            }
        },

        scales: {

            x: {

                grid: {
                    color: "rgba(255,255,255,0.06)"
                },

                ticks: {
                    color: COLORS.muted,

                    maxRotation: 0,

                    autoSkip: true,

                    maxTicksLimit: 12
                }
            },

            y: {

                beginAtZero: true,

                grid: {
                    color: COLORS.grid
                },

                ticks: {
                    color: COLORS.muted
                }
            }
        }
    };
}


/* =========================================================
   1. NOWE ARTYKUŁY
   ========================================================= */

async function createNewArticlesChart() {

    const rows = await loadCSV(
        "2-nowe_artykuly_monthly.csv"
    );

    rows.forEach(row => {

        row.date = parseDate(row.month);

        row.value =
            numberOrZero(row["total.content"]);
    });


    rows.sort(
        (a, b) => a.date - b.date
    );


    const labels = rows.map(
        row => formatMonth(row.date)
    );

    const values = rows.map(
        row => row.value
    );


    const canvas =
        document.getElementById(
            "newArticlesChart"
        );


    new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Nowe artykuły",

                data: values,

                borderColor: COLORS.blue,

                backgroundColor: "transparent",

                borderWidth: 2.5,

                pointRadius: 0,

                pointHoverRadius: 5,

                pointHoverBackgroundColor:
                    COLORS.blue,

                pointHoverBorderColor:
                    COLORS.text,

                tension: 0.15
            }]
        },

        options: {

            ...baseOptions(),

            plugins: {

                ...baseOptions().plugins,

                tooltip: {

                    ...baseOptions().plugins.tooltip,

                    callbacks: {

                        label: context =>
                            ` Nowe artykuły: ${formatNumber(context.raw)}`
                    }
                }
            },

            scales: {

                ...baseOptions().scales,

                y: {

                    ...baseOptions().scales.y,

                    title: {

                        display: true,

                        text:
                            "Liczba nowych artykułów",

                        color: COLORS.muted
                    },

                    ticks: {

                        color: COLORS.muted,

                        callback: value =>
                            formatNumber(value)
                    }
                }
            }
        }
    });
}


/* =========================================================
   2. AKTYWNI EDYTORZY
   ========================================================= */

async function createActiveEditorsChart() {

    const rows = await loadCSV(
        "4-aktywni_edytorzy_monthly.csv"
    );


    rows.forEach(row => {

        row.date = parseDate(row.month);

        row.value =
            numberOrZero(row["total.total"]);
    });


    rows.sort(
        (a, b) => a.date - b.date
    );


    const labels = rows.map(
        row => formatMonth(row.date)
    );

    const values = rows.map(
        row => row.value
    );


    const canvas =
        document.getElementById(
            "activeEditorsChart"
        );


    const options = baseOptions();

    /*
     * W notebooku ten wykres miał:
     *
     * plt.grid(False)
     *
     * Dlatego tutaj również usuwamy poziomą siatkę.
     */

    options.scales.y.grid = {
        display: false
    };


    new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Aktywni edytorzy",

                data: values,

                borderColor: COLORS.blue,

                backgroundColor: "transparent",

                borderWidth: 2.5,

                pointRadius: 0,

                pointHoverRadius: 5,

                pointHoverBackgroundColor:
                    COLORS.blue,

                pointHoverBorderColor:
                    COLORS.text,

                tension: 0.15
            }]
        },

        options: {

            ...options,

            plugins: {

                ...options.plugins,

                tooltip: {

                    ...options.plugins.tooltip,

                    callbacks: {

                        label: context =>
                            ` Aktywni edytorzy: ${formatNumber(context.raw)}`
                    }
                }
            },

            scales: {

                ...options.scales,

                y: {

                    ...options.scales.y,

                    title: {

                        display: true,

                        text:
                            "Liczba aktywnych edytorów",

                        color: COLORS.muted
                    },

                    ticks: {

                        color: COLORS.muted,

                        callback: value =>
                            formatNumber(value)
                    }
                }
            }
        }
    });
}


/* =========================================================
   3. OGLĄDALNOŚĆ WEDŁUG PLATFORM
   ========================================================= */

async function createViewsPlatformChart() {

    let rows = await loadCSV(
        "1-ogladalnosc_monthly.csv"
    );


    /*
     * Dokładnie jak w notebooku:
     *
     * ogladalnosc[
     *     ogladalnosc['agent'] == 'user'
     * ]
     */

    rows = rows.filter(
        row => row.agent === "user"
    );


    rows.forEach(row => {

        row.date = parseDate(row.month);

        row.desktop =
            numberOrZero(
                row["total.desktop"]
            );

        row.mobileApp =
            numberOrZero(
                row["total.mobile-app"]
            );

        row.mobileWeb =
            numberOrZero(
                row["total.mobile-web"]
            );


        /*
         * Dokładnie jak:
         *
         * desktop + mobile-app + mobile-web
         */

        row.sum =
            row.desktop +
            row.mobileApp +
            row.mobileWeb;
    });


    rows.sort(
        (a, b) => a.date - b.date
    );


    const labels = rows.map(
        row => formatMonth(row.date)
    );


    const desktop = rows.map(
        row => row.desktop
    );

    const mobileApp = rows.map(
        row => row.mobileApp
    );

    const mobileWeb = rows.map(
        row => row.mobileWeb
    );

    const sum = rows.map(
        row => row.sum
    );


    const canvas =
        document.getElementById(
            "viewsPlatformChart"
        );


    new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [

                {
                    label:
                        "Przeglądarka na komputerze",

                    data: desktop,

                    borderColor: COLORS.red,

                    backgroundColor: "transparent",

                    borderWidth: 2,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                },

                {
                    label: "Aplikacja",

                    data: mobileApp,

                    borderColor: COLORS.green,

                    backgroundColor: "transparent",

                    borderWidth: 2,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                },

                {
                    label:
                        "Przeglądarka na telefonie",

                    data: mobileWeb,

                    borderColor: COLORS.orange,

                    backgroundColor: "transparent",

                    borderWidth: 2,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                },

                {
                    label: "Suma wyświetleń",

                    data: sum,

                    borderColor: COLORS.blue,

                    backgroundColor: "transparent",

                    borderWidth: 3,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                }
            ]
        },

        options: {

            ...baseOptions(),

            plugins: {

                ...baseOptions().plugins,

                tooltip: {

                    ...baseOptions().plugins.tooltip,

                    callbacks: {

                        label: context =>
                            ` ${context.dataset.label}: ${formatNumber(context.raw)}`
                    }
                }
            },

            scales: {

                ...baseOptions().scales,

                y: {

                    ...baseOptions().scales.y,

                    title: {

                        display: true,

                        text: "Liczba wyświetleń",

                        color: COLORS.muted
                    },

                    ticks: {

                        color: COLORS.muted,

                        callback: value =>
                            formatMillions(value)
                    }
                }
            }
        }
    });
}


/* =========================================================
   4. EDYCJE ARTYKUŁÓW PRZEZ UŻYTKOWNIKÓW
   ========================================================= */

async function createUserEditsChart() {

    let rows = await loadCSV(
        "8-edycje_uzytkownikow_monthly.csv"
    );


    /*
     * Notebook najpierw poprawia zapis daty:
     *
     * '--' → '-'
     * '-0' → '-'
     */

    rows = rows.map(row => {

        const cleanedDate =
            row.month
                .replace(/--/g, "-")
                .replace(/-0/g, "-");


        return {
            ...row,

            date:
                parseDate(cleanedDate),

            editorType:
                row.editor_type,

            content:
                numberOrZero(
                    row["total.content"]
                )
        };
    });


    /*
     * Tylko:
     *
     * anonymous
     * user
     */

    rows = rows.filter(
        row =>
            row.editorType === "anonymous" ||
            row.editorType === "user"
    );


    /*
     * Grupowanie po miesiącu.
     *
     * Odpowiada pivot_table(..., aggfunc='sum')
     * z notebooka.
     */

    const grouped = new Map();


    rows.forEach(row => {

        if (!row.date) {
            return;
        }


        const key =
            row.date.toISOString();


        if (!grouped.has(key)) {

            grouped.set(key, {
                date: row.date,

                anonymous: 0,

                user: 0
            });
        }


        const item =
            grouped.get(key);


        if (row.editorType === "anonymous") {

            item.anonymous += row.content;

        } else if (
            row.editorType === "user"
        ) {

            item.user += row.content;
        }
    });


    const data =
        Array.from(grouped.values());


    data.sort(
        (a, b) => a.date - b.date
    );


    /*
     * Odpowiednik:
     *
     * pivoted_edycje['Suma'] =
     *     pivoted_edycje['anonymous'] +
     *     pivoted_edycje['user']
     */

    data.forEach(row => {

        row.sum =
            row.anonymous +
            row.user;
    });


    const labels = data.map(
        row => formatMonth(row.date)
    );


    const anonymous = data.map(
        row => row.anonymous
    );

    const user = data.map(
        row => row.user
    );

    const sum = data.map(
        row => row.sum
    );


    const canvas =
        document.getElementById(
            "userEditsChart"
        );


    new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [

                {
                    label:
                        "Niezalogowani użytkownicy",

                    data: anonymous,

                    borderColor: COLORS.orange,

                    backgroundColor: "transparent",

                    borderWidth: 2,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                },

                {
                    label:
                        "Zalogowani użytkownicy",

                    data: user,

                    borderColor: COLORS.green,

                    backgroundColor: "transparent",

                    borderWidth: 2,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                },

                {
                    label: "Suma",

                    data: sum,

                    borderColor: COLORS.blue,

                    backgroundColor: "transparent",

                    borderWidth: 3,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    tension: 0.15
                }
            ]
        },

        options: {

            ...baseOptions(),

            plugins: {

                ...baseOptions().plugins,

                tooltip: {

                    ...baseOptions().plugins.tooltip,

                    callbacks: {

                        label: context =>
                            ` ${context.dataset.label}: ${formatNumber(context.raw)}`
                    }
                }
            },

            scales: {

                ...baseOptions().scales,

                y: {

                    ...baseOptions().scales.y,

                    title: {

                        display: true,

                        text: "Liczba edycji",

                        color: COLORS.muted
                    },

                    ticks: {

                        color: COLORS.muted,

                        callback: value =>
                            formatThousands(value)
                    }
                }
            }
        }
    });
}


/* =========================================================
   URUCHOMIENIE
   ========================================================= */

async function initializeCharts() {

    try {

        await Promise.all([

            createNewArticlesChart(),

            createActiveEditorsChart(),

            createViewsPlatformChart(),

            createUserEditsChart()
        ]);

        console.log(
            "Wykresy zostały załadowane."
        );

    } catch (error) {

        console.error(
            "Błąd podczas ładowania wykresów:",
            error
        );
    }
}


/*
 * Start po załadowaniu strony.
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeCharts
);

