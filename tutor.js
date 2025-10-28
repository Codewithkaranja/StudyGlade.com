<<<<<<< HEAD
// tutor.js — StudyGlade Tutor Dashboard

// -------------------------
// Global Variables
// -------------------------
let assignments = [];
let currentUploadIndex = null;
let students = [];

// -------------------------
// Auth Check
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  const tutorToken = localStorage.getItem("tutorToken");
  if (!tutorToken) {
    alert("Unauthorized access! Redirecting...");
    window.location.href = "index.html";
    return;
  }

  // Load assignments
  loadAssignments();
});

// -------------------------
// Show Tutor Name
// -------------------------
const tutorNameSpan = document.getElementById("tutor-name");
if (tutorNameSpan) {
  const storedTutorName =
    localStorage.getItem("tutorName") || "Tutor Charles";
  tutorNameSpan.textContent = storedTutorName;
}

// -------------------------
// Load Assignments
// -------------------------
function loadAssignments() {
  assignments = JSON.parse(localStorage.getItem("questions")) || [];

  // Create unique student list
  students = [...new Set(assignments.map(a => a.studentName))];
  renderStudentFilter();
  renderAssignments();
  updateStats();
}

// -------------------------
// Student Filter Dropdown
// -------------------------
function renderStudentFilter() {
  const filterSelect = document.getElementById("studentFilter");
  if (!filterSelect) return;

  filterSelect.innerHTML =
    '<option value="all">All Students</option>' +
    students.map(name => `<option value="${name}">${name}</option>`).join("");

  // Use onchange to avoid multiple listeners
  filterSelect.onchange = () => renderAssignments(filterSelect.value);
}

// -------------------------
// Render Assignments Table
// -------------------------
function renderAssignments(filterStudent = "all") {
  const tbody = document.getElementById("assignments-list");
  const tutorQuestions = document.getElementById("tutorQuestions");
  if (!tbody) return;

  let filtered = assignments;
  if (filterStudent !== "all") {
    filtered = assignments.filter(a => a.studentName === filterStudent);
  }

  tbody.innerHTML = filtered.map((a, i) => {
    const isPastDue = new Date(a.deadline) < new Date() && a.status === 'Pending';
    return `
      <tr>
        <td>${a.studentName}</td>
        <td>${a.title}</td>
        <td>${a.subject}</td>
        <td>${a.topic}</td>
        <td>${new Date(a.deadline).toLocaleString()}</td>
        <td>
          <span class="badge ${a.status === "Pending" ? "pending" : "completed"}">
            ${a.status}
          </span>
          ${isPastDue ? `<span class="badge past-due">Past Due</span>` : ""}
        </td>
        <td>$${a.amount}</td>
        <td>
          ${
            a.questionFile
              ? `<div class="btn-group">
                   <a href="${a.questionFile}" target="_blank" class="btn btn-view">
                     <i class="fa-solid fa-eye"></i> View
                   </a>
                   <a href="${a.questionFile}" download="${a.title}" class="btn btn-download">
                     <i class="fa-solid fa-download"></i> Download
                   </a>
                 </div>` 
              : "No file"
          }
        </td>
        <td>
          ${
            a.status === "Pending"
              ? `<button onclick="showUploadModal(${i})" class="btn-primary">
                   <i class="fa-solid fa-upload"></i> Upload Answer
                 </button>`
              : a.answerFile
                ? `<a href="${a.answerFile}" target="_blank" class="btn btn-answer">
                     <i class="fa-solid fa-file-arrow-up"></i> View Answer
                   </a>`
                : "—"
          }
        </td>
      </tr>
    `;
  }).join("");

  // If no assignments, show message
  tutorQuestions.innerHTML = filtered.length
    ? ""
    : `<p style="text-align:center; margin:1rem;">No assignments available.</p>`;

  updateStats(filtered);
}

// -------------------------
// Animate Value Counter
// -------------------------
function animateValue(id, start, end, duration, colorClass) {
  const element = document.getElementById(id);
  const range = end - start;
  const minIncrement = range > 0 && range < 5 ? 1 : range / (duration / 20);
  let current = start;

  if (colorClass) element.classList.add(colorClass);

  const timer = setInterval(() => {
    current += minIncrement;
    if ((minIncrement > 0 && current >= end) || (minIncrement < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
      if (colorClass) setTimeout(() => element.classList.remove(colorClass), 500);
    }
    element.innerHTML = element.innerHTML.replace(/\d+(\.\d+)?/, Math.floor(current));
  }, 15);
}
// Get elements
const tutorNameEl = document.getElementById('tutor-name');
const totalAssignmentsEl = document.getElementById('total-assignments');
const pendingAssignmentsEl = document.getElementById('pending-assignments');
const pastDueAssignmentsEl = document.getElementById('past-due-assignments');
const completedAssignmentsEl = document.getElementById('completed-assignments');
const totalEarningsEl = document.getElementById('total-earnings');
const pendingEarningsEl = document.getElementById('pending-earnings'); // NEW

// Example data (replace with your API/fetch logic)
const tutorData = {
  name: "John Doe",
  totalAssignments: 12,
  pendingAssignments: 3,
  pastDueAssignments: 1,
  completedAssignments: 8,
  totalEarnings: 250,
  pendingEarnings: 75 // NEW
};

// Function to update stats
function updateTutorStats(data) {
  tutorNameEl.textContent = data.name;
  totalAssignmentsEl.innerHTML = `<i class="fa-solid fa-clipboard"></i> ${data.totalAssignments}`;
  pendingAssignmentsEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${data.pendingAssignments}`;
  pastDueAssignmentsEl.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${data.pastDueAssignments}`;
  completedAssignmentsEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${data.completedAssignments}`;
  totalEarningsEl.innerHTML = `<i class="fa-solid fa-dollar-sign"></i> $${data.totalEarnings}`;
  pendingEarningsEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> $${data.pendingEarnings}`; // NEW

  // Optional animation when values update
  [totalEarningsEl, pendingEarningsEl].forEach(el => {
    el.classList.add('updated');
    setTimeout(() => el.classList.remove('updated'), 400);
  });
}

// Initial render
updateTutorStats(tutorData);

// -------------------------
// Update Stats Cards
// -------------------------
function updateStats(filtered = assignments) {
  const total = filtered.length;
  const pending = filtered.filter(a => a.status === "Pending").length;
  const completed = filtered.filter(a => a.status === "Completed").length;
  const pastDue = filtered.filter(
    a => a.status === "Pending" && new Date(a.deadline) < new Date()
  ).length;

  const earnings = filtered
    .filter(a => a.status === "Completed")
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const pendingEarnings = filtered
    .filter(a => a.status === "Pending")
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  // 🧮 Update all stat cards
  document.getElementById("total-assignments").innerHTML =
    `<i class="fa-solid fa-clipboard"></i> ${total}`;
  document.getElementById("pending-assignments").innerHTML =
    `<i class="fa-solid fa-hourglass-half fa-spin"></i>
 ${pending}`;
  document.getElementById("completed-assignments").innerHTML =
    `<i class="fa-solid fa-check-circle"></i> ${completed}`;

  const pastDueElem = document.getElementById("past-due-assignments");
  if (pastDueElem)
    pastDueElem.innerHTML =
      `<i class="fa-solid fa-exclamation-triangle"></i> ${pastDue}`;

  document.getElementById("total-earnings").innerHTML =
    `<i class="fa-solid fa-hand-holding-dollar"></i>$
${earnings}`;
  
  // 💸 New: Pending earnings card
  const pendingEarningsEl = document.getElementById("pending-earnings");
  if (pendingEarningsEl)
    pendingEarningsEl.innerHTML =
      `<i class="fa-solid fa-hand-holding-dollar fa-spin"></i>
 $${pendingEarnings}`;
}


// -------------------------
// Upload Modal Logic
// -------------------------
function showUploadModal(index) {
  currentUploadIndex = index;
  document.getElementById("upload-modal").style.display = "block";
}

function hideUploadModal() {
  document.getElementById("upload-modal").style.display = "none";
}

const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", e => {
    e.preventDefault();
    if (currentUploadIndex === null) return;

    const file = document.getElementById("answer-file").files[0];
    if (!file) return alert("Please select a file to upload.");

    const reader = new FileReader();
    reader.onload = () => {
      assignments[currentUploadIndex].answerFile = reader.result;
      assignments[currentUploadIndex].status = "Completed";

      localStorage.setItem("questions", JSON.stringify(assignments));
      renderAssignments(document.getElementById("studentFilter").value);
      hideUploadModal();
      alert("Answer uploaded successfully!");
    };
    reader.readAsDataURL(file);
  });
}

// -------------------------
// Auto-refresh Assignments
// -------------------------
setInterval(() => {
  const latest = JSON.parse(localStorage.getItem("questions")) || [];
  if (JSON.stringify(latest) !== JSON.stringify(assignments)) {
    assignments = latest;
    students = [...new Set(assignments.map(a => a.studentName))];
    renderStudentFilter();
    renderAssignments(document.getElementById("studentFilter").value);
  }
}, 3000);
function redirectToPaypoint() {
  window.location.href = "paypoint.html"; // or your desired URL
}

// -------------------------
// Logout
// -------------------------
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    // localStorage.removeItem("tutorToken"); // uncomment for strict logout
    //localStorage.setItem('tutorToken', 'dev-tutor-token')
    window.location.href = "index.html";
  });
}
=======
// -------------------------
// Global Variables
// -------------------------
let assignments = [];
let currentUploadIndex = null;
let students = []; // list of unique students

// -------------------------
// Auth: Redirect if not tutor
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  const tutorToken = localStorage.getItem('tutorToken');

  if (!tutorToken) {
    window.location.href = 'index.html';
    return;
  }

  // Load all assignments from localStorage (all students)
  assignments = JSON.parse(localStorage.getItem('questions')) || [];

  // Generate unique student list
  students = [...new Set(assignments.map(a => a.studentName))];
  renderStudentFilter();

  renderAssignments();
});

// -------------------------
// Render Student Filter Dropdown
// -------------------------
function renderStudentFilter() {
  const filterSelect = document.getElementById('student-filter');
  if (!filterSelect) return;

  filterSelect.innerHTML = '<option value="all">All Students</option>' +
    students.map(name => `<option value="${name}">${name}</option>`).join('');

  filterSelect.addEventListener('change', () => {
    renderAssignments(filterSelect.value);
  });
}

// -------------------------
// Render Assignments Table
// -------------------------
function renderAssignments(filterStudent = 'all') {
  const tbody = document.getElementById('assignments-list');
  if (!tbody) return;

  let filteredAssignments = assignments;
  if (filterStudent !== 'all') {
    filteredAssignments = assignments.filter(a => a.studentName === filterStudent);
  }

  tbody.innerHTML = filteredAssignments.map((a, i) => `
    <tr>
      <td>${a.studentName}</td>
      <td>${a.title}</td>
      <td>${a.subject}</td>
      <td>${a.topic}</td>
      <td>${new Date(a.deadline).toLocaleString()}</td>
      <td>${a.status}</td>
      <td>$${a.amount}</td>
      <td>
        ${a.status === 'Pending' ? `<button onclick="showUploadModal(${i})" class="btn-primary">Upload Answer</button>` :
          a.answerFile ? `<a href="${a.answerFile}" target="_blank" class="btn-secondary">View Answer</a>` : '—'}
      </td>
    </tr>
  `).join('');

  // Update stats for filtered view
  document.getElementById('total-assignments').innerText = filteredAssignments.length;
  document.getElementById('pending-assignments').innerText = filteredAssignments.filter(a => a.status === 'Pending').length;
  document.getElementById('completed-assignments').innerText = filteredAssignments.filter(a => a.status === 'Completed').length;
  document.getElementById('total-earnings').innerText = '$' + filteredAssignments.reduce((sum, a) => sum + (a.status === 'Completed' ? a.amount : 0), 0);
}

// -------------------------
// Upload Modal Functions
// -------------------------
function showUploadModal(index) {
  currentUploadIndex = index;
  document.getElementById('upload-modal').style.display = 'block';
}

function hideUploadModal() {
  document.getElementById('upload-modal').style.display = 'none';
}

// -------------------------
// Handle Answer Upload
// -------------------------
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    if (currentUploadIndex === null) return;

    const file = document.getElementById('answer-file').files[0];
    if (!file) return alert("Please select a file to upload.");

    assignments[currentUploadIndex].answerFile = URL.createObjectURL(file);
    assignments[currentUploadIndex].status = 'Completed';

    renderAssignments(document.getElementById('student-filter').value);
    hideUploadModal();
    alert('Answer uploaded successfully!');
  });
}

// -------------------------
// Auto-refresh assignments
// -------------------------
setInterval(() => {
  const latestAssignments = JSON.parse(localStorage.getItem('questions')) || [];
  if (JSON.stringify(latestAssignments) !== JSON.stringify(assignments)) {
    assignments = latestAssignments;
    students = [...new Set(assignments.map(a => a.studentName))];
    renderStudentFilter();
    renderAssignments(document.getElementById('student-filter').value);
  }
}, 3000);

// -------------------------
// Logout
// -------------------------
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
  //localStorage.removeItem('tutorToken');
  //localStorage.setItem('tutorToken', 'dev-tutor-token');
  
  window.location.href = 'index.html';
});
>>>>>>> e5e825f28639e9ea07307309a76af16cfb497822
