// =====================================================
// SKILLSWAP CAMPUS
// DASHBOARD.JS
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api";

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allPosts = [];
let mySkills = [];
let selectedPost = null;
let dashboardNotifications = [];

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

async function initializeDashboard() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  await loadUserInfo();

  setupLogout();
  setupTheme();
  setupNotifications();
  setupSearch();
  setupModals();

  await loadMySkills();
  await loadPosts();
  await loadStats();

  await loadDashboardNotifications();
}

// =====================================================
// GET TOKEN
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
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    // -------------------------------------------------
    // UNAUTHORIZED
    // -------------------------------------------------

    if (response.status === 401) {
      localStorage.removeItem("token");

      alert("Session expired. Please login again.");

      window.location.href = "login.html";

      return null;
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    console.error("Invalid server response:", text);

    return {
      success: false,
      message: "Server returned an invalid response.",
    };
  } catch (error) {
    console.error("API Request Error:", error);

    return {
      success: false,
      message: "Server connection failed.",
    };
  }
}

// =====================================================
// LOAD CURRENT USER INFORMATION
// =====================================================

async function loadUserInfo() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/users/profile`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 401) {
      localStorage.removeItem("token");

      window.location.href = "login.html";

      return;
    }

    const data = await response.json();

    if (!data || !data.success || !data.data) {
      console.error(
        "Failed to load current user profile:",
        data,
      );

      return;
    }

    const user = data.data;

    const name = user.name || "User";

    // -------------------------------------------------
    // TOP BAR USERNAME
    // -------------------------------------------------

    const username =
      document.getElementById("username");

    if (username) {
      username.textContent = name;
    }

    // -------------------------------------------------
    // WELCOME NAME
    // -------------------------------------------------

    const welcomeName =
      document.getElementById("welcomeName");

    if (welcomeName) {
      welcomeName.textContent = name;
    }

    // -------------------------------------------------
    // AVATAR
    // -------------------------------------------------

    const avatar =
      document.getElementById("userAvatar");

    if (avatar) {
      avatar.textContent =
        name.charAt(0).toUpperCase();
    }

    console.log(
      "Current user loaded:",
      user,
    );
  } catch (error) {
    console.error(
      "Load user profile error:",
      error,
    );
  }
}

// =====================================================
// CURRENT USER ID
// =====================================================

function getCurrentUserId() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/"),
      ),
    );

    return Number(payload.id);
  } catch (error) {
    console.error(
      "Token decoding error:",
      error,
    );

    return null;
  }
}

// =====================================================
// LOAD MY SKILLS
// =====================================================

async function loadMySkills() {
  const data =
    await apiRequest(
      "/skills/my-skills",
    );

  if (!data || !data.success) {
    console.error(
      "Failed to load my skills:",
      data,
    );

    mySkills = [];

    return;
  }

  mySkills = data.data || [];

  console.log(
    "My skills:",
    mySkills,
  );

  populateOfferedSkillDropdown();
}

// =====================================================
// GET SKILL NAME
// =====================================================

function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill;
  }

  return (
    skill.skill_name ||
    skill.name ||
    skill.skill ||
    skill.title ||
    ""
  );
}

// =====================================================
// CREATE POST SKILL DROPDOWN
// =====================================================

function populateOfferedSkillDropdown() {
  const select =
    document.getElementById(
      "postOfferedSkill",
    );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      Select a skill
    </option>
  `;

  if (mySkills.length === 0) {
    select.innerHTML = `
      <option value="">
        No skills added. Add skills first.
      </option>
    `;

    return;
  }

  mySkills.forEach((skill) => {
    const name =
      getSkillName(skill);

    if (!name) {
      return;
    }

    const option =
      document.createElement(
        "option",
      );

    option.value = name;

    option.textContent = name;

    select.appendChild(
      option,
    );
  });
}

// =====================================================
// LOAD EXCHANGE POSTS
// =====================================================

async function loadPosts() {
  const container =
    document.getElementById(
      "exchangePostsContainer",
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="exchange-loading">
      Loading exchange posts...
    </div>
  `;

  const data =
    await apiRequest(
      "/exchange/posts",
    );

  if (!data || !data.success) {
    console.error(
      "Posts API Error:",
      data,
    );

    container.innerHTML = `
      <div class="exchange-loading">

        <h3>
          Failed to load exchange posts
        </h3>

        <p>
          ${escapeHTML(
            data?.message ||
              "Please try again.",
          )}
        </p>

      </div>
    `;

    return;
  }

  allPosts =
    data.data || [];

  renderPosts(
    allPosts,
  );
}

// =====================================================
// RENDER POSTS
// =====================================================

function renderPosts(posts) {
  const container =
    document.getElementById(
      "exchangePostsContainer",
    );

  if (!container) {
    return;
  }

  if (
    !posts ||
    posts.length === 0
  ) {
    container.innerHTML = `
      <div class="exchange-loading">

        <h3>
          No exchange posts found
        </h3>

        <p>
          Try another skill or create your own post.
        </p>

      </div>
    `;

    return;
  }

  const currentUserId =
    getCurrentUserId();

  container.innerHTML =
    posts
      .map((post) => {
        const isOwnPost =
          Number(post.user_id) ===
          Number(currentUserId);

        const userName =
          post.name || "User";

        const avatar =
          userName
            .charAt(0)
            .toUpperCase();

        return `
          <div class="exchange-post-card">

            <div class="post-header">

              <div class="post-user">

                <div class="post-avatar">
                  ${escapeHTML(avatar)}
                </div>

                <div class="post-user-info">

                  <h3>
                    ${escapeHTML(userName)}
                  </h3>

                  <span>
                    ${formatDate(
                      post.created_at,
                    )}
                  </span>

                </div>

              </div>

            </div>

            <div class="post-content">

              <div class="skill-exchange">

                <div class="skill-box offered">

                  <span class="skill-label">
                    CAN TEACH
                  </span>

                  <strong>
                    ${escapeHTML(
                      post.offered_skill,
                    )}
                  </strong>

                </div>

                <div class="exchange-arrow">
                  ⇄
                </div>

                <div class="skill-box wanted">

                  <span class="skill-label">
                    WANTS TO LEARN
                  </span>

                  <strong>
                    ${escapeHTML(
                      post.wanted_skill,
                    )}
                  </strong>

                </div>

              </div>

              ${
                post.description
                  ? `
                    <p class="post-description">
                      ${escapeHTML(
                        post.description,
                      )}
                    </p>
                  `
                  : ""
              }

            </div>

            <div class="post-actions">

              ${
                isOwnPost
                  ? `
                    <span class="own-post-label">
                      Your Post
                    </span>
                  `
                  : `
                    <button
                      class="request-btn"
                      type="button"
                      data-post-id="${post.id}"
                    >
                      🔄 Request Exchange
                    </button>
                  `
              }

            </div>

          </div>
        `;
      })
      .join("");

  // -------------------------------------------------
  // REQUEST BUTTONS
  // -------------------------------------------------

  container
    .querySelectorAll(
      ".request-btn",
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const postId =
            button.dataset.postId;

          openRequestModal(
            postId,
          );
        },
      );
    });
}

// =====================================================
// SEARCH SETUP
// =====================================================

function setupSearch() {
  const navbarSearch =
    document.getElementById(
      "navbarSkillSearch",
    );

  const skillSearch =
    document.getElementById(
      "skillSearchInput",
    );

  if (navbarSearch) {
    navbarSearch.addEventListener(
      "input",
      () => {
        const keyword =
          navbarSearch.value
            .trim()
            .toLowerCase();

        if (skillSearch) {
          skillSearch.value =
            navbarSearch.value;
        }

        filterPosts(
          keyword,
        );
      },
    );
  }

  if (skillSearch) {
    skillSearch.addEventListener(
      "input",
      () => {
        filterPosts(
          skillSearch.value
            .trim()
            .toLowerCase(),
        );
      },
    );

    skillSearch.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          filterPosts(
            skillSearch.value
              .trim()
              .toLowerCase(),
          );
        }
      },
    );
  }
}

// =====================================================
// FILTER POSTS
// =====================================================

function filterPosts(keyword) {
  if (!keyword) {
    renderPosts(
      allPosts,
    );

    return;
  }

  const filtered =
    allPosts.filter(
      (post) => {
        const offered =
          String(
            post.offered_skill ||
              "",
          ).toLowerCase();

        const wanted =
          String(
            post.wanted_skill ||
              "",
          ).toLowerCase();

        return (
          offered.includes(
            keyword,
          ) ||
          wanted.includes(
            keyword,
          )
        );
      },
    );

  renderPosts(
    filtered,
  );
}

// =====================================================
// SEARCH POSTS
// =====================================================

function searchPosts() {
  const skillSearch =
    document.getElementById(
      "skillSearchInput",
    );

  const navbarSearch =
    document.getElementById(
      "navbarSkillSearch",
    );

  const keyword = skillSearch
    ? skillSearch.value
        .trim()
        .toLowerCase()
    : "";

  if (
    navbarSearch &&
    skillSearch
  ) {
    navbarSearch.value =
      skillSearch.value;
  }

  filterPosts(
    keyword,
  );
}

// =====================================================
// SHOW ALL POSTS
// =====================================================

function showAllPosts() {
  const skillSearch =
    document.getElementById(
      "skillSearchInput",
    );

  const navbarSearch =
    document.getElementById(
      "navbarSkillSearch",
    );

  if (skillSearch) {
    skillSearch.value = "";
  }

  if (navbarSearch) {
    navbarSearch.value = "";
  }

  renderPosts(
    allPosts,
  );
}

// =====================================================
// MODAL SETUP
// =====================================================

function setupModals() {
  const createModal =
    document.getElementById(
      "createPostModal",
    );

  const requestModal =
    document.getElementById(
      "requestModal",
    );

  if (createModal) {
    createModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          createModal
        ) {
          closeCreatePostModal();
        }
      },
    );
  }

  if (requestModal) {
    requestModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          requestModal
        ) {
          closeRequestModal();
        }
      },
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      closeCreatePostModal();
      closeRequestModal();
    },
  );
}

// =====================================================
// OPEN CREATE POST MODAL
// =====================================================

function openCreatePostModal() {
  const modal =
    document.getElementById(
      "createPostModal",
    );

  if (!modal) {
    return;
  }

  populateOfferedSkillDropdown();

  const offered =
    document.getElementById(
      "postOfferedSkill",
    );

  const wanted =
    document.getElementById(
      "postWantedSkill",
    );

  const description =
    document.getElementById(
      "postDescription",
    );

  if (offered) {
    offered.value = "";
  }

  if (wanted) {
    wanted.value = "";
  }

  if (description) {
    description.value = "";
  }

  modal.style.display = "flex";

  modal.classList.add(
    "show",
  );
}

// =====================================================
// CLOSE CREATE POST MODAL
// =====================================================

function closeCreatePostModal() {
  const modal =
    document.getElementById(
      "createPostModal",
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "show",
  );

  modal.style.display =
    "none";
}

// =====================================================
// CREATE EXCHANGE POST
// =====================================================

async function createExchangePost() {
  const offeredElement =
    document.getElementById(
      "postOfferedSkill",
    );

  const wantedElement =
    document.getElementById(
      "postWantedSkill",
    );

  const descriptionElement =
    document.getElementById(
      "postDescription",
    );

  if (
    !offeredElement ||
    !wantedElement ||
    !descriptionElement
  ) {
    alert(
      "Post form could not be loaded correctly.",
    );

    return;
  }

  const offeredSkill =
    offeredElement.value.trim();

  const wantedSkill =
    wantedElement.value.trim();

  const description =
    descriptionElement.value.trim();

  if (!offeredSkill) {
    alert(
      "Please select the skill you can teach.",
    );

    return;
  }

  if (!wantedSkill) {
    alert(
      "Please enter the skill you want to learn.",
    );

    return;
  }

  const button =
    document.querySelector(
      "#createPostModal .modal-submit-btn",
    );

  if (button) {
    button.disabled = true;

    button.textContent =
      "Creating...";
  }

  const data =
    await apiRequest(
      "/exchange/posts",
      {
        method: "POST",

        body: JSON.stringify({
          offered_skill:
            offeredSkill,

          wanted_skill:
            wantedSkill,

          description:
            description,
        }),
      },
    );

  if (
    data &&
    data.success
  ) {
    alert(
      "Exchange post created successfully!",
    );

    closeCreatePostModal();

    await loadPosts();

    await loadStats();
  } else {
    alert(
      data?.message ||
        "Failed to create exchange post.",
    );
  }

  if (button) {
    button.disabled = false;

    button.textContent =
      "Create Post";
  }
}

// =====================================================
// OPEN REQUEST MODAL
// =====================================================

function openRequestModal(postId) {
  selectedPost =
    allPosts.find(
      (post) =>
        Number(post.id) ===
        Number(postId),
    );

  if (!selectedPost) {
    alert(
      "Exchange post not found.",
    );

    return;
  }

  const currentUserId =
    getCurrentUserId();

  if (
    Number(
      selectedPost.user_id,
    ) ===
    Number(currentUserId)
  ) {
    alert(
      "You cannot send a request to your own post.",
    );

    return;
  }

  const info =
    document.getElementById(
      "requestPostInfo",
    );

  if (info) {
    info.innerHTML = `
      You are requesting an exchange with

      <strong>
        ${escapeHTML(
          selectedPost.name ||
            "User",
        )}
      </strong>

      <br><br>

      They can teach:

      <strong>
        ${escapeHTML(
          selectedPost.offered_skill,
        )}
      </strong>

      <br>

      They want to learn:

      <strong>
        ${escapeHTML(
          selectedPost.wanted_skill,
        )}
      </strong>
    `;
  }

  populateRequestSkills();

  const modal =
    document.getElementById(
      "requestModal",
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "flex";

  modal.classList.add(
    "show",
  );
}

// =====================================================
// CLOSE REQUEST MODAL
// =====================================================

function closeRequestModal() {
  const modal =
    document.getElementById(
      "requestModal",
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "show",
  );

  modal.style.display =
    "none";

  selectedPost = null;
}

// =====================================================
// REQUEST SKILLS DROPDOWN
// =====================================================

function populateRequestSkills() {
  const select =
    document.getElementById(
      "requestSkillSelect",
    );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      Select your skill
    </option>
  `;

  if (
    mySkills.length === 0
  ) {
    select.innerHTML = `
      <option value="">
        No skills found. Add skills first.
      </option>
    `;

    return;
  }

  mySkills.forEach(
    (skill) => {
      const name =
        getSkillName(skill);

      if (!name) {
        return;
      }

      const option =
        document.createElement(
          "option",
        );

      option.value = name;

      option.textContent =
        name;

      select.appendChild(
        option,
      );
    },
  );
}

// =====================================================
// SEND EXCHANGE REQUEST
// =====================================================

async function sendExchangeRequest() {
  if (!selectedPost) {
    alert(
      "No exchange post selected.",
    );

    return;
  }

  const skillSelect =
    document.getElementById(
      "requestSkillSelect",
    );

  if (!skillSelect) {
    alert(
      "Skill selector not found.",
    );

    return;
  }

  const selectedSkill =
    skillSelect.value.trim();

  if (!selectedSkill) {
    alert(
      "Please select the skill you want to offer.",
    );

    return;
  }

  const button =
    document.querySelector(
      "#requestModal .modal-submit-btn",
    );

  if (button) {
    button.disabled = true;

    button.textContent =
      "Sending...";
  }

  const requestData = {
    post_id:
      Number(
        selectedPost.id,
      ),

    receiver_id:
      Number(
        selectedPost.user_id,
      ),

    skill_offered:
      selectedSkill,

    skill_requested:
      selectedPost.wanted_skill,
  };

  console.log(
    "Exchange Request:",
    requestData,
  );

  const data =
    await apiRequest(
      "/exchange/send",
      {
        method: "POST",

        body: JSON.stringify(
          requestData,
        ),
      },
    );

  if (
    data &&
    data.success
  ) {
    alert(
      "Exchange request sent successfully!",
    );

    closeRequestModal();

    await loadStats();
  } else {
    alert(
      data?.message ||
        "Failed to send exchange request.",
    );
  }

  if (button) {
    button.disabled = false;

    button.textContent =
      "Send Exchange Request";
  }
}

// =====================================================
// LOAD STATS
// =====================================================

async function loadStats() {
  const incoming =
    await apiRequest(
      "/exchange/incoming",
    );

  const sent =
    await apiRequest(
      "/exchange/sent",
    );

  const incomingData =
    incoming?.success
      ? incoming.data || []
      : [];

  const sentData =
    sent?.success
      ? sent.data || []
      : [];

  const incomingCount =
    incomingData.filter(
      (request) =>
        request.status ===
        "Pending",
    ).length;

  const sentCount =
    sentData.filter(
      (request) =>
        request.status ===
        "Pending",
    ).length;

  const acceptedCount =
    [
      ...incomingData,
      ...sentData,
    ].filter(
      (request) =>
        request.status ===
        "Accepted",
    ).length;

  const completedCount =
    [
      ...incomingData,
      ...sentData,
    ].filter(
      (request) =>
        request.status ===
        "Completed",
    ).length;

  setText(
    "incomingCount",
    incomingCount,
  );

  setText(
    "sentCount",
    sentCount,
  );

  setText(
    "acceptedCount",
    acceptedCount,
  );

  setText(
    "completedCount",
    completedCount,
  );
}

// =====================================================
// =====================================================
// NOTIFICATIONS
// =====================================================
// =====================================================

// =====================================================
// SETUP NOTIFICATION BUTTON
// =====================================================

function setupNotifications() {
  const button =
    document.getElementById(
      "notificationBtn",
    );

  const dropdown =
    document.getElementById(
      "notificationDropdown",
    );

  if (
    !button ||
    !dropdown
  ) {
    return;
  }

  // -------------------------------------------------
  // OPEN / CLOSE POPUP
  // -------------------------------------------------

  button.addEventListener(
    "click",
    async (event) => {
      event.stopPropagation();

      dropdown.classList.toggle(
        "show",
      );

      if (
        dropdown.classList.contains(
          "show",
        )
      ) {
        await loadDashboardNotifications();
      }
    },
  );

  // -------------------------------------------------
  // CLOSE OUTSIDE
  // -------------------------------------------------

  document.addEventListener(
    "click",
    (event) => {
      if (
        !dropdown.contains(
          event.target,
        ) &&
        event.target !== button
      ) {
        dropdown.classList.remove(
          "show",
        );
      }
    },
  );
}

// =====================================================
// LOAD DASHBOARD NOTIFICATIONS
// =====================================================

async function loadDashboardNotifications() {
  const container =
    document.getElementById(
      "notificationContainer",
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="notification-item">
      Loading notifications...
    </div>
  `;

  const data =
    await apiRequest(
      "/notifications",
    );

  if (
    !data ||
    !data.success
  ) {
    console.error(
      "Notification API Error:",
      data,
    );

    container.innerHTML = `
      <div class="notification-item">

        <p>
          Failed to load notifications.
        </p>

      </div>

      <div class="notification-popup-footer">

        <a
          href="notifications.html"
          class="view-all-notifications"
        >
          View All Notifications →
        </a>

      </div>
    `;

    return;
  }

  dashboardNotifications =
    data.data || [];

  // -------------------------------------------------
  // SORT LATEST FIRST
  // -------------------------------------------------

  dashboardNotifications.sort(
    (a, b) =>
      new Date(
        b.created_at,
      ) -
      new Date(
        a.created_at,
      ),
  );

  // -------------------------------------------------
  // ONLY LATEST 10
  // -------------------------------------------------

  const latestNotifications =
    dashboardNotifications.slice(
      0,
      10,
    );

  renderDashboardNotifications(
    latestNotifications,
  );
}

// =====================================================
// GET NOTIFICATION ICON
// =====================================================

function getNotificationIcon(
  notification,
) {
  const title =
    String(
      notification.title ||
        "",
    ).toLowerCase();

  if (
    title.includes(
      "new exchange",
    ) ||
    title.includes(
      "exchange request",
    ) ||
    title.includes(
      "request",
    )
  ) {
    return "🔄";
  }

  if (
    title.includes(
      "accepted",
    )
  ) {
    return "✅";
  }

  if (
    title.includes(
      "rejected",
    )
  ) {
    return "❌";
  }

  if (
    title.includes(
      "completed",
    )
  ) {
    return "🎉";
  }

  if (
    title.includes(
      "message",
    )
  ) {
    return "💬";
  }

  if (
    title.includes(
      "skill",
    )
  ) {
    return "💡";
  }

  return "🔔";
}

// =====================================================
// RENDER DASHBOARD NOTIFICATIONS
// =====================================================

function renderDashboardNotifications(
  notifications,
) {
  const container =
    document.getElementById(
      "notificationContainer",
    );

  if (!container) {
    return;
  }

  // -------------------------------------------------
  // EMPTY
  // -------------------------------------------------

  if (
    !notifications ||
    notifications.length === 0
  ) {
    container.innerHTML = `
      <div class="notification-item">

        <div class="notification-empty-icon">
          🔔
        </div>

        <div>
          <strong>
            No notifications
          </strong>

          <p>
            You're all caught up!
          </p>
        </div>

      </div>

      <div class="notification-popup-footer">

        <a
          href="notifications.html"
          class="view-all-notifications"
        >
          View All Notifications →
        </a>

      </div>
    `;

    return;
  }

  // -------------------------------------------------
  // NOTIFICATION ITEMS
  // -------------------------------------------------

  const notificationHTML =
    notifications
      .map(
        (notification) => {
          const icon =
            getNotificationIcon(
              notification,
            );

          const unread =
            !Boolean(
              notification.is_read,
            );

          return `
            <div
              class="
                dashboard-notification-item
                ${unread ? "unread" : "read"}
              "
              data-notification-id="${notification.id}"
            >

              <!-- ICON -->

              <div class="dashboard-notification-icon">
                ${icon}
              </div>

              <!-- CONTENT -->

              <div class="dashboard-notification-content">

                <div class="dashboard-notification-top">

                  <strong>
                    ${escapeHTML(
                      notification.title ||
                        "Notification",
                    )}
                  </strong>

                  ${
                    unread
                      ? `
                        <span
                          class="notification-unread-dot"
                        ></span>
                      `
                      : ""
                  }

                </div>

                <p>
                  ${escapeHTML(
                    notification.message ||
                      "",
                  )}
                </p>

                <span
                  class="dashboard-notification-time"
                >
                  ${formatNotificationTime(
                    notification.created_at,
                  )}
                </span>

              </div>

            </div>
          `;
        },
      )
      .join("");

  // -------------------------------------------------
  // ONLY ONE VIEW ALL BUTTON
  // -------------------------------------------------

  container.innerHTML =
    notificationHTML +
    `
      <div class="notification-popup-footer">

        <a
          href="notifications.html"
          class="view-all-notifications"
        >
          View All Notifications →
        </a>

      </div>
    `;

  // -------------------------------------------------
  // SINGLE NOTIFICATION CLICK
  // -------------------------------------------------

  container
    .querySelectorAll(
      ".dashboard-notification-item",
    )
    .forEach((item) => {
      item.addEventListener(
        "click",
        async () => {
          const notificationId =
            item.dataset
              .notificationId;

          if (!notificationId) {
            return;
          }

          const notification =
            dashboardNotifications.find(
              (n) =>
                Number(n.id) ===
                Number(
                  notificationId,
                ),
            );

          if (
            !notification ||
            Boolean(
              notification.is_read,
            )
          ) {
            return;
          }

          await markDashboardNotificationAsRead(
            notificationId,
          );
        },
      );
    });
}

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// =====================================================

async function markDashboardNotificationAsRead(
  notificationId,
) {
  const data =
    await apiRequest(
      `/notifications/read/${notificationId}`,
      {
        method: "PUT",
      },
    );

  if (
    !data ||
    !data.success
  ) {
    console.error(
      "Mark notification read error:",
      data,
    );

    return;
  }

  const notification =
    dashboardNotifications.find(
      (n) =>
        Number(n.id) ===
        Number(notificationId),
    );

  if (notification) {
    notification.is_read = 1;
  }

  // Re-render only latest 10
  const latest =
    dashboardNotifications
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b.created_at,
          ) -
          new Date(
            a.created_at,
          ),
      )
      .slice(
        0,
        10,
      );

  renderDashboardNotifications(
    latest,
  );
}

// =====================================================
// THEME
// =====================================================

function setupTheme() {
  const button =
    document.getElementById(
      "themeToggle",
    );

  if (!button) {
    return;
  }

  const savedTheme =
    localStorage.getItem(
      "theme",
    );

  if (
    savedTheme ===
    "dark"
  ) {
    document.body.classList.add(
      "dark-mode",
    );

    button.textContent =
      "☀️";
  }

  button.addEventListener(
    "click",
    () => {
      document.body.classList.toggle(
        "dark-mode",
      );

      const isDark =
        document.body.classList.contains(
          "dark-mode",
        );

      localStorage.setItem(
        "theme",
        isDark
          ? "dark"
          : "light",
      );

      button.textContent =
        isDark
          ? "☀️"
          : "🌙";
    },
  );
}

// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {
  const button =
    document.getElementById(
      "logoutBtn",
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {
      localStorage.removeItem(
        "token",
      );

      window.location.href =
        "login.html";
    },
  );
}

// =====================================================
// SET TEXT
// =====================================================

function setText(
  id,
  value,
) {
  const element =
    document.getElementById(
      id,
    );

  if (element) {
    element.textContent =
      value;
  }
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
  dateString,
) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      dateString,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

// =====================================================
// FORMAT NOTIFICATION TIME
// =====================================================

function formatNotificationTime(
  dateString,
) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      dateString,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const seconds =
    Math.floor(
      difference / 1000,
    );

  if (
    seconds < 60
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  if (
    minutes < 60
  ) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (
    hours < 24
  ) {
    return `${hours} hr ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  if (
    days < 7
  ) {
    return `${days} day${
      days > 1
        ? "s"
        : ""
    } ago`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
  value,
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
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}