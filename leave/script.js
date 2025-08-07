// Use localStorage for demo, all leave requests stored in "leaveRequests_freeform"
let leaveRequests = JSON.parse(localStorage.getItem("leaveRequests_freeform") || "[]");

// UI references
const modal = document.getElementById('modal');
const newRequestBtn = document.getElementById('newRequestBtn');
const closeModal = document.getElementById('closeModal');
const leaveForm = document.getElementById('leaveForm');
const tabContent = document.getElementById('tab-content');
const myRequestsTab = document.getElementById('myRequestsTab');
const analyticsTab = document.getElementById('analyticsTab');

// Modal logic
newRequestBtn.onclick = () => { 
    modal.style.display = 'block'; 
    leaveForm.reset();
};
closeModal.onclick = () => { modal.style.display = 'none'; };
window.onclick = function(event) { if (event.target === modal) modal.style.display = "none"; };

// Tab click logic
myRequestsTab.onclick = () => {
    setActiveTab(myRequestsTab);
    renderRequests();
};
analyticsTab.onclick = () => {
    setActiveTab(analyticsTab);
    renderAnalytics();
};

function setActiveTab(tab) {
    myRequestsTab.classList.remove('active');
    analyticsTab.classList.remove('active');
    tab.classList.add('active');
}

// Leave requests display
function renderRequests() {
    if(leaveRequests.length === 0){
        tabContent.innerHTML = `<div style='padding:16px;color:#888;'>No leave requests yet.</div>`;
        return;
    }
    tabContent.innerHTML = "";
    leaveRequests.forEach(req => {
        const card = document.createElement('div');
        card.className = "leave-card";
        card.innerHTML = `
            <div class="leave-info">
                <div><b>${req.employee}</b> (${req.leaveType})</div>
                <div>Duration: ${req.startDate} to ${req.endDate} (${req.days} days)</div>
                <div>Reason: ${req.reason}</div>
                <div>Status: <span class="status-${req.status.toLowerCase()}">${req.status}</span></div>
            </div>
        `;
        tabContent.appendChild(card);
    });
}

// Analytics display
function renderAnalytics() {
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

// Submit new request
leaveForm.onsubmit = (e) => {
    e.preventDefault();
    const employee = document.getElementById('employee').value.trim();
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();
    const days = calcDays(startDate, endDate);
    leaveRequests.unshift({
        employee, 
        leaveType, 
        startDate,
        endDate,
        days,
        reason,
        status: 'Pending'
    });
    localStorage.setItem("leaveRequests_freeform", JSON.stringify(leaveRequests));
    modal.style.display = 'none';
    leaveForm.reset();
    renderRequests();
    myRequestsTab.click();
};

function calcDays(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (Math.abs(endDate - startDate) / (1000 * 3600 * 24)) + 1;
}

// Initial
myRequestsTab.click();

// Auto-refresh UI when localStorage changes (e.g., if admin updates status in another window)
window.addEventListener('storage', function(e) {
    if(e.key === "leaveRequests_freeform") {
        leaveRequests = JSON.parse(localStorage.getItem("leaveRequests_freeform") || "[]");
        renderRequests();
        renderAnalytics();
    }
});