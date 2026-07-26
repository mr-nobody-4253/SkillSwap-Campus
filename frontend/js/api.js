const API_BASE_URL = "http://127.0.0.1:5000/api";

async function apiRequest(endpoint, method = "GET", body = null, auth = false) {

    const headers = {
        "Content-Type": "application/json"
    };

    if (auth) {
        const token = localStorage.getItem("token");

        if (token) {
            headers.Authorization = token;
        }
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_BASE_URL + endpoint, options);

    console.log("Status:", response.status);

    const data = await response.json();

    console.log("Response:", data);

    return data;
}