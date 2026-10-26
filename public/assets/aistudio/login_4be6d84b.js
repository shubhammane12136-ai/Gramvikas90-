/* =========================================================
   GRAMVIKAS — login.js
   Handles: role tabs, registration, login, and admin
   two-step (OTP) verification.

   ---------------------------------------------------------
   IMPORTANT — READ BEFORE DEPLOYING
   ---------------------------------------------------------
   This is a front-end-only demo. There is no server here,
   so it cannot do two things for real:

   1. "Login with Gmail" as real Google OAuth.
      What's built instead is email + password, restricted
      to @gmail.com addresses, stored in localStorage.
      To add real "Sign in with Google" you need a Google
      Cloud OAuth Client ID and Google Identity Services —
      see the commented block in initGoogleSignIn() below.

   2. Actually emailing a one-time code to the admin's Gmail.
      A browser cannot send email by itself. The OTP is
      generated here and simply shown on screen in a
      dashed "demo mode" box (sendOtpEmail function).
      To really email it you need one of:
        - A backend endpoint that sends mail via Gmail
          SMTP / Nodemailer, or
        - A client-callable email API such as EmailJS
          (emailjs.com) — no backend required, just an
          API key. See the commented call inside
          sendOtpEmail() for where that would go.

   Also note: storing passwords in localStorage (plain,
   client-side) is fine for a prototype but is NOT secure
   for production — real deployments must hash passwords
   and check them on a server, never trust the browser.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const $ = (sel) => document.querySelector(sel);

    /* =====================================================
       THEME (kept in sync with the dashboard)
       ===================================================== */

    const themeToggle = $("#authThemeToggle");
    const savedTheme = localStorage.getItem("gramvikas-theme");

    if (savedTheme === "dark") document.body.classList.add("dark-mode");

    function updateThemeIcon() {
        const icon = themeToggle?.querySelector("i");
        if (!icon) return;
        icon.className = document.body.classList.contains("dark-mode")
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";
    }
    updateThemeIcon();

    themeToggle?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem(
            "gramvikas-theme",
            document.body.classList.contains("dark-mode") ? "dark" : "light"
        );
        updateThemeIcon();
    });


    /* =====================================================
       TOAST (same pattern as the dashboard's script.js)
       ===================================================== */

    let toastTimer;

    function showToast(title, message) {
        const toast = $("#toast");
        if (!toast) return;

        $("#toastTitle").textContent = title;
        $("#toastMessage").textContent = message;

        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
    }

    $("#closeToast")?.addEventListener("click", () => {
        $("#toast").classList.remove("show");
    });


    /* =====================================================
       "DATABASE" — localStorage-backed account stores
       ===================================================== */

    const USERS_KEY = "gramvikas-users";
    const ADMINS_KEY = "gramvikas-admins";

    const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const saveUsers = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));

    const getAdmins = () => JSON.parse(localStorage.getItem(ADMINS_KEY) || "[]");
    const saveAdmins = (arr) => localStorage.setItem(ADMINS_KEY, JSON.stringify(arr));


    /* =====================================================
       VALIDATION HELPERS
       ===================================================== */

    const isGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim());
    const isMobile = (num) => /^[6-9]\d{9}$/.test(num.trim()); // Indian 10-digit mobile

    function setFieldError(inputEl, message) {
        const group = inputEl.closest(".form-group");
        if (!group) return;
        let err = group.querySelector(".field-error");
        if (!err) {
            err = document.createElement("small");
            err.className = "field-error";
            group.appendChild(err);
        }
        err.textContent = message;
        group.classList.toggle("invalid", Boolean(message));
    }

    function clearFieldError(inputEl) {
        setFieldError(inputEl, "");
    }


    /* =====================================================
       VIEW SWITCHING
       (Role tabs removed — combinedLoginView is the default
       view and login.js auto-detects villager vs admin.)
       ===================================================== */

    function showView(id) {
        document.querySelectorAll(".auth-view").forEach((v) => {
            v.hidden = v.id !== id;
        });
    }

    document.querySelectorAll("[data-switch]").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showView(link.dataset.switch);
        });
    });


    /* =====================================================
       BUILD SHARED REGISTRATION FIELDS
       (identical fields for villager + admin registration)
       ===================================================== */

    function buildRegisterFields(form, prefix) {
        form.innerHTML = `
            <div class="form-group">
                <label for="${prefix}Name">Full Name</label>
                <div class="input-icon">
                    <i class="fa-solid fa-id-card"></i>
                    <input type="text" id="${prefix}Name" placeholder="Full name" required>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}State">State</label>
                <div class="input-icon">
                    <i class="fa-solid fa-flag"></i>
                    <select id="${prefix}State" required>
                        <option value="" disabled selected>Select state</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="${prefix}Dist">District</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-map"></i>
                        <select id="${prefix}Dist" required disabled>
                            <option value="" disabled selected>Select state first</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="${prefix}Tal">Taluka / Taluk</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-map"></i>
                        <select id="${prefix}Tal" required disabled>
                            <option value="" disabled selected>Select district first</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Village">Village Name</label>
                <div class="input-icon">
                    <i class="fa-solid fa-location-dot"></i>
                    <select id="${prefix}Village" required disabled>
                        <option value="" disabled selected>Select taluka first</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Mobile">Mobile Number</label>
                <div class="input-icon">
                    <i class="fa-solid fa-phone"></i>
                    <input type="tel" id="${prefix}Mobile" placeholder="10-digit mobile number" maxlength="10" required>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Gmail">Gmail Address</label>
                <div class="input-icon">
                    <i class="fa-solid fa-envelope"></i>
                    <input type="email" id="${prefix}Gmail" placeholder="you@gmail.com" required>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Password">Password</label>
                <div class="input-icon">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="${prefix}Password" placeholder="Create a password (min 6 characters)" required>
                    <button type="button" class="toggle-eye" data-target="${prefix}Password">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Confirm">Confirm Password</label>
                <div class="input-icon">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="${prefix}Confirm" placeholder="Re-enter password" required>
                    <button type="button" class="toggle-eye" data-target="${prefix}Confirm">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="primary-btn auth-submit">
                <i class="fa-solid fa-user-plus"></i> Register
            </button>
        `;
    }

    buildRegisterFields($("#userRegisterForm"), "user");
    buildRegisterFields($("#adminRegisterForm"), "admin");


    /* =====================================================
       CASCADING LOCATION DROPDOWNS
       State → District → Taluka/Taluk → Village
       Data sources: maharashtra-data.js, karnataka-data.js
       ===================================================== */

    // Map each supported state to its district list + nested data.
    // To add another state: create a <state>-data.js file with the
    // same ALL_DISTRICTS / DATA shape, load it in login.html, and
    // add an entry here.
    const STATE_DATA_MAP = {
        "Maharashtra": {
            allDistricts: MAHARASHTRA_ALL_DISTRICTS,
            data: MAHARASHTRA_DATA,
        },
        "Karnataka": {
            allDistricts: KARNATAKA_ALL_DISTRICTS,
            data: KARNATAKA_DATA,
        },
    };

    function fillSelect(selectEl, items, placeholder) {
        selectEl.innerHTML =
            `<option value="" disabled selected>${placeholder}</option>` +
            items.map((item) => `<option value="${item}">${item}</option>`).join("");
    }

    function resetSelect(selectEl, placeholder) {
        selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        selectEl.disabled = true;
    }

    function initLocationCascade(prefix) {
        const stateSelect = $(`#${prefix}State`);
        const distSelect = $(`#${prefix}Dist`);
        const talSelect = $(`#${prefix}Tal`);
        const villageSelect = $(`#${prefix}Village`);

        stateSelect.addEventListener("change", () => {
            const stateInfo = STATE_DATA_MAP[stateSelect.value];

            resetSelect(talSelect, "Select district first");
            resetSelect(villageSelect, "Select taluka first");

            if (stateInfo) {
                fillSelect(distSelect, stateInfo.allDistricts, "Select district");
                distSelect.disabled = false;
            } else {
                resetSelect(distSelect, "Select state first");
            }
        });

        distSelect.addEventListener("change", () => {
            const stateInfo = STATE_DATA_MAP[stateSelect.value];
            const district = distSelect.value;
            const talukas = stateInfo?.data[district]
                ? Object.keys(stateInfo.data[district])
                : [];

            resetSelect(villageSelect, "Select taluka first");

            if (talukas.length) {
                fillSelect(talSelect, talukas, "Select taluka");
                talSelect.disabled = false;
            } else {
                // District exists but taluka data hasn't been added yet
                resetSelect(talSelect, "No taluka data yet for this district");
            }
        });

        talSelect.addEventListener("change", () => {
            const stateInfo = STATE_DATA_MAP[stateSelect.value];
            const district = distSelect.value;
            const taluka = talSelect.value;
            const villages = stateInfo?.data[district]?.[taluka] || [];

            if (villages.length) {
                fillSelect(villageSelect, villages, "Select village");
                villageSelect.disabled = false;
            } else {
                resetSelect(villageSelect, "No village data yet for this taluka");
            }
        });
    }

    initLocationCascade("user");
    initLocationCascade("admin");


    /* =====================================================
       SHOW / HIDE PASSWORD
       ===================================================== */

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".toggle-eye");
        if (!btn) return;

        const input = document.getElementById(btn.dataset.target);
        if (!input) return;

        const icon = btn.querySelector("i");
        const showing = input.type === "text";

        input.type = showing ? "password" : "text";
        icon.className = showing ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });


    /* =====================================================
       GENERIC REGISTRATION HANDLER
       ===================================================== */

    function readRegisterForm(prefix) {
        return {
            name: $(`#${prefix}Name`).value.trim(),
            village: $(`#${prefix}Village`).value.trim(),
            tal: $(`#${prefix}Tal`).value.trim(),
            dist: $(`#${prefix}Dist`).value.trim(),
            state: $(`#${prefix}State`).value.trim(),
            mobile: $(`#${prefix}Mobile`).value.trim(),
            gmail: $(`#${prefix}Gmail`).value.trim().toLowerCase(),
            password: $(`#${prefix}Password`).value,
            confirm: $(`#${prefix}Confirm`).value,
        };
    }

    function validateRegisterData(data, prefix) {
        let ok = true;

        const req = ["Name", "Village", "Tal", "Dist", "State", "Mobile", "Gmail", "Password", "Confirm"];
        req.forEach((field) => clearFieldError($(`#${prefix}${field}`)));

        if (!data.name) { setFieldError($(`#${prefix}Name`), "Name is required."); ok = false; }
        if (!data.village) { setFieldError($(`#${prefix}Village`), "Village name is required."); ok = false; }
        if (!data.tal) { setFieldError($(`#${prefix}Tal`), "Taluka is required."); ok = false; }
        if (!data.dist) { setFieldError($(`#${prefix}Dist`), "District is required."); ok = false; }
        if (!data.state) { setFieldError($(`#${prefix}State`), "State is required."); ok = false; }

        if (!isMobile(data.mobile)) {
            setFieldError($(`#${prefix}Mobile`), "Enter a valid 10-digit mobile number.");
            ok = false;
        }

        if (!isGmail(data.gmail)) {
            setFieldError($(`#${prefix}Gmail`), "Please use a valid @gmail.com address.");
            ok = false;
        }

        if (data.password.length < 6) {
            setFieldError($(`#${prefix}Password`), "Password must be at least 6 characters.");
            ok = false;
        }

        if (data.password !== data.confirm) {
            setFieldError($(`#${prefix}Confirm`), "Passwords do not match.");
            ok = false;
        }

        return ok;
    }

    // ----- Villager registration -----
    $("#userRegisterForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const data = readRegisterForm("user");
        if (!validateRegisterData(data, "user")) return;

        const users = getUsers();

        if (users.some((u) => u.gmail === data.gmail)) {
            setFieldError($("#userGmail"), "An account with this Gmail already exists.");
            return;
        }

        delete data.confirm;
        users.push(data);
        saveUsers(users);

        showToast("Registration Successful", "Your villager account has been created.");
        e.target.reset();
        showView("combinedLoginView");
    });

    // ----- Admin registration -----
    $("#adminRegisterForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const data = readRegisterForm("admin");
        if (!validateRegisterData(data, "admin")) return;

        const admins = getAdmins();

        if (admins.some((a) => a.gmail === data.gmail)) {
            setFieldError($("#adminGmail"), "An admin account with this Gmail already exists.");
            return;
        }

        delete data.confirm;
        admins.push(data);
        saveAdmins(admins);

        showToast("Registration Successful", "Admin account created.");
        e.target.reset();
        showView("combinedLoginView");
    });


    /* =====================================================
       COMBINED LOGIN — role select only, no credentials
       ---------------------------------------------------
       TEMPORARY CHANGE: Gmail + password login has been
       removed for now. There's just "Continue as Villager"
       / "Continue as Admin" — clicking either starts a
       session immediately with a placeholder name, without
       checking the users/admins stores at all.

       TO RESTORE REAL LOGIN LATER:
       swap the two click handlers below for a form submit
       handler that looks up getUsers()/getAdmins() by Gmail
       and checks the password before calling startSession()
       (see git history / previous version of this file).
       Admin OTP verification (sendOtpEmail/startOtpCountdown/
       adminOtpForm handling below) is also kept intact and
       still works if you want to wire it back in for admins.
       ===================================================== */

    let pendingAdmin = null;
    let otpValue = null;
    let otpExpiresAt = 0;
    let otpTimerInterval = null;

    $("#continueAsUserBtn").addEventListener("click", () => {
        startSession({ role: "user", gmail: "villager@guest.local", name: "Villager" });
    });

    $("#continueAsAdminBtn").addEventListener("click", () => {
        showView("adminRoleChoiceView");
    });

    $("#openSarpanchLoginBtn").addEventListener("click", () => {
        showView("sarpanchLoginView");
    });

    $("#openContractorLoginBtn").addEventListener("click", () => {
        showView("contractorLoginView");
    });

    // Demo-mode role entry. These buttons do not verify identity.
    $("#sarpanchLoginBtn").addEventListener("click", () => {
        startSession({ role: "sarpanch", gmail: "sarpanch@guest.local", name: "Sarpanch" });
    });

    $("#contractorLoginBtn").addEventListener("click", () => {
        const name = $("#contractorNameInput")?.value.trim();
        const gmail = $("#contractorEmailInput")?.value.trim().toLowerCase();
        if (!name || !gmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) {
            showToast("Details required", "Enter your contractor name and valid assigned email address.");
            return;
        }
        startSession({ role: "contractor", gmail, name });
    });


    /* =====================================================
       ADMIN — STEP 2: GENERATE + "SEND" OTP
       ===================================================== */

    function generateOtp() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    function sendOtpEmail(admin) {
        otpValue = generateOtp();
        otpExpiresAt = Date.now() + 60_000;

        // ---------------------------------------------------
        // DEMO MODE: no backend, so we can't truly email this.
        // Shown directly in the UI so the flow is testable.
        //
        // To actually send it to the admin's Gmail inbox, call
        // a real email service here instead, e.g. with EmailJS:
        //
        //   emailjs.send("service_id", "template_id", {
        //       to_email: admin.gmail,
        //       otp_code: otpValue,
        //   });
        //
        // (requires including the EmailJS SDK + your account keys)
        // ---------------------------------------------------
        $("#otpDemoBox").innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            Demo mode — no email server is connected, so here is the
            code that would normally be emailed to
            <strong>${admin.gmail}</strong>:<br>
            <strong>${otpValue}</strong>
        `;

        showToast("Verification Code Sent", `A 6-digit code was generated for ${admin.gmail}.`);
        startOtpCountdown();
    }

    function startOtpCountdown() {
        clearInterval(otpTimerInterval);

        const timerText = $("#otpTimerText");
        const resendLink = $("#resendOtpLink");
        resendLink.classList.add("disabled-link");

        otpTimerInterval = setInterval(() => {
            const secondsLeft = Math.max(0, Math.round((otpExpiresAt - Date.now()) / 1000));
            timerText.textContent = secondsLeft > 0
                ? `Code expires in ${secondsLeft}s`
                : "Code expired";

            if (secondsLeft <= 0) {
                clearInterval(otpTimerInterval);
                resendLink.classList.remove("disabled-link");
            }
        }, 1000);
    }

    $("#resendOtpLink").addEventListener("click", (e) => {
        e.preventDefault();
        if (Date.now() < otpExpiresAt) return; // still within cooldown
        if (pendingAdmin) sendOtpEmail(pendingAdmin);
    });

    $("#adminOtpForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const otpInput = $("#otpInput");
        clearFieldError(otpInput);

        if (Date.now() > otpExpiresAt) {
            setFieldError(otpInput, "Code expired. Please resend.");
            return;
        }

        if (otpInput.value.trim() !== otpValue) {
            setFieldError(otpInput, "Incorrect code. Please try again.");
            return;
        }

        clearInterval(otpTimerInterval);

        startSession({
            role: "admin",
            gmail: pendingAdmin.gmail,
            name: pendingAdmin.name,
        });
    });


    /* =====================================================
       SESSION + REDIRECT
       ===================================================== */

    function startSession(session) {
        sessionStorage.setItem("gramvikas-session", JSON.stringify(session));
        showToast("Welcome", `Signed in as ${session.name}.`);
        setTimeout(() => { window.location.href = "index.html"; }, 600);
    }


    /* =====================================================
       OPTIONAL: REAL "SIGN IN WITH GOOGLE" (GOOGLE OAUTH)
       ---------------------------------------------------
       Uncomment + configure to offer a real Google Sign-In
       button instead of (or alongside) the Gmail+password
       form above. Requires a Google Cloud OAuth Client ID
       from https://console.cloud.google.com/apis/credentials
       ===================================================== */

    // function initGoogleSignIn() {
    //     google.accounts.id.initialize({
    //         client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    //         callback: (response) => {
    //             const payload = JSON.parse(atob(response.credential.split(".")[1]));
    //             startSession({ role: "user", gmail: payload.email, name: payload.name });
    //         },
    //     });
    //     google.accounts.id.renderButton(
    //         document.getElementById("googleSignInBtn"),
    //         { theme: "outline", size: "large", width: 320 }
    //     );
    // }
    // Also add <script src="https://accounts.google.com/gsi/client" async defer></script>
    // to <head>, a <div id="googleSignInBtn"></div> in the login form, and call
    // initGoogleSignIn() once that script has loaded.

});
