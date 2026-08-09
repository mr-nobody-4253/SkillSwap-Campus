// =====================================================
// SKILLSWAP CAMPUS
// MESSAGES.JS
// =====================================================

// =====================================================
// API BASE URL
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api";

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allChats = [];
let selectedUser = null;

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    initializeMessages();
});

// =====================================================
// INITIALIZE
// =====================================================

async function initializeMessages() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    loadUserInfo();

    setupLogout();

    setupTheme();

    setupNotifications();

    setupMessageInput();

    await loadChats();
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

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return null;
    }

    try {

        const response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,

                headers: {
                    ...(options.headers || {}),

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },
            }
        );

        // =============================================
        // UNAUTHORIZED
        // =============================================

        if (response.status === 401) {

            localStorage.removeItem("token");

            alert(
                "Session expired. Please login again."
            );

            window.location.href = "login.html";

            return null;
        }

        // =============================================
        // SERVER RESPONSE
        // =============================================

        const data =
            await response.json();

        return data;

    } catch (error) {

        console.error(
            "API Error:",
            error
        );

        return {
            success: false,
            message:
                "Server connection failed.",
        };
    }
}

// =====================================================
// USER INFO
// =====================================================

function loadUserInfo() {

    const token = getToken();

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
            payload.name || "User";

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

    } catch (error) {

        console.error(
            "User info error:",
            error
        );
    }
}

// =====================================================
// LOAD ALL CHATS
// =====================================================

async function loadChats() {

    const container =
        document.getElementById(
            "chatList"
        );

    if (!container) return;

    container.innerHTML = `
        <div class="chat-loading">
            Loading chats...
        </div>
    `;

    const data =
        await apiRequest(
            "/messages/all"
        );

    if (!data || !data.success) {

        container.innerHTML = `
            <div class="chat-loading">
                Failed to load chats.
            </div>
        `;

        console.error(
            "Chats API error:",
            data
        );

        return;
    }

    // =============================================
    // SAVE CHATS
    // =============================================

    allChats =
        data.data || [];

    // =============================================
    // RENDER CHATS
    // =============================================

    renderChats(allChats);
}

// =====================================================
// RENDER CHAT LIST
// =====================================================

function renderChats(chats) {

    const container =
        document.getElementById(
            "chatList"
        );

    if (!container) return;

    // =================================================
    // NO CHATS
    // =================================================

    if (chats.length === 0) {

        container.innerHTML = `
            <div class="chat-loading">

                <div class="empty-chat-icon">
                    💬
                </div>

                <p>
                    No conversations yet.
                </p>

                <small>
                    Start an exchange and
                    send a message.
                </small>

            </div>
        `;

        return;
    }

    // =================================================
    // CHAT ITEMS
    // =================================================

    container.innerHTML = chats
        .map(function (chat) {

            // =========================================
            // AVATAR INITIAL
            // =========================================

            const initial =
                chat.name
                    ? chat.name
                        .charAt(0)
                        .toUpperCase()
                    : "U";

            // =========================================
            // ACTIVE CHAT
            // =========================================

            const active =
                selectedUser &&
                Number(selectedUser.id) ===
                Number(chat.id)
                    ? "active"
                    : "";

            // =========================================
            // UNREAD COUNT
            // =========================================

            const unreadCount =
                Number(
                    chat.unread_count || 0
                );

            // =========================================
            // UNREAD BADGE
            // =========================================

            const unreadBadge =
                unreadCount > 0
                    ? `
                        <span class="unread-badge">
                            ${unreadCount}
                        </span>
                    `
                    : "";

            // =========================================
            // LAST MESSAGE
            // =========================================

            let lastMessage =
                chat.last_message;

            if (
                !lastMessage ||
                String(lastMessage).trim() === ""
            ) {

                lastMessage =
                    "No messages yet";
            }

            // =========================================
            // TRUNCATE LONG MESSAGE
            // =========================================

            if (
                String(lastMessage).length > 35
            ) {

                lastMessage =
                    String(lastMessage)
                        .substring(0, 35)
                    + "...";
            }

            // =========================================
            // RETURN CHAT ITEM
            // =========================================

            return `
                <div
                    class="chat-item ${active}"
                    data-user-id="${chat.id}"
                >

                    <div
                        class="chat-item-avatar"
                    >
                        ${escapeHTML(initial)}
                    </div>

                    <div
                        class="chat-item-info"
                    >

                        <h3>
                            ${escapeHTML(
                                chat.name ||
                                "User"
                            )}
                        </h3>

                        <p class="last-message-preview">
                            ${escapeHTML(
                                lastMessage
                            )}
                        </p>

                    </div>

                    ${unreadBadge}

                </div>
            `;
        })
        .join("");

    // =================================================
    // CHAT CLICK EVENTS
    // =================================================

    const chatItems =
        container.querySelectorAll(
            ".chat-item"
        );

    chatItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const userId =
                        this.dataset.userId;

                    openChat(userId);
                }
            );
        }
    );
}

// =====================================================
// OPEN CHAT
// =====================================================

async function openChat(userId) {

    // =================================================
    // FIND SELECTED USER
    // =================================================

    selectedUser =
        allChats.find(
            function (chat) {

                return (
                    Number(chat.id) ===
                    Number(userId)
                );
            }
        );

    if (!selectedUser) {

        console.error(
            "Selected user not found:",
            userId
        );

        return;
    }

    // =================================================
    // SHOW ACTIVE CHAT
    // =================================================

    const emptyChat =
        document.getElementById(
            "emptyChat"
        );

    const activeChat =
        document.getElementById(
            "activeChat"
        );

    if (emptyChat) {
        emptyChat.style.display =
            "none";
    }

    if (activeChat) {
        activeChat.style.display =
            "flex";
    }

    // =================================================
    // UPDATE CHAT HEADER
    // =================================================

    const name =
        selectedUser.name ||
        "User";

    const email =
        selectedUser.email ||
        "";

    const nameElement =
        document.getElementById(
            "chatUserName"
        );

    const emailElement =
        document.getElementById(
            "chatUserEmail"
        );

    const avatar =
        document.getElementById(
            "chatAvatar"
        );

    if (nameElement) {
        nameElement.textContent =
            name;
    }

    if (emailElement) {
        emailElement.textContent =
            email;
    }

    if (avatar) {
        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }

    // =================================================
    // HIGHLIGHT SELECTED CHAT
    // =================================================

    renderChats(allChats);

    // =================================================
    // LOAD CONVERSATION
    // =================================================

    await loadConversation(
        selectedUser.id
    );

    // =================================================
    // MARK UNREAD MESSAGES AS READ
    // =================================================

    await markMessagesAsRead(
        selectedUser.id
    );

    // =================================================
    // RELOAD CHAT LIST
    // Removes unread badge
    // =================================================

    await loadChats();
}

// =====================================================
// LOAD CONVERSATION
// =====================================================

async function loadConversation(userId) {

    const container =
        document.getElementById(
            "messagesContainer"
        );

    if (!container) return;

    container.innerHTML = `
        <div class="chat-loading">
            Loading messages...
        </div>
    `;

    const data =
        await apiRequest(
            `/messages/conversation/${userId}`
        );

    if (!data || !data.success) {

        container.innerHTML = `
            <div class="chat-loading">
                Failed to load messages.
            </div>
        `;

        console.error(
            "Conversation API error:",
            data
        );

        return;
    }

    const messages =
        data.data || [];

    renderMessages(messages);
}

// =====================================================
// MARK MESSAGES AS READ
// =====================================================

async function markMessagesAsRead(userId) {

    if (!userId) {
        return false;
    }

    const data =
        await apiRequest(
            `/messages/read/${userId}`,
            {
                method: "PUT",
            }
        );

    if (!data || !data.success) {

        console.error(
            "Mark messages as read error:",
            data
        );

        return false;
    }

    console.log(
        "Messages marked as read:",
        data.updated
    );

    return true;
}

// =====================================================
// RENDER MESSAGES
// =====================================================

function renderMessages(messages) {

    const container =
        document.getElementById(
            "messagesContainer"
        );

    if (!container) return;

    // =================================================
    // NO MESSAGES
    // =================================================

    if (messages.length === 0) {

        container.innerHTML = `
            <div class="no-messages">

                <div class="empty-chat-icon">
                    👋
                </div>

                <h3>
                    No messages yet
                </h3>

                <p>
                    Start the conversation!
                </p>

            </div>
        `;

        return;
    }

    // =================================================
    // CURRENT USER
    // =================================================

    const currentUserId =
        getCurrentUserId();

    // =================================================
    // RENDER
    // =================================================

    container.innerHTML =
        messages
            .map(
                function (message) {

                    const isMine =
                        Number(
                            message.sender_id
                        ) ===
                        Number(
                            currentUserId
                        );

                    return `
                        <div
                            class="message-row ${
                                isMine
                                    ? "sent"
                                    : "received"
                            }"
                        >

                            <div
                                class="message-bubble"
                            >

                                <p>
                                    ${escapeHTML(
                                        message.message
                                    )}
                                </p>

                                <span>
                                    ${formatTime(
                                        message.sent_at
                                    )}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");

    // =================================================
    // SCROLL TO BOTTOM
    // =================================================

    container.scrollTop =
        container.scrollHeight;
}

// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    // =================================================
    // CHECK SELECTED USER
    // =================================================

    if (!selectedUser) {

        alert(
            "Please select a conversation first."
        );

        return;
    }

    // =================================================
    // GET INPUT
    // =================================================

    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) return;

    const message =
        input.value.trim();

    // =================================================
    // EMPTY MESSAGE
    // =================================================

    if (!message) {
        return;
    }

    // =================================================
    // SEND BUTTON
    // =================================================

    const button =
        document.getElementById(
            "sendMessageBtn"
        );

    if (button) {
        button.disabled = true;
    }

    try {

        // =============================================
        // API
        // =============================================

        const data =
            await apiRequest(
                "/messages/send",
                {
                    method: "POST",

                    body: JSON.stringify({
                        receiver_id:
                            selectedUser.id,

                        message:
                            message,
                    }),
                }
            );

        // =============================================
        // SUCCESS
        // =============================================

        if (
            data &&
            data.success
        ) {

            input.value = "";

            // =========================================
            // RELOAD CONVERSATION
            // =========================================

            await loadConversation(
                selectedUser.id
            );

            // =========================================
            // RELOAD CHAT LIST
            // This updates:
            // - last message
            // - unread count
            // - latest chat position
            // =========================================

            await loadChats();
        }

        // =============================================
        // ERROR
        // =============================================

        else {

            console.error(
                "Send message error:",
                data
            );

            alert(
                data?.message ||
                "Failed to send message."
            );
        }

    } catch (error) {

        console.error(
            "Send message exception:",
            error
        );

        alert(
            "Failed to send message."
        );

    } finally {

        // =============================================
        // ENABLE BUTTON
        // =============================================

        if (button) {
            button.disabled = false;
        }

        input.focus();
    }
}

// =====================================================
// MESSAGE INPUT
// =====================================================

function setupMessageInput() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const button =
        document.getElementById(
            "sendMessageBtn"
        );

    // =================================================
    // SEND BUTTON
    // =================================================

    if (button) {

        button.addEventListener(
            "click",
            sendMessage
        );
    }

    // =================================================
    // ENTER KEY
    // =================================================

    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }
}

// =====================================================
// CURRENT USER ID
// =====================================================

function getCurrentUserId() {

    const token =
        getToken();

    if (!token) {
        return null;
    }

    try {

        const payload =
            JSON.parse(
                atob(
                    token
                        .split(".")[1]
                        .replace(
                            /-/g,
                            "+"
                        )
                        .replace(
                            /_/g,
                            "/"
                        )
                )
            );

        return Number(
            payload.id
        );

    } catch (error) {

        console.error(
            "Current user ID error:",
            error
        );

        return null;
    }
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

    // =================================================
    // LOAD SAVED THEME
    // =================================================

    if (saved === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

        button.textContent =
            "☀️";

    } else {

        button.textContent =
            "🌙";
    }

    // =================================================
    // TOGGLE THEME
    // =================================================

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

    if (!button || !dropdown) {
        return;
    }

    // =================================================
    // OPEN / CLOSE
    // =================================================

    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            dropdown.classList.toggle(
                "show"
            );
        }
    );

    // =================================================
    // CLOSE WHEN CLICK OUTSIDE
    // =================================================

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
// FORMAT TIME
// =====================================================

function formatTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

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