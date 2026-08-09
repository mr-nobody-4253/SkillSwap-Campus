// =====================================================
// SKILLSWAP CAMPUS
// NOTIFICATIONS.JS
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api";

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", initializeNotifications);

// =====================================================
// INITIALIZE
// =====================================================

async function initializeNotifications() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";

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

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";

    return null;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,

      headers: {
        ...(options.headers || {}),

        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },
    });

    // =================================================
    // SESSION EXPIRED
    // =================================================

    if (response.status === 401) {
      localStorage.removeItem("token");

      alert("Session expired. Please login again.");

      window.location.href = "login.html";

      return null;
    }

    // =================================================
    // RESPONSE
    // =================================================

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
      }

      return data;
    }

    console.error("Invalid server response.");

    return {
      success: false,

      message: "Invalid server response.",
    };
  } catch (error) {
    console.error("Notification API Error:", error);

    return {
      success: false,

      message: "Server connection failed.",
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
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    const name = payload.name || "User";

    const username = document.getElementById("username");

    const avatar = document.getElementById("userAvatar");

    if (username) {
      username.textContent = name;
    }

    if (avatar) {
      avatar.textContent = name.charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("User info error:", error);
  }
}

// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {
  const container = document.getElementById("notificationsContainer");

  if (!container) return;

  container.innerHTML = `

        <div class="notification-loading">

            Loading notifications...

        </div>

    `;

  const data = await apiRequest("/notifications");

  if (!data || !data.success) {
    showNotificationError(data?.message || "Failed to load notifications.");

    return;
  }

  const notifications = Array.isArray(data.data) ? data.data : [];

  updateStats(notifications);

  renderNotifications(notifications);
}

// =====================================================
// RENDER NOTIFICATIONS
// =====================================================

function renderNotifications(notifications) {
  const container = document.getElementById("notificationsContainer");

  if (!container) return;

  if (notifications.length === 0) {
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

  container.innerHTML = notifications
    .map(function (notification) {
      return createNotificationCard(notification);
    })
    .join("");

  setupNotificationRead();
}

// =====================================================
// CREATE NOTIFICATION CARD
// =====================================================

function createNotificationCard(notification) {
  const id = notification.id;

  const type = getNotificationType(notification.type, notification.title);

  const icon = getNotificationIcon(notification.type, type);

  const title = notification.title || "Notification";

  const message = notification.message || "";

  const isRead = notification.is_read === 1 || notification.is_read === true;

  const unreadClass = isRead ? "" : "unread";

  return `

        <div
            class="notification-card ${unreadClass}"
            data-id="${id}"
        >

            <div
                class="notification-icon ${type}"
            >

                ${escapeHTML(icon)}

            </div>


            <div
                class="notification-content"
            >

                <h3>

                    ${escapeHTML(title)}

                </h3>


                <p>

                    ${escapeHTML(message)}

                </p>


                <span
                    class="notification-time"
                >

                    ${formatDate(notification.created_at)}

                </span>

            </div>


            ${
              !isRead
                ? `
                        <div
                            class="unread-dot"
                            title="Unread"
                        ></div>
                    `
                : ""
            }

        </div>

    `;
}

// =====================================================
// NOTIFICATION TYPE
// =====================================================

function getNotificationType(type, title) {
  const value = String(type || title || "").toLowerCase();

  if (value.includes("accept")) {
    return "accepted";
  }

  if (value.includes("reject")) {
    return "rejected";
  }

  if (value.includes("complete")) {
    return "completed";
  }

  if (value.includes("message")) {
    return "message";
  }

  return "request";
}

// =====================================================
// NOTIFICATION ICON
// =====================================================

function getNotificationIcon(type, notificationType) {
  if (notificationType === "accepted") {
    return "✅";
  }

  if (notificationType === "rejected") {
    return "❌";
  }

  if (notificationType === "completed") {
    return "🎉";
  }

  if (notificationType === "message") {
    return "💬";
  }

  return "🔔";
}

// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(notifications) {
  const total = notifications.length;

  const unread = notifications.filter(function (notification) {
    return notification.is_read === 0 || notification.is_read === false;
  }).length;

  const accepted = notifications.filter(function (notification) {
    const type = String(
      notification.type || notification.title || "",
    ).toLowerCase();

    return type.includes("accept");
  }).length;

  setText("totalNotifications", total);

  setText("unreadNotifications", unread);

  setText("acceptedNotifications", accepted);
}

// =====================================================
// CLICK NOTIFICATION = MARK AS READ
// =====================================================

function setupNotificationRead() {
  const cards = document.querySelectorAll(".notification-card");

  cards.forEach(function (card) {
    card.addEventListener("click", async function () {
      const id = this.dataset.id;

      if (!id) return;

      const wasUnread = this.classList.contains("unread");

      if (!wasUnread) {
        return;
      }

      const data = await apiRequest(`/notifications/read/${id}`, {
        method: "PUT",
      });

      if (data && data.success) {
        this.classList.remove("unread");

        const dot = this.querySelector(".unread-dot");

        if (dot) {
          dot.remove();
        }

        updateUnreadCount();
      }
    });
  });
}

// =====================================================
// UPDATE UNREAD COUNT
// =====================================================

function updateUnreadCount() {
  const unread = document.querySelectorAll(".notification-card.unread").length;

  setText("unreadNotifications", unread);
}

// =====================================================
// MARK ALL AS READ
// =====================================================

function setupMarkAllRead() {
  const button = document.getElementById("markAllReadBtn");

  if (!button) return;

  button.addEventListener("click", async function () {
    const unread = document.querySelectorAll(".notification-card.unread");

    if (unread.length === 0) {
      return;
    }

    const originalText = button.textContent;

    button.disabled = true;

    button.textContent = "Marking...";

    const data = await apiRequest("/notifications/read-all", {
      method: "PUT",
    });

    if (data && data.success) {
      unread.forEach(function (card) {
        card.classList.remove("unread");

        const dot = card.querySelector(".unread-dot");

        if (dot) {
          dot.remove();
        }
      });

      setText("unreadNotifications", 0);
    } else {
      alert(data?.message || "Failed to mark all notifications as read.");
    }

    button.disabled = false;

    button.textContent = originalText;
  });
}

// =====================================================
// SEARCH
// =====================================================

function setupSearch() {
  const input = document.getElementById("notificationSearch");

  if (!input) return;

  input.addEventListener("input", function () {
    const keyword = this.value.trim().toLowerCase();

    const cards = document.querySelectorAll(".notification-card");

    cards.forEach(function (card) {
      const text = card.textContent.toLowerCase();

      card.style.display = text.includes(keyword) ? "flex" : "none";
    });
  });
}

// =====================================================
// THEME
// =====================================================

function setupTheme() {
  const button = document.getElementById("themeToggle");

  if (!button) return;

  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");

    button.textContent = "☀️";
  }

  button.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    button.textContent = isDark ? "☀️" : "🌙";
  });
}

// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {
  const button = document.getElementById("logoutBtn");

  if (!button) return;

  button.addEventListener("click", function () {
    localStorage.removeItem("token");

    window.location.href = "login.html";
  });
}

// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",

    month: "short",

    day: "numeric",
  });
}

// =====================================================
// ERROR
// =====================================================

function showNotificationError(message) {
  const container = document.getElementById("notificationsContainer");

  if (!container) return;

  container.innerHTML = `

        <div class="notification-empty">

            <div class="empty-icon">
                ⚠️
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;
}

// =====================================================
// SET TEXT
// =====================================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}
