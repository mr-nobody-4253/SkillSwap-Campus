// =====================================================
// SKILLSWAP CAMPUS
// PROFILE.JS
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api";

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentProfile = null;
let deletePostId = null;

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", initializeProfile);

// =====================================================
// INITIALIZE PROFILE
// =====================================================

async function initializeProfile() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  setupLogout();
  setupTheme();
  setupProfileEdit();
  setupDeleteModal();

  // Load profile first.
  // This will also update the navbar with the latest name.
  await loadProfile();

  // Then load user's posts
  await loadMyPosts();
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
    // JSON RESPONSE
    // =================================================

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
      }

      return data;
    }

    // =================================================
    // INVALID RESPONSE
    // =================================================

    const text = await response.text();

    console.error("Invalid server response:", text);

    return {
      success: false,
      message: "Server returned an invalid response.",
    };
  } catch (error) {
    console.error("API Connection Error:", error);

    return {
      success: false,
      message: "Server connection failed.",
    };
  }
}

// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {
  const data = await apiRequest("/users/profile");

  if (!data || !data.success) {
    alert(data?.message || "Failed to load profile.");

    return;
  }

  currentProfile = data.data;

  // Display profile information
  displayProfile(currentProfile);

  // IMPORTANT:
  // Always use the database name here.
  // Do NOT depend only on the old JWT name.
  updateNavbarUser(currentProfile.name);
}

// =====================================================
// DISPLAY PROFILE
// =====================================================

function displayProfile(profile) {
  if (!profile) {
    return;
  }

  const name = profile.name || "User";

  const email = profile.email || "";

  const department = profile.department || "";

  const semester = profile.semester || "";

  const bio = profile.bio || "";

  // =================================================
  // PROFILE HEADER
  // =================================================

  setText("profileName", name);

  setText("profileEmail", email);

  // =================================================
  // PROFILE AVATAR
  // =================================================

  const profileAvatar = document.getElementById("profileAvatar");

  if (profileAvatar) {
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  }

  // =================================================
  // FORM VALUES
  // =================================================

  setValue("name", name);

  setValue("email", email);

  setValue("department", department);

  setValue("semester", semester);

  setValue("bio", bio);

  // Email must always remain disabled
  const emailInput = document.getElementById("email");

  if (emailInput) {
    emailInput.disabled = true;
  }
}

// =====================================================
// PROFILE EDIT SETUP
// =====================================================

function setupProfileEdit() {
  const editButton = document.getElementById("editProfileBtn");

  const cancelButton = document.getElementById("cancelProfileBtn");

  const form = document.getElementById("profileForm");

  // =================================================
  // EDIT BUTTON
  // =================================================

  if (editButton) {
    editButton.addEventListener("click", function () {
      enableProfileEditing();
    });
  }

  // =================================================
  // CANCEL BUTTON
  // =================================================

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      cancelProfileEditing();
    });
  }

  // =================================================
  // FORM SUBMIT
  // =================================================

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      await saveProfile();
    });
  }
}

// =====================================================
// ENABLE PROFILE EDITING
// =====================================================

function enableProfileEditing() {
  const editableFields = ["name", "department", "semester", "bio"];

  editableFields.forEach(function (id) {
    const field = document.getElementById(id);

    if (field) {
      field.disabled = false;
    }
  });

  // =================================================
  // EMAIL MUST REMAIN DISABLED
  // =================================================

  const email = document.getElementById("email");

  if (email) {
    email.disabled = true;
  }

  // =================================================
  // SHOW FORM ACTIONS
  // =================================================

  const actions = document.getElementById("profileFormActions");

  if (actions) {
    actions.style.display = "flex";
  }

  // =================================================
  // EDIT BUTTON
  // =================================================

  const editButton = document.getElementById("editProfileBtn");

  if (editButton) {
    editButton.textContent = "✏️ Editing Profile";

    editButton.disabled = true;
  }

  // =================================================
  // FOCUS NAME
  // =================================================

  const name = document.getElementById("name");

  if (name) {
    name.focus();
  }
}

// =====================================================
// CANCEL PROFILE EDITING
// =====================================================

function cancelProfileEditing() {
  if (currentProfile) {
    displayProfile(currentProfile);
  }

  disableProfileEditing();
}

// =====================================================
// DISABLE PROFILE EDITING
// =====================================================

function disableProfileEditing() {
  const fields = ["name", "department", "semester", "bio"];

  fields.forEach(function (id) {
    const field = document.getElementById(id);

    if (field) {
      field.disabled = true;
    }
  });

  // =================================================
  // EMAIL ALWAYS DISABLED
  // =================================================

  const email = document.getElementById("email");

  if (email) {
    email.disabled = true;
  }

  // =================================================
  // HIDE SAVE / CANCEL
  // =================================================

  const actions = document.getElementById("profileFormActions");

  if (actions) {
    actions.style.display = "none";
  }

  // =================================================
  // ENABLE EDIT BUTTON
  // =================================================

  const editButton = document.getElementById("editProfileBtn");

  if (editButton) {
    editButton.textContent = "✏️ Edit Profile";

    editButton.disabled = false;
  }
}

// =====================================================
// SAVE PROFILE
// =====================================================

async function saveProfile() {
  const name = getValue("name").trim();

  const department = getValue("department").trim();

  const semester = getValue("semester").trim();

  const bio = getValue("bio").trim();

  // =================================================
  // VALIDATION
  // =================================================

  if (!name) {
    alert("Name cannot be empty.");
    return;
  }

  if (!department) {
    alert("Department cannot be empty.");
    return;
  }

  if (!semester) {
    alert("Semester cannot be empty.");
    return;
  }

  // =================================================
  // SAVE BUTTON
  // =================================================

  const saveButton = document.querySelector(".save-profile-btn");

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
  }

  // =================================================
  // UPDATE PROFILE API
  // =================================================

  const data = await apiRequest("/users/profile", {
    method: "PUT",

    body: JSON.stringify({
      name: name,
      department: department,
      semester: semester,
      bio: bio,
    }),
  });

  // =================================================
  // SUCCESS
  // =================================================

  if (data && data.success) {
    // =================================================
    // SAVE NEW JWT
    // =================================================

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // =================================================
    // USE SERVER RESPONSE
    // =================================================

    if (data.user) {
      currentProfile = {
        ...currentProfile,
        ...data.user,
      };
    } else {
      currentProfile = {
        ...currentProfile,
        name: name,
        department: department,
        semester: semester,
        bio: bio,
      };
    }

    // =================================================
    // UPDATE PROFILE UI
    // =================================================

    displayProfile(currentProfile);

    // =================================================
    // UPDATE NAVBAR
    // =================================================

    updateNavbarUser(currentProfile.name);

    // =================================================
    // DISABLE EDIT MODE
    // =================================================

    disableProfileEditing();

    alert("Profile updated successfully!");
  } else {
    alert(data?.message || "Failed to update profile.");
  }

  // =================================================
  // RESTORE SAVE BUTTON
  // =================================================

  if (saveButton) {
    saveButton.disabled = false;
    saveButton.textContent = "💾 Save Changes";
  }
}

// =====================================================
// UPDATE NAVBAR USER
// =====================================================

function updateNavbarUser(name) {
  const safeName = name || "User";

  const username = document.getElementById("username");

  const avatar = document.getElementById("userAvatar");

  if (username) {
    username.textContent = safeName;
  }

  if (avatar) {
    avatar.textContent = safeName.charAt(0).toUpperCase();
  }
}

// =====================================================
// LOAD MY POSTS
// =====================================================

async function loadMyPosts() {
  const container = document.getElementById("myPostsContainer");

  if (!container) {
    return;
  }

  container.innerHTML = `
        <div class="posts-loading">
            Loading your posts...
        </div>
    `;

  const data = await apiRequest("/posts/my-posts");

  if (!data || !data.success) {
    container.innerHTML = `
            <div class="my-posts-empty">
                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(data?.message || "Failed to load your posts.")}
                </p>
            </div>
        `;

    return;
  }

  const posts = Array.isArray(data.data) ? data.data : [];

  // =================================================
  // UPDATE POST COUNT
  // =================================================

  setText("myPostCount", posts.length);

  // =================================================
  // NO POSTS
  // =================================================

  if (posts.length === 0) {
    container.innerHTML = `
            <div class="my-posts-empty">
                <div class="empty-icon">
                    📝
                </div>

                <h3>
                    No Posts Yet
                </h3>

                <p>
                    You haven't created any exchange posts yet.
                </p>
            </div>
        `;

    return;
  }

  // =================================================
  // RENDER POSTS
  // =================================================

  container.innerHTML = posts
    .map(function (post) {
      return createPostCard(post);
    })
    .join("");
}

// =====================================================
// CREATE POST CARD
// =====================================================

function createPostCard(post) {
  const offeredSkill = post.offered_skill || "";

  const wantedSkill = post.wanted_skill || "";

  const description = post.description || "";

  return `
        <div
            class="my-post-card"
            data-post-id="${post.id}"
        >

            <div class="my-post-card-header">

                <span class="my-post-date">
                    ${formatDate(post.created_at)}
                </span>

                <button
                    type="button"
                    class="delete-post-btn"
                    onclick="openDeleteModal(${post.id})"
                >
                    🗑️ Delete
                </button>

            </div>

            <div class="my-post-skills">

                <div class="my-post-skill-box">

                    <span class="my-post-skill-label">
                        You Offer
                    </span>

                    <strong>
                        ${escapeHTML(offeredSkill)}
                    </strong>

                </div>

                <div class="my-post-exchange-icon">
                    ⇄
                </div>

                <div class="my-post-skill-box">

                    <span class="my-post-skill-label">
                        You Want
                    </span>

                    <strong>
                        ${escapeHTML(wantedSkill)}
                    </strong>

                </div>

            </div>

            <div class="my-post-description">

                <p>
                    ${escapeHTML(description)}
                </p>

            </div>

        </div>
    `;
}

// =====================================================
// DELETE MODAL SETUP
// =====================================================

function setupDeleteModal() {
  const modal = document.getElementById("deleteModal");

  const cancelButton = document.getElementById("cancelDeleteBtn");

  const confirmButton = document.getElementById("confirmDeleteBtn");

  // =================================================
  // CANCEL
  // =================================================

  if (cancelButton) {
    cancelButton.addEventListener("click", closeDeleteModal);
  }

  // =================================================
  // CONFIRM
  // =================================================

  if (confirmButton) {
    confirmButton.addEventListener("click", confirmDeletePost);
  }

  // =================================================
  // CLICK OUTSIDE
  // =================================================

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeDeleteModal();
      }
    });
  }
}

// =====================================================
// OPEN DELETE MODAL
// =====================================================

function openDeleteModal(postId) {
  deletePostId = postId;

  const modal = document.getElementById("deleteModal");

  if (modal) {
    modal.style.display = "flex";
  }
}

// =====================================================
// CLOSE DELETE MODAL
// =====================================================

function closeDeleteModal() {
  deletePostId = null;

  const modal = document.getElementById("deleteModal");

  if (modal) {
    modal.style.display = "none";
  }
}

// =====================================================
// CONFIRM DELETE POST
// =====================================================

async function confirmDeletePost() {
  if (!deletePostId) {
    return;
  }

  const postId = deletePostId;

  const confirmButton = document.getElementById("confirmDeleteBtn");

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = "Deleting...";
  }

  const data = await apiRequest(`/posts/${postId}`, {
    method: "DELETE",
  });

  // =================================================
  // SUCCESS
  // =================================================

  if (data && data.success) {
    closeDeleteModal();

    alert("Post deleted successfully!");

    await loadMyPosts();
  } else {
    alert(data?.message || "Failed to delete post.");
  }

  // =================================================
  // RESTORE BUTTON
  // =================================================

  if (confirmButton) {
    confirmButton.disabled = false;
    confirmButton.textContent = "Delete Post";
  }
}

// =====================================================
// THEME
// =====================================================

function setupTheme() {
  const button = document.getElementById("themeToggle");

  if (!button) {
    return;
  }

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

  if (!button) {
    return;
  }

  button.addEventListener("click", function () {
    localStorage.removeItem("token");

    window.location.href = "login.html";
  });
}

// =====================================================
// FORMAT DATE
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
// SET TEXT
// =====================================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// =====================================================
// SET VALUE
// =====================================================

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value ?? "";
  }
}

// =====================================================
// GET VALUE
// =====================================================

function getValue(id) {
  const element = document.getElementById(id);

  if (!element) {
    return "";
  }

  return element.value;
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
