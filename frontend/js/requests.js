// =====================================================
// SKILLSWAP CAMPUS
// REQUESTS PAGE
// =====================================================

const API_BASE =
    "http://127.0.0.1:5000/api";


// =====================================================
// GLOBAL
// =====================================================

let currentTab = "incoming";


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeRequestsPage();

    }
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeRequestsPage() {

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

    setupNotifications();

    setupTabs();


    await loadIncomingRequests();

}


// =====================================================
// GET TOKEN
// =====================================================

function getToken() {

    return localStorage.getItem(
        "token"
    );

}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

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

                    ...options,

                    headers: {

                        ...(options.headers || {}),

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        // =================================================
        // SESSION EXPIRED
        // =================================================

        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );


            alert(
                "Session expired. Please login again."
            );


            window.location.href =
                "login.html";


            return null;

        }


        // =================================================
        // JSON RESPONSE
        // =================================================

        const contentType =
            response.headers.get(
                "content-type"
            );


        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {

            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "API Error:",
                    data
                );

            }


            return data;

        }


        // =================================================
        // INVALID RESPONSE
        // =================================================

        const text =
            await response.text();


        console.error(
            "Invalid server response:",
            text
        );


        return {

            success: false,

            message:
                "Server returned an invalid response."

        };


    }
    catch (error) {

        console.error(
            "Server connection error:",
            error
        );


        return {

            success: false,

            message:
                "Server connection failed."

        };

    }

}


// =====================================================
// USER INFORMATION
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
            "User information error:",
            error
        );

    }

}


// =====================================================
// TABS
// =====================================================

function setupTabs() {

    const incomingBtn =
        document.getElementById(
            "incomingBtn"
        );


    const sentBtn =
        document.getElementById(
            "sentBtn"
        );


    if (incomingBtn) {

        incomingBtn.addEventListener(
            "click",
            function () {

                switchTab(
                    "incoming"
                );

            }
        );

    }


    if (sentBtn) {

        sentBtn.addEventListener(
            "click",
            function () {

                switchTab(
                    "sent"
                );

            }
        );

    }

}


// =====================================================
// SWITCH TAB
// =====================================================

async function switchTab(
    tab
) {

    currentTab =
        tab;


    const incomingBtn =
        document.getElementById(
            "incomingBtn"
        );


    const sentBtn =
        document.getElementById(
            "sentBtn"
        );


    if (incomingBtn) {

        incomingBtn.classList.toggle(
            "active",
            tab === "incoming"
        );

    }


    if (sentBtn) {

        sentBtn.classList.toggle(
            "active",
            tab === "sent"
        );

    }


    if (
        tab === "incoming"
    ) {

        await loadIncomingRequests();

    }
    else {

        await loadSentRequests();

    }

}


// =====================================================
// LOAD INCOMING REQUESTS
// =====================================================

async function loadIncomingRequests() {

    showLoading();


    const data =
        await apiRequest(
            "/exchange/incoming"
        );


    if (
        !data ||
        !data.success
    ) {

        showError(
            data?.message ||
            "Failed to load incoming requests."
        );


        return;

    }


    const requests =
        Array.isArray(data.data)
            ? data.data
            : [];


    renderIncomingRequests(
        requests
    );

}


// =====================================================
// LOAD SENT REQUESTS
// =====================================================

async function loadSentRequests() {

    showLoading();


    const data =
        await apiRequest(
            "/exchange/sent"
        );


    if (
        !data ||
        !data.success
    ) {

        showError(
            data?.message ||
            "Failed to load sent requests."
        );


        return;

    }


    const requests =
        Array.isArray(data.data)
            ? data.data
            : [];


    renderSentRequests(
        requests
    );

}


// =====================================================
// RENDER INCOMING
// =====================================================

function renderIncomingRequests(
    requests
) {

    const container =
        document.getElementById(
            "requestsContainer"
        );


    if (!container) return;


    if (
        requests.length === 0
    ) {

        showEmpty(
            "No Incoming Requests",
            "You don't have any exchange requests yet."
        );


        return;

    }


    container.innerHTML =
        requests
            .map(
                function (request) {

                    return createIncomingCard(
                        request
                    );

                }
            )
            .join("");

}


// =====================================================
// RENDER SENT
// =====================================================

function renderSentRequests(
    requests
) {

    const container =
        document.getElementById(
            "requestsContainer"
        );


    if (!container) return;


    if (
        requests.length === 0
    ) {

        showEmpty(
            "No Sent Requests",
            "You haven't sent any exchange requests yet."
        );


        return;

    }


    container.innerHTML =
        requests
            .map(
                function (request) {

                    return createSentCard(
                        request
                    );

                }
            )
            .join("");

}


// =====================================================
// INCOMING CARD
// =====================================================

function createIncomingCard(
    request
) {

    const name =
        request.name ||
        "User";


    const firstLetter =
        name
            .charAt(0)
            .toUpperCase();


    const status =
        request.status ||
        "Pending";


    let actions = "";


    // =================================================
    // PENDING
    // =================================================

    if (
        status === "Pending"
    ) {

        actions = `

            <div class="request-actions">

                <button
                    class="accept-btn"
                    onclick="acceptRequest(${request.id})"
                >

                    ✓ Accept

                </button>


                <button
                    class="reject-btn"
                    onclick="rejectRequest(${request.id})"
                >

                    ✕ Reject

                </button>

            </div>

        `;

    }


    // =================================================
    // ACCEPTED
    // =================================================

    else if (
        status === "Accepted"
    ) {

        actions = `

            <button
                class="complete-btn"
                onclick="completeExchange(${request.id})"
            >

                ✓ Complete Exchange

            </button>

        `;

    }


    // =================================================
    // COMPLETED
    // =================================================

    else if (
        status === "Completed"
    ) {

        actions = `

            <div class="request-completed-message">

                ✓ Exchange Completed Successfully

            </div>

        `;

    }


    return `

        <div class="request-card">


            <div class="request-card-header">


                <div class="request-user">


                    <div class="request-avatar">

                        ${escapeHTML(
                            firstLetter
                        )}

                    </div>


                    <div class="request-user-info">

                        <h3>

                            ${escapeHTML(
                                name
                            )}

                        </h3>

                        <span>

                            ${formatDate(
                                request.created_at
                            )}

                        </span>

                    </div>


                </div>


            </div>



            <div class="request-skills">


                <div class="request-skill-box">

                    <span class="skill-label">

                        Offers

                    </span>

                    <strong>

                        ${escapeHTML(
                            request.skill_offered ||
                            ""
                        )}

                    </strong>

                </div>


                <div class="request-exchange-icon">

                    ⇄

                </div>


                <div class="request-skill-box">

                    <span class="skill-label">

                        Wants

                    </span>

                    <strong>

                        ${escapeHTML(
                            request.skill_requested ||
                            ""
                        )}

                    </strong>

                </div>


            </div>



            <div class="request-status-row">


                <span class="request-status-label">

                    Request Status

                </span>


                <span
                    class="status-badge ${getStatusClass(
                        status
                    )}"
                >

                    ${escapeHTML(
                        status
                    )}

                </span>


            </div>


            ${actions}


        </div>

    `;

}


// =====================================================
// SENT CARD
// =====================================================

function createSentCard(
    request
) {

    const name =
        request.name ||
        "User";


    const firstLetter =
        name
            .charAt(0)
            .toUpperCase();


    const status =
        request.status ||
        "Pending";


    let actions = "";


    // =================================================
    // ACCEPTED
    // =================================================

    if (
        status === "Accepted"
    ) {

        actions = `

            <button
                class="complete-btn"
                onclick="completeExchange(${request.id})"
            >

                ✓ Complete Exchange

            </button>

        `;

    }


    // =================================================
    // COMPLETED
    // =================================================

    else if (
        status === "Completed"
    ) {

        actions = `

            <div class="request-completed-message">

                ✓ Exchange Completed Successfully

            </div>

        `;

    }


    return `

        <div class="request-card">


            <div class="request-card-header">


                <div class="request-user">


                    <div class="request-avatar">

                        ${escapeHTML(
                            firstLetter
                        )}

                    </div>


                    <div class="request-user-info">

                        <h3>

                            ${escapeHTML(
                                name
                            )}

                        </h3>

                        <span>

                            ${formatDate(
                                request.created_at
                            )}

                        </span>

                    </div>


                </div>


            </div>



            <div class="request-skills">


                <div class="request-skill-box">

                    <span class="skill-label">

                        You Offer

                    </span>

                    <strong>

                        ${escapeHTML(
                            request.skill_offered ||
                            ""
                        )}

                    </strong>

                </div>


                <div class="request-exchange-icon">

                    ⇄

                </div>


                <div class="request-skill-box">

                    <span class="skill-label">

                        You Requested

                    </span>

                    <strong>

                        ${escapeHTML(
                            request.skill_requested ||
                            ""
                        )}

                    </strong>

                </div>


            </div>



            <div class="request-status-row">


                <span class="request-status-label">

                    Request Status

                </span>


                <span
                    class="status-badge ${getStatusClass(
                        status
                    )}"
                >

                    ${escapeHTML(
                        status
                    )}

                </span>


            </div>


            ${actions}


        </div>

    `;

}


// =====================================================
// ACCEPT REQUEST
// =====================================================

async function acceptRequest(
    requestId
) {

    if (
        !confirm(
            "Are you sure you want to accept this request?"
        )
    ) {

        return;

    }


    const data =
        await apiRequest(
            `/exchange/accept/${requestId}`,
            {
                method: "PUT"
            }
        );


    if (
        data &&
        data.success
    ) {

        alert(
            "Exchange request accepted!"
        );


        await loadIncomingRequests();

    }
    else {

        alert(
            data?.message ||
            "Failed to accept request."
        );

    }

}


// =====================================================
// REJECT REQUEST
// =====================================================

async function rejectRequest(
    requestId
) {

    if (
        !confirm(
            "Are you sure you want to reject this request?"
        )
    ) {

        return;

    }


    const data =
        await apiRequest(
            `/exchange/reject/${requestId}`,
            {
                method: "PUT"
            }
        );


    if (
        data &&
        data.success
    ) {

        alert(
            "Exchange request rejected."
        );


        await loadIncomingRequests();

    }
    else {

        alert(
            data?.message ||
            "Failed to reject request."
        );

    }

}


// =====================================================
// COMPLETE EXCHANGE
// =====================================================

async function completeExchange(
    requestId
) {

    if (
        !confirm(
            "Are you sure this skill exchange has been completed?"
        )
    ) {

        return;

    }


    const data =
        await apiRequest(
            `/exchange/complete/${requestId}`,
            {
                method: "PUT"
            }
        );


    if (
        data &&
        data.success
    ) {

        alert(
            "Exchange completed successfully!"
        );


        if (
            currentTab ===
            "incoming"
        ) {

            await loadIncomingRequests();

        }
        else {

            await loadSentRequests();

        }

    }
    else {

        alert(
            data?.message ||
            "Failed to complete exchange."
        );

    }

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    const container =
        document.getElementById(
            "requestsContainer"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="requests-loading">

            Loading requests...

        </div>

    `;

}


// =====================================================
// EMPTY
// =====================================================

function showEmpty(
    title,
    message
) {

    const container =
        document.getElementById(
            "requestsContainer"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="requests-empty">

            <h3>

                ${escapeHTML(
                    title
                )}

            </h3>

            <p>

                ${escapeHTML(
                    message
                )}

            </p>

        </div>

    `;

}


// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    const container =
        document.getElementById(
            "requestsContainer"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="requests-empty">

            <h3>
                Something went wrong
            </h3>

            <p>

                ${escapeHTML(
                    message
                )}

            </p>

        </div>

    `;

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(
    status
) {

    switch (
        status
    ) {

        case "Pending":

            return "status-pending";


        case "Accepted":

            return "status-accepted";


        case "Rejected":

            return "status-rejected";


        case "Completed":

            return "status-completed";


        default:

            return "status-pending";

    }

}


// =====================================================
// FORMAT DATE
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
// NOTIFICATIONS
// =====================================================

function setupNotifications() {

    const button =
        document.getElementById(
            "notificationBtn"
        );


    const dropdown =
        document.getElementById(
            "notificationDropdown"
        );


    if (
        !button ||
        !dropdown
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            dropdown.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !dropdown.contains(
                    event.target
                ) &&
                event.target !== button
            ) {

                dropdown.classList.remove(
                    "show"
                );

            }

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


    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme ===
        "dark"
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


            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );


            localStorage.setItem(
                "theme",
                isDark
                    ? "dark"
                    : "light"
            );


            button.textContent =
                isDark
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