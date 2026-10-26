/* =========================================================
   GRAMVIKAS — auth-guard.js
   Protects index.html, shows the logged-in user's name & role,
   and wires up the logout button.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const session = JSON.parse(
        sessionStorage.getItem("gramvikas-session") || "null"
    );

    if (!session) {
        window.location.replace("login.html");
        return;
    }

    // ----- Populate header profile -----
    const nameEl = document.getElementById("profileName");
    const roleEl = document.getElementById("profileRole");

    if (nameEl) {
        nameEl.textContent = session.name || "User";
        if (session.role === "sarpanch") {
            nameEl.innerHTML = `<i class="fa-solid fa-crown" style="color: #f59e0b; margin-right: 4px;"></i> ${session.name}`;
        }
    }

    if (roleEl) {
        if (session.role === "sarpanch") {
            roleEl.textContent = "Sarpanch (Panchayat Head)";
            roleEl.style.color = "#15803d";
            roleEl.style.fontWeight = "700";
        } else if (session.role === "contractor") {
            roleEl.textContent = `Contractor (${session.email || session.gmail || ""})`;
        } else {
            roleEl.textContent = `Villager (${session.email || session.gmail || ""})`;
        }
    }

    // ----- Logout -----
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", () => {
        sessionStorage.removeItem("gramvikas-session");
        window.location.href = "login.html";
    });
});
