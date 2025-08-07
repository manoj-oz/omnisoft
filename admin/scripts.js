// Hardcoded admin credentials
const ADMIN_USER = "Arjun";
const ADMIN_PASS = "12345";

// Employee portal stores requests in this key for shared demo
const LS_KEY = "leaveRequests_freeform";

// Load requests
let leaveRequests = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

// DOM references
const loginSection = document.getElementById('login-section');
const portalSection = document.getElementById('portal-section');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');
const tabContent = document.getElementById('tab-content');
const allRequestsTab = document.getElementById('allRequestsTab');
const analyticsTab = document.getElementById('analyticsTab');

// Login logic
adminLoginForm.onsubmit = function(e) {
    e.preventDefault();
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;
    if (u === ADMIN_USER && p === ADMIN_PASS) {
        loginSection.style.display = "none";
        portalSection.style.display = "";
        allRequestsTab.classList.add('active');
        analyticsTab.classList.remove('active');
        renderRequests();
    } else {
        loginError.innerText = "Incorrect credentials";
    }
};
// Tab navigation
allRequestsTab.onclick = function() {
    setAdminTab(allRequestsTab);
    renderRequests();
};
analyticsTab.onclick = function() {
    setAdminTab(analyticsTab);
    renderAnalytics();
};

function setAdminTab(tab) {
    allRequestsTab.classList.remove('active');
    analyticsTab.classList.remove('active');
    tab.classList.add('active');
}

// Requests table
function renderRequests() {
    leaveRequests = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    tabContent.innerHTML = "";
    if(leaveRequests.length === 0){
        tabContent.innerHTML = `<div style='padding:16px;color:#888;'>No requests in the system.</div>`;
        return;
    }
    leaveRequests.forEach((req, idx) => {
        const card = document.createElement('div');
        card.className = "leave-card";
        card.innerHTML = `
            <div class="leave-info">
                <div><b>${escapeHTML(req.employee)}</b> (${escapeHTML(req.leaveType)})</div>
                <div>Duration: ${escapeHTML(req.startDate)} to ${escapeHTML(req.endDate)} (${escapeHTML(req.days)} days)</div>
                <div>Reason: ${escapeHTML(req.reason)}</div>
                <div>Status: <span class="status-${req.status.toLowerCase()}">${req.status}</span></div>
            </div>
            <div class="leave-actions">
                ${
                  req.status === 'Pending'
                    ? `<button class="approve" onclick="window.approveRequest(${idx})">Approve</button>
                       <button class="reject" onclick="window.rejectRequest(${idx})">Reject</button>`
                    : req.status === "Approved"
                        ? `<span class="status-approved">✔</span>`
                        : req.status === "Rejected"
                            ? `<span class="status-rejected">✘</span>`
                            : `<span class="status-pending">⏸</span>`
                }
            </div>
        `;
        tabContent.appendChild(card);
    });
}
// Very simple HTML injection defense
function escapeHTML(str) {
    return String(str).replace(/[<>"'&]/g, c =>
        ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c])
    );
}

// Approve/reject
window.approveRequest = function(idx) {
    leaveRequests[idx].status = "Approved";
    saveAndRefresh();
};
window.rejectRequest = function(idx) {
    leaveRequests[idx].status = "Rejected";
    saveAndRefresh();
};
function saveAndRefresh() {
    localStorage.setItem(LS_KEY, JSON.stringify(leaveRequests));
    renderRequests();
}

// Analytics
function renderAnalytics() {
    leaveRequests = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    let total = leaveRequests.length;
    let approved = leaveRequests.filter(x => x.status === "Approved").length;
    let pending = leaveRequests.filter(x => x.status === "Pending").length;
    let rejected = leaveRequests.filter(x => x.status === "Rejected").length;
    tabContent.innerHTML = `
        <div class="analytics-boxes">
            <div class="analytics-box">
                <div class="analytics-label">Total Requests</div>
                ${total}
            </div>
            <div class="analytics-box">
                <div class="analytics-label">Approved</div>
                ${approved}
            </div>
            <div class="analytics-box">
                <div class="analytics-label">Pending</div>
                ${pending}
            </div>
            <div class="analytics-box">
                <div class="analytics-label">Rejected</div>
                ${rejected}
            </div>
        </div>
    `;
}

// Live sync (if employee portal is open in another tab)
window.addEventListener('storage', function(e) {
    if(e.key === LS_KEY) {
        leaveRequests = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        if (allRequestsTab.classList.contains('active')) renderRequests();
        else renderAnalytics();
    }
});