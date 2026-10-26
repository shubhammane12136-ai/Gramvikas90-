/* =========================================================
   GRAMVIKAS — login.js
   Handles:
   1. Villager Email + Password login and registration
   2. Exclusive Sarpanch login (only piyushyadav3077@gmail.com / 816111)
   3. Contractor access
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => [...document.querySelectorAll(sel)];

    /* =====================================================
       THEME MANAGEMENT
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
       TOAST NOTIFICATIONS
       ===================================================== */
    let toastTimer;

    function showToast(title, message, isError = false) {
        const toast = $("#toast");
        if (!toast) return;

        const titleEl = $("#toastTitle");
        const msgEl = $("#toastMessage");
        const iconEl = toast.querySelector(".toast-icon i");

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (iconEl) {
            iconEl.className = isError ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-check";
        }
        const iconWrap = toast.querySelector(".toast-icon");
        if (iconWrap) {
            iconWrap.style.background = isError ? "#fef2f2" : "#ecfdf5";
            iconWrap.style.color = isError ? "#dc2626" : "#10b981";
        }

        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
    }

    $("#closeToast")?.addEventListener("click", () => {
        $("#toast")?.classList.remove("show");
    });

    /* =====================================================
       USER DATABASE & SEED ACCOUNTS
       ===================================================== */
    const USERS_KEY = "gramvikas-users";
    const SARPANCH_EMAIL = "piyushyadav3077@gmail.com";
    const SARPANCH_PASS = "816111";

    function seedDefaultVillagers() {
        return [
            {
                name: "Ramesh Patil",
                gmail: "ramesh.patil@gmail.com",
                password: "pass123",
                village: "Adarsh Gram",
                tal: "Haveli",
                dist: "Pune",
                state: "Maharashtra",
                mobile: "9823456789"
            },
            {
                name: "Sunita Kadam",
                gmail: "sunita.kadam@gmail.com",
                password: "pass123",
                village: "Adarsh Gram",
                tal: "Haveli",
                dist: "Pune",
                state: "Maharashtra",
                mobile: "9823456790"
            },
            {
                name: "Kishore Jadhav",
                gmail: "kishore.jadhav@gmail.com",
                password: "pass123",
                village: "Adarsh Gram",
                tal: "Haveli",
                dist: "Pune",
                state: "Maharashtra",
                mobile: "9823456791"
            }
        ];
    }

    function getUsers() {
        const stored = localStorage.getItem(USERS_KEY);
        if (!stored) {
            const defaults = seedDefaultVillagers();
            localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
            return defaults;
        }
        try {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveUsers(arr) {
        localStorage.setItem(USERS_KEY, JSON.stringify(arr));
    }

    /* =====================================================
       VALIDATION HELPERS
       ===================================================== */
    const isMobile = (num) => /^[6-9]\d{9}$/.test((num || "").trim());

    function setFieldError(inputEl, message) {
        if (!inputEl) return;
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
        if (!inputEl) return;
        const group = inputEl.closest(".form-group");
        if (group) {
            group.classList.remove("invalid");
            const err = group.querySelector(".field-error");
            if (err) err.textContent = "";
        }
    }

    /* =====================================================
       VIEW NAVIGATION
       ===================================================== */
    function showView(viewId) {
        $$(".auth-view").forEach((v) => {
            v.hidden = v.id !== viewId;
        });

        // Sync tabs if applicable
        if (viewId === "villagerLoginView") {
            $("#tabVillager")?.classList.add("active");
            $("#tabSarpanch")?.classList.remove("active");
            $("#roleTabsContainer")?.removeAttribute("hidden");
        } else if (viewId === "sarpanchLoginView") {
            $("#tabSarpanch")?.classList.add("active");
            $("#tabVillager")?.classList.remove("active");
            $("#roleTabsContainer")?.removeAttribute("hidden");
        } else {
            // In registration or contractor subviews, keep tabs available or hidden
            $("#roleTabsContainer")?.setAttribute("hidden", "true");
        }
    }

    // Tab buttons
    $("#tabVillager")?.addEventListener("click", () => {
        showView("villagerLoginView");
    });

    $("#tabSarpanch")?.addEventListener("click", () => {
        showView("sarpanchLoginView");
    });

    // Sub-links
    $("#openRegisterLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        showView("userRegisterView");
    });

    $("#backToVillagerLoginFromReg")?.addEventListener("click", (e) => {
        e.preventDefault();
        showView("villagerLoginView");
    });

    $("#switchBackToVillagerLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        showView("villagerLoginView");
    });

    $("#openContractorViewLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        showView("contractorLoginView");
    });

    $("#backToVillagerFromContractor")?.addEventListener("click", (e) => {
        e.preventDefault();
        showView("villagerLoginView");
    });

    /* =====================================================
       AUTOFILL HELPERS
       ===================================================== */
    $("#autofillSarpanchBtn")?.addEventListener("click", () => {
        const emailInput = $("#sarpanchEmail");
        const passInput = $("#sarpanchPassword");
        if (emailInput && passInput) {
            emailInput.value = SARPANCH_EMAIL;
            passInput.value = SARPANCH_PASS;
            clearFieldError(emailInput);
            clearFieldError(passInput);
            showToast("Credentials Applied", "Authorized Sarpanch credentials filled. Click 'Sign In' to proceed.");
        }
    });

    $("#autofillVillagerDemoBtn")?.addEventListener("click", () => {
        const emailInput = $("#villagerEmail");
        const passInput = $("#villagerPassword");
        if (emailInput && passInput) {
            emailInput.value = "ramesh.patil@gmail.com";
            passInput.value = "pass123";
            clearFieldError(emailInput);
            clearFieldError(passInput);
            showToast("Demo Villager Applied", "Ramesh Patil's credentials filled.");
        }
    });

    /* =====================================================
       SHOW / HIDE PASSWORD TOGGLE
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
       1. SARPANCH LOGIN HANDLER
       Strictly enforces:
       Email: piyushyadav3077@gmail.com
       Password: 816111
       ===================================================== */
    $("#sarpanchLoginForm")?.addEventListener("submit", (e) => {
        e.preventDefault();

        const emailInput = $("#sarpanchEmail");
        const passInput = $("#sarpanchPassword");

        clearFieldError(emailInput);
        clearFieldError(passInput);

        const email = (emailInput?.value || "").trim().toLowerCase();
        const password = (passInput?.value || "").trim();

        if (!email) {
            setFieldError(emailInput, "Sarpanch email is required.");
            return;
        }

        if (!password) {
            setFieldError(passInput, "Password is required.");
            return;
        }

        // Strictly verify authorized credentials
        if (email === SARPANCH_EMAIL && password === SARPANCH_PASS) {
            startSession({
                role: "sarpanch",
                email: SARPANCH_EMAIL,
                gmail: SARPANCH_EMAIL,
                name: "Piyush Yadav (Sarpanch)",
                village: "Adarsh Gram",
                designation: "Gram Panchayat Sarpanch"
            });
        } else {
            setFieldError(
                passInput,
                "Invalid credentials. Only the authorized Sarpanch (piyushyadav3077@gmail.com) can log in as Sarpanch."
            );
            showToast(
                "Access Denied",
                "Unauthorized Sarpanch login attempt. Only piyushyadav3077@gmail.com with password 816111 is permitted.",
                true
            );
        }
    });

    /* =====================================================
       2. VILLAGER LOGIN HANDLER (Email & Password)
       ===================================================== */
    $("#villagerLoginForm")?.addEventListener("submit", (e) => {
        e.preventDefault();

        const emailInput = $("#villagerEmail");
        const passInput = $("#villagerPassword");

        clearFieldError(emailInput);
        clearFieldError(passInput);

        const email = (emailInput?.value || "").trim().toLowerCase();
        const password = (passInput?.value || "").trim();

        if (!email) {
            setFieldError(emailInput, "Please enter your email address.");
            return;
        }

        if (!password) {
            setFieldError(passInput, "Please enter your password.");
            return;
        }

        // Block Sarpanch from accidental villager login form to avoid confusion
        if (email === SARPANCH_EMAIL) {
            setFieldError(
                emailInput,
                "This email belongs to the village Sarpanch. Please switch to the Sarpanch Login tab."
            );
            return;
        }

        const users = getUsers();
        const user = users.find(
            (u) => (u.gmail || u.email || "").toLowerCase().trim() === email
        );

        if (!user) {
            setFieldError(
                emailInput,
                "No registered villager account found with this email. Please register or check spelling."
            );
            showToast("Account Not Found", "Please register your account or use the quick demo login.", true);
            return;
        }

        if (user.password !== password) {
            setFieldError(passInput, "Incorrect password. Please try again.");
            showToast("Login Failed", "Incorrect password for this villager account.", true);
            return;
        }

        startSession({
            role: "user",
            email: email,
            gmail: email,
            name: user.name || "Villager",
            village: user.village || "Adarsh Gram",
            phone: user.mobile || "",
            dist: user.dist || "",
            tal: user.tal || "",
            state: user.state || ""
        });
    });

    /* =====================================================
       3. CONTRACTOR LOGIN HANDLER
       ===================================================== */
    $("#contractorLoginForm")?.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = $("#contractorNameInput")?.value.trim();
        const email = $("#contractorEmailInput")?.value.trim().toLowerCase();

        if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Details required", "Enter contractor name and valid assigned email.", true);
            return;
        }

        startSession({
            role: "contractor",
            email: email,
            gmail: email,
            name: name
        });
    });

    /* =====================================================
       4. BUILD REGISTRATION FIELDS & CASCADING SELECTS
       ===================================================== */
    function buildRegisterFields(form, prefix) {
        if (!form) return;
        form.innerHTML = `
            <div class="form-group">
                <label for="${prefix}Name">Villager Full Name</label>
                <div class="input-icon">
                    <i class="fa-solid fa-id-card"></i>
                    <input type="text" id="${prefix}Name" placeholder="e.g. Ramesh Shankar Patil" required>
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
                <label for="${prefix}Gmail">Email Address</label>
                <div class="input-icon">
                    <i class="fa-solid fa-envelope"></i>
                    <input type="email" id="${prefix}Gmail" placeholder="you@gmail.com" required>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Password">Create Password</label>
                <div class="input-icon">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="${prefix}Password" placeholder="Min 6 characters" required>
                    <button type="button" class="toggle-eye" data-target="${prefix}Password" aria-label="Toggle password">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="${prefix}Confirm">Confirm Password</label>
                <div class="input-icon">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="${prefix}Confirm" placeholder="Re-enter password" required>
                    <button type="button" class="toggle-eye" data-target="${prefix}Confirm" aria-label="Toggle password">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="primary-btn auth-submit" id="userRegisterSubmitBtn">
                <i class="fa-solid fa-user-plus"></i> Complete Villager Registration
            </button>
        `;
    }

    buildRegisterFields($("#userRegisterForm"), "user");

    const STATE_DATA_MAP = {
        Maharashtra: {
            allDistricts: typeof MAHARASHTRA_ALL_DISTRICTS !== "undefined" ? MAHARASHTRA_ALL_DISTRICTS : [],
            data: typeof MAHARASHTRA_DATA !== "undefined" ? MAHARASHTRA_DATA : {},
        },
        Karnataka: {
            allDistricts: typeof KARNATAKA_ALL_DISTRICTS !== "undefined" ? KARNATAKA_ALL_DISTRICTS : [],
            data: typeof KARNATAKA_DATA !== "undefined" ? KARNATAKA_DATA : {},
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
        if (!stateSelect || !distSelect || !talSelect || !villageSelect) return;

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
            const talukas = stateInfo?.data[district] ? Object.keys(stateInfo.data[district]) : [];
            resetSelect(villageSelect, "Select taluka first");

            if (talukas.length) {
                fillSelect(talSelect, talukas, "Select taluka");
                talSelect.disabled = false;
            } else {
                resetSelect(talSelect, "No taluka data available");
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
                resetSelect(villageSelect, "No village data available");
            }
        });
    }

    initLocationCascade("user");

    // Villager registration submission
    $("#userRegisterForm")?.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = $("#userName")?.value.trim();
        const state = $("#userState")?.value;
        const dist = $("#userDist")?.value;
        const tal = $("#userTal")?.value;
        const village = $("#userVillage")?.value;
        const mobile = $("#userMobile")?.value.trim();
        const gmail = $("#userGmail")?.value.trim().toLowerCase();
        const password = $("#userPassword")?.value;
        const confirm = $("#userConfirm")?.value;

        if (!name || !state || !dist || !tal || !village || !mobile || !gmail || !password) {
            showToast("Missing Fields", "Please complete all fields in the registration form.", true);
            return;
        }

        if (!isMobile(mobile)) {
            setFieldError($("#userMobile"), "Enter a valid 10-digit mobile number.");
            return;
        }

        if (password.length < 6) {
            setFieldError($("#userPassword"), "Password must be at least 6 characters.");
            return;
        }

        if (password !== confirm) {
            setFieldError($("#userConfirm"), "Passwords do not match.");
            return;
        }

        if (gmail === SARPANCH_EMAIL) {
            setFieldError($("#userGmail"), "This email is reserved for the village Sarpanch.");
            return;
        }

        const users = getUsers();
        if (users.some((u) => (u.gmail || u.email || "").toLowerCase() === gmail)) {
            setFieldError($("#userGmail"), "An account with this email address already exists.");
            return;
        }

        const newVillager = {
            name,
            state,
            dist,
            tal,
            village,
            mobile,
            gmail,
            email: gmail,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newVillager);
        saveUsers(users);

        showToast("Registration Successful!", `Welcome ${name}! Signing in to your portal...`);

        // Start session right away
        setTimeout(() => {
            startSession({
                role: "user",
                email: gmail,
                gmail: gmail,
                name: name,
                village: village,
                phone: mobile,
                dist,
                tal,
                state
            });
        }, 800);
    });

    /* =====================================================
       SESSION START & REDIRECT
       ===================================================== */
    function startSession(session) {
        sessionStorage.setItem("gramvikas-session", JSON.stringify(session));
        showToast("Signed In", `Welcome, ${session.name}! Redirecting...`);
        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);
    }
});
