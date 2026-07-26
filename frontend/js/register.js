const togglePassword =
    document.getElementById("togglePassword");

const password =
    document.getElementById("password");

togglePassword.addEventListener("click", () => {

    password.type =
        password.type === "password"
            ? "text"
            : "password";

    togglePassword.innerHTML =
        password.type === "password"
            ? "👁"
            : "🙈";
});

const registerForm =
    document.getElementById("registerForm");

registerForm.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        const data = {
            name:
                document.getElementById("name").value,

            email:
                document.getElementById("email").value,

            password:
                document.getElementById("password").value,

            department:
                document.getElementById("department").value,

            semester:
                document.getElementById("semester").value,

            bio:
                document.getElementById("bio").value
        };

        const btn =
            document.querySelector(".login-btn");

        btn.disabled = true;
        btn.innerText =
            "Creating Account...";

        try {

            const result =
                await apiRequest(
                    "/users/register",
                    "POST",
                    data
                );

            if (result.success) {

                alert(
                    "Registration Successful!"
                );

                window.location.href =
                    "login.html";

            } else {

                alert(result.message);

            }

        } catch (error) {

            alert(error.message);

        }

        btn.disabled = false;
        btn.innerText =
            "Create Account";
    }
);