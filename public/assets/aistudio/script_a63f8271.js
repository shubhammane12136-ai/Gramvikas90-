/* =========================================================
   GRAMVIKAS — VILLAGE DEVELOPMENT DASHBOARD
   script.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       HELPER FUNCTIONS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];


    /* =====================================================
       CURRENT SESSION
       ---------------------------------------------------
       auth-guard.js already redirects to login.html if no
       session exists, so by the time script.js runs there
       should always be a valid session. We read it again
       here (rather than relying on globals from another
       file) so complaint visibility can be scoped to the
       logged-in user.
       ===================================================== */

    function getCurrentSession() {

        try {
            return JSON.parse(
                sessionStorage.getItem("gramvikas-session") || "null"
            );
        } catch (err) {
            return null;
        }
    }

    const currentSession = getCurrentSession();
    const isAdmin = ["admin", "sarpanch"].includes(currentSession?.role);
    const isContractor = currentSession?.role === "contractor";
    const contractorEmail = String(currentSession?.gmail || "").trim().toLowerCase();

    function contractorCanEditProject(project) {
        if (!isContractor || !project) return false;
        const assignedEmail = String(project.contractorEmail || "").trim().toLowerCase();
        const start = project.contractorStart ? Date.parse(project.contractorStart) : 0;
        const deadline = project.contractorDeadline ? Date.parse(project.contractorDeadline) : NaN;
        const now = Date.now();
        return Boolean(assignedEmail && assignedEmail === contractorEmail && Number.isFinite(deadline) && now <= deadline && (!start || (Number.isFinite(start) && now >= start)));
    }

    function contractorAssignmentMessage(project) {
        if (!project) return "This work is not available.";
        if (String(project.contractorEmail || "").trim().toLowerCase() !== contractorEmail) return "This work is assigned to another contractor. View-only access.";
        if (project.contractorStart && Date.now() < Date.parse(project.contractorStart)) return `Editing starts ${new Date(project.contractorStart).toLocaleString("en-IN")}.`;
        if (!project.contractorDeadline || Date.now() > Date.parse(project.contractorDeadline)) return "The editing deadline has passed. View-only access.";
        return `You can update this assigned work until ${new Date(project.contractorDeadline).toLocaleString("en-IN")}.`;
    }

    function toDateTimeLocalValue(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    }


    /* =====================================================
       CURRENT DATE
       ===================================================== */

    const currentDate = $("#currentDate");

    function updateDate() {
        if (!currentDate) return;

        const today = new Date();

        currentDate.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    updateDate();


    /* =====================================================
       MOBILE SIDEBAR
       ===================================================== */

    const sidebar = $("#sidebar");
    const sidebarOverlay = $("#sidebarOverlay");
    const menuToggle = $("#menuToggle");
    const sidebarClose = $("#sidebarClose");

    function closeSidebar() {
        sidebar?.classList.remove("open");
        sidebarOverlay?.classList.remove("show");
    }

    menuToggle?.addEventListener("click", () => {
        sidebar?.classList.add("open");
        sidebarOverlay?.classList.add("show");
    });

    sidebarClose?.addEventListener("click", closeSidebar);

    sidebarOverlay?.addEventListener("click", closeSidebar);


    /* =====================================================
       PAGE NAVIGATION
       (only the selected section is shown, all others
       stay hidden — clicking a sidebar link switches
       the visible "page")
       ===================================================== */

    const navLinks = $$(".nav-link");

    const pageSections = $$(".page-section");

    const pageHeading = $("#pageHeading");

    const pageTitles = {
        dashboard: "Village Profile",
        development: "Development Indicators",
        projects: "Development Projects",
        schemes: "Government Schemes",
        complaints: "Citizen Complaints",
        complaintsDevelopment: "Complaints Development",
        reports: "Reports",
        settings: "Settings"
    };


    function showPage(pageId) {

        const target =
            pageSections.find(
                section => section.id === pageId
            );

        if (!target) return;

        pageSections.forEach(section => {
            section.classList.remove("active");
        });

        target.classList.add("active");

        if (pageHeading && pageTitles[pageId]) {
            pageHeading.textContent = pageTitles[pageId];
        }

        $(".main-content")?.scrollTo({ top: 0, behavior: "auto" });
        window.scrollTo({ top: 0, behavior: "auto" });
    }


    function highlightSubItem(id) {

        const subTarget = document.getElementById(id);

        if (!subTarget) return;

        requestAnimationFrame(() => {

            subTarget.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            subTarget.classList.add("highlight-pulse");

            setTimeout(() => {
                subTarget.classList.remove("highlight-pulse");
            }, 1600);

        });
    }


    navLinks.forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            navLinks.forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");

            const hash =
                link.getAttribute("href")?.replace("#", "");

            const pageId =
                link.dataset.page || hash;

            if (pageId) {
                showPage(pageId);
            }

            // links like Education/Health/Water/Agriculture point
            // to a card *inside* the Development page — show that
            // page, then smoothly scroll to and highlight the card
            if (link.dataset.page && hash && hash !== pageId) {
                highlightSubItem(hash);
            }

            closeSidebar();
        });

    });


    /* =====================================================
       DARK / LIGHT MODE
       ===================================================== */

    const themeToggle = $("#themeToggle");

    const savedTheme =
        localStorage.getItem("gramvikas-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    function updateThemeIcon() {

        const icon =
            themeToggle?.querySelector("i");

        if (!icon) return;

        if (document.body.classList.contains("dark-mode")) {

            icon.className = "fa-solid fa-sun";

        } else {

            icon.className = "fa-solid fa-moon";
        }
    }

    updateThemeIcon();

    function toggleTheme() {

        document.body.classList.toggle("dark-mode");

        const isDark =
            document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "gramvikas-theme",
            isDark ? "dark" : "light"
        );

        updateThemeIcon();

        showToast(
            "Theme Updated",
            isDark
                ? "Dark mode enabled."
                : "Light mode enabled."
        );

        refreshChart();
    }

    themeToggle?.addEventListener("click", toggleTheme);

    $("#settingsThemeToggle")?.addEventListener("click", toggleTheme);


    /* =====================================================
       GLOBAL SEARCH
       ===================================================== */

    const searchInput = $("#globalSearch");

    const SEARCHABLE_SELECTOR =
        ".stat-card, " +
        ".service-card, " +
        ".project-item, " +
        ".announcement-item, " +
        ".indicator-card, " +
        ".scheme-card, " +
        ".report-card, " +
        ".complaint-item, " +
        ".category-complaint-row, " +
        ".category-summary-card, " +
        ".top-complaint-card";

    function performSearch(value) {

        const query =
            value.trim().toLowerCase();

        // Queried live (not cached) since scheme & complaint
        // cards are rendered dynamically after this point.
        const searchableItems = $$(SEARCHABLE_SELECTOR);

        searchableItems.forEach(item => {

            const text =
                item.textContent.toLowerCase();

            if (!query || text.includes(query)) {

                item.style.display = "";

            } else {

                item.style.display = "none";
            }

        });
    }

    searchInput?.addEventListener(
        "input",
        event => {
            performSearch(event.target.value);
        }
    );


    /* =====================================================
       CTRL + K SEARCH SHORTCUT
       ===================================================== */

    document.addEventListener("keydown", event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            searchInput?.focus();
        }

        if (event.key === "Escape") {

            closeSidebar();

            closeNotificationPanel();

            closeModal($("#complaintModal"));

            closeModal($("#reportModal"));

            closeModal($("#photoLightbox"));

            closeModal($("#complaintDetailModal"));
        }

    });


    /* =====================================================
       VILLAGE PROFILE STATS (Population, Households, etc.)
       ---------------------------------------------------
       Stored in localStorage so they persist and can be
       edited. Only admins get an edit button on each card
       (rendered conditionally below) and saveVillageStats()
       re-checks isAdmin before writing, the same "defense in
       depth" pattern used for Development Indicators and
       Projects elsewhere in this file.
       ===================================================== */

    const VILLAGE_STATS_KEY = "gramvikas-village-stats";

    function seedVillageStats() {
        return [
            {
                id: "population", iconClass: "population", icon: "fa-solid fa-users",
                label: "Total Population", value: 8450,
                changeType: "positive", changeAmount: "4.2%",
                subtitle: "Compared to previous year"
            },
            {
                id: "households", iconClass: "households", icon: "fa-solid fa-house",
                label: "Total Households", value: 1825,
                changeType: "positive", changeAmount: "2.8%",
                subtitle: "Registered households"
            },
            {
                id: "literacy", iconClass: "education", icon: "fa-solid fa-book-open",
                label: "Literacy Rate", value: 82, suffix: "%",
                changeType: "positive", changeAmount: "3.5%",
                subtitle: "Above district average"
            },
            {
                id: "development", iconClass: "development", icon: "fa-solid fa-chart-line",
                label: "Development Score", value: 76, suffix: "%",
                changeType: "positive", changeAmount: "8.7%",
                subtitle: "Overall development"
            },
            {
                id: "schools", iconClass: "schools", icon: "fa-solid fa-school",
                label: "Schools Available", value: 6,
                changeType: "positive", changeAmount: "1",
                subtitle: "Primary & secondary schools"
            },
            {
                id: "hospitals", iconClass: "hospitals", icon: "fa-solid fa-hospital",
                label: "Hospitals & Health Centres", value: 2,
                changeType: "positive", changeAmount: "1",
                subtitle: "Public healthcare facilities"
            }
        ];
    }

    function getVillageStats() {

        const stored = localStorage.getItem(VILLAGE_STATS_KEY);

        if (!stored) {
            const seeded = seedVillageStats();
            localStorage.setItem(VILLAGE_STATS_KEY, JSON.stringify(seeded));
            return seeded;
        }

        return JSON.parse(stored);
    }

    function saveVillageStats(stats) {

        if (!isAdmin) return false; // defense in depth — only admins may edit village profile data

        localStorage.setItem(VILLAGE_STATS_KEY, JSON.stringify(stats));
        return true;
    }

    function renderVillageStats() {

        const grid = $("#statsGrid");
        if (!grid) return;

        const stats = getVillageStats();

        grid.innerHTML = stats.map(stat => {

            // Edit button only exists in the markup for admins —
            // villagers get the exact same cards with no control.
            // Sits inside the card, below the subtitle, rather
            // than floating over the corner like the indicator
            // cards do.
            const editBtnHTML = isAdmin
                ? `
                    <button class="stat-edit-btn" data-edit-stat="${stat.id}" title="Edit ${stat.label}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                `
                : "";

            const arrowIcon = stat.changeType === "negative" ? "fa-arrow-down" : "fa-arrow-up";

            return `
                <div class="stat-card" id="stat-${stat.id}">

                    <div class="stat-top">
                        <div class="stat-icon ${stat.iconClass}">
                            <i class="${stat.icon}"></i>
                        </div>

                        <span class="stat-change ${stat.changeType}">
                            <i class="fa-solid ${arrowIcon}"></i>
                            ${stat.changeAmount}
                        </span>
                    </div>

                    <div class="stat-content">
                        <span>${stat.label}</span>
                        <h3 data-value="${stat.value}" data-suffix="${stat.suffix || ""}">${stat.value.toLocaleString("en-IN")}${stat.suffix || ""}</h3>
                        <small>${stat.subtitle}</small>
                    </div>

                    ${editBtnHTML}

                </div>
            `;
        }).join("");
    }

    renderVillageStats();


    const editVillageStatModal = $("#editVillageStatModal");
    const editVillageStatForm = $("#editVillageStatForm");

    function openVillageStatEditor(statId) {

        if (!isAdmin) return; // defense in depth — button doesn't exist for villagers anyway

        const stats = getVillageStats();
        const stat = stats.find(s => s.id === statId);

        if (!stat) return;

        $("#villageStatModalTitle").textContent = `Edit ${stat.label}`;
        $("#villageStatId").value = stat.id;
        $("#villageStatValue").value = stat.value;
        $("#villageStatChangeDirection").value = stat.changeType === "negative" ? "negative" : "positive";
        $("#villageStatChangeAmount").value = stat.changeAmount;
        $("#villageStatSubtitle").value = stat.subtitle;

        openModal(editVillageStatModal);
    }

    $("#statsGrid")?.addEventListener(
        "click",
        event => {
            const btn = event.target.closest("[data-edit-stat]");
            if (!btn) return;
            openVillageStatEditor(btn.dataset.editStat);
        }
    );

    $("#closeEditVillageStatModal")?.addEventListener(
        "click",
        () => closeModal(editVillageStatModal)
    );

    editVillageStatModal?.addEventListener(
        "click",
        event => {
            if (event.target === editVillageStatModal) closeModal(editVillageStatModal);
        }
    );

    editVillageStatForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (!isAdmin) {
                showToast("Not Authorized", "Only admins can edit village profile data.");
                closeModal(editVillageStatModal);
                return;
            }

            const id = $("#villageStatId").value;
            const stats = getVillageStats();
            const stat = stats.find(s => s.id === id);

            if (!stat) {
                closeModal(editVillageStatModal);
                return;
            }

            stat.value = Number($("#villageStatValue").value) || 0;
            stat.changeType = $("#villageStatChangeDirection").value === "negative" ? "negative" : "positive";
            stat.changeAmount = $("#villageStatChangeAmount").value.trim();
            stat.subtitle = $("#villageStatSubtitle").value.trim();

            const saved = saveVillageStats(stats);

            if (!saved) {
                showToast("Not Authorized", "Only admins can edit village profile data.");
                closeModal(editVillageStatModal);
                return;
            }

            renderVillageStats();
            initStatCounters();

            closeModal(editVillageStatModal);

            showToast("Village Profile Updated", `${stat.label} has been updated.`);
        }
    );


    /* =====================================================
       ANIMATED COUNTERS
       ===================================================== */

    function animateCounter(element) {

        const target =
            Number(element.dataset.value || 0);

        const suffix =
            element.dataset.suffix || "";

        const duration = 1400;

        const startTime = performance.now();

        function updateCounter(currentTime) {

            const progress =
                Math.min(
                    (currentTime - startTime) / duration,
                    1
                );

            const eased =
                1 - Math.pow(1 - progress, 3);

            const value =
                Math.round(target * eased);

            element.textContent =
                value.toLocaleString("en-IN") + suffix;

            if (progress < 1) {

                requestAnimationFrame(updateCounter);

            }

        }

        requestAnimationFrame(updateCounter);
    }

    // Re-run whenever the stats grid re-renders (e.g. after an
    // admin saves an edit) so the new/changed cards count up too.
    function initStatCounters() {

        const counters = $$("#statsGrid [data-value]");

        if ("IntersectionObserver" in window) {

            const counterObserver =
                new IntersectionObserver(
                    entries => {

                        entries.forEach(entry => {

                            if (
                                entry.isIntersecting &&
                                !entry.target.dataset.animated
                            ) {

                                entry.target.dataset.animated =
                                    "true";

                                animateCounter(entry.target);
                            }

                        });

                    },
                    {
                        threshold: 0.5
                    }
                );

            counters.forEach(counter => {
                counterObserver.observe(counter);
            });

        } else {

            counters.forEach(counter => {
                animateCounter(counter);
            });
        }
    }

    initStatCounters();


    /* =====================================================
       PROGRESS BAR ANIMATION
       ===================================================== */

    const progressBars =
        $$(".progress-fill");

    if ("IntersectionObserver" in window) {

        const progressObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting)
                            return;

                        const bar =
                            entry.target;

                        if (bar.dataset.done)
                            return;

                        bar.dataset.done = "true";

                        const width =
                            bar.style.width;

                        bar.style.width = "0";

                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);

                    });

                },
                {
                    threshold: 0.3
                }
            );

        progressBars.forEach(bar => {
            progressObserver.observe(bar);
        });
    }


    /* =====================================================
       DEVELOPMENT CHART
       ===================================================== */

    let developmentChart = null;

    const chartCanvas =
        $("#developmentChart");

    const chartData = {

        year: {

            labels: [
                "Education",
                "Health",
                "Agriculture",
                "Water",
                "Infrastructure",
                "Energy"
            ],

            values: [
                84,
                72,
                79,
                75,
                81,
                88
            ]

        },

        month: {

            labels: [
                "Education",
                "Health",
                "Agriculture",
                "Water",
                "Infrastructure",
                "Energy"
            ],

            values: [
                86,
                75,
                81,
                78,
                83,
                90
            ]

        },

        quarter: {

            labels: [
                "Education",
                "Health",
                "Agriculture",
                "Water",
                "Infrastructure",
                "Energy"
            ],

            values: [
                82,
                70,
                76,
                73,
                79,
                85
            ]

        }

    };


    function createChart(period = "year") {

        if (
            !chartCanvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }

        const dark =
            document.body.classList.contains("dark-mode");

        const textColor =
            dark ? "#cbd5e1" : "#475569";

        const gridColor =
            dark
                ? "rgba(148,163,184,.12)"
                : "rgba(148,163,184,.18)";

        const selectedData =
            chartData[period] ||
            chartData.year;


        if (developmentChart) {
            developmentChart.destroy();
        }


        developmentChart = new Chart(
            chartCanvas,
            {

                type: "bar",

                data: {

                    labels:
                        selectedData.labels,

                    datasets: [

                        {

                            label:
                                "Development %",

                            data:
                                selectedData.values,

                            borderRadius: 8,

                            borderSkipped:
                                false,

                            backgroundColor: [

                                "rgba(37,99,235,.82)",

                                "rgba(124,58,237,.82)",

                                "rgba(16,185,129,.82)",

                                "rgba(6,182,212,.82)",

                                "rgba(245,158,11,.82)",

                                "rgba(239,68,68,.72)"

                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: {

                        duration: 1100,

                        easing:
                            "easeOutQuart"

                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            displayColors:
                                false,

                            callbacks: {

                                label:
                                    context =>
                                        `${context.raw}% development`

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {

                                color:
                                    textColor,

                                font: {
                                    size: 9
                                }

                            }

                        },

                        y: {

                            beginAtZero:
                                true,

                            max: 100,

                            grid: {

                                color:
                                    gridColor

                            },

                            ticks: {

                                color:
                                    textColor,

                                font: {
                                    size: 9
                                },

                                callback:
                                    value =>
                                        `${value}%`

                            }

                        }

                    }

                }

            }
        );
    }


    function refreshChart() {

        const selector =
            $("#chartPeriod");

        const period =
            selector
                ? selector.value
                : "year";

        createChart(period);
    }

    refreshChart();


    /* =====================================================
       CHART PERIOD
       ===================================================== */

    $("#chartPeriod")?.addEventListener(
        "change",
        event => {

            createChart(
                event.target.value
            );

            const selectedText =
                event.target.options[
                    event.target.selectedIndex
                ].text;

            showToast(
                "Chart Updated",
                `Showing ${selectedText}.`
            );
        }
    );


    /* =====================================================
       YEAR FILTER
       ===================================================== */

    $("#yearFilter")?.addEventListener(
        "change",
        event => {

            showToast(
                "Year Selected",
                `Dashboard data selected for ${event.target.value}.`
            );
        }
    );


    /* =====================================================
       NOTIFICATION PANEL
       ===================================================== */

    const notificationPanel =
        $("#notificationPanel");

    const notificationBtn =
        $("#notificationBtn");

    const closeNotifications =
        $("#closeNotifications");


    function closeNotificationPanel() {

        notificationPanel?.classList.remove(
            "show"
        );
    }


    notificationBtn?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            notificationPanel?.classList.toggle(
                "show"
            );

        }
    );


    closeNotifications?.addEventListener(
        "click",
        closeNotificationPanel
    );


    document.addEventListener(
        "click",
        event => {

            if (
                notificationPanel &&
                !notificationPanel.contains(event.target) &&
                !notificationBtn?.contains(event.target)
            ) {

                closeNotificationPanel();
            }

        }
    );


    /* =====================================================
       CLEAR NOTIFICATIONS
       ===================================================== */

    $("#clearNotifications")?.addEventListener(
        "click",
        () => {

            $$(".notification-item.unread")
                .forEach(item => {

                    item.classList.remove(
                        "unread"
                    );

                });


            const count =
                notificationPanel?.querySelector(
                    ".notification-header span"
                );

            if (count) {

                count.textContent =
                    "All notifications read";
            }


            const badge =
                notificationBtn?.querySelector(
                    "span"
                );

            if (badge) {

                badge.style.display =
                    "none";
            }


            showToast(
                "Notifications Cleared",
                "All notifications have been marked as read."
            );

        }
    );


    /* =====================================================
       MODAL FUNCTIONS
       ===================================================== */

    function openModal(modal) {

        if (!modal) return;

        modal.classList.add("show");
    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("show");
    }


    /* =====================================================
       COMPLAINTS — CATEGORY META & SEED DATA

       Complaints are stored in localStorage under
       "gramvikas-complaints". If none exist yet (first visit),
       we seed a realistic starter set so the "Top 3 Most
       Complained Topics" cards and the citizen complaint list
       aren't empty. Anything the user submits via the form is
       appended to the same array.
       ===================================================== */

    const complaintCategoryMeta = {
        sarpanch:    { label: "Grievance on Sarpanch", icon: "fa-solid fa-scale-balanced" },
        water:       { label: "Water Supply", icon: "fa-solid fa-droplet" },
        road:        { label: "Roads",        icon: "fa-solid fa-road" },
        electricity: { label: "Electricity",  icon: "fa-solid fa-bolt" },
        sanitation:  { label: "Sanitation",   icon: "fa-solid fa-broom" },
        education:   { label: "Education",    icon: "fa-solid fa-school" },
        health:      { label: "Healthcare",   icon: "fa-solid fa-heart-pulse" },
        other:       { label: "Other",        icon: "fa-solid fa-circle-question" }
    };

    function seedComplaints() {
        return [
            { name: "Kishore Jadhav", category: "sarpanch", grievanceType: "Project Quality / Work Delay", escalationAuthority: "Block Development Officer (BDO)", confidential: false, gender: "male", description: "Ward 3 concrete road work stopped for 4 months despite funds sanctioned; Sarpanch has not provided expenditure accounts.", location: "Ward 3, Village Center", date: "2026-08-01T10:15:00", status: "Under BDO Inquiry", sarpanchResponse: "Contractor was issued a show-cause notice on 2nd August. Materials arrived last week and work is resuming." },
            { name: "Sunanda Patil",  category: "sarpanch", grievanceType: "Scheme Beneficiary Bias", escalationAuthority: "CEO, Zilla Parishad", confidential: true, gender: "female", description: "PMAY housing beneficiary list was altered without open Gram Sabha ratifications. Deserving BPL families were left out.", location: "East Hamlets", date: "2026-08-04T14:30:00", status: "Notice Issued", sarpanchResponse: "" },
            { name: "Ramesh Patil",   category: "water",       gender: "male",   description: "Low water pressure in East Ward tap connections for the past week.", location: "East Ward, near community tap", date: "2026-07-18T09:20:00", status: "Resolved" },
            { name: "Sunita Kadam",   category: "water",       gender: "female", description: "No tap water supply for 3 days near the Gram Panchayat office.", location: "Near Gram Panchayat office", date: "2026-07-22T11:05:00", status: "Resolved" },
            { name: "Anil More",     category: "water",       gender: "male",   description: "Water tank overflow flooding the lane every morning.", location: "Ward 3, water tank lane", date: "2026-07-25T08:15:00", status: "In Progress" },
            { name: "Kavita Jadhav",  category: "water",       gender: "female", description: "Muddy/contaminated water coming from the community tap.", location: "West Ward community tap", date: "2026-07-29T14:40:00", status: "Pending" },
            { name: "Suresh Pawar",  category: "water",       gender: "male",   description: "Borewell near the school has stopped working.", location: "Near Village Primary School", date: "2026-08-01T10:00:00", status: "Pending" },
            { name: "Manisha Gaikwad", category: "water",      gender: "female", description: "Irregular water supply timing disrupts daily chores.", location: "Ward 2, main street", date: "2026-08-03T17:30:00", status: "Pending" },
            { name: "Vishal Chavan", category: "water",       gender: "male",   description: "Leaking main pipeline wasting water on the main road.", location: "Main Road, near bus stop", date: "2026-08-05T09:45:00", status: "Resolved" },

            { name: "Prakash Deshmukh", category: "road",       gender: "male",   description: "Large potholes on the main road causing accidents.", location: "Main Road, opposite market", date: "2026-07-15T08:00:00", status: "Resolved" },
            { name: "Rekha Shinde",   category: "road",       gender: "female", description: "Street lights not working, road is unsafe at night.", location: "Ward 4, market road", date: "2026-07-20T19:10:00", status: "Resolved" },
            { name: "Ganesh Bhosale", category: "road",       gender: "male",   description: "Road connecting to the primary school is unpaved and muddy in rain.", location: "School Road", date: "2026-07-24T07:50:00", status: "In Progress" },
            { name: "Pooja Nikam",   category: "road",       gender: "female", description: "Broken culvert near the bus stop needs urgent repair.", location: "Near Bus Stop", date: "2026-07-30T12:20:00", status: "Pending" },
            { name: "Ravindra Salunkhe", category: "road",     gender: "male",   description: "No footpath along the highway stretch, unsafe for pedestrians.", location: "Highway stretch, Ward 1", date: "2026-08-02T16:00:00", status: "Pending" },
            { name: "Ashwini Kale",  category: "road",       gender: "female", description: "Speed breakers needed near the anganwadi centre.", location: "Near Anganwadi Centre", date: "2026-08-04T13:15:00", status: "Resolved" },

            { name: "Dattatray Mane", category: "electricity", gender: "male",   description: "Frequent power cuts during evening hours.", location: "Ward 2, residential lane", date: "2026-07-17T20:30:00", status: "Resolved" },
            { name: "Sneha Waghmare", category: "electricity", gender: "female", description: "Transformer near the market making a loud humming noise.", location: "Near Village Market", date: "2026-07-26T18:45:00", status: "In Progress" },
            { name: "Vijay Thorat",  category: "electricity", gender: "male",   description: "Exposed electric wires near the school compound wall.", location: "Near Village Primary School", date: "2026-08-01T11:30:00", status: "Pending" },
            { name: "Nikita Pol",    category: "electricity", gender: "female", description: "Street light pole damaged and sparking after the storm.", location: "Ward 5, main junction", date: "2026-08-06T21:00:00", status: "Resolved" },

            { name: "Sanjay Bhandare", category: "sanitation",  gender: "male",   description: "Garbage not collected from the ward for over a week.", location: "Ward 3", date: "2026-07-19T09:00:00", status: "Resolved" },
            { name: "Meena Ghadge",  category: "sanitation",  gender: "female", description: "Public toilet block near the market needs cleaning.", location: "Near Village Market", date: "2026-07-28T10:40:00", status: "In Progress" },
            { name: "Ajay Kulkarni", category: "sanitation",  gender: "male",   description: "Open drainage overflowing behind the housing colony.", location: "Behind Housing Colony", date: "2026-08-03T15:20:00", status: "Resolved" },

            { name: "Shalini Rane",  category: "health",      gender: "female", description: "Health sub-centre often out of basic medicines.", location: "Village Health Sub-Centre", date: "2026-07-21T10:15:00", status: "Resolved" },
            { name: "Nitin Sawant",  category: "health",      gender: "male",   description: "No doctor available at the PHC on weekends.", location: "Primary Health Centre (PHC)", date: "2026-08-02T09:30:00", status: "Pending" },

            { name: "Priya Naik",    category: "education",   gender: "female", description: "Shortage of teachers at the village primary school.", location: "Village Primary School", date: "2026-07-23T13:00:00", status: "In Progress" },

            { name: "Baban Wagh",    category: "other",       gender: "male",   description: "Stray cattle causing traffic issues near the chowk.", location: "Main Chowk", date: "2026-07-27T08:30:00", status: "Resolved" }
        ];
    }

    function getComplaints() {

        const stored = localStorage.getItem("gramvikas-complaints");

        const complaints = stored
            ? JSON.parse(stored)
            : seedComplaints();

        let needsSave = !stored;

        // Ensure Sarpanch grievances exist even if localStorage was seeded in earlier session
        if (!complaints.some(c => c.category === "sarpanch")) {
            complaints.unshift(
                {
                    id: "c-sarpanch-1",
                    name: "Kishore Jadhav",
                    category: "sarpanch",
                    grievanceType: "Project Quality / Work Delay",
                    escalationAuthority: "Block Development Officer (BDO)",
                    confidential: false,
                    gender: "male",
                    description: "Ward 3 concrete road work stopped for 4 months despite funds sanctioned; Sarpanch has not provided expenditure accounts.",
                    location: "Ward 3, Village Center",
                    date: "2026-08-01T10:15:00",
                    status: "Under BDO Inquiry",
                    sarpanchResponse: "Contractor was issued a show-cause notice on 2nd August. Materials arrived last week and work is resuming."
                },
                {
                    id: "c-sarpanch-2",
                    name: "Sunanda Patil",
                    category: "sarpanch",
                    grievanceType: "Scheme Beneficiary Bias",
                    escalationAuthority: "CEO, Zilla Parishad",
                    confidential: true,
                    gender: "female",
                    description: "PMAY housing beneficiary list was altered without open Gram Sabha ratifications. Deserving BPL families were left out.",
                    location: "East Hamlets",
                    date: "2026-08-04T14:30:00",
                    status: "Notice Issued",
                    sarpanchResponse: ""
                }
            );
            needsSave = true;
        }

        // Every complaint needs a stable id so a clicked card can be
        // matched back to its full record for the detail modal.
        complaints.forEach((c, index) => {
            if (!c.id) {
                c.id = `c-${index}-${new Date(c.date).getTime() || Date.now()}`;
                needsSave = true;
            }
        });

        if (needsSave) {
            localStorage.setItem(
                "gramvikas-complaints",
                JSON.stringify(complaints)
            );
        }

        return complaints;
    }


    /* =====================================================
       COMPLAINT VISIBILITY
       ---------------------------------------------------
       - Admins see every complaint (that's the whole point
         of the dashboard's complaint-management view).
       - Villagers only see complaints they personally
         submitted (matched on the Gmail stored on the
         complaint). Older/seeded complaints have no
         ownerEmail, so they belong to nobody and stay
         admin-only.
       ===================================================== */

    function getVisibleComplaints() {

        const all = getComplaints();

        if (isAdmin) return all;

        const myEmail = (currentSession?.gmail || "").toLowerCase();

        if (!myEmail) return [];

        return all.filter(
            c => (c.ownerEmail || "").toLowerCase() === myEmail
        );
    }


    /* =====================================================
       COMPLAINT MODAL
       ===================================================== */

    const complaintModal =
        $("#complaintModal");

    const complaintForm =
        $("#complaintForm");


    function openComplaintModal(categoryDefault = null) {
        const nameInput = $("#citizenName");
        if (nameInput && currentSession?.name) {
            nameInput.value = currentSession.name;
            nameInput.readOnly = true;
        }
        const categorySelect = $("#complaintCategory");
        const sarpanchPanel = $("#sarpanchGrievancePanel");
        if (categoryDefault && categorySelect) {
            categorySelect.value = categoryDefault;
        }
        if (sarpanchPanel && categorySelect) {
            sarpanchPanel.hidden = categorySelect.value !== "sarpanch";
        }
        openModal(complaintModal);
    }

    $("#addComplaintBtn")?.addEventListener("click", () => openComplaintModal());
    $("#addSarpanchComplaintBtn")?.addEventListener("click", () => openComplaintModal("sarpanch"));

    $("#complaintCategory")?.addEventListener("change", event => {
        const sarpanchPanel = $("#sarpanchGrievancePanel");
        if (sarpanchPanel) {
            sarpanchPanel.hidden = event.target.value !== "sarpanch";
        }
    });


    $("#closeComplaintModal")?.addEventListener(
        "click",
        () => {
            closeModal(complaintModal);
        }
    );


    $("#cancelComplaint")?.addEventListener(
        "click",
        () => {
            closeModal(complaintModal);
        }
    );


    complaintModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === complaintModal
            ) {

                closeModal(complaintModal);
            }

        }
    );


    /* =====================================================
       COMPLAINT PHOTO ATTACHMENT

       There's no backend here — complaints (and any attached
       photo) are persisted to localStorage — so the photo is
       downscaled and re-encoded to a compact JPEG data URL on
       the client before it's stored. That keeps even a large
       phone-camera photo small enough to sit alongside the
       rest of the complaint data.
       ===================================================== */

    const photoUpload =
        $("#photoUpload");

    const complaintPhotoInput =
        $("#complaintPhoto");

    const photoUploadEmpty =
        $("#photoUploadEmpty");

    const photoUploadPreview =
        $("#photoUploadPreview");

    const photoPreviewImg =
        $("#photoPreviewImg");

    const removePhotoBtn =
        $("#removePhotoBtn");


    const MAX_PHOTO_SOURCE_BYTES = 8 * 1024 * 1024; // 8MB original upload
    const MAX_PHOTO_DIMENSION = 1280;                // longest side, in px

    let complaintPhotoData = null; // compressed data URL, or null


    function showPhotoPreview(dataUrl) {

        complaintPhotoData = dataUrl;

        if (photoPreviewImg) photoPreviewImg.src = dataUrl;

        photoUploadEmpty?.setAttribute("hidden", "");
        photoUploadPreview?.removeAttribute("hidden");
    }


    function clearPhotoField() {

        complaintPhotoData = null;

        if (complaintPhotoInput) complaintPhotoInput.value = "";
        if (photoPreviewImg) photoPreviewImg.src = "";

        photoUploadPreview?.setAttribute("hidden", "");
        photoUploadEmpty?.removeAttribute("hidden");
    }


    // Reads the file, draws it to a canvas at a capped size,
    // and resolves with a compressed JPEG data URL.
    function compressPhoto(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onerror = () =>
                reject(new Error("Could not read the selected file."));

            reader.onload = () => {

                const img = new Image();

                img.onerror = () =>
                    reject(new Error("Could not decode the selected image."));

                img.onload = () => {

                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_PHOTO_DIMENSION || height > MAX_PHOTO_DIMENSION) {

                        const scale =
                            MAX_PHOTO_DIMENSION / Math.max(width, height);

                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }

                    const canvas =
                        document.createElement("canvas");

                    canvas.width = width;
                    canvas.height = height;

                    const ctx =
                        canvas.getContext("2d");

                    // Flatten any transparency onto white before
                    // encoding as JPEG.
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL("image/jpeg", 0.72));
                };

                img.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }


    photoUpload?.addEventListener(
        "click",
        event => {

            // Let the remove button handle its own click instead
            // of re-opening the file picker underneath it.
            if (event.target.closest(".photo-remove-btn")) return;

            complaintPhotoInput?.click();
        }
    );


    complaintPhotoInput?.addEventListener(
        "change",
        async () => {

            const file =
                complaintPhotoInput.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                showToast(
                    "Unsupported File",
                    "Please attach an image file (JPG, PNG, etc.)."
                );

                complaintPhotoInput.value = "";
                return;
            }

            if (file.size > MAX_PHOTO_SOURCE_BYTES) {

                showToast(
                    "Photo Too Large",
                    "Please attach a photo smaller than 8MB."
                );

                complaintPhotoInput.value = "";
                return;
            }

            try {

                const compressed =
                    await compressPhoto(file);

                showPhotoPreview(compressed);

            } catch (err) {

                showToast(
                    "Upload Failed",
                    "That photo couldn't be processed. Please try another one."
                );

                complaintPhotoInput.value = "";
            }

        }
    );


    removePhotoBtn?.addEventListener(
        "click",
        () => {
            clearPhotoField();
        }
    );


    /* =====================================================
       SAVE COMPLAINT
       ===================================================== */

    complaintForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                $("#citizenName")?.value.trim();

            const category =
                $("#complaintCategory")?.value;

            const gender =
                $("#complaintGender")?.value;

            const location =
                $("#complaintLocation")?.value.trim();

            const description =
                $("#complaintDescription")
                    ?.value.trim();


            if (
                !name ||
                !category ||
                !gender ||
                !location ||
                !description
            ) {

                showToast(
                    "Missing Information",
                    "Please complete all complaint fields."
                );

                return;
            }


            const complaints = getComplaints();


            const isSarpanchGrievance = category === "sarpanch";
            const grievanceType = isSarpanchGrievance ? $("#sarpanchIssueType")?.value : "";
            const escalationAuthority = isSarpanchGrievance ? ($("#sarpanchEscalationAuthority")?.value || "Block Development Officer (BDO)") : "";
            const confidential = isSarpanchGrievance && Boolean($("#sarpanchConfidential")?.checked);

            complaints.push({

                id: `c-${Date.now()}`,

                name: name,

                // Tag every new complaint with the submitter's
                // Gmail so it can be matched back to them later.
                ownerEmail:
                    (currentSession?.gmail || "").toLowerCase(),

                category: category,

                grievanceType: grievanceType || "",

                escalationAuthority: escalationAuthority || "",

                confidential: confidential,

                sarpanchResponse: "",

                gender: gender,

                location: location,

                description: description,

                photo:
                    complaintPhotoData || null,

                date:
                    new Date().toISOString(),

                status:
                    isSarpanchGrievance ? "Under BDO Inquiry" : "Pending"

            });


            localStorage.setItem(
                "gramvikas-complaints",
                JSON.stringify(complaints)
            );


            complaintForm.reset();

            clearPhotoField();

            if ($("#sarpanchGrievancePanel")) $("#sarpanchGrievancePanel").hidden = true;

            closeModal(complaintModal);


            showToast(
                isSarpanchGrievance ? "Grievance on Sarpanch Submitted" : "Complaint Submitted",
                isSarpanchGrievance
                    ? `Your complaint on the Sarpanch has been recorded and escalated to the ${escalationAuthority}.`
                    : "Your complaint has been recorded successfully."
            );


            refreshComplaintsUI();

        }
    );


    /* =====================================================
       COMPLAINT STATS, TOP 3 TOPICS & CITIZEN LIST
       ---------------------------------------------------
       Pending / In Progress / Resolved on the summary cards
       below are no longer read from each complaint's own
       stored `status` alone — they're cross-checked against
       Complaints Development. If the admin has posted a
       development update for a complaint, that update's
       percent decides which bucket it falls in, so these
       cards move automatically whenever a development update
       is posted, edited, or deleted (see the two
       refreshComplaintsUI() calls in the COMPLAINTS
       DEVELOPMENT section further down this file).
       ===================================================== */

    // Same localStorage key the Complaints Development section
    // (further down this file) stores its progress updates under.
    // Read directly by key here, rather than calling that section's
    // own getComplaintsDevelopment(), so this code works no matter
    // which part of the script has run yet.
    function getComplaintsDevelopmentUpdates() {
        try {
            return JSON.parse(
                localStorage.getItem("gramvikas-complaints-development") || "[]"
            );
        } catch {
            return [];
        }
    }

    // A complaint's effective status: if one or more Complaints
    // Development updates are linked to it (matched by complaintId),
    // the MOST RECENT one's percent decides — 100% = Resolved,
    // 1-99% = In Progress, 0% = Pending. No linked update yet →
    // fall back to the complaint's own stored status.
    function getEffectiveComplaintStatus(complaint, devUpdates) {

        const linkedUpdates = devUpdates
            .filter(u => u.complaintId === complaint.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (linkedUpdates.length === 0) return complaint.status;

        const percent = Number(linkedUpdates[0].percent) || 0;

        if (percent >= 100) return "Resolved";
        if (percent > 0) return "In Progress";
        return "Pending";
    }

    function updateComplaintStats(complaints) {

        const devUpdates = getComplaintsDevelopmentUpdates();

        const effectiveStatuses = complaints.map(
            c => getEffectiveComplaintStatus(c, devUpdates)
        );

        const total = complaints.length;

        const pending =
            effectiveStatuses.filter(s => s === "Pending").length;

        const progress =
            effectiveStatuses.filter(s => s === "In Progress").length;

        const resolved =
            effectiveStatuses.filter(s => s === "Resolved").length;

        const setText = (id, value) => {
            const el = $(id);
            if (el) el.textContent = value;
        };

        setText("#totalComplaintsCount", total);
        setText("#pendingComplaintsCount", pending);
        setText("#progressComplaintsCount", progress);
        setText("#resolvedComplaintsCount", resolved);
    }

    function renderTopComplaints(complaints) {

        const grid = $("#topComplaintsGrid");

        if (!grid) return;

        // Count complaints per category
        const counts = {};

        complaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });

        const total = complaints.length || 1;

        // Sort categories by complaint count, take top 3
        const topThree = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        grid.innerHTML = topThree
            .map(([categoryKey, count], index) => {

                const meta =
                    complaintCategoryMeta[categoryKey] ||
                    { label: categoryKey, icon: "fa-solid fa-circle-question" };

                const percent = Math.round((count / total) * 100);

                return `
                    <div
                        class="top-complaint-card top-complaint-card-clickable"
                        data-category="${categoryKey}"
                        role="button"
                        tabindex="0"
                        title="View all ${meta.label} complaints"
                    >

                        <div class="top-complaint-rank">#${index + 1}</div>

                        <div class="top-complaint-icon">
                            <i class="${meta.icon}"></i>
                        </div>

                        <div class="top-complaint-content">
                            <h3>${meta.label}</h3>
                            <p><strong>${count}</strong> complaints reported</p>

                            <div class="top-complaint-bar">
                                <div class="top-complaint-bar-fill" style="width:${percent}%"></div>
                            </div>

                            <span class="top-complaint-percent">${percent}% of all complaints</span>
                        </div>

                    </div>
                `;
            })
            .join("");
    }

    /* =====================================================
       COMPLAINT LIST ROW (shared markup)
       ---------------------------------------------------
       Used for both the "Recent Complaints" (top 3) list
       and the admin's full "All Complaints" list. Each row
       is clickable and opens the full detail modal. A photo
       is NEVER shown directly on the row — if one is
       attached, a separate "View Photo" button opens it in
       the lightbox on demand. Admin-only; villagers never
       see this markup.
       ===================================================== */

    function statusClassFor(status) {
        if (status === "Resolved") return "resolved";
        if (status === "In Progress" || status === "Notice Issued" || status === "Under BDO Inquiry") return "progress";
        return "pending";
    }

    /* =====================================================
       COMPLAINTS BY CATEGORY — summary cards
       ---------------------------------------------------
       One card per category: total complaints, that
       category's share of all complaints (%), and a
       male / female / other split of the applicants who
       filed them. Shown to every signed-in user. Admins can
       click a card to drill into that category's individual
       complaints (name, date, time, location, photo) — see
       "CATEGORY COMPLAINTS" below. Villagers see the same
       totals but the cards are not clickable, so individual
       names stay admin-only.
       ===================================================== */

    function genderBreakdownHTML(complaints) {

        const counts = { male: 0, female: 0, other: 0 };

        complaints.forEach(c => {
            const g = (c.gender || "").toLowerCase();
            if (g === "male") counts.male++;
            else if (g === "female") counts.female++;
            else counts.other++;
        });

        const total = complaints.length || 1;

        const genderIcon = {
            male: "fa-solid fa-mars",
            female: "fa-solid fa-venus",
            other: "fa-solid fa-genderless"
        };

        const genderLabel = {
            male: "Male",
            female: "Female",
            other: "Other"
        };

        return ["male", "female", "other"]
            .filter(g => counts[g] > 0)
            .map(g => {
                const pct = Math.round((counts[g] / total) * 100);
                return `
                    <span>
                        <i class="${genderIcon[g]}"></i>
                        ${genderLabel[g]} ${pct}%
                    </span>
                `;
            })
            .join("");
    }

    function renderComplaintCategoryCards(complaints) {

        const grid = $("#complaintCategoryGrid");

        if (!grid) return;

        if (complaints.length === 0) {

            grid.innerHTML = `
                <div class="complaint-empty">
                    <i class="fa-solid fa-comments"></i>
                    <p>No complaints have been submitted yet.</p>
                </div>
            `;

            return;
        }

        const total = complaints.length;

        // Group complaints by category
        const byCategory = {};

        complaints.forEach(c => {
            (byCategory[c.category] ||= []).push(c);
        });

        // Show every known category (even 0-count ones), highest first
        const categories = Object.keys(complaintCategoryMeta)
            .map(key => ({
                key,
                meta: complaintCategoryMeta[key],
                items: byCategory[key] || []
            }))
            .sort((a, b) => b.items.length - a.items.length);

        grid.innerHTML = categories
            .map(({ key, meta, items }) => {

                const count = items.length;
                const percent = Math.round((count / total) * 100);

                const clickableAttrs = isAdmin
                    ? `data-category="${key}" role="button" tabindex="0" title="View ${meta.label} complaints"`
                    : "";

                return `
                    <div
                        class="category-summary-card ${isAdmin ? "category-summary-card-clickable" : ""}"
                        ${clickableAttrs}
                    >

                        <div class="category-summary-icon">
                            <i class="${meta.icon}"></i>
                        </div>

                        <div class="category-summary-body">

                            <h4>${meta.label}</h4>

                            ${
                                count > 0
                                    ? `
                                        <div class="category-summary-count">
                                            ${count}<span>complaints</span>
                                        </div>

                                        <div class="category-summary-percent-bar">
                                            <div class="category-summary-percent-fill" style="width:${percent}%"></div>
                                        </div>
                                        <span class="category-summary-percent-label">${percent}% of all complaints</span>

                                        <div class="category-summary-gender">
                                            ${genderBreakdownHTML(items)}
                                        </div>
                                    `
                                    : `<div class="category-count-empty">No complaints yet</div>`
                            }

                        </div>

                    </div>
                `;
            })
            .join("");
    }



    /* =====================================================
       CATEGORY COMPLAINTS (single-line list, admin only)
       ---------------------------------------------------
       Clicking a "Top 3 Most Complained Topics" card (e.g.
       Healthcare) drills into every complaint filed under
       that category, shown as one row per complaint — name,
       date, time and location all side by side on one line,
       with a "View Image" button pinned to the end of the
       row. The photo itself is never shown inline — the
       button only reveals it on demand, same as elsewhere.
       ===================================================== */

    function categoryComplaintCardHTML(c) {

        const dt = new Date(c.date);

        const dateLabel = dt.toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short", year: "numeric" }
        );

        const timeLabel = dt.toLocaleTimeString(
            "en-IN",
            { hour: "2-digit", minute: "2-digit" }
        );

        const isOwner = Boolean(currentSession?.gmail && c.ownerEmail && currentSession.gmail.toLowerCase() === c.ownerEmail.toLowerCase());
        const isConfidential = Boolean(c.confidential);
        const displayName = (isConfidential && !isOwner) ? "Confidential Villager (Protected)" : (c.name || "Unknown");
        const initial = isConfidential && !isOwner ? "🛡️" : ((c.name || "?").trim().charAt(0).toUpperCase() || "?");

        const photoActionHTML = c.photo
            ? `
                <button
                    class="secondary-btn small"
                    data-view-photo
                    data-photo-src="${c.photo}"
                >
                    <i class="fa-regular fa-image"></i>
                    <span>View Image</span>
                </button>
            `
            : `
                <span class="category-complaint-noimg">
                    <i class="fa-regular fa-image"></i> No image
                </span>
            `;

        const sarpanchBadgeHTML = c.category === "sarpanch"
            ? `<span class="complaint-badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5" title="Escalated for administrative inquiry"><i class="fa-solid fa-scale-balanced"></i> ${escapeHTML(c.escalationAuthority || "BDO Review")}</span>`
            : "";

        const replyBadgeHTML = c.sarpanchResponse
            ? `<span class="complaint-badge" style="background:#dcfce7;color:#166534" title="Official Sarpanch explanation recorded"><i class="fa-solid fa-reply"></i> Clarified</span>`
            : "";

        return `
            <div
                class="category-complaint-row"
                data-complaint-id="${c.id}"
                role="button"
                tabindex="0"
            >

                <div class="category-complaint-avatar" style="${c.category === 'sarpanch' ? 'background:#fee2e2;color:#dc2626' : ''}">${initial}</div>

                <div class="category-complaint-row-field name">
                    <span class="field-label">Applicant</span>
                    <strong>${escapeHTML(displayName)}</strong>
                    ${c.grievanceType ? `<small style="font-size:8.5px;color:#b91c1c;font-weight:600">${escapeHTML(c.grievanceType)}</small>` : ""}
                </div>

                <div class="category-complaint-row-field date">
                    <span class="field-label">Date</span>
                    <strong><i class="fa-regular fa-calendar"></i> ${dateLabel}</strong>
                </div>

                <div class="category-complaint-row-field time">
                    <span class="field-label">Time</span>
                    <strong><i class="fa-regular fa-clock"></i> ${timeLabel}</strong>
                </div>

                <div class="category-complaint-row-field location">
                    <span class="field-label">Location</span>
                    <strong><i class="fa-solid fa-location-dot"></i> ${escapeHTML(c.location || "Not specified")}</strong>
                </div>

                <span class="complaint-badge ${statusClassFor(c.status)}">${c.status}</span>
                ${sarpanchBadgeHTML}
                ${replyBadgeHTML}

                <div class="category-complaint-row-actions">
                    ${photoActionHTML}
                </div>

            </div>
        `;
    }

    function renderCategoryComplaints(categoryKey) {

        const grid = $("#categoryComplaintsGrid");

        if (!grid) return;

        const meta =
            complaintCategoryMeta[categoryKey] ||
            { label: categoryKey, icon: "fa-solid fa-circle-question" };

        const titleEl = $("#categoryComplaintsTitle");
        if (titleEl) titleEl.textContent = `${meta.label} Complaints`;

        const iconEl = $("#categoryComplaintsIcon");
        if (iconEl) iconEl.className = meta.icon;

        const complaints = getComplaints()
            .filter(c => c.category === categoryKey)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (complaints.length === 0) {

            grid.innerHTML = `
                <div class="complaint-empty">
                    <i class="fa-solid fa-comments"></i>
                    <p>No ${meta.label} complaints have been submitted yet.</p>
                </div>
            `;

            return;
        }

        grid.innerHTML = complaints.map(categoryComplaintCardHTML).join("");
    }

    function openCategoryComplaints(categoryKey) {

        // Individual complaint details (names, photos) stay
        // admin-only — villagers only ever see the category totals.
        if (!isAdmin) return;

        renderCategoryComplaints(categoryKey);

        $("#topComplaintsSection")?.classList.add("hidden");
        $("#citizenComplaintsSection")?.classList.add("hidden");
        $("#categoryComplaintsSection")?.classList.remove("hidden");
    }

    function closeCategoryComplaints() {

        $("#categoryComplaintsSection")?.classList.add("hidden");
        $("#citizenComplaintsSection")?.classList.remove("hidden");

        if (isAdmin) {
            $("#topComplaintsSection")?.classList.remove("hidden");
        }
    }

    $("#backToComplaintsBtn")?.addEventListener(
        "click",
        closeCategoryComplaints
    );


    /* =====================================================
       COMPLAINT DETAIL MODAL (admin only)
       ---------------------------------------------------
       Clicking any complaint card — in "Recent Complaints"
       or the full "All Complaints" list — opens this modal
       with the complaint's full detail: who filed it, the
       date, the time, and the attached photo (if any).
       ===================================================== */

    const complaintDetailModal = $("#complaintDetailModal");

    function findComplaintById(id) {
        return getComplaints().find(c => c.id === id) || null;
    }

    function setDetailText(selector, value) {
        const el = $(selector);
        if (el) el.textContent = value;
    }

    let activeComplaintDetailId = null;

    function openComplaintDetail(id) {

        activeComplaintDetailId = id;
        const c = findComplaintById(id);

        if (!c) return;

        const isOwner = Boolean(currentSession?.gmail && c.ownerEmail && currentSession.gmail.toLowerCase() === c.ownerEmail.toLowerCase());
        const isConfidential = Boolean(c.confidential);
        const displayName = (isConfidential && !isOwner) ? "Confidential Villager (Identity Protected)" : (c.name || "Unknown");
        const displayEmail = (isConfidential && !isOwner) ? "Protected under Whistleblower Rule" : (c.ownerEmail || "Not available");

        const meta =
            complaintCategoryMeta[c.category] ||
            { label: c.category, icon: "fa-solid fa-circle-question" };

        const dt = new Date(c.date);

        const dateLabel = dt.toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "long", year: "numeric" }
        );

        const timeLabel = dt.toLocaleTimeString(
            "en-IN",
            { hour: "2-digit", minute: "2-digit" }
        );

        const iconEl = $("#complaintDetailIcon i");
        if (iconEl) iconEl.className = meta.icon;

        setDetailText("#complaintDetailCategory", meta.label);

        const statusEl = $("#complaintDetailStatus");
        if (statusEl) {
            statusEl.textContent = c.status;
            statusEl.className = `complaint-badge ${statusClassFor(c.status)}`;
        }

        setDetailText("#complaintDetailDescription", c.description);
        setDetailText("#complaintDetailName", displayName);
        setDetailText("#complaintDetailEmail", displayEmail);
        setDetailText("#complaintDetailLocation", c.location || "Not specified");
        setDetailText(
            "#complaintDetailGender",
            c.gender
                ? c.gender.charAt(0).toUpperCase() + c.gender.slice(1)
                : "Not specified"
        );
        setDetailText("#complaintDetailDate", dateLabel);
        setDetailText("#complaintDetailTime", timeLabel);

        const photoEl = $("#complaintDetailPhoto");

        if (photoEl) {
            if (c.photo) {
                photoEl.src = c.photo;
                photoEl.classList.remove("hidden");
            } else {
                photoEl.removeAttribute("src");
                photoEl.classList.add("hidden");
            }
        }

        // Oversight & Sarpanch Clarification Section
        const sarpanchBox = $("#complaintSarpanchDetailBox");
        if (sarpanchBox) {
            if (c.category === "sarpanch") {
                sarpanchBox.hidden = false;
                setDetailText("#complaintSarpanchGrievanceType", c.grievanceType || "Panchayat Governance Irregularity");
                setDetailText("#complaintSarpanchEscalatedTo", c.escalationAuthority || "Block Development Officer (BDO)");
                setDetailText("#complaintSarpanchResponseText", c.sarpanchResponse || "No formal explanation submitted yet.");

                const clarForm = $("#sarpanchClarificationForm");
                const clarInput = $("#sarpanchClarificationInput");
                if (clarForm) {
                    if (currentSession?.role === "sarpanch") {
                        clarForm.hidden = false;
                        if (clarInput) clarInput.value = c.sarpanchResponse || "";
                    } else {
                        clarForm.hidden = true;
                    }
                }
            } else {
                sarpanchBox.hidden = true;
            }
        }

        openModal(complaintDetailModal);
    }

    $("#sarpanchClarificationForm")?.addEventListener("submit", event => {
        event.preventDefault();
        if (!activeComplaintDetailId) return;
        const text = $("#sarpanchClarificationInput")?.value.trim();
        if (!text) return;
        const complaints = getComplaints();
        const comp = complaints.find(item => item.id === activeComplaintDetailId);
        if (comp) {
            comp.sarpanchResponse = text;
            localStorage.setItem("gramvikas-complaints", JSON.stringify(complaints));
            setDetailText("#complaintSarpanchResponseText", text);
            showToast("Clarification Saved", "Official Sarpanch explanation recorded.");
            refreshComplaintsUI();
        }
    });

    $("#closeComplaintDetailModal")?.addEventListener(
        "click",
        () => closeModal(complaintDetailModal)
    );

    complaintDetailModal?.addEventListener(
        "click",
        event => {
            if (event.target === complaintDetailModal) {
                closeModal(complaintDetailModal);
            }
        }
    );

    // Clicking the photo inside the detail modal opens it full-size.
    $("#complaintDetailPhoto")?.addEventListener(
        "click",
        event => openPhotoLightbox(event.target.src)
    );

    // Delegated click handling for both complaint lists:
    // - "View Photo" opens that complaint's photo in the lightbox
    //   (the photo itself is never shown directly on the row)
    // - clicking anywhere else on a row opens the full detail modal
    $("#complaints")?.addEventListener(
        "click",
        event => {

            const categoryCard = event.target.closest("[data-category]");

            if (categoryCard) {
                openCategoryComplaints(categoryCard.dataset.category);
                return;
            }

            const photoBtn = event.target.closest("[data-view-photo]");

            if (photoBtn) {
                openPhotoLightbox(photoBtn.dataset.photoSrc);
                return;
            }

            const row = event.target.closest("[data-complaint-id]");

            if (row) {
                openComplaintDetail(row.dataset.complaintId);
            }
        }
    );

    // Keyboard access: Enter/Space opens the detail modal when focus
    // is on the row itself. Real <button> children (View Photo, View
    // Details) already turn Enter/Space into a native click, which
    // the handler above catches — skip those here to avoid double-firing.
    $("#complaints")?.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter" && event.key !== " ") return;

            if (event.target.closest("button")) return;

            const categoryCard = event.target.closest("[data-category]");

            if (categoryCard) {
                event.preventDefault();
                openCategoryComplaints(categoryCard.dataset.category);
                return;
            }

            const row = event.target.closest("[data-complaint-id]");

            if (!row) return;

            event.preventDefault();

            openComplaintDetail(row.dataset.complaintId);
        }
    );


    function refreshComplaintsUI() {

        // Total count + category-wise breakdown are aggregate,
        // non-personal numbers, so every signed-in user (villager
        // or admin) sees them for the whole village.
        const allComplaints = getComplaints();

        updateComplaintStats(allComplaints);

        // Everyone sees the category summary cards (count, % of
        // total, gender split). Only admins get the "Top 3 Most
        // Complained Topics" ranking and can click a category card
        // to see individual complaints (name, photo, etc.).
        renderComplaintCategoryCards(allComplaints);

        if (isAdmin) {
            renderTopComplaints(allComplaints);
        } else {
            $("#topComplaintsSection")?.classList.add("hidden");
        }
    }


    refreshComplaintsUI();


    /* =====================================================
       COMPLAINT PHOTO LIGHTBOX

       Clicking a photo thumbnail in the citizen complaint
       list opens it full-size in an overlay.
       ===================================================== */

    const photoLightbox =
        $("#photoLightbox");

    const lightboxImg =
        $("#lightboxImg");


    function openPhotoLightbox(src) {

        if (lightboxImg) lightboxImg.src = src;

        openModal(photoLightbox);
    }


    $("#closePhotoLightbox")?.addEventListener(
        "click",
        () => {
            closeModal(photoLightbox);
        }
    );


    photoLightbox?.addEventListener(
        "click",
        event => {

            if (event.target === photoLightbox) {

                closeModal(photoLightbox);
            }

        }
    );


    /* =====================================================
       DEVELOPMENT INDICATORS & PROJECTS
       ---------------------------------------------------
       Both sections are stored in localStorage (there's no
       backend). Everyone can VIEW them, but only an admin
       can edit them:

       - Edit / Add / Delete buttons are only ever placed in
         the DOM when isAdmin is true (see renderDevelopment
         Indicators / renderProjects) — a villager's page
         never contains them.
       - Every function that actually writes data (save*)
         re-checks isAdmin before touching localStorage. That
         way, even if someone opened devtools and tried to
         call the save/submit functions directly, the write
         is refused rather than silently trusting the button
         being hidden.
       ===================================================== */

    const DEV_INDICATORS_KEY = "gramvikas-development";
    const PROJECTS_KEY = "gramvikas-projects";
    const CONTRACTORS_KEY = "gramvikas-contractors";


    function seedDevelopmentIndicators() {
        return [
            {
                id: "education", icon: "fa-solid fa-graduation-cap", label: "Education",
                percent: 84, description: "Overall education score",
                metrics: [
                    { label: "School Attendance", value: 89 },
                    { label: "Literacy Rate", value: 82 },
                    { label: "School Infrastructure", value: 81 }
                ]
            },
            {
                id: "health", icon: "fa-solid fa-heart-pulse", label: "Healthcare",
                percent: 72, description: "Overall health score",
                metrics: [
                    { label: "Health Centre", value: 78 },
                    { label: "Vaccination", value: 91 },
                    { label: "Maternal Care", value: 76 }
                ]
            },
            {
                id: "agriculture", icon: "fa-solid fa-wheat-awn", label: "Agriculture",
                percent: 79, description: "Overall agriculture score",
                metrics: [
                    { label: "Irrigated Land", value: 68 },
                    { label: "Crop Productivity", value: 82 },
                    { label: "Farmer Support", value: 87 }
                ]
            },
            {
                id: "water", icon: "fa-solid fa-water", label: "Water & Sanitation",
                percent: 75, description: "Overall water score",
                metrics: [
                    { label: "Safe Drinking Water", value: 91 },
                    { label: "Toilet Coverage", value: 87 },
                    { label: "Waste Management", value: 62 }
                ]
            }
        ];
    }

    function getDevelopmentIndicators() {

        const stored = localStorage.getItem(DEV_INDICATORS_KEY);

        if (!stored) {
            const seeded = seedDevelopmentIndicators();
            localStorage.setItem(DEV_INDICATORS_KEY, JSON.stringify(seeded));
            return seeded;
        }

        return JSON.parse(stored);
    }

    function saveDevelopmentIndicators(indicators) {

        if (!isAdmin) return false; // defense in depth

        localStorage.setItem(DEV_INDICATORS_KEY, JSON.stringify(indicators));
        return true;
    }


    const projectCategoryMeta = {
        road:   { iconClass: "road-project",   icon: "fa-solid fa-road",        label: "Roads" },
        water:  { iconClass: "water-project",  icon: "fa-solid fa-faucet-drip", label: "Water Supply" },
        school: { iconClass: "school-project", icon: "fa-solid fa-school",      label: "Education" },
        solar:  { iconClass: "solar-project",  icon: "fa-solid fa-solar-panel", label: "Energy" }
    };

    function seedProjects() {
        return [
            { id: "proj-1", category: "road",   title: "Internal Road Development", description: "Construction of 3.5 km village roads", progress: 78,  status: "ongoing" },
            { id: "proj-2", category: "water",  title: "Jal Jeevan Water Project",   description: "Tap water connection to households",   progress: 92,  status: "ongoing" },
            { id: "proj-3", category: "school", title: "Primary School Renovation",  description: "Renovation of village primary school",  progress: 100, status: "completed" },
            { id: "proj-4", category: "solar",  title: "Solar Street Lights",        description: "Installation of 50 solar street lights", progress: 45,  status: "planned" }
        ];
    }

    function getProjects() {

        const stored = localStorage.getItem(PROJECTS_KEY);

        if (!stored) {
            const seeded = seedProjects();
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(seeded));
            return seeded;
        }

        return JSON.parse(stored);
    }

    function getContractors() {
        try {
            const stored = JSON.parse(localStorage.getItem(CONTRACTORS_KEY) || "[]");
            return Array.isArray(stored) ? stored : [];
        } catch (error) { return []; }
    }

    function saveContractors(contractors) {
        if (!isAdmin) return false;
        localStorage.setItem(CONTRACTORS_KEY, JSON.stringify(contractors));
        return true;
    }

    function renderContractorDirectory() {
        const tbody = $("#contractorDirectoryList");
        if (!tbody) return;
        const contractors = getContractors();
        const projects = getProjects();
        if (!contractors.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="contractor-empty">No contractors registered yet.</td></tr>';
        } else {
            tbody.innerHTML = contractors.map(contractor => {
                const count = projects.filter(project => String(project.contractorEmail || "").toLowerCase() === contractor.email).length;
                return `<tr><td><strong>${escapeHTML(contractor.name)}</strong></td><td>${escapeHTML(contractor.email)}</td><td>${escapeHTML(contractor.phone || "—")}</td><td>${count}</td><td>${isAdmin ? `<button type="button" class="secondary-btn small" data-delete-contractor="${escapeHTML(contractor.id)}">Remove</button>` : '<span class="contractor-status planned">View only</span>'}</td></tr>`;
            }).join("");
        }
        const select = $("#projectContractorSelect");
        if (select) {
            const current = select.value;
            select.innerHTML = '<option value="">Select a contractor (or enter details below)</option>' + contractors.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)} — ${escapeHTML(c.email)}</option>`).join("");
            if (contractors.some(c => c.id === current)) select.value = current;
        }
    }

    function saveProjects(projects, contractorUpdate = false) {
        if (!isAdmin && !(isContractor && contractorUpdate)) return false;
        if (isContractor && contractorUpdate) {
            const previous = getProjects();
            const previousById = new Map(previous.map(project => [project.id, project]));
            for (const project of projects) {
                const oldProject = previousById.get(project.id);
                if (!oldProject) return false;
                const changed = project.progress !== oldProject.progress || project.status !== oldProject.status;
                const otherChanged = project.title !== oldProject.title || project.description !== oldProject.description || project.category !== oldProject.category || project.contractorEmail !== oldProject.contractorEmail || project.contractorDeadline !== oldProject.contractorDeadline || project.contractorName !== oldProject.contractorName || project.contractorStart !== oldProject.contractorStart;
                if (otherChanged || (changed && !contractorCanEditProject(oldProject))) return false;
            }
        }
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        return true;
    }


    /* ----- Render: Development Indicators ----- */

    function renderDevelopmentIndicators() {

        const grid = $("#indicatorGrid");
        if (!grid) return;

        const indicators = getDevelopmentIndicators();

        grid.innerHTML = indicators.map(ind => {

            // Edit button only exists in the markup for admins.
            const editBtnHTML = isAdmin
                ? `
                    <button class="indicator-edit-btn" data-edit-indicator="${ind.id}" title="Edit ${ind.label}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                `
                : "";

            const metricsHTML = ind.metrics.map(m => `
                <li>
                    <span>${m.label}</span>
                    <strong>${m.value}%</strong>
                </li>
            `).join("");

            return `
                <div class="indicator-card" id="${ind.id}">

                    ${editBtnHTML}

                    <div class="indicator-header">
                        <div class="indicator-icon">
                            <i class="${ind.icon}"></i>
                        </div>
                        <span>${ind.label}</span>
                    </div>

                    <h3>${ind.percent}%</h3>
                    <p>${ind.description}</p>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${ind.percent}%;"></div>
                    </div>

                    <ul>${metricsHTML}</ul>

                </div>
            `;
        }).join("");
    }


    const editIndicatorModal = $("#editIndicatorModal");
    const editIndicatorForm = $("#editIndicatorForm");

    function openIndicatorEditor(indicatorId) {

        if (!isAdmin) return; // defense in depth — button doesn't exist for villagers anyway

        const indicators = getDevelopmentIndicators();
        const indicator = indicators.find(i => i.id === indicatorId);

        if (!indicator) return;

        $("#indicatorModalTitle").textContent = `Edit ${indicator.label}`;
        $("#indicatorId").value = indicator.id;
        $("#indicatorPercent").value = indicator.percent;
        $("#indicatorDescription").value = indicator.description;

        [0, 1, 2].forEach(i => {
            const metric = indicator.metrics[i] || { label: "", value: 0 };
            $(`#indicatorMetric${i + 1}Label`).value = metric.label;
            $(`#indicatorMetric${i + 1}Value`).value = metric.value;
        });

        openModal(editIndicatorModal);
    }

    $("#indicatorGrid")?.addEventListener(
        "click",
        event => {
            const btn = event.target.closest("[data-edit-indicator]");
            if (!btn) return;
            openIndicatorEditor(btn.dataset.editIndicator);
        }
    );

    $("#closeEditIndicatorModal")?.addEventListener(
        "click",
        () => closeModal(editIndicatorModal)
    );

    editIndicatorModal?.addEventListener(
        "click",
        event => {
            if (event.target === editIndicatorModal) closeModal(editIndicatorModal);
        }
    );

    editIndicatorForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (!isAdmin) {
                showToast("Not Authorized", "Only admins can edit development data.");
                closeModal(editIndicatorModal);
                return;
            }

            const id = $("#indicatorId").value;
            const indicators = getDevelopmentIndicators();
            const indicator = indicators.find(i => i.id === id);

            if (!indicator) {
                closeModal(editIndicatorModal);
                return;
            }

            indicator.percent = Math.max(0, Math.min(100, Number($("#indicatorPercent").value) || 0));
            indicator.description = $("#indicatorDescription").value.trim();

            indicator.metrics = [0, 1, 2].map(i => ({
                label: $(`#indicatorMetric${i + 1}Label`).value.trim(),
                value: Math.max(0, Math.min(100, Number($(`#indicatorMetric${i + 1}Value`).value) || 0))
            }));

            saveDevelopmentIndicators(indicators);
            closeModal(editIndicatorModal);
            renderDevelopmentIndicators();

            showToast("Indicator Updated", `${indicator.label} data has been saved.`);
        }
    );


    renderDevelopmentIndicators();


    /* ----- Render: Projects ----- */

    function projectStatusLabel(status) {
        if (status === "ongoing") return "Ongoing";
        if (status === "completed") return "Completed";
        if (status === "other") return "Other";
        return "Planned";
    }

    function syncProjectStatusDetails() {
        const status = $("#projectStatus");
        const group = $("#projectStatusDetailsGroup");
        const details = $("#projectStatusDetails");
        if (!status || !group || !details) return;
        const show = status.value === "other";
        group.hidden = !show;
        details.required = show;
    }

    $("#projectStatus")?.addEventListener("change", syncProjectStatusDetails);

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
    }

    function formatWorkDuration(project) {
        const start = project.contractorStart ? Date.parse(project.contractorStart) : NaN;
        const end = project.contractorDeadline ? Date.parse(project.contractorDeadline) : NaN;
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "Not set";
        const totalHours = Math.ceil((end - start) / 3600000);
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        if (days && hours) return `${days} day${days === 1 ? "" : "s"} ${hours} hr`;
        if (days) return `${days} day${days === 1 ? "" : "s"}`;
        return `${Math.max(1, hours)} hour${hours === 1 ? "" : "s"}`;
    }

    function renderContractorWork() {
        const tbody = $("#contractorWorkList");
        if (!tbody) return;
        const projects = getProjects().filter(project => project.contractorEmail);
        const note = $("#contractorRegisterNote");
        if (!projects.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="contractor-empty">No contractor assignments yet. The Sarpanch can assign work from Projects → Edit Project.</td></tr>';
            if (note) note.textContent = isAdmin ? "Use Projects → Add Project or Edit Project to assign a contractor and set the work dates." : "No contractor assignments are currently listed.";
            renderContractorDirectory();
            return;
        }
        tbody.innerHTML = projects.map(project => {
            const deadline = project.contractorDeadline ? Date.parse(project.contractorDeadline) : NaN;
            const start = project.contractorStart ? Date.parse(project.contractorStart) : NaN;
            const now = Date.now();
            let label = project.status === "completed" ? "Completed" : "Scheduled";
            let statusClass = project.status === "completed" ? "completed" : "planned";
            if (project.status !== "completed" && Number.isFinite(deadline) && now > deadline) { label = "Editing closed"; statusClass = "locked"; }
            else if (project.status !== "completed" && Number.isFinite(start) && now >= start) { label = "In progress"; statusClass = "ongoing"; }
            return `<tr>
                <td><strong>${escapeHTML(project.title)}</strong><small>${escapeHTML(project.description || "")}</small></td>
                <td><strong>${escapeHTML(project.contractorName || "Contractor")}</strong><small>${escapeHTML(project.contractorEmail)}</small></td>
                <td>${escapeHTML(formatWorkDuration(project))}</td>
                <td>${Number.isFinite(deadline) ? escapeHTML(new Date(deadline).toLocaleString("en-IN")) : "Not set"}</td>
                <td><span class="contractor-status ${statusClass}">${label}</span></td>
            </tr>`;
        }).join("");
        if (note) note.textContent = isAdmin ? "Assignments and deadlines are controlled by the Sarpanch in Projects." : "This register is view-only. Contractors can edit only their assigned project while its editing window is open.";
        renderContractorDirectory();
    }

    /* ----- Historical contractor work records (construction section) ----- */
    const PAST_WORK_KEY = "gramvikas-past-contractor-work";
    const pastWorkCategories = {
        road: "Road construction", water: "Water project", building: "Building / construction",
        drainage: "Drainage", electricity: "Street lighting / electricity", other: "Other"
    };
    const pastWorkStatuses = { completed: "Completed", incomplete: "Incomplete", delayed: "Delayed", terminated: "Terminated" };

    function getPastWorkRecords() {
        try {
            const data = JSON.parse(localStorage.getItem(PAST_WORK_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) { return []; }
    }

    function renderPastWorkHistory() {
        const tbody = $("#pastWorkHistoryList");
        if (!tbody) return;
        const records = getPastWorkRecords();
        if (!records.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="contractor-empty">No past contractor work records yet. The Sarpanch can add road, water, construction and other completed work here.</td></tr>';
        } else {
            tbody.innerHTML = records.slice().sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).map(record => {
                const amount = record.cost !== "" && record.cost != null && Number.isFinite(Number(record.cost))
                    ? `₹${Number(record.cost).toLocaleString("en-IN", {maximumFractionDigits:2})}` : "—";
                const status = pastWorkStatuses[record.outcome] || record.outcome || "—";
                return `<tr>
                    <td><strong>${escapeHTML(record.title || "Untitled work")}</strong><small>${escapeHTML(pastWorkCategories[record.category] || record.category || "Other")}</small></td>
                    <td>${escapeHTML(record.contractor || "—")}</td>
                    <td>${escapeHTML(record.location || "—")}</td>
                    <td>${escapeHTML(record.period || "—")}</td>
                    <td>${escapeHTML(amount)}</td>
                    <td><span class="contractor-status ${record.outcome === "completed" ? "completed" : record.outcome === "delayed" || record.outcome === "incomplete" ? "planned" : "locked"}">${escapeHTML(status)}</span></td>
                    <td>${escapeHTML(record.details || "—")}</td>
                    <td>${isAdmin ? `<button type="button" class="secondary-btn small" data-delete-past-work="${escapeHTML(record.id)}" title="Delete past work record">Remove</button>` : "View only"}</td>
                </tr>`;
            }).join("");
        }
        const addButton = $("#addPastWorkBtn");
        if (addButton && isAdmin) addButton.hidden = false;
    }

    const pastWorkForm = $("#pastWorkForm");
    const pastWorkHistoryPanel = $("#pastWorkHistoryPanel");
    const togglePastWorkHistoryBtn = $("#togglePastWorkHistoryBtn");
    togglePastWorkHistoryBtn?.addEventListener("click", () => {
        if (!pastWorkHistoryPanel) return;
        const willShow = pastWorkHistoryPanel.hidden;
        pastWorkHistoryPanel.hidden = !willShow;
        togglePastWorkHistoryBtn.setAttribute("aria-expanded", String(willShow));
        togglePastWorkHistoryBtn.innerHTML = willShow
            ? '<i class="fa-solid fa-eye-slash"></i> Hide Past History'
            : '<i class="fa-solid fa-clock-rotate-left"></i> View Past History';
        if (willShow) renderPastWorkHistory();
    });
    $("#addPastWorkBtn")?.addEventListener("click", () => {
        if (pastWorkHistoryPanel) {
            pastWorkHistoryPanel.hidden = false;
            togglePastWorkHistoryBtn?.setAttribute("aria-expanded", "true");
            if (togglePastWorkHistoryBtn) togglePastWorkHistoryBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide Past History';
        }
        if (!isAdmin || !pastWorkForm) return;
        pastWorkForm.reset();
        pastWorkForm.hidden = false;
        $("#pastWorkTitle")?.focus();
    });
    $("#cancelPastWorkBtn")?.addEventListener("click", () => {
        pastWorkForm?.reset();
        if (pastWorkForm) pastWorkForm.hidden = true;
    });
    pastWorkForm?.addEventListener("submit", event => {
        event.preventDefault();
        if (!isAdmin) { showToast("Not Authorized", "Only the Sarpanch/admin can add past work records."); return; }
        const title = $("#pastWorkTitle").value.trim();
        const contractor = $("#pastWorkContractor").value.trim();
        if (!title || !contractor) { showToast("Missing Information", "Enter the work name and contractor name."); return; }
        const records = getPastWorkRecords();
        records.push({
            id: `past-work-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            title, category: $("#pastWorkCategory").value, contractor,
            location: $("#pastWorkLocation").value.trim(), period: $("#pastWorkPeriod").value.trim(),
            cost: $("#pastWorkCost").value.trim(), outcome: $("#pastWorkOutcome").value,
            details: $("#pastWorkDetails").value.trim(), createdAt: Date.now()
        });
        localStorage.setItem(PAST_WORK_KEY, JSON.stringify(records));
        pastWorkForm.reset();
        pastWorkForm.hidden = true;
        renderPastWorkHistory();
        showToast("Past work saved", `${title} has been added to contractor history.`);
    });
    $("#pastWorkHistoryList")?.addEventListener("click", event => {
        const button = event.target.closest("[data-delete-past-work]");
        if (!button || !isAdmin) return;
        if (!window.confirm("Remove this past contractor work record?")) return;
        const records = getPastWorkRecords().filter(record => record.id !== button.dataset.deletePastWork);
        localStorage.setItem(PAST_WORK_KEY, JSON.stringify(records));
        renderPastWorkHistory();
        showToast("Record removed", "The past work record has been removed.");
    });
    renderPastWorkHistory();

    function renderProjects() {

        const list = $("#projectList");
        if (!list) return;

        const projects = getProjects();

        if (projects.length === 0) {
            list.innerHTML = `
                <div class="complaint-empty">
                    <i class="fa-solid fa-diagram-project"></i>
                    <p>No projects added yet.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = projects.map(p => {

            const meta = projectCategoryMeta[p.category] ||
                { iconClass: "road-project", icon: "fa-solid fa-diagram-project" };

            const canEdit = isAdmin || contractorCanEditProject(p);
            const actionsHTML = canEdit
                ? `<div class="project-item-actions">
                    <button class="project-edit-btn" data-edit-project="${p.id}" title="${isAdmin ? "Edit or assign project" : "Update assigned work"}"><i class="fa-solid fa-pen"></i></button>
                    ${isAdmin ? `<button class="project-delete-btn" data-delete-project="${p.id}" title="Delete project"><i class="fa-solid fa-trash"></i></button>` : ""}
                  </div>` : "";
            const assignmentHTML = isAdmin && p.contractorEmail
                ? `<small class="project-assignment-note">Assigned: ${escapeHTML(p.contractorName || p.contractorEmail)} (${escapeHTML(p.contractorEmail)})${p.contractorDeadline ? ` · Until ${new Date(p.contractorDeadline).toLocaleString("en-IN")}` : " · No deadline"}</small>`
                : isContractor ? `<small class="project-assignment-note">${contractorAssignmentMessage(p)}</small>` : "";

            return `
                <div class="project-item">

                    <div class="project-icon ${meta.iconClass}">
                        <i class="${meta.icon}"></i>
                    </div>

                    <div class="project-details">

                        <h4>${p.title}</h4>
                        <p>${p.description}</p>

                        <div class="project-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${p.progress}%;"></div>
                            </div>
                            <span>${p.progress}%</span>
                        </div>

                    </div>

                    <span class="project-status ${p.status}">${projectStatusLabel(p.status)}</span>
                    ${assignmentHTML}
                    ${actionsHTML}

                </div>
            `;
        }).join("");
    }


    const editProjectModal = $("#editProjectModal");
    const editProjectForm = $("#editProjectForm");

    function openProjectEditor(projectId) {

        if (!isAdmin && !isContractor) return;

        editProjectForm?.reset();

        if (!projectId) {
            // "Add project" mode — only the Sarpanch/admin can reach this path.
            if (!isAdmin) return;
            $("#projectModalTitle").textContent = "Add Project";
            $("#projectId").value = "";
            $("#projectProgress").value = 0;
            if ($("#projectStatusDetails")) $("#projectStatusDetails").value = "";
            syncProjectStatusDetails();
            if ($("#projectAssignmentFields")) $("#projectAssignmentFields").hidden = false;
            [$("#projectTitle"), $("#projectDescription"), $("#projectCategory"), $("#projectProgress"), $("#projectStatus")].forEach(el => { if (el) el.disabled = false; });
            const note = $("#projectModalTitle")?.parentElement?.querySelector("p");
            if (note) note.textContent = "Create a project and optionally assign a contractor with a work period and editing deadline.";
            $("#projectContractorName").value = "";
            $("#projectContractorEmail").value = "";
            if ($("#projectContractorSelect")) $("#projectContractorSelect").value = "";
            renderContractorDirectory();
            $("#projectContractorStart").value = toDateTimeLocalValue(new Date().toISOString());
            openModal(editProjectModal);
            return;
        }

        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);

        if (!project || (!isAdmin && !contractorCanEditProject(project))) {
            showToast("Editing unavailable", isContractor ? contractorAssignmentMessage(project) : "You do not have permission to edit this project.");
            return;
        }

        $("#projectModalTitle").textContent = isContractor ? "Update Assigned Work" : "Edit Project";
        $("#projectId").value = project.id;
        $("#projectTitle").value = project.title;
        $("#projectDescription").value = project.description;
        $("#projectCategory").value = project.category;
        $("#projectProgress").value = project.progress;
        $("#projectStatus").value = project.status;
        $("#projectStatusDetails").value = project.statusDetails || "";
        syncProjectStatusDetails();
        $("#projectContractorName").value = project.contractorName || "";
        $("#projectContractorEmail").value = project.contractorEmail || "";
        renderContractorDirectory();
        const registeredContractor = getContractors().find(c => c.email === String(project.contractorEmail || "").toLowerCase());
        if ($("#projectContractorSelect")) $("#projectContractorSelect").value = registeredContractor?.id || "";
        $("#projectContractorStart").value = toDateTimeLocalValue(project.contractorStart);
        $("#projectContractorDeadline").value = toDateTimeLocalValue(project.contractorDeadline);
        const contractorFields = $("#projectAssignmentFields");
        if (contractorFields) contractorFields.hidden = !isAdmin;
        [$("#projectTitle"), $("#projectDescription"), $("#projectCategory")].forEach(el => { if (el) el.disabled = isContractor; });
        [$("#projectProgress"), $("#projectStatus")].forEach(el => { if (el) el.disabled = false; });
        if (isContractor) {
            const note = $("#projectModalTitle")?.parentElement?.querySelector("p");
            if (note) note.textContent = contractorAssignmentMessage(project);
        } else {
            const note = $("#projectModalTitle")?.parentElement?.querySelector("p");
            if (note) note.textContent = "Update project details, contractor assignment and editing deadline.";
        }
        openModal(editProjectModal);
    }

    // Reveal "Add Project" only for admins — everyone else never
    // sees this button (it stays `hidden` from the HTML default).
    if (isAdmin) {
        $("#addProjectBtn")?.removeAttribute("hidden");
    }

    $("#addProjectBtn")?.addEventListener(
        "click",
        () => openProjectEditor(null)
    );

    const addContractorModal = $("#addContractorModal");
    if (isAdmin) $("#addContractorBtn")?.removeAttribute("hidden");
    $("#addContractorBtn")?.addEventListener("click", () => {
        $("#addContractorForm")?.reset();
        openModal(addContractorModal);
    });
    $("#closeAddContractorModal")?.addEventListener("click", () => closeModal(addContractorModal));
    addContractorModal?.addEventListener("click", event => { if (event.target === addContractorModal) closeModal(addContractorModal); });
    $("#addContractorForm")?.addEventListener("submit", event => {
        event.preventDefault();
        if (!isAdmin) return;
        const name = $("#newContractorName").value.trim();
        const email = $("#newContractorEmail").value.trim().toLowerCase();
        const phone = $("#newContractorPhone").value.trim();
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Check contractor details", "Enter a name and a valid email address."); return;
        }
        const contractors = getContractors();
        if (contractors.some(c => c.email === email)) {
            showToast("Contractor already exists", "A contractor with this email is already registered."); return;
        }
        contractors.push({ id: "contractor-" + Date.now(), name, email, phone });
        saveContractors(contractors);
        renderContractorDirectory();
        closeModal(addContractorModal);
        showToast("Contractor added", `${name} is now available for project assignment.`);
    });
    $("#contractorDirectoryList")?.addEventListener("click", event => {
        const button = event.target.closest("[data-delete-contractor]");
        if (!button || !isAdmin) return;
        const contractor = getContractors().find(c => c.id === button.dataset.deleteContractor);
        if (!contractor) return;
        if (getProjects().some(project => String(project.contractorEmail || "").toLowerCase() === contractor.email)) {
            showToast("Contractor is assigned", "Reassign or remove this contractor from their projects before removing them from the directory."); return;
        }
        if (!window.confirm(`Remove ${contractor.name} from the contractor directory?`)) return;
        saveContractors(getContractors().filter(c => c.id !== contractor.id));
        renderContractorDirectory();
        showToast("Contractor removed", `${contractor.name} was removed from the directory.`);
    });
    $("#projectContractorSelect")?.addEventListener("change", event => {
        const contractor = getContractors().find(c => c.id === event.target.value);
        if (!contractor) return;
        $("#projectContractorName").value = contractor.name;
        $("#projectContractorEmail").value = contractor.email;
    });

    $("#projectList")?.addEventListener(
        "click",
        event => {

            const editBtn = event.target.closest("[data-edit-project]");
            if (editBtn) {
                openProjectEditor(editBtn.dataset.editProject);
                return;
            }

            const deleteBtn = event.target.closest("[data-delete-project]");
            if (deleteBtn) {

                if (!isAdmin) return; // defense in depth

                const id = deleteBtn.dataset.deleteProject;

                const confirmed = window.confirm(
                    "Delete this project? This can't be undone."
                );

                if (!confirmed) return;

                const projects = getProjects().filter(p => p.id !== id);

                saveProjects(projects);
                renderProjects();
                renderContractorWork();

                showToast("Project Deleted", "The project has been removed.");
            }
        }
    );

    $("#closeEditProjectModal")?.addEventListener(
        "click",
        () => closeModal(editProjectModal)
    );

    editProjectModal?.addEventListener(
        "click",
        event => {
            if (event.target === editProjectModal) closeModal(editProjectModal);
        }
    );

    editProjectForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const id = $("#projectId").value;
            const existingProjects = getProjects();
            const existingProject = id ? existingProjects.find(p => p.id === id) : null;
            if (isContractor && (!existingProject || !contractorCanEditProject(existingProject))) {
                showToast("Editing locked", "This work is not assigned to you or its editing deadline has passed.");
                closeModal(editProjectModal);
                renderProjects();
                return;
            }
            if (!isAdmin && !isContractor) {
                showToast("Not Authorized", "You cannot edit project data.");
                closeModal(editProjectModal);
                return;
            }

            if (isContractor) {
                existingProject.progress = Math.max(0, Math.min(100, Number($("#projectProgress").value) || 0));
                existingProject.status = $("#projectStatus").value;
                existingProject.statusDetails = existingProject.status === "other" ? $("#projectStatusDetails").value.trim() : "";
                if (!saveProjects(existingProjects, true)) return;
                closeModal(editProjectModal);
                renderProjects();
                renderContractorWork();
                showToast("Work updated", `${existingProject.title} progress has been saved.`);
                return;
            }


            const title = $("#projectTitle").value.trim();
            const description = $("#projectDescription").value.trim();
            const category = $("#projectCategory").value;
            const progress = Math.max(0, Math.min(100, Number($("#projectProgress").value) || 0));
            const status = $("#projectStatus").value;
            const statusDetails = status === "other" ? $("#projectStatusDetails").value.trim() : "";
            const assignedContractorName = $("#projectContractorName").value.trim();
            const assignedContractorEmail = $("#projectContractorEmail").value.trim().toLowerCase();
            const contractorStart = $("#projectContractorStart").value || toDateTimeLocalValue(new Date().toISOString());
            const contractorDeadline = $("#projectContractorDeadline").value;

            if (assignedContractorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedContractorEmail)) {
                showToast("Invalid email", "Enter a valid contractor email address.");
                return;
            }
            if (assignedContractorEmail && !assignedContractorName) {
                showToast("Contractor name required", "Enter the name of the contractor responsible for this work.");
                return;
            }
            if (assignedContractorEmail && (!contractorDeadline || !Number.isFinite(Date.parse(contractorDeadline)))) {
                showToast("Deadline required", "Set the date and time until which this contractor can edit the assigned work.");
                return;
            }
            if (assignedContractorEmail && (!Number.isFinite(Date.parse(contractorStart)) || Date.parse(contractorStart) >= Date.parse(contractorDeadline))) {
                showToast("Invalid work duration", "The work start date and time must be before the editing deadline.");
                return;
            }
            if (contractorDeadline && Date.parse(contractorDeadline) <= Date.now() && assignedContractorEmail) {
                showToast("Invalid deadline", "The contractor editing deadline must be in the future.");
                return;
            }

            if (!title || !description || !category || !status || (status === "other" && !statusDetails)) {
                showToast("Missing Information", "Please complete all project fields, including the other status details when selected.");
                return;
            }

            const projects = getProjects();

            if (id) {

                // Editing an existing project
                const project = projects.find(p => p.id === id);

                if (project) {
                    project.title = title;
                    project.description = description;
                    project.category = category;
                    project.progress = progress;
                    project.status = status;
                    project.statusDetails = statusDetails;
                    project.contractorName = assignedContractorEmail ? assignedContractorName : "";
                    project.contractorEmail = assignedContractorEmail;
                    project.contractorStart = assignedContractorEmail ? new Date(contractorStart).toISOString() : "";
                    project.contractorDeadline = assignedContractorEmail ? new Date(contractorDeadline).toISOString() : "";
                }

            } else {

                // Adding a new project
                projects.push({
                    id: "proj-" + Date.now(),
                    title,
                    description,
                    category,
                    progress,
                    status,
                    statusDetails,
                    contractorName: assignedContractorEmail ? assignedContractorName : "",
                    contractorEmail: assignedContractorEmail,
                    contractorStart: assignedContractorEmail ? new Date(contractorStart).toISOString() : "",
                    contractorDeadline: assignedContractorEmail ? new Date(contractorDeadline).toISOString() : ""
                });
            }

            saveProjects(projects);
            closeModal(editProjectModal);
            renderProjects();
            renderContractorWork();

            showToast(
                id ? "Project Updated" : "Project Added",
                `${title} has been saved.`
            );
        }
    );


    renderProjects();
    renderContractorWork();


    /* =====================================================
       COMPLAINTS DEVELOPMENT
       ---------------------------------------------------
       A small feed of admin-posted progress updates on how
       complaint resolution is coming along overall — sits
       just below "Complaints by Category" on the Complaints
       page. Same pattern as Development Indicators / Projects:

       - "Add Update" plus each entry's edit/delete buttons
         only exist in the DOM when isAdmin is true (see
         renderComplaintsDevelopment) — villagers never see them.
       - saveComplaintsDevelopment() re-checks isAdmin before
         touching localStorage, as defense in depth.
       ===================================================== */

    const COMPLAINTS_DEV_KEY = "gramvikas-complaints-development";

    function seedComplaintsDevelopment() {
        return [
            {
                id: "cdev-1",
                title: "Streetlight repairs underway",
                note: "Maintenance team has started replacing faulty solar streetlights reported under infrastructure complaints.",
                percent: 60,
                date: new Date().toISOString()
            },
            {
                id: "cdev-2",
                title: "Water supply complaints reviewed",
                note: "All pending water supply complaints have been inspected on-site; repair work is scheduled for this week.",
                percent: 35,
                date: new Date().toISOString()
            }
        ];
    }

    // Fills the "Related Complaint" <select> in the Add/Edit Update modal
    // using only complaints that actually exist in the Complaints section
    // (getComplaints()) — nothing free-typed can end up in the dropdown.
    function populateComplaintDevSelect(selectedComplaintId) {

        const select = $("#complaintDevComplaintSelect");
        if (!select) return;

        const complaints = getComplaints()
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const optionsHTML = complaints.map(c => {
            const meta = complaintCategoryMeta[c.category] || complaintCategoryMeta.other;
            return `<option value="${c.id}">${c.name} — ${meta.label} (${c.status})</option>`;
        }).join("");

        select.innerHTML = `<option value="">— Select a complaint —</option>${optionsHTML}`;

        if (selectedComplaintId) select.value = selectedComplaintId;

        updateComplaintDevSelectedInfo();
    }

    // Small readonly preview of the currently-selected complaint, so the
    // admin can confirm they picked the right one before typing a note.
    function updateComplaintDevSelectedInfo() {

        const select = $("#complaintDevComplaintSelect");
        const info = $("#complaintDevSelectedInfo");
        if (!select || !info) return;

        const complaint = getComplaints().find(c => c.id === select.value);

        if (!complaint) {
            info.textContent = "";
            return;
        }

        const meta = complaintCategoryMeta[complaint.category] || complaintCategoryMeta.other;
        info.textContent = `${meta.label} · ${complaint.location} · Status: ${complaint.status}`;
    }

    function getComplaintsDevelopment() {

        const stored = localStorage.getItem(COMPLAINTS_DEV_KEY);

        if (!stored) {
            const seeded = seedComplaintsDevelopment();
            localStorage.setItem(COMPLAINTS_DEV_KEY, JSON.stringify(seeded));
            return seeded;
        }

        return JSON.parse(stored);
    }

    function saveComplaintsDevelopment(updates) {

        if (!isAdmin) return false; // defense in depth

        localStorage.setItem(COMPLAINTS_DEV_KEY, JSON.stringify(updates));
        return true;
    }

    function formatComplaintDevDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }


    /* ----- Render: overall completion stat cards ----- */

    function renderComplaintsDevStats() {

        const grid = $("#complaintsDevStatsGrid");
        if (!grid) return;

        const updates = getComplaintsDevelopment();
        const totalUpdates = updates.length;

        const avgPercent = totalUpdates
            ? Math.round(updates.reduce((sum, u) => sum + Number(u.percent || 0), 0) / totalUpdates)
            : 0;

        const completed = updates.filter(u => Number(u.percent) >= 100).length;
        const inProgress = totalUpdates - completed;

        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon population"><i class="fa-solid fa-list-check"></i></div>
                </div>
                <div class="stat-content">
                    <span>Total Updates</span>
                    <h3>${totalUpdates}</h3>
                    <small>Progress entries posted</small>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon development"><i class="fa-solid fa-chart-line"></i></div>
                </div>
                <div class="stat-content">
                    <span>Average Progress</span>
                    <h3>${avgPercent}%</h3>
                    <small>Across all tracked complaints</small>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon education"><i class="fa-solid fa-circle-check"></i></div>
                </div>
                <div class="stat-content">
                    <span>Fully Resolved</span>
                    <h3>${completed}</h3>
                    <small>Reached 100% progress</small>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon schools"><i class="fa-solid fa-hourglass-half"></i></div>
                </div>
                <div class="stat-content">
                    <span>Still In Progress</span>
                    <h3>${inProgress}</h3>
                    <small>Below 100% progress</small>
                </div>
            </div>
        `;
    }


    /* ----- Render: Complaints Development ----- */

    function renderComplaintsDevelopment() {

        renderComplaintsDevStats();

        const list = $("#complaintsDevList");
        if (!list) return;

        const updates = getComplaintsDevelopment()
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (updates.length === 0) {
            list.innerHTML = `
                <div class="complaint-empty">
                    <i class="fa-solid fa-chart-line"></i>
                    <p>No development updates posted yet.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = updates.map(u => {

            // Edit/delete buttons only exist in the markup for admins.
            const actionsHTML = isAdmin
                ? `
                    <div class="project-item-actions">
                        <button class="project-edit-btn" data-edit-complaint-dev="${u.id}" title="Edit update">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="project-delete-btn" data-delete-complaint-dev="${u.id}" title="Delete update">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `
                : "";

            return `
                <div class="complaints-dev-item">

                    <div class="complaints-dev-item-head">

                        <div>
                            <h4>${u.title}</h4>
                            <small>
                                ${u.citizenName ? `Complaint by ${u.citizenName} · ` : ""}Updated ${formatComplaintDevDate(u.date)}
                            </small>
                        </div>

                        ${actionsHTML}

                    </div>

                    <p>${u.note}</p>

                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${u.percent}%;"></div>
                        </div>
                        <span>${u.percent}%</span>
                    </div>

                </div>
            `;
        }).join("");
    }


    const editComplaintDevModal = $("#editComplaintDevModal");
    const editComplaintDevForm = $("#editComplaintDevForm");

    function openComplaintDevEditor(updateId) {

        if (!isAdmin) return; // defense in depth — button doesn't exist for villagers anyway

        editComplaintDevForm?.reset();

        if (!updateId) {
            // "Add update" mode
            $("#complaintDevModalTitle").textContent = "Add Development Update";
            $("#complaintDevId").value = "";
            $("#complaintDevPercent").value = 0;
            populateComplaintDevSelect(null);
            openModal(editComplaintDevModal);
            return;
        }

        const updates = getComplaintsDevelopment();
        const update = updates.find(u => u.id === updateId);

        if (!update) return;

        $("#complaintDevModalTitle").textContent = "Edit Development Update";
        $("#complaintDevId").value = update.id;
        populateComplaintDevSelect(update.complaintId || "");
        $("#complaintDevNote").value = update.note;
        $("#complaintDevPercent").value = update.percent;

        openModal(editComplaintDevModal);
    }

    // "Select" half of the select-and-type flow: picking a different
    // complaint refreshes the readonly preview line.
    $("#complaintDevComplaintSelect")?.addEventListener(
        "change",
        updateComplaintDevSelectedInfo
    );

    // Reveal "Add Update" only for admins — everyone else never
    // sees this button (it stays `hidden` from the HTML default).
    if (isAdmin) {
        $("#addComplaintUpdateBtn")?.removeAttribute("hidden");
    }

    $("#addComplaintUpdateBtn")?.addEventListener(
        "click",
        () => openComplaintDevEditor(null)
    );

    $("#complaintsDevList")?.addEventListener(
        "click",
        event => {

            const editBtn = event.target.closest("[data-edit-complaint-dev]");
            if (editBtn) {
                openComplaintDevEditor(editBtn.dataset.editComplaintDev);
                return;
            }

            const deleteBtn = event.target.closest("[data-delete-complaint-dev]");
            if (deleteBtn) {

                if (!isAdmin) return; // defense in depth

                const id = deleteBtn.dataset.deleteComplaintDev;

                const confirmed = window.confirm(
                    "Delete this development update? This can't be undone."
                );

                if (!confirmed) return;

                const updates = getComplaintsDevelopment().filter(u => u.id !== id);

                saveComplaintsDevelopment(updates);
                renderComplaintsDevelopment();

                // Removing this update may change the linked complaint's
                // effective status (it falls back to the next-latest
                // update, or its own stored status) — keep the Citizen
                // Complaints cards in sync.
                refreshComplaintsUI();

                showToast("Update Deleted", "The development update has been removed.");
            }
        }
    );

    $("#closeEditComplaintDevModal")?.addEventListener(
        "click",
        () => closeModal(editComplaintDevModal)
    );

    editComplaintDevModal?.addEventListener(
        "click",
        event => {
            if (event.target === editComplaintDevModal) closeModal(editComplaintDevModal);
        }
    );

    editComplaintDevForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (!isAdmin) {
                showToast("Not Authorized", "Only admins can edit complaint development updates.");
                closeModal(editComplaintDevModal);
                return;
            }

            const id = $("#complaintDevId").value;

            const complaintId = $("#complaintDevComplaintSelect").value;
            const note = $("#complaintDevNote").value.trim();
            const percent = Math.max(0, Math.min(100, Number($("#complaintDevPercent").value) || 0));

            // "Select" — must be one of the actual complaints from the
            // Complaints section; nothing free-typed is accepted here.
            const complaint = getComplaints().find(c => c.id === complaintId);

            if (!complaint) {
                showToast("Missing Information", "Please select the complaint this update is about.");
                return;
            }

            if (!note) {
                showToast("Missing Information", "Please complete all update fields.");
                return;
            }

            const meta = complaintCategoryMeta[complaint.category] || complaintCategoryMeta.other;
            const title = `${meta.label} — ${complaint.location}`;

            const updates = getComplaintsDevelopment();

            if (id) {

                // Editing an existing update
                const update = updates.find(u => u.id === id);
                if (update) {
                    update.complaintId = complaint.id;
                    update.title = title;
                    update.citizenName = complaint.name;
                    update.category = complaint.category;
                    update.note = note;
                    update.percent = percent;
                    update.date = new Date().toISOString();
                }

            } else {

                // Posting a new update
                updates.push({
                    id: "cdev-" + Date.now(),
                    complaintId: complaint.id,
                    title,
                    citizenName: complaint.name,
                    category: complaint.category,
                    note,
                    percent,
                    date: new Date().toISOString()
                });
            }

            saveComplaintsDevelopment(updates);
            closeModal(editComplaintDevModal);
            renderComplaintsDevelopment();

            // This update's percent may move the linked complaint into
            // a new status bucket — keep the Citizen Complaints cards
            // (Pending / In Progress / Resolved) in sync automatically.
            refreshComplaintsUI();

            showToast(
                id ? "Update Saved" : "Update Posted",
                `${title} has been saved.`
            );
        }
    );


    renderComplaintsDevelopment();


    /* =====================================================
       PROFILE & PASSWORD (Settings → Account)
       ---------------------------------------------------
       The full registration record (name, mobile, location,
       password, etc.) lives in the same localStorage arrays
       login.js writes to — "gramvikas-users" for villagers,
       "gramvikas-admins" for admins. We read/update that
       same record here so edits made on this dashboard are
       exactly what login.js will check against next time
       the person logs in.
       ===================================================== */

    const ACCOUNT_USERS_KEY = "gramvikas-users";
    const ACCOUNT_ADMINS_KEY = "gramvikas-admins";

    const getAccountUsers = () =>
        JSON.parse(localStorage.getItem(ACCOUNT_USERS_KEY) || "[]");

    const saveAccountUsers = arr =>
        localStorage.setItem(ACCOUNT_USERS_KEY, JSON.stringify(arr));

    const getAccountAdmins = () =>
        JSON.parse(localStorage.getItem(ACCOUNT_ADMINS_KEY) || "[]");

    const saveAccountAdmins = arr =>
        localStorage.setItem(ACCOUNT_ADMINS_KEY, JSON.stringify(arr));


    // Both arrays + a save function for whichever one applies to
    // the person currently logged in.
    function getAccountsArray() {
        return isAdmin ? getAccountAdmins() : getAccountUsers();
    }

    function saveAccountsArray(arr) {
        if (isAdmin) saveAccountAdmins(arr);
        else saveAccountUsers(arr);
    }

    // The logged-in person's own full record (or null if — for
    // whatever reason — it can't be found).
    function getCurrentAccountRecord() {

        if (!currentSession?.gmail) return null;

        const accounts = getAccountsArray();

        return accounts.find(a => a.gmail === currentSession.gmail) || null;
    }


    /* ----- Render: Account details card ----- */

    function renderAccountDetails() {

        const container = $("#accountDetails");
        if (!container) return;

        const record = getCurrentAccountRecord();

        if (!record) {
            container.innerHTML = `
                <div class="score-item">
                    <span><i class="fa-solid fa-triangle-exclamation"></i> Account</span>
                    <strong>Record not found</strong>
                </div>
            `;
            return;
        }

        const rows = [
            { icon: "fa-solid fa-user",          label: "Name",     value: record.name },
            { icon: "fa-solid fa-id-badge",      label: "Role",     value: isAdmin ? "Administrator" : "Villager" },
            { icon: "fa-solid fa-envelope",      label: "Gmail",    value: record.gmail },
            { icon: "fa-solid fa-phone",         label: "Mobile",   value: record.mobile },
            { icon: "fa-solid fa-location-dot",  label: "Village",  value: record.village },
            { icon: "fa-solid fa-map",           label: "Taluka",   value: record.tal },
            { icon: "fa-solid fa-map",           label: "District", value: record.dist },
            { icon: "fa-solid fa-flag",          label: "State",    value: record.state }
        ];

        container.innerHTML = rows.map(row => `
            <div class="score-item">
                <span><i class="${row.icon}"></i> ${row.label}</span>
                <strong>${row.value || "—"}</strong>
            </div>
        `).join("");
    }

    renderAccountDetails();


    /* ----- Edit Profile: location cascade (State→District→Taluka→Village) ----- */

    const PROFILE_STATE_DATA_MAP = {
        "Maharashtra": {
            allDistricts: typeof MAHARASHTRA_ALL_DISTRICTS !== "undefined" ? MAHARASHTRA_ALL_DISTRICTS : [],
            data: typeof MAHARASHTRA_DATA !== "undefined" ? MAHARASHTRA_DATA : {}
        },
        "Karnataka": {
            allDistricts: typeof KARNATAKA_ALL_DISTRICTS !== "undefined" ? KARNATAKA_ALL_DISTRICTS : [],
            data: typeof KARNATAKA_DATA !== "undefined" ? KARNATAKA_DATA : {}
        }
    };

    function fillProfileSelect(selectEl, items, placeholder, selectedValue) {
        selectEl.innerHTML =
            `<option value="" disabled>${placeholder}</option>` +
            items.map(item =>
                `<option value="${item}" ${item === selectedValue ? "selected" : ""}>${item}</option>`
            ).join("");
        selectEl.disabled = false;
    }

    function resetProfileSelect(selectEl, placeholder) {
        selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        selectEl.disabled = true;
    }

    const editProfileState = $("#editProfileState");
    const editProfileDist = $("#editProfileDist");
    const editProfileTal = $("#editProfileTal");
    const editProfileVillage = $("#editProfileVillage");

    // Re-cascade on manual changes (same behaviour as the login page).
    editProfileState?.addEventListener("change", () => {

        const stateInfo = PROFILE_STATE_DATA_MAP[editProfileState.value];

        resetProfileSelect(editProfileTal, "Select district first");
        resetProfileSelect(editProfileVillage, "Select taluka first");

        if (stateInfo) {
            fillProfileSelect(editProfileDist, stateInfo.allDistricts, "Select district", "");
        } else {
            resetProfileSelect(editProfileDist, "Select state first");
        }
    });

    editProfileDist?.addEventListener("change", () => {

        const stateInfo = PROFILE_STATE_DATA_MAP[editProfileState.value];
        const talukas = stateInfo?.data[editProfileDist.value]
            ? Object.keys(stateInfo.data[editProfileDist.value])
            : [];

        resetProfileSelect(editProfileVillage, "Select taluka first");

        if (talukas.length) {
            fillProfileSelect(editProfileTal, talukas, "Select taluka", "");
        } else {
            resetProfileSelect(editProfileTal, "No taluka data yet for this district");
        }
    });

    editProfileTal?.addEventListener("change", () => {

        const stateInfo = PROFILE_STATE_DATA_MAP[editProfileState.value];
        const villages =
            stateInfo?.data[editProfileDist.value]?.[editProfileTal.value] || [];

        if (villages.length) {
            fillProfileSelect(editProfileVillage, villages, "Select village", "");
        } else {
            resetProfileSelect(editProfileVillage, "No village data yet for this taluka");
        }
    });


    // Pre-fill the whole cascade with the record's existing
    // location, in order, so every dropdown already shows the
    // person's current values when the modal opens.
    function prefillProfileLocation(record) {

        const stateInfo = PROFILE_STATE_DATA_MAP[record.state];

        editProfileState.value = record.state || "";

        if (stateInfo) {
            fillProfileSelect(editProfileDist, stateInfo.allDistricts, "Select district", record.dist);
        } else {
            resetProfileSelect(editProfileDist, "Select state first");
        }

        const talukas = stateInfo?.data[record.dist]
            ? Object.keys(stateInfo.data[record.dist])
            : [];

        if (talukas.length) {
            fillProfileSelect(editProfileTal, talukas, "Select taluka", record.tal);
        } else {
            resetProfileSelect(editProfileTal, "Select district first");
        }

        const villages = stateInfo?.data[record.dist]?.[record.tal] || [];

        if (villages.length) {
            fillProfileSelect(editProfileVillage, villages, "Select village", record.village);
        } else {
            resetProfileSelect(editProfileVillage, "Select taluka first");
        }
    }


    /* ----- Edit Profile modal open/save ----- */

    const editProfileModal = $("#editProfileModal");
    const editProfileForm = $("#editProfileForm");

    $("#editProfileBtn")?.addEventListener("click", () => {

        const record = getCurrentAccountRecord();
        if (!record) return;

        $("#editProfileName").value = record.name || "";
        $("#editProfileGmail").value = record.gmail || "";
        $("#editProfileMobile").value = record.mobile || "";

        prefillProfileLocation(record);

        openModal(editProfileModal);
    });

    $("#closeEditProfileModal")?.addEventListener("click", () => closeModal(editProfileModal));

    editProfileModal?.addEventListener("click", event => {
        if (event.target === editProfileModal) closeModal(editProfileModal);
    });

    const isValidMobile = num => /^[6-9]\d{9}$/.test((num || "").trim());

    editProfileForm?.addEventListener("submit", event => {

        event.preventDefault();

        const record = getCurrentAccountRecord();

        if (!record) {
            showToast("Something Went Wrong", "Your account record couldn't be found.");
            return;
        }

        const name = $("#editProfileName").value.trim();
        const mobile = $("#editProfileMobile").value.trim();
        const state = $("#editProfileState").value;
        const dist = $("#editProfileDist").value;
        const tal = $("#editProfileTal").value;
        const village = $("#editProfileVillage").value;

        if (!name) {
            showToast("Missing Information", "Please enter your full name.");
            return;
        }

        if (!isValidMobile(mobile)) {
            showToast("Invalid Mobile Number", "Enter a valid 10-digit mobile number.");
            return;
        }

        if (!state || !dist || !tal || !village) {
            showToast("Missing Information", "Please complete your state, district, taluka and village.");
            return;
        }

        const accounts = getAccountsArray();
        const target = accounts.find(a => a.gmail === record.gmail);

        if (!target) {
            showToast("Something Went Wrong", "Your account record couldn't be found.");
            return;
        }

        target.name = name;
        target.mobile = mobile;
        target.state = state;
        target.dist = dist;
        target.tal = tal;
        target.village = village;

        saveAccountsArray(accounts);

        // Keep the session + header in sync so the new name shows
        // up immediately without needing to log out and back in.
        if (currentSession) {
            currentSession.name = name;
            sessionStorage.setItem("gramvikas-session", JSON.stringify(currentSession));
        }

        const headerName = $("#profileName");
        if (headerName) headerName.textContent = name;

        renderAccountDetails();
        closeModal(editProfileModal);

        showToast("Profile Updated", "Your details have been saved.");
    });


    /* ----- Change Password modal open/save ----- */

    const changePasswordModal = $("#changePasswordModal");
    const changePasswordForm = $("#changePasswordForm");

    $("#changePasswordBtn")?.addEventListener("click", () => {
        changePasswordForm?.reset();
        openModal(changePasswordModal);
    });

    $("#closeChangePasswordModal")?.addEventListener("click", () => closeModal(changePasswordModal));

    changePasswordModal?.addEventListener("click", event => {
        if (event.target === changePasswordModal) closeModal(changePasswordModal);
    });

    // Show/hide password text — same pattern as the login page.
    document.addEventListener("click", event => {

        const btn = event.target.closest(".toggle-eye");
        if (!btn) return;

        const input = document.getElementById(btn.dataset.target);
        if (!input) return;

        const icon = btn.querySelector("i");
        const showing = input.type === "text";

        input.type = showing ? "password" : "text";
        icon.className = showing ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });

    changePasswordForm?.addEventListener("submit", event => {

        event.preventDefault();

        const record = getCurrentAccountRecord();

        if (!record) {
            showToast("Something Went Wrong", "Your account record couldn't be found.");
            return;
        }

        const currentPassword = $("#currentPassword").value;
        const newPassword = $("#newPassword").value;
        const confirmNewPassword = $("#confirmNewPassword").value;

        if (currentPassword !== record.password) {
            showToast("Incorrect Password", "Your current password doesn't match.");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Weak Password", "New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showToast("Passwords Don't Match", "New password and confirmation must match.");
            return;
        }

        const accounts = getAccountsArray();
        const target = accounts.find(a => a.gmail === record.gmail);

        if (!target) {
            showToast("Something Went Wrong", "Your account record couldn't be found.");
            return;
        }

        target.password = newPassword;
        saveAccountsArray(accounts);

        changePasswordForm.reset();
        closeModal(changePasswordModal);

        showToast("Password Updated", "Your password has been changed successfully.");
    });


    /* =====================================================
       REPORT MODAL
       ===================================================== */

    const reportModal =
        $("#reportModal");


    const reportTitles = {

        monthlyReport: [

            "Monthly Development Report",

            "Current month village development summary"

        ],

        annualReport: [

            "Annual Development Report",

            "Yearly village development performance"

        ],

        projectReport: [

            "Project Status Report",

            "Village development project progress"

        ]

    };


    function openReport(type) {

        const title =
            $("#reportTitle");

        const subtitle =
            $("#reportSubtitle");


        const data =
            reportTitles[type] ||
            reportTitles.monthlyReport;


        if (title) {
            title.textContent =
                data[0];
        }


        if (subtitle) {
            subtitle.textContent =
                data[1];
        }


        openModal(reportModal);
    }


    $("#monthlyReport")?.addEventListener(
        "click",
        () => {
            openReport("monthlyReport");
        }
    );


    $("#annualReport")?.addEventListener(
        "click",
        () => {
            openReport("annualReport");
        }
    );


    $("#projectReport")?.addEventListener(
        "click",
        () => {
            openReport("projectReport");
        }
    );


    $("#viewReportBtn")?.addEventListener(
        "click",
        () => {
            openReport("annualReport");
        }
    );


    $("#closeReportModal")?.addEventListener(
        "click",
        () => {
            closeModal(reportModal);
        }
    );


    $("#closeReport")?.addEventListener(
        "click",
        () => {
            closeModal(reportModal);
        }
    );


    reportModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === reportModal
            ) {

                closeModal(reportModal);
            }

        }
    );


    /* =====================================================
       GOVERNMENT SCHEMES — DATA
       (documents required + category-wise priority for
       selection / waiting-list ranking, as per common
       scheme guidelines. Indicative — verify locally.)
       ===================================================== */

    const schemesData = {

        pmay: {
            name: "PM Awas Yojana (Gramin)",
            icon: "fa-solid fa-house",
            category: "housing",
            top: true,
            stats: [
                { value: "156", label: "Beneficiaries" },
                { value: "92%", label: "Completed" }
            ],
            tagline: "Housing support for eligible rural families",
            about:
                "Provides financial assistance to eligible rural households " +
                "for construction of a pucca house with basic amenities. " +
                "Beneficiaries are selected from the Permanent Wait List " +
                "generated using SECC-2011 housing deprivation data.",
            ministry: "Ministry of Rural Development",
            benefit: "₹1.2 lakh (plain) / ₹1.3 lakh (hilly)",
            mode: "Direct Benefit Transfer",
            documents: [
                "Aadhaar Card",
                "Job Card (MGNREGA), if available",
                "Bank Passbook (linked to Aadhaar)",
                "Caste Certificate (SC/ST/OBC, if applicable)",
                "BPL / SECC Family ID",
                "Passport-size Photograph",
                "Land ownership / house-site document"
            ],
            amounts: [
                { category: "Plain Area Households", amount: "₹1,20,000",
                  note: "One-time construction assistance (all categories)" },
                { category: "Hilly / Difficult / IAP Districts", amount: "₹1,30,000",
                  note: "Higher assistance for North-East & hill states" },
                { category: "MGNREGA Convergence (up to 90 days)", amount: "≈ ₹18,000",
                  note: "Additional unskilled wage support for construction" },
                { category: "SBM-G Toilet Incentive", amount: "₹12,000",
                  note: "Add-on support for building a household toilet" }
            ],
            loan: {
                title: "Credit Linked Subsidy (home loan top-up, if taken)",
                rows: [
                    { category: "EWS / LIG Category", rate: "6.5%",
                      note: "Interest subsidy on loan amount up to ₹6 lakh" },
                    { category: "MIG-I Category", rate: "4%",
                      note: "Interest subsidy on loan amount up to ₹9 lakh" },
                    { category: "MIG-II Category", rate: "3%",
                      note: "Interest subsidy on loan amount up to ₹12 lakh" }
                ]
            },
            applyLink: "https://pmayg.nic.in/",
            priority: [
                { rank: 1, category: "SC / ST Households", level: "highest",
                  note: "Listed first on the Permanent Wait List" },
                { rank: 2, category: "Minorities & BPL Families", level: "high",
                  note: "Households identified as houseless / living in kutcha houses" },
                { rank: 3, category: "OBC Households", level: "medium",
                  note: "Considered after SC/ST and BPL categories are covered" },
                { rank: 4, category: "General / EWS Category", level: "standard",
                  note: "Covered as per remaining wait-list slots and state quota" }
            ]
        },

        jjm: {
            name: "Jal Jeevan Mission",
            icon: "fa-solid fa-faucet-drip",
            category: "water",
            top: true,
            stats: [
                { value: "1,660", label: "Connections" },
                { value: "91%", label: "Coverage" }
            ],
            tagline: "Functional household tap water connections",
            about:
                "Aims to provide safe and adequate drinking water through " +
                "individual household tap connections to every rural home. " +
                "Villages are covered on a saturation basis rather than " +
                "individual application.",
            ministry: "Ministry of Jal Shakti",
            benefit: "Free / subsidised tap connection",
            mode: "Village-level infrastructure",
            documents: [
                "Aadhaar Card of Head of Household",
                "Ration Card",
                "Proof of Residence",
                "Village Water & Sanitation Committee approval",
                "Property / house number document"
            ],
            amounts: [
                { category: "SC / ST / BPL Households", amount: "Free",
                  note: "Connection cost fully borne under the mission" },
                { category: "General / APL Households", amount: "₹500 – ₹1,000",
                  note: "Nominal one-time household contribution, state-dependent" }
            ],
            loan: null,
            applyLink: "https://jaljeevanmission.gov.in/",
            priority: [
                { rank: 1, category: "SC / ST Habitations", level: "highest",
                  note: "Priority hamlets covered first under saturation plan" },
                { rank: 2, category: "Water-stressed / Quality-affected Villages", level: "high",
                  note: "Fluoride, arsenic or scarcity-hit areas prioritised" },
                { rank: 3, category: "Aspirational Districts & OBC-majority Hamlets", level: "medium",
                  note: "Taken up in the next phase of saturation" },
                { rank: 4, category: "General / Remaining Households", level: "standard",
                  note: "Covered as full village saturation progresses" }
            ]
        },

        pmkisan: {
            name: "PM Kisan Samman Nidhi",
            icon: "fa-solid fa-tractor",
            category: "agriculture",
            top: true,
            stats: [
                { value: "642", label: "Farmers" },
                { value: "96%", label: "Coverage" }
            ],
            tagline: "Income support for landholding farmer families",
            about:
                "Provides ₹6,000 per year in three instalments directly to " +
                "the bank accounts of eligible landholding farmer families. " +
                "Eligibility is based on land records, not on social category.",
            ministry: "Ministry of Agriculture & Farmers Welfare",
            benefit: "₹6,000 / year (3 instalments)",
            mode: "Direct Benefit Transfer",
            documents: [
                "Aadhaar Card",
                "Land Record / Khatauni (7/12 extract)",
                "Bank Passbook (Aadhaar-linked)",
                "Mobile Number",
                "Self-declaration / farmer registration form"
            ],
            amounts: [
                { category: "All Landholding Farmer Families", amount: "₹2,000 × 3",
                  note: "₹6,000 total per year, paid in 3 equal instalments" }
            ],
            loan: {
                title: "Kisan Credit Card (KCC) — linked short-term loan",
                rows: [
                    { category: "Loan up to ₹3 lakh (all categories)", rate: "7%",
                      note: "Standard KCC interest rate on short-term crop loan" },
                    { category: "With Prompt Repayment Incentive", rate: "4%",
                      note: "Effective rate after 3% govt interest subvention" }
                ]
            },
            applyLink: "https://pmkisan.gov.in/",
            priority: [
                { rank: 1, category: "All Landholding Categories", level: "standard",
                  note: "No caste-based priority — eligibility is land-record based" },
                { rank: 2, category: "Small & Marginal Farmers", level: "medium",
                  note: "Given outreach priority in registration drives" },
                { rank: 3, category: "SC / ST / OBC Farmers", level: "medium",
                  note: "Same benefit; targeted awareness camps to improve enrolment" }
            ]
        },

        mgnrega: {
            name: "MGNREGA",
            icon: "fa-solid fa-person-walking",
            category: "employment",
            top: true,
            stats: [
                { value: "385", label: "Workers" },
                { value: "78%", label: "Target" }
            ],
            tagline: "Guaranteed rural wage employment",
            about:
                "Guarantees 100 days of wage employment per year to every " +
                "rural household whose adult members volunteer for unskilled " +
                "manual work. Job cards are issued on a universal, " +
                "self-selecting basis.",
            ministry: "Ministry of Rural Development",
            benefit: "100 days guaranteed wage employment / household",
            mode: "Job Card + Wage Payment",
            documents: [
                "Aadhaar Card",
                "Job Card Application Form",
                "Proof of Residence",
                "Bank / Post Office Account details",
                "Passport-size Photograph"
            ],
            amounts: [
                { category: "All Categories (Universal Wage Rate)", amount: "≈ ₹220 – ₹320 / day",
                  note: "Notified daily wage rate varies by state, revised annually" }
            ],
            loan: null,
            applyLink: "https://nrega.nic.in/",
            priority: [
                { rank: 1, category: "All Rural Households", level: "standard",
                  note: "Universal, demand-driven scheme — no caste-based ranking" },
                { rank: 2, category: "SC / ST Households", level: "medium",
                  note: "Statutory reporting priority; works often taken up on SC/ST land first" },
                { rank: 3, category: "Women-headed & BPL Households", level: "medium",
                  note: "Encouraged participation; at least 1/3rd workdays reserved for women" }
            ]
        },

        ayushman: {
            name: "Ayushman Bharat (PM-JAY)",
            icon: "fa-solid fa-heart-pulse",
            category: "health",
            top: false,
            stats: [
                { value: "1,120", label: "Cards Issued" },
                { value: "88%", label: "Coverage" }
            ],
            tagline: "Free health cover up to ₹5 lakh per family / year",
            about:
                "Provides cashless hospitalisation cover for secondary and " +
                "tertiary care through empanelled hospitals. Beneficiary " +
                "families are identified from SECC-2011 deprivation and " +
                "occupational criteria, not by caste.",
            ministry: "National Health Authority",
            benefit: "₹5,00,000 cover per family / year",
            mode: "Cashless treatment via Ayushman Card",
            documents: [
                "Aadhaar Card",
                "Ration Card / Family ID",
                "SECC-2011 verification (auto-checked)",
                "Mobile Number",
                "Passport-size Photograph"
            ],
            amounts: [
                { category: "All Eligible Families (SC/ST/OBC/General)", amount: "₹5,00,000 / year",
                  note: "Same cashless cover for the whole family, regardless of category" }
            ],
            loan: null,
            applyLink: "https://pmjay.gov.in/",
            priority: [
                { rank: 1, category: "SC / ST & Manual Scavenger Households", level: "highest",
                  note: "Automatically included as deprivation criteria (D1-D7)" },
                { rank: 2, category: "Landless / BPL Labour Households", level: "high",
                  note: "Covered under SECC occupational categories" },
                { rank: 3, category: "OBC & General EWS Households", level: "medium",
                  note: "Covered where SECC deprivation criteria are met" }
            ]
        },

        ujjwala: {
            name: "PM Ujjwala Yojana",
            icon: "fa-solid fa-fire-burner",
            category: "women",
            top: false,
            stats: [
                { value: "410", label: "Connections" },
                { value: "85%", label: "Coverage" }
            ],
            tagline: "Free LPG connection to women of BPL households",
            about:
                "Provides a deposit-free LPG gas connection in the name of " +
                "women from below-poverty-line households, to replace " +
                "unsafe cooking fuels with clean energy.",
            ministry: "Ministry of Petroleum & Natural Gas",
            benefit: "Free LPG connection + first refill support",
            mode: "Connection issued via local gas agency",
            documents: [
                "Aadhaar Card (applicant - adult woman)",
                "BPL Certificate / SECC Family ID",
                "Bank Passbook",
                "Passport-size Photograph",
                "Proof of Residence"
            ],
            amounts: [
                { category: "SC / ST / AAY Women", amount: "₹1,600 (Free)",
                  note: "Connection cost + first refill + regulator fully covered" },
                { category: "OBC / General (BPL)", amount: "₹1,600 (Free)",
                  note: "Same support once BPL / SECC status is verified" }
            ],
            loan: {
                title: "Stove & Refill EMI Facility (optional)",
                rows: [
                    { category: "All Beneficiary Categories", rate: "0%",
                      note: "Interest-free — cost recovered via small deductions from subsidy" }
                ]
            },
            applyLink: "https://www.pmuy.gov.in/",
            priority: [
                { rank: 1, category: "SC / ST Women (BPL)", level: "highest",
                  note: "Listed among priority beneficiary categories" },
                { rank: 2, category: "Antyodaya Anna Yojana (AAY) Households", level: "high",
                  note: "Poorest-of-poor ration card holders prioritised" },
                { rank: 3, category: "OBC / Minority Women (BPL)", level: "medium",
                  note: "Covered under forest dwellers, tea garden, island categories" },
                { rank: 4, category: "General Category (BPL)", level: "standard",
                  note: "Eligible once poverty criteria are verified" }
            ]
        },

        nsap: {
            name: "National Social Assistance Programme",
            icon: "fa-solid fa-person-cane",
            category: "senior",
            top: false,
            stats: [
                { value: "274", label: "Beneficiaries" },
                { value: "90%", label: "Coverage" }
            ],
            tagline: "Pension for elderly, widows and persons with disability",
            about:
                "A social security pension scheme (Old Age, Widow and " +
                "Disability Pension) for BPL citizens, providing a monthly " +
                "cash allowance to reduce economic vulnerability.",
            ministry: "Ministry of Rural Development",
            benefit: "₹200 – ₹500+ / month (state top-ups apply)",
            mode: "Direct Benefit Transfer",
            documents: [
                "Aadhaar Card",
                "Age Proof (for Old Age Pension)",
                "BPL Certificate",
                "Death Certificate of Spouse (for Widow Pension)",
                "Disability Certificate (for Disability Pension)",
                "Bank Passbook"
            ],
            amounts: [
                { category: "Old Age Pension (60–79 yrs)", amount: "₹200 – ₹300 / month",
                  note: "Central share; most states add a top-up" },
                { category: "Old Age Pension (80+ yrs)", amount: "₹500+ / month",
                  note: "Higher central assistance for senior-most citizens" },
                { category: "Widow Pension", amount: "₹300+ / month",
                  note: "For BPL widows aged 40–79 years" },
                { category: "Disability Pension", amount: "₹300 – ₹500 / month",
                  note: "For BPL persons with 80%+ disability" }
            ],
            loan: null,
            applyLink: "https://nsap.nic.in/",
            priority: [
                { rank: 1, category: "SC / ST BPL Elderly & Widows", level: "highest",
                  note: "Given first preference in Gram Sabha approval list" },
                { rank: 2, category: "Persons with Disability (all categories)", level: "high",
                  note: "Priority regardless of caste, subject to BPL status" },
                { rank: 3, category: "OBC BPL Households", level: "medium",
                  note: "Covered after SC/ST and disability cases are cleared" },
                { rank: 4, category: "General Category BPL", level: "standard",
                  note: "Covered as per remaining budget allocation" }
            ]
        },

        pmfby: {
            name: "PM Fasal Bima Yojana",
            icon: "fa-solid fa-cloud-showers-heavy",
            category: "agriculture",
            top: false,
            stats: [
                { value: "318", label: "Farmers" },
                { value: "74%", label: "Coverage" }
            ],
            tagline: "Crop insurance against natural calamities",
            about:
                "Provides comprehensive insurance cover against crop loss " +
                "due to natural calamities, pests and diseases, at a low, " +
                "uniform premium rate for all farmers.",
            ministry: "Ministry of Agriculture & Farmers Welfare",
            benefit: "Sum insured based on scale of finance",
            mode: "Premium subsidy + insurance payout",
            documents: [
                "Aadhaar Card",
                "Land Record / Tenancy Agreement",
                "Bank Passbook",
                "Sowing Certificate",
                "Premium payment receipt (for non-loanee farmers)"
            ],
            amounts: [
                { category: "Kharif Food & Oilseed Crops", amount: "2% of Sum Insured",
                  note: "Farmer's premium share (same for all categories)" },
                { category: "Rabi Food & Oilseed Crops", amount: "1.5% of Sum Insured",
                  note: "Farmer's premium share (same for all categories)" },
                { category: "Commercial / Horticulture Crops", amount: "5% of Sum Insured",
                  note: "Remaining premium subsidised by Centre & State" }
            ],
            loan: null,
            applyLink: "https://pmfby.gov.in/",
            priority: [
                { rank: 1, category: "All Farmers (Loanee & Non-loanee)", level: "standard",
                  note: "No caste-based priority — open to all landholders/tenants" },
                { rank: 2, category: "Small & Marginal Farmers", level: "medium",
                  note: "Outreach priority in enrolment camps" },
                { rank: 3, category: "SC / ST / OBC Farmers", level: "medium",
                  note: "Same benefit; targeted awareness under state camps" }
            ]
        },

        ssy: {
            name: "Sukanya Samriddhi Yojana",
            icon: "fa-solid fa-child-dress",
            category: "girl-child",
            top: false,
            stats: [
                { value: "203", label: "Accounts" },
                { value: "81%", label: "Coverage" }
            ],
            tagline: "Savings scheme for a girl child's education & marriage",
            about:
                "A small savings scheme for parents of a girl child to build " +
                "a fund for her education and marriage expenses, with " +
                "attractive government-set interest and tax benefits.",
            ministry: "Ministry of Finance",
            benefit: "High interest rate savings account",
            mode: "Post Office / Authorised Bank account",
            documents: [
                "Girl child's Birth Certificate",
                "Aadhaar Card of parent/guardian",
                "Aadhaar Card of the girl child (if available)",
                "Proof of Residence",
                "Passport-size Photograph"
            ],
            amounts: [
                { category: "All Categories (Min. Deposit)", amount: "₹250 / year",
                  note: "Minimum yearly deposit to keep the account active" },
                { category: "All Categories (Max. Deposit)", amount: "₹1,50,000 / year",
                  note: "Maximum yearly deposit eligible for tax benefit" }
            ],
            loan: {
                title: "Interest Rate Earned on Deposit",
                rows: [
                    { category: "All Account Holders", rate: "≈ 8.2% p.a.",
                      note: "Government-notified rate, compounded annually (revised quarterly)" }
                ]
            },
            applyLink: "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samriddhi-Account.aspx",
            priority: [
                { rank: 1, category: "All Girl Children (up to age 10)", level: "standard",
                  note: "No caste-based priority — open to every eligible family" },
                { rank: 2, category: "SC / ST / BPL Families", level: "medium",
                  note: "Focus of awareness drives under Beti Bachao Beti Padhao" }
            ]
        },

        nsp: {
            name: "National Scholarship Portal (NSP)",
            icon: "fa-solid fa-graduation-cap",
            category: "education",
            top: true,
            stats: [
                { value: "512", label: "Students" },
                { value: "89%", label: "Disbursed" }
            ],
            tagline: "Single-window scholarships for school & college students",
            about:
                "A common portal for students to apply for pre-matric, " +
                "post-matric and merit-based central and state scholarships, " +
                "with funds transferred directly to bank accounts after " +
                "institution verification.",
            ministry: "Ministry of Electronics & IT / Ministry of Education",
            benefit: "₹2,000 – ₹20,000+ / year (scheme-dependent)",
            mode: "Direct Benefit Transfer",
            documents: [
                "Aadhaar Card",
                "Previous year mark-sheet",
                "Bonafide / Institution ID Certificate",
                "Income Certificate",
                "Caste Certificate (SC/ST/OBC, if applicable)",
                "Bank Passbook (Aadhaar-linked)"
            ],
            amounts: [
                { category: "Pre-Matric Students (Class 9–10)", amount: "₹2,000 – ₹5,000 / year",
                  note: "Covers SC/ST/OBC/Minority pre-matric scholars" },
                { category: "Post-Matric Students (Class 11+)", amount: "₹5,000 – ₹20,000 / year",
                  note: "Tuition & maintenance allowance, course-dependent" },
                { category: "Merit-cum-Means Scholars", amount: "Up to ₹20,000 / year",
                  note: "For professional & technical courses" }
            ],
            loan: null,
            applyLink: "https://scholarships.gov.in/",
            priority: [
                { rank: 1, category: "SC / ST Students", level: "highest",
                  note: "Reserved scholarship slots and higher income ceiling" },
                { rank: 2, category: "Minority Community Students", level: "high",
                  note: "Dedicated minority scholarship schemes" },
                { rank: 3, category: "OBC Students", level: "medium",
                  note: "Post-matric OBC scholarship, subject to income limit" },
                { rank: 4, category: "General / EWS Students", level: "standard",
                  note: "Covered under state & merit-based scholarships" }
            ]
        },

        yasasvi: {
            name: "PM YASASVI Scholarship",
            icon: "fa-solid fa-book-open-reader",
            category: "education",
            top: false,
            stats: [
                { value: "268", label: "Students" },
                { value: "83%", label: "Coverage" }
            ],
            tagline: "Merit scholarship for OBC, EBC & DNT students",
            about:
                "Provides scholarships to meritorious students from Other " +
                "Backward Classes, Economically Backward Classes and " +
                "De-notified, Nomadic & Semi-Nomadic Tribes to pursue " +
                "school and higher education.",
            ministry: "Ministry of Social Justice & Empowerment",
            benefit: "₹75,000 – ₹1,25,000 / year (class-wise)",
            mode: "Direct Benefit Transfer",
            documents: [
                "Aadhaar Card",
                "Class 8 entrance exam scorecard",
                "Caste Certificate (OBC / EBC / DNT)",
                "Income Certificate",
                "School admission proof",
                "Bank Passbook"
            ],
            amounts: [
                { category: "Class 9 & 10 Students", amount: "₹75,000 / year",
                  note: "Paid for residential school stay & studies" },
                { category: "Class 11 & 12 Students", amount: "₹1,25,000 / year",
                  note: "Higher allowance for senior secondary stage" }
            ],
            loan: null,
            applyLink: "https://yet.nta.ac.in/",
            priority: [
                { rank: 1, category: "De-notified, Nomadic & Semi-Nomadic Tribes", level: "highest",
                  note: "Dedicated quota within the scheme" },
                { rank: 2, category: "Economically Backward Class Students", level: "high",
                  note: "Income-verified priority applicants" },
                { rank: 3, category: "OBC Students", level: "medium",
                  note: "Selected via entrance exam merit list" }
            ]
        },

        swadhar: {
            name: "Swadhar Greh Scheme",
            icon: "fa-solid fa-hands-holding-circle",
            category: "women",
            top: false,
            stats: [
                { value: "34", label: "Women Supported" },
                { value: "100%", label: "Shelter Active" }
            ],
            tagline: "Shelter & rehabilitation for women in difficult circumstances",
            about:
                "Provides shelter, food, clothing, counselling, legal aid " +
                "and skill training to women in distress — including " +
                "widows, divorced or deserted women, victims of domestic " +
                "violence, and women released from prison — who are " +
                "without family or social support.",
            ministry: "Ministry of Women & Child Development",
            benefit: "Free shelter, food, counselling, legal & skill support",
            mode: "Referral / walk-in at Swadhar Greh centre",
            documents: [
                "Aadhaar Card (or any ID proof)",
                "Proof of distress (divorce decree / desertion / police complaint, if available)",
                "Passport-size Photograph",
                "Reference letter from Gram Panchayat / Anganwadi (optional)",
                "Medical certificate (if applicable)"
            ],
            amounts: [
                { category: "All Women in Difficult Circumstances", amount: "Free residential support",
                  note: "Includes divorced, deserted, widowed & destitute women" },
                { category: "Skill Training & Vocational Support", amount: "Up to ₹5,000 / month stipend",
                  note: "During training period, centre-dependent" }
            ],
            loan: null,
            applyLink: "https://wcd.nic.in/schemes/swadhar-greh",
            priority: [
                { rank: 1, category: "Survivors of Violence / Trafficking", level: "highest",
                  note: "Immediate shelter admission, no waiting period" },
                { rank: 2, category: "Divorced / Deserted / Widowed Women", level: "high",
                  note: "Priority intake with legal & counselling support" },
                { rank: 3, category: "Women Released from Prison / Mental Hospitals", level: "medium",
                  note: "Admitted with rehabilitation & family-tracing support" }
            ]
        },

        msc: {
            name: "Mahila Samman Savings Certificate",
            icon: "fa-solid fa-piggy-bank",
            category: "women",
            top: false,
            stats: [
                { value: "187", label: "Accounts" },
                { value: "76%", label: "Coverage" }
            ],
            tagline: "Fixed-return small savings scheme for women & girls",
            about:
                "A one-time small savings scheme allowing women and girls " +
                "to deposit and earn a fixed, government-guaranteed " +
                "interest rate over a 2-year tenure, with a partial " +
                "withdrawal facility.",
            ministry: "Ministry of Finance",
            benefit: "Fixed 7.5% p.a. interest, 2-year tenure",
            mode: "Post Office / Authorised Bank account",
            documents: [
                "Aadhaar Card",
                "Proof of Residence",
                "Passport-size Photograph",
                "Guardian's ID (if account is for a minor girl)"
            ],
            amounts: [
                { category: "All Women & Girls (Min. Deposit)", amount: "₹1,000",
                  note: "Minimum deposit to open the account" },
                { category: "All Women & Girls (Max. Deposit)", amount: "₹2,00,000",
                  note: "Maximum deposit allowed per account" }
            ],
            loan: {
                title: "Interest Rate Earned on Deposit",
                rows: [
                    { category: "All Account Holders", rate: "7.5% p.a.",
                      note: "Fixed for the 2-year tenure, quarterly compounded" }
                ]
            },
            applyLink: "https://www.indiapost.gov.in/",
            priority: [
                { rank: 1, category: "All Women & Girls (any age)", level: "standard",
                  note: "No caste-based priority — open to every applicant" }
            ]
        }

    };


    /* =====================================================
       GOVERNMENT SCHEMES — CATEGORIES (for the filter bar
       shown when the user clicks "View All")
       ===================================================== */

    const schemeCategories = [
        { key: "all",         label: "All Schemes",     icon: "fa-solid fa-grip" },
        { key: "housing",     label: "Housing",          icon: "fa-solid fa-house" },
        { key: "water",       label: "Water",            icon: "fa-solid fa-droplet" },
        { key: "agriculture", label: "Agriculture",      icon: "fa-solid fa-wheat-awn" },
        { key: "employment",  label: "Employment",       icon: "fa-solid fa-person-walking" },
        { key: "health",      label: "Health",           icon: "fa-solid fa-heart-pulse" },
        { key: "education",   label: "Students",         icon: "fa-solid fa-graduation-cap" },
        { key: "women",       label: "Women",            icon: "fa-solid fa-venus" },
        { key: "girl-child",  label: "Girl Child",       icon: "fa-solid fa-child-dress" },
        { key: "senior",      label: "Senior Citizens",  icon: "fa-solid fa-person-cane" }
    ];


    /* =====================================================
       SCHEME DETAILS MODAL
       ===================================================== */

    const schemeModal = $("#schemeModal");

    function renderSchemeModal(schemeId) {

        const scheme = schemesData[schemeId];

        if (!scheme) return;

        $("#schemeModalTitle").textContent = scheme.name;
        $("#schemeModalSubtitle").textContent = scheme.tagline;
        $("#schemeModalAbout").textContent = scheme.about;
        $("#schemeModalIcon").innerHTML =
            `<i class="${scheme.icon}"></i>`;

        $("#schemeModalMeta").innerHTML = `
            <div>
                <span>Ministry</span>
                <strong>${scheme.ministry}</strong>
            </div>
            <div>
                <span>Benefit</span>
                <strong>${scheme.benefit}</strong>
            </div>
            <div>
                <span>Mode</span>
                <strong>${scheme.mode}</strong>
            </div>
        `;

        $("#schemeModalDocuments").innerHTML = scheme.documents
            .map(doc => `
                <li>
                    <i class="fa-solid fa-circle-check"></i>
                    <span>${doc}</span>
                </li>
            `)
            .join("");

        // Category-wise benefit amount
        const amountBlock = $("#schemeModalAmountBlock");

        if (scheme.amounts && scheme.amounts.length) {

            amountBlock.classList.remove("no-data");

            $("#schemeModalAmount").innerHTML = scheme.amounts
                .map(row => `
                    <div class="amount-row">
                        <div class="amount-icon">
                            <i class="fa-solid fa-sack-dollar"></i>
                        </div>
                        <div class="amount-category">
                            <strong>${row.category}</strong>
                            <small>${row.note}</small>
                        </div>
                        <span class="amount-value">${row.amount}</span>
                    </div>
                `)
                .join("");

        } else {
            amountBlock.classList.add("no-data");
        }

        // Loan interest rate (only for schemes with a loan / credit component)
        const loanBlock = $("#schemeModalLoanBlock");

        if (scheme.loan && scheme.loan.rows && scheme.loan.rows.length) {

            loanBlock.classList.remove("no-data");

            loanBlock.querySelector("h4").innerHTML =
                `<i class="fa-solid fa-percent"></i> ${scheme.loan.title}`;

            $("#schemeModalLoan").innerHTML = scheme.loan.rows
                .map(row => `
                    <div class="amount-row">
                        <div class="amount-icon loan">
                            <i class="fa-solid fa-percent"></i>
                        </div>
                        <div class="amount-category">
                            <strong>${row.category}</strong>
                            <small>${row.note}</small>
                        </div>
                        <span class="amount-value loan">${row.rate}</span>
                    </div>
                `)
                .join("");

        } else {
            loanBlock.classList.add("no-data");
        }

        $("#schemeModalPriority").innerHTML = scheme.priority
            .map(row => `
                <div class="priority-row">
                    <div class="priority-rank">${row.rank}</div>
                    <div class="priority-category">
                        <strong>${row.category}</strong>
                        <small>${row.note}</small>
                    </div>
                    <span class="priority-level ${row.level}">
                        ${row.level}
                    </span>
                </div>
            `)
            .join("");

        // Apply Now link
        const applyLink = $("#schemeModalApplyLink");

        if (scheme.applyLink) {
            applyLink.href = scheme.applyLink;
            applyLink.style.display = "";
        } else {
            applyLink.style.display = "none";
        }

        openModal(schemeModal);
    }

    $("#schemeGrid")?.addEventListener("click", event => {

        const trigger = event.target.closest(
            ".scheme-details-btn, .scheme-card"
        );

        if (!trigger) return;

        const schemeId = trigger.dataset.scheme;

        if (!schemeId) return;

        renderSchemeModal(schemeId);
    });

    $("#closeSchemeModal")?.addEventListener(
        "click",
        () => closeModal(schemeModal)
    );

    schemeModal?.addEventListener(
        "click",
        event => {

            if (event.target === schemeModal) {
                closeModal(schemeModal);
            }

        }
    );


    /* =====================================================
       GOVERNMENT SCHEMES — DYNAMIC GRID + CATEGORY FILTER

       Default state: only the "top" schemes are shown as cards.
       Clicking "View All" reveals a row of category chips
       (Students, Women, Health, Agriculture, ...). Picking a
       chip shows ONLY the schemes belonging to that type;
       "All Schemes" shows every scheme.
       ===================================================== */

    const schemeGrid       = $("#schemeGrid");
    const schemeFilterBar  = $("#schemeFilterBar");
    const schemeEmptyState = $("#schemeEmptyState");
    const viewAllSchemesBtn  = $("#viewAllSchemes");
    const viewAllSchemesText = $("#viewAllSchemesText");

    let schemesExpanded  = false;   // false = "top schemes" view
    let activeSchemeType  = "all";  // currently selected category chip

    // Build a single scheme card's markup
    function schemeCardHTML(id, scheme) {

        const statsHTML = (scheme.stats || [])
            .map(stat => `
                <span>
                    <strong>${stat.value}</strong>
                    ${stat.label}
                </span>
            `)
            .join("");

        return `
            <div class="scheme-card" data-scheme="${id}">

                <div class="scheme-icon">
                    <i class="${scheme.icon}"></i>
                </div>

                <div class="scheme-content">
                    <h3>${scheme.name}</h3>
                    <p>${scheme.tagline}</p>

                    <div class="scheme-stats">
                        ${statsHTML}
                    </div>

                    <button class="scheme-details-btn" data-scheme="${id}">
                        View Details
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

            </div>
        `;
    }

    // Build the category filter chips (once)
    function renderSchemeFilterBar() {

        if (!schemeFilterBar) return;

        schemeFilterBar.innerHTML = schemeCategories
            .map(cat => `
                <button
                    class="scheme-filter-chip${cat.key === activeSchemeType ? " active" : ""}"
                    data-category="${cat.key}"
                >
                    <i class="${cat.icon}"></i>
                    <span>${cat.label}</span>
                </button>
            `)
            .join("");
    }

    // Decide which schemes to show and paint the grid
    function renderSchemeGrid() {

        if (!schemeGrid) return;

        let entries = Object.entries(schemesData);

        if (!schemesExpanded) {
            // Collapsed view: only featured / top schemes
            entries = entries.filter(([, scheme]) => scheme.top);
        } else if (activeSchemeType !== "all") {
            // Expanded view with a specific type selected
            entries = entries.filter(
                ([, scheme]) => scheme.category === activeSchemeType
            );
        }
        // Expanded view + "all" selected -> every scheme

        if (entries.length === 0) {
            schemeGrid.innerHTML = "";
            schemeEmptyState?.classList.add("visible");
        } else {
            schemeEmptyState?.classList.remove("visible");
            schemeGrid.innerHTML = entries
                .map(([id, scheme]) => schemeCardHTML(id, scheme))
                .join("");
        }
    }

    // Toggle between "top schemes" and "browse by type"
    viewAllSchemesBtn?.addEventListener("click", () => {

        schemesExpanded = !schemesExpanded;
        activeSchemeType = "all";

        schemeFilterBar?.classList.toggle("visible", schemesExpanded);

        viewAllSchemesText.textContent =
            schemesExpanded ? "Show Less" : "View All";

        viewAllSchemesBtn.querySelector("i").className =
            schemesExpanded
                ? "fa-solid fa-arrow-up"
                : "fa-solid fa-arrow-right";

        renderSchemeFilterBar();
        renderSchemeGrid();

    });

    // Handle category chip selection
    schemeFilterBar?.addEventListener("click", event => {

        const chip = event.target.closest(".scheme-filter-chip");

        if (!chip) return;

        activeSchemeType = chip.dataset.category;

        renderSchemeFilterBar();
        renderSchemeGrid();

    });

    // Initial paint — top schemes, filter bar hidden
    renderSchemeFilterBar();
    renderSchemeGrid();


    /* =====================================================
       PRINT REPORT
       ===================================================== */

    $("#printReport")?.addEventListener(
        "click",
        () => {

            const preview =
                $("#reportPreview");


            if (!preview) {

                window.print();

                return;
            }


            const printWindow =
                window.open(
                    "",
                    "_blank",
                    "width=900,height=700"
                );


            if (!printWindow) {

                showToast(
                    "Print Blocked",
                    "Please allow pop-ups to print the report."
                );

                return;
            }


            printWindow.document.write(`

                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        GramVikas Development Report
                    </title>

                    <style>

                        body {
                            font-family: Arial, sans-serif;
                            padding: 40px;
                            color: #172033;
                        }

                        .report {
                            max-width: 800px;
                            margin: auto;
                            text-align: center;
                        }

                        .summary {
                            display: grid;
                            grid-template-columns:
                                repeat(4, 1fr);
                            gap: 12px;
                            margin-top: 30px;
                        }

                        .summary div {
                            padding: 18px;
                            border: 1px solid #ddd;
                            border-radius: 10px;
                        }

                    </style>

                </head>

                <body>

                    <div class="report">

                        ${preview.innerHTML}

                    </div>

                    <script>

                        window.onload = function() {
                            window.print();
                        };

                    <\/script>

                </body>

                </html>

            `);


            printWindow.document.close();

        }
    );


    /* =====================================================
       VIEW SERVICES
       ===================================================== */

    $("#viewAllServices")?.addEventListener(
        "click",
        () => {

            const services =
                $(".service-grid");

            services?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }
    );


    /* =====================================================
       VIEW ANNOUNCEMENTS
       ===================================================== */

    $("#viewAnnouncements")?.addEventListener(
        "click",
        () => {

            showToast(
                "Announcements",
                "All current announcements are displayed above."
            );

        }
    );


    /* =====================================================
       TOAST NOTIFICATION
       ===================================================== */

    let toastTimer;


    function showToast(
        title,
        message
    ) {

        const toast =
            $("#toast");

        if (!toast) return;


        const titleElement =
            $("#toastTitle");

        const messageElement =
            $("#toastMessage");


        if (titleElement) {

            titleElement.textContent =
                title;
        }


        if (messageElement) {

            messageElement.textContent =
                message;
        }


        toast.classList.add("show");


        clearTimeout(toastTimer);


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3500
            );

    }


    $("#closeToast")?.addEventListener(
        "click",
        () => {

            $("#toast")?.classList.remove(
                "show"
            );

        }
    );


    /* =====================================================
       SCROLL REVEAL ANIMATION
       ===================================================== */

    const revealItems = $$(
        ".stat-card, " +
        ".dashboard-card, " +
        ".service-card, " +
        ".indicator-card, " +
        ".scheme-card, " +
        ".report-card"
    );


    if ("IntersectionObserver" in window) {

        const revealObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        entry.target.style.opacity =
                            "1";

                        entry.target.style.transform =
                            "translateY(0)";


                        revealObserver.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.08
                }
            );


        revealItems.forEach(
            (item, index) => {

                item.style.opacity =
                    "0";

                item.style.transform =
                    "translateY(18px)";


                item.style.transition =
                    `opacity .55s ease ${
                        Math.min(
                            index * .035,
                            .25
                        )
                    }s,
                    transform .55s cubic-bezier(
                        .2,.8,.2,1
                    ) ${
                        Math.min(
                            index * .035,
                            .25
                        )
                    }s`;


                revealObserver.observe(
                    item
                );

            }
        );
    }


    /* =====================================================
       3D CARD HOVER
       ===================================================== */

    if (
        window.matchMedia(
            "(pointer:fine)"
        ).matches
    ) {

        $$(
            ".stat-card, " +
            ".service-card, " +
            ".scheme-card"
        ).forEach(card => {

            card.addEventListener(
                "pointermove",
                event => {

                    const rect =
                        card.getBoundingClientRect();


                    const x =
                        (event.clientX -
                            rect.left) /
                        rect.width -
                        0.5;


                    const y =
                        (event.clientY -
                            rect.top) /
                        rect.height -
                        0.5;


                    card.style.transform =
                        `perspective(700px)
                         rotateX(${(-y * 3).toFixed(2)}deg)
                         rotateY(${(x * 3).toFixed(2)}deg)
                         translateY(-5px)`;

                }
            );


            card.addEventListener(
                "pointerleave",
                () => {

                    card.style.transform =
                        "";

                }
            );

        });

    }


    /* =====================================================
       WELCOME MESSAGE
       ===================================================== */

    setTimeout(
        () => {

            showToast(
                "Welcome to GramVikas",
                "Village Development Dashboard is ready."
            );

        },
        900
    );

});