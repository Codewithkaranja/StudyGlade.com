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
