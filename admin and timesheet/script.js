const urlParams = new URLSearchParams(window.location.search);
const dateFromURL = urlParams.get('date');

if (dateFromURL) {
    window.addEventListener('DOMContentLoaded', () => {
        const dateInput = document.getElementById("date");
        dateInput.value = dateFromURL;
        updateEditableDays(dateFromURL);
        loadTable();
    });
}


const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TASKS = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5", "Task 6"];
let editableDays = [];
let currentWeekDates = [];

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function loadTable() {
    const tbody = document.getElementById("task-table");
    tbody.innerHTML = "";
    currentWeekDates = [];

    const weekStart = getMonday(document.getElementById("date").value);
    for (let i = 0; i < 5; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        currentWeekDates.push(formatDate(d));
    }

    TASKS.forEach(task => {
        const tr = document.createElement("tr");

        const tdTask = document.createElement("td");
        tdTask.textContent = task;
        tr.appendChild(tdTask);

        DAYS.forEach((day, index) => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.className = "task-input";
            input.dataset.task = task;
            input.dataset.day = day;
            input.dataset.date = currentWeekDates[index];
            input.disabled = !editableDays.includes(day);
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".total").forEach(t => t.value = "");
}

function calculateTotal() {
    const totals = {};
    DAYS.forEach(day => totals[day] = 0);

    const tempTotals = {};
    DAYS.forEach(day => tempTotals[day] = 0);

    document.querySelectorAll(".task-input").forEach(input => {
        const val = parseFloat(input.value);
        const day = input.dataset.day;

        if (!isNaN(val)) {
            tempTotals[day] += val;
        }
    });

    for (const day in tempTotals) {
        if (tempTotals[day] > 9) {
            alert(`More than 9 hours not allowed for ${day}. Please adjust your entries.`);
            return;
        }
    }

    document.querySelectorAll(".task-input").forEach(input => {
        const val = parseFloat(input.value);
        const day = input.dataset.day;

        if (!isNaN(val)) {
            totals[day] += val;
        }
    });

    document.querySelectorAll(".total").forEach((input, index) => {
        const day = DAYS[index];
        input.value = totals[day] || 0;
    });
}

function clearWeek() {
    document.querySelectorAll(".task-input").forEach(input => {
        input.value = "";
    });
    document.querySelectorAll(".total").forEach(t => t.value = "");
}

function saveTimesheet() {
    const empId = document.getElementById("emp-id").value.trim();
    const selectedDate = document.getElementById("date").value;

    if (!empId || !selectedDate) {
        alert("Please enter Employee ID and select a date.");
        return;
    }

    const weekStart = getMonday(new Date(selectedDate));
    const data = {
        empId,
        weekStart: formatDate(weekStart),
        tasks: {}
    };

    TASKS.forEach(task => {
        data.tasks[task] = {};
        DAYS.forEach(day => {
            const input = document.querySelector(`.task-input[data-task="${task}"][data-day="${day}"]`);
            data.tasks[task][day] = input ? input.value : "";
        });
    });

    const totals = document.querySelectorAll(".total");
    data.totalHours = {};
    totals.forEach((input, index) => {
        data.totalHours[DAYS[index]] = input.value;
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Timesheet_${empId}_${data.weekStart}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Timesheet downloaded.");
}

function updateEditableDays(selectedDateStr) {
    const today = new Date();
    const selectedDate = new Date(selectedDateStr);
    const monday = getMonday(selectedDate);

    editableDays = [];

    if (selectedDate > today) {
        alert("Future dates are not allowed.");
        document.getElementById("date").value = "";
        return;
    }

    if (selectedDate.toDateString() === today.toDateString()) {
        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            if (date.toDateString() === today.toDateString()) {
                editableDays.push(DAYS[i]);
            }
        }
    } else if (selectedDate < today) {
        editableDays = []; // Previous week – read only
    } else if (selectedDate.getDay() === 1) {
        editableDays = [...DAYS];
    }
}

const dateInput = document.getElementById("date");
dateInput.addEventListener("change", () => {
    const selectedDateStr = dateInput.value;
    if (!selectedDateStr) return;

    updateEditableDays(selectedDateStr);
    loadTable();
});

loadTable();