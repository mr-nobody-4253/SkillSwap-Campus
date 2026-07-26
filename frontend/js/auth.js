const loginForm = document.getElementById("loginForm");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// Show / Hide Password
togglePassword.addEventListener("click", () => {

    if (password.type === "password") {
        password.type = "text";
        togglePassword.innerHTML = "🙈";
    } else {
        password.type = "password";
        togglePassword.innerHTML = "👁";
    }

});

// Login
loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const passwordValue = document.getElementById("password").value;

    const loginBtn = document.querySelector(".login-btn");

    loginBtn.disabled = true;
    loginBtn.innerText = "Signing In...";

    try {

        const result = await apiRequest("/users/login", "POST", {
            email,
            password: passwordValue
        });

        if (result.success) {

            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            alert("Login Successful!");

            window.location.href = "dashboard.html";

        } else {

            alert(result.message);

        }

    }catch (error) {

    console.error(error);

    alert(error.message);

}

    loginBtn.disabled = false;
    loginBtn.innerText = "Login";

});