/* =========================================================
   GRAMVIKAS — auth-guard.js
   Protects index.html, shows the logged-in user's name,
   and wires up the logout button.
   (The actual redirect-if-not-logged-in check already runs
   earlier, inline in <head>, so the page never flashes
   before redirecting.)
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

    if (nameEl) nameEl.textContent = session.name || "User";
    if (roleEl) {
        const roleLabels = {
            admin: "Administrator",
            sarpanch: "Sarpanch",
            contractor: "Contractor",
            user: "Villager",
        };
        roleEl.textContent = roleLabels[session.role] || "Villager";
    }

    // ----- Logout -----
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn?.addEventListener("click", () => {
        sessionStorage.removeItem("gramvikas-session");
        window.location.href = "login.html";
    });

});
