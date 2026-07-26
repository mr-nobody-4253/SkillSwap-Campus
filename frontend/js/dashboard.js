const user =
    JSON.parse(
        localStorage.getItem("user")
    );

if(!user){

    window.location.href =
        "login.html";
}

document.getElementById(
    "username"
).innerText = user.name;

document.getElementById(
    "welcomeName"
).innerText = user.name;

document.querySelector(
    ".avatar"
).innerText =
    user.name.charAt(0);

document
    .getElementById("logoutBtn")
    .addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";

});

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const notificationDropdown =
    document.getElementById(
        "notificationDropdown"
    );

notificationBtn.addEventListener(
    "click",
    () => {

        if (
            notificationDropdown.style.display
            === "block"
        ) {

            notificationDropdown.style.display =
                "none";

        } else {

            notificationDropdown.style.display =
                "block";

        }

    }
);

document.addEventListener(
    "click",
    (e) => {

        if (
            !notificationBtn.contains(
                e.target
            ) &&
            !notificationDropdown.contains(
                e.target
            )
        ) {

            notificationDropdown.style.display =
                "none";

        }

    }
);

async function loadStats() {

    const token =
        localStorage.getItem("token");

    try {

        // Incoming
        const incomingResponse =
            await fetch(
                "http://127.0.0.1:5000/api/exchange/incoming",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const incomingData =
            await incomingResponse.json();
            console.log(incomingData);

        document.getElementById(
            "incomingCount"
        ).innerText =
            incomingData.total_requests || 0;

        // Sent
        const sentResponse =
            await fetch(
                "http://127.0.0.1:5000/api/exchange/sent",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const sentData =
            await sentResponse.json();
            console.log(sentData);

        document.getElementById(
            "sentCount"
        ).innerText =
            sentData.total_requests || 0;

        // Accepted
        const accepted =
            incomingData.data.filter(
                item =>
                    item.status ===
                    "Accepted"
            ).length;

        document.getElementById(
            "acceptedCount"
        ).innerText = accepted;

        // Completed
        const completed =
            incomingData.data.filter(
                item =>
                    item.status ===
                    "Completed"
            ).length;

        document.getElementById(
            "completedCount"
        ).innerText = completed;

    } catch (error) {

        console.log(
            "Stats Error:",
            error
        );
    }
}

loadStats();

const savedTheme =
    localStorage.getItem(
        "theme"
    );

if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-mode"
    );

}

window.addEventListener(
    "load",
    () => {

        if (
            document.body.classList.contains(
                "dark-mode"
            )
        ) {

            document.getElementById(
                "themeToggle"
            ).innerText = "☀️";

        }

    }
);

const themeToggle =
    document.getElementById(
        "themeToggle"
    );

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        if (
    document.body.classList.contains(
        "dark-mode"
    )
) {

    themeToggle.innerText =
        "☀️";

    localStorage.setItem(
        "theme",
        "dark"
    );

}
else {

    themeToggle.innerText =
        "🌙";

    localStorage.setItem(
        "theme",
        "light"
    );

}

    }
);

async function loadRecentNotifications() {

    const token =
        localStorage.getItem(
            "token"
        );

    try {

        const response =
            await fetch(
                "http://127.0.0.1:5000/api/notifications",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        const container =
            document.getElementById(
                "recentNotifications"
            );

        container.innerHTML = "";

        if (
            !data.data ||
            data.data.length === 0
        ) {

            container.innerHTML =
                `
                <div class="notification-card">
                    No notifications yet.
                </div>
                `;

            return;

        }

        data.data
            .slice(0, 5)
            .forEach(
                notification => {

                    container.innerHTML +=
                        `
                        <div class="notification-card">
                            ${notification.message}
                        </div>
                        `;
                }
            );

    } catch (error) {

        console.log(
            "Notification Error:",
            error
        );

    }
}

loadRecentNotifications();