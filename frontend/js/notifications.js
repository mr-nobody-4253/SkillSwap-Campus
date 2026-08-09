// =====================================================
// SKILLSWAP CAMPUS
// NOTIFICATIONS.JS
// =====================================================

const API_BASE =
    "http://127.0.0.1:5000/api";


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeNotifications
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeNotifications() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "login.html";

        return;

    }


    loadUserInfo();

    setupLogout();

    setupTheme();

    setupSearch();

    setupMarkAllRead();


    await loadNotifications();

}


// =====================================================
// TOKEN
// =====================================================

function getToken() {

    return localStorage.getItem("token");

}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(endpoint) {

    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return null;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {
                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }
                }
            );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return null;

        }


        const data =
            await response.json();


        return data;

    }
    catch (error) {

        console.error(
            "Notification API Error:",
            error
        );

        return null;

    }

}


// =====================================================
// USER INFO
// =====================================================

function loadUserInfo() {

    const token =
        getToken();


    if (!token) return;


    try {

        const payload =
            JSON.parse(
                atob(
                    token
                        .split(".")[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );


        const name =
            payload.name ||
            "User";


        const username =
            document.getElementById(
                "username"
            );


        const avatar =
            document.getElementById(
                "userAvatar"
            );


        if (username) {

            username.textContent =
                name;

        }


        if (avatar) {

            avatar.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }

    }
    catch (error) {

        console.error(
            "User info error:",
            error
        );

    }

}


// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="notification-loading">

            Loading notifications...

        </div>

    `;


    /*
        We use existing exchange requests
        as notification sources.
    */


    const incoming =
        await apiRequest(
            "/exchange/incoming"
        );


    const sent =
        await apiRequest(
            "/exchange/sent"
        );


    const incomingData =
        incoming?.success
            ? incoming.data || []
            : [];


    const sentData =
        sent?.success
            ? sent.data || []
            : [];


    const notifications = [];


    // =================================================
    // INCOMING REQUESTS
    // =================================================

    incomingData.forEach(
        function (request) {

            notifications.push({

                type:
                    getNotificationType(
                        request.status,
                        "incoming"
                    ),

                icon:
                    getNotificationIcon(
                        request.status,
                        "incoming"
                    ),

                title:
                    getNotificationTitle(
                        request.status,
                        "incoming"
                    ),

                message:
                    getIncomingMessage(
                        request
                    ),

                date:
                    request.created_at,

                status:
                    request.status

            });

        }
    );


    // =================================================
    // SENT REQUESTS
    // =================================================

    sentData.forEach(
        function (request) {

            notifications.push({

                type:
                    getNotificationType(
                        request.status,
                        "sent"
                    ),

                icon:
                    getNotificationIcon(
                        request.status,
                        "sent"
                    ),

                title:
                    getNotificationTitle(
                        request.status,
                        "sent"
                    ),

                message:
                    getSentMessage(
                        request
                    ),

                date:
                    request.created_at,

                status:
                    request.status

            });

        }
    );


    // newest first

    notifications.sort(
        function (a, b) {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        }
    );


    updateStats(
        notifications
    );


    renderNotifications(
        notifications
    );

}


// =====================================================
// NOTIFICATION TYPE
// =====================================================

function getNotificationType(
    status,
    direction
) {

    if (status === "Accepted") {

        return "accepted";

    }


    if (status === "Rejected") {

        return "rejected";

    }


    if (status === "Completed") {

        return "completed";

    }


    return "request";

}


// =====================================================
// ICON
// =====================================================

function getNotificationIcon(
    status,
    direction
) {

    if (status === "Accepted") {

        return "✅";

    }


    if (status === "Rejected") {

        return "❌";

    }


    if (status === "Completed") {

        return "🎉";

    }


    return direction === "incoming"
        ? "📩"
        : "📤";

}


// =====================================================
// TITLE
// =====================================================

function getNotificationTitle(
    status,
    direction
) {

    if (status === "Accepted") {

        return "Exchange Request Accepted";

    }


    if (status === "Rejected") {

        return "Exchange Request Rejected";

    }


    if (status === "Completed") {

        return "Exchange Completed";

    }


    if (direction === "incoming") {

        return "New Exchange Request";

    }


    return "Exchange Request Sent";

}


// =====================================================
// INCOMING MESSAGE
// =====================================================

function getIncomingMessage(
    request
) {

    const name =
        request.name ||
        "Someone";


    if (
        request.status ===
        "Accepted"
    ) {

        return `
            ${escapeHTML(name)}
            accepted your exchange request.
            They offered
            <strong>
                ${escapeHTML(
                    request.skill_offered
                )}
            </strong>.
        `;

    }


    if (
        request.status ===
        "Rejected"
    ) {

        return `
            ${escapeHTML(name)}
            rejected your exchange request.
        `;

    }


    if (
        request.status ===
        "Completed"
    ) {

        return `
            Your exchange with
            ${escapeHTML(name)}
            has been completed.
        `;

    }


    return `
        ${escapeHTML(name)}
        sent you an exchange request.
        They offer
        <strong>
            ${escapeHTML(
                request.skill_offered
            )}
        </strong>
        and want
        <strong>
            ${escapeHTML(
                request.skill_requested
            )}
        </strong>.
    `;

}


// =====================================================
// SENT MESSAGE
// =====================================================

function getSentMessage(
    request
) {

    const name =
        request.name ||
        "User";


    if (
        request.status ===
        "Accepted"
    ) {

        return `
            Your exchange request to
            ${escapeHTML(name)}
            was accepted.
        `;

    }


    if (
        request.status ===
        "Rejected"
    ) {

        return `
            Your exchange request to
            ${escapeHTML(name)}
            was rejected.
        `;

    }


    if (
        request.status ===
        "Completed"
    ) {

        return `
            Your exchange with
            ${escapeHTML(name)}
            has been completed successfully.
        `;

    }


    return `
        Your exchange request to
        ${escapeHTML(name)}
        is currently pending.
    `;

}


// =====================================================
// RENDER
// =====================================================

function renderNotifications(
    notifications
) {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) return;


    if (
        notifications.length ===
        0
    ) {

        container.innerHTML = `

            <div class="notification-empty">

                <div class="empty-icon">
                    🔔
                </div>

                <h3>
                    No Notifications
                </h3>

                <p>
                    You're all caught up!
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        notifications
            .map(
                function (
                    notification,
                    index
                ) {

                    return `

                        <div
                            class="notification-card unread"
                            data-index="${index}"
                        >

                            <div
                                class="notification-icon ${notification.type}"
                            >

                                ${notification.icon}

                            </div>


                            <div
                                class="notification-content"
                            >

                                <h3>

                                    ${notification.title}

                                </h3>


                                <p>

                                    ${notification.message}

                                </p>


                                <span
                                    class="notification-time"
                                >

                                    ${formatDate(
                                        notification.date
                                    )}

                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    setupNotificationRead();

}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(
    notifications
) {

    const total =
        notifications.length;


    const unread =
        notifications.length;


    const accepted =
        notifications.filter(
            function (notification) {

                return (
                    notification.status ===
                    "Accepted"
                );

            }
        ).length;


    setText(
        "totalNotifications",
        total
    );


    setText(
        "unreadNotifications",
        unread
    );


    setText(
        "acceptedNotifications",
        accepted
    );

}


// =====================================================
// CLICK NOTIFICATION = READ
// =====================================================

function setupNotificationRead() {

    const cards =
        document.querySelectorAll(
            ".notification-card"
        );


    cards.forEach(
        function (card) {

            card.addEventListener(
                "click",
                function () {

                    this.classList.remove(
                        "unread"
                    );

                    updateUnreadCount();

                }
            );

        }
    );

}


// =====================================================
// UNREAD COUNT
// =====================================================

function updateUnreadCount() {

    const unread =
        document.querySelectorAll(
            ".notification-card.unread"
        ).length;


    setText(
        "unreadNotifications",
        unread
    );

}


// =====================================================
// MARK ALL READ
// =====================================================

function setupMarkAllRead() {

    const button =
        document.getElementById(
            "markAllReadBtn"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        function () {

            document
                .querySelectorAll(
                    ".notification-card.unread"
                )
                .forEach(
                    function (card) {

                        card.classList.remove(
                            "unread"
                        );

                    }
                );


            setText(
                "unreadNotifications",
                0
            );

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const input =
        document.getElementById(
            "notificationSearch"
        );


    if (!input) return;


    input.addEventListener(
        "input",
        function () {

            const keyword =
                this.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".notification-card"
                )
                .forEach(
                    function (card) {

                        const text =
                            card.textContent
                                .toLowerCase();


                        card.style.display =
                            text.includes(
                                keyword
                            )
                                ? "flex"
                                : "none";

                    }
                );

        }
    );

}


// =====================================================
// THEME
// =====================================================

function setupTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) return;


    const saved =
        localStorage.getItem(
            "theme"
        );


    if (
        saved === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

        button.textContent =
            "☀️";

    }


    button.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-mode"
            );


            const dark =
                document.body.classList.contains(
                    "dark-mode"
                );


            localStorage.setItem(
                "theme",
                dark
                    ? "dark"
                    : "light"
            );


            button.textContent =
                dark
                    ? "☀️"
                    : "🌙";

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "token"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =====================================================
// DATE
// =====================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}