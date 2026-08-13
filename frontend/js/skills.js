// =====================================================
// SKILLSWAP CAMPUS
// SKILLS.JS
// =====================================================

// =====================================================
// API BASE
// =====================================================

const API_BASE = "http://127.0.0.1:5000/api";

// =====================================================
// GLOBAL
// =====================================================

let skills = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeSkillsPage
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeSkillsPage() {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return;
    }


    setupLogout();

    setupTheme();

    setupSkillModal();

    await loadUserInfo();

    await loadSkills();
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

async function apiRequest(
    endpoint,
    options = {}
) {

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
                        `Bearer ${token}`
                }
            }
        );


        // =================================================
        // SESSION EXPIRED
        // =================================================

        if (response.status === 401) {

            localStorage.removeItem("token");

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


        return {

            success: false,

            message:
                "Server returned an invalid response."
        };

    } catch (error) {

        console.error(
            "API Connection Error:",
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
// LOAD USER INFO
// =====================================================

async function loadUserInfo() {

    const data =
        await apiRequest(
            "/users/profile"
        );


    if (
        !data ||
        !data.success ||
        !data.data
    ) {

        alert(
            data?.message ||
            "Failed to load user information."
        );

        return;
    }


    const user =
        data.data;


    const name =
        user.name || "User";


    const department =
        user.department ||
        "Unknown Department";


    // =================================================
    // NAVBAR
    // =================================================

    updateNavbarUser(name);


    // =================================================
    // PAGE USER INFO
    // =================================================

    setText(
        "skillsUserName",
        name
    );


    setText(
        "skillsUserDepartment",
        `Student of ${department}`
    );
}


// =====================================================
// UPDATE NAVBAR
// =====================================================

function updateNavbarUser(name) {

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


// =====================================================
// LOAD SKILLS
// =====================================================

async function loadSkills() {

    const container =
        document.getElementById(
            "skillsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="skills-loading">
            Loading your skills...
        </div>
    `;


    const data =
        await apiRequest(
            "/skills/my-skills"
        );


    if (
        !data ||
        !data.success
    ) {

        container.innerHTML = `
            <div class="skills-empty">

                <div class="skills-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(
                        data?.message ||
                        "Failed to load skills."
                    )}
                </p>

            </div>
        `;

        return;
    }


    skills =
        Array.isArray(data.data)
            ? data.data
            : [];


    renderSkills();
}


// =====================================================
// RENDER SKILLS
// =====================================================

function renderSkills() {

    const container =
        document.getElementById(
            "skillsContainer"
        );


    if (!container) {
        return;
    }


    // =================================================
    // EMPTY
    // =================================================

    if (skills.length === 0) {

        container.innerHTML = `
            <div class="skills-empty">

                <div class="skills-empty-icon">
                    💡
                </div>

                <h3>
                    No Skills Added Yet
                </h3>

                <p>
                    Click "Add Skill" to add your first skill.
                </p>

            </div>
        `;

        return;
    }


    // =================================================
    // SKILL CARDS
    // =================================================

    container.innerHTML =
        skills
            .map(
                function (skill) {

                    return `
                        <div
                            class="skill-card"
                            data-skill-id="${skill.id}"
                        >

                            <div class="skill-name">
                                ${escapeHTML(
                                    skill.skill_name
                                )}
                            </div>

                            <button
                                type="button"
                                class="delete-skill-btn"
                                data-id="${skill.id}"
                                title="Delete skill"
                            >
                                🗑️
                            </button>

                        </div>
                    `;
                }
            )
            .join("");


    // =================================================
    // DELETE EVENTS
    // =================================================

    const deleteButtons =
        document.querySelectorAll(
            ".delete-skill-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const skillId =
                        this.dataset.id;

                    deleteSkill(skillId);
                }
            );
        }
    );
}


// =====================================================
// SETUP SKILL MODAL
// =====================================================

function setupSkillModal() {

    const modal =
        document.getElementById(
            "skillModal"
        );


    const addButton =
        document.getElementById(
            "addSkillBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelSkillBtn"
        );


    const form =
        document.getElementById(
            "skillForm"
        );


    // =================================================
    // OPEN MODAL
    // =================================================

    if (addButton) {

        addButton.addEventListener(
            "click",
            openSkillModal
        );
    }


    // =================================================
    // CLOSE MODAL
    // =================================================

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeSkillModal
        );
    }


    // =================================================
    // FORM SUBMIT
    // =================================================

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await addSkill();
            }
        );
    }


    // =================================================
    // CLICK OUTSIDE
    // =================================================

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeSkillModal();
                }
            }
        );
    }


    // =================================================
    // ESC KEY
    // =================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeSkillModal();
            }
        }
    );
}


// =====================================================
// OPEN MODAL
// =====================================================

function openSkillModal() {

    const modal =
        document.getElementById(
            "skillModal"
        );


    const input =
        document.getElementById(
            "skillNameInput"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }


    if (input) {

        input.value = "";

        setTimeout(
            function () {

                input.focus();

            },
            100
        );
    }
}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeSkillModal() {

    const modal =
        document.getElementById(
            "skillModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    const form =
        document.getElementById(
            "skillForm"
        );


    if (form) {

        form.reset();
    }
}


// =====================================================
// ADD SKILL
// =====================================================

async function addSkill() {

    const input =
        document.getElementById(
            "skillNameInput"
        );


    const saveButton =
        document.getElementById(
            "saveSkillBtn"
        );


    if (!input) {
        return;
    }


    const skillName =
        input.value.trim();


    // =================================================
    // VALIDATION
    // =================================================

    if (!skillName) {

        alert(
            "Please enter a skill name."
        );

        input.focus();

        return;
    }


    // =================================================
    // CHECK DUPLICATE
    // =================================================

    const duplicate =
        skills.some(
            function (skill) {

                return (
                    String(
                        skill.skill_name
                    ).toLowerCase() ===
                    skillName.toLowerCase()
                );
            }
        );


    if (duplicate) {

        alert(
            "You already have this skill."
        );

        input.focus();

        return;
    }


    // =================================================
    // BUTTON STATE
    // =================================================

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Adding...";
    }


    // =================================================
    // API
    // =================================================

    const data =
        await apiRequest(
            "/skills/add",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        skill_name:
                            skillName
                    })
            }
        );


    // =================================================
    // SUCCESS
    // =================================================

    if (
        data &&
        data.success
    ) {

        closeSkillModal();

        await loadSkills();

        alert(
            "Skill added successfully!"
        );

    } else {

        alert(
            data?.message ||
            "Failed to add skill."
        );
    }


    // =================================================
    // RESTORE BUTTON
    // =================================================

    if (saveButton) {

        saveButton.disabled = false;

        saveButton.textContent =
            "Add Skill";
    }
}


// =====================================================
// DELETE SKILL
// =====================================================

async function deleteSkill(skillId) {

    if (!skillId) {
        return;
    }


    const skill =
        skills.find(
            function (item) {

                return String(
                    item.id
                ) === String(skillId);
            }
        );


    const skillName =
        skill?.skill_name ||
        "this skill";


    // =================================================
    // CONFIRMATION
    // =================================================

    const confirmed =
        confirm(
            `Are you sure you want to delete "${skillName}"?`
        );


    if (!confirmed) {
        return;
    }


    // =================================================
    // API
    // =================================================

    const data =
        await apiRequest(
            `/skills/delete/${skillId}`,
            {
                method: "DELETE"
            }
        );


    // =================================================
    // SUCCESS
    // =================================================

    if (
        data &&
        data.success
    ) {

        skills =
            skills.filter(
                function (item) {

                    return String(
                        item.id
                    ) !== String(skillId);
                }
            );


        renderSkills();


        alert(
            "Skill deleted successfully!"
        );

    } else {

        alert(
            data?.message ||
            "Failed to delete skill."
        );
    }
}


// =====================================================
// THEME
// =====================================================

function setupTheme() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme === "dark"
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


    if (!button) {
        return;
    }


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
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
    }
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

