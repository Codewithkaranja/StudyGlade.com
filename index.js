// =========================
// Auth: Check tutor login (redirect if needed for tutor pages)
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const tutorToken = localStorage.getItem('tutorToken');
  if (window.location.pathname.includes('tutor.html') && !tutorToken) {
    window.location.href = 'index.html';
  }
});

// =========================
// Data
// =========================
let questions = JSON.parse(localStorage.getItem('questions')) || [];
let recommendedDocuments = [
  { title: "Calculus Lecture Notes", category: "notes", subject: "Mathematics", uploader: "Admin", downloads: 120, fileUrl: "#" },
  { title: "Physics Past Paper", category: "past-papers", subject: "Physics", uploader: "Admin", downloads: 85, fileUrl: "#" },
];

// =========================
// DOM Elements
// =========================
const questionForm = document.getElementById("question-form");
const questionsList = document.getElementById("questions-list");
const recommendedDocsGrid = document.getElementById("recommended-documents");
const totalQuestionsEl = document.getElementById("total-questions");
const pendingQuestionsEl = document.getElementById("pending-questions");
const completedQuestionsEl = document.getElementById("completed-questions");
const totalEarningsEl = document.getElementById("total-earnings");

// =========================
// Render Functions
// =========================
function renderQuestions() {
  if (!questionsList) return;

  questionsList.innerHTML = questions
    .map(q => `
      <div class="question-card">
        <div class="question-header">
          <h4>${q.title}</h4>
          <div class="badges">
            ${(new Date() - new Date(q.postedAt)) / (1000 * 60 * 60) < 24 ? '<span class="badge new">New</span>' : ""}
            ${q.views > 50 ? '<span class="badge popular">Popular</span>' : ""}
          </div>
        </div>
        <p>${q.description}</p>
        <div class="question-meta">
          <span>Student: ${q.studentName}</span>
          <span>Subject: ${q.subject}</span>
          <span>Topic: ${q.topic}</span>
          <span>Deadline: ${new Date(q.deadline).toLocaleString()}</span>
          <span>Amount: $${q.amount}</span>
          <span>Status: ${q.status}</span>
        </div>
        <div class="question-attachments">
          ${q.documentUrl ? `<a href="${q.documentUrl}" target="_blank" class="btn-attach">📄 Document</a>` : ""}
          ${q.imageUrl ? `<a href="${q.imageUrl}" target="_blank" class="btn-attach">🖼 Image</a>` : ""}
          ${q.answerFile ? `<a href="${q.answerFile}" download class="btn-primary">Download Answer</a>` : ""}
        </div>
      </div>
    `).join("");

  updateStats();
}

function renderRecommendedDocuments() {
  if (!recommendedDocsGrid) return;

  recommendedDocsGrid.innerHTML = recommendedDocuments
    .map(doc => `
      <div class="document-card">
        <div class="doc-thumbnail"><i class="fas fa-file-pdf"></i></div>
        <div class="doc-title">${doc.title}</div>
        <div class="doc-meta">
          <span>${doc.subject}</span>
          <span>${doc.category}</span>
        </div>
        <div class="doc-meta">
          <span>By ${doc.uploader}</span>
          <span>${doc.downloads} downloads</span>
        </div>
        <div class="doc-actions">
          <a href="${doc.fileUrl}" target="_blank" class="btn-download">Download</a>
        </div>
      </div>
    `).join("");
}

function updateStats() {
  totalQuestionsEl.textContent = questions.length;
  pendingQuestionsEl.textContent = questions.filter(q => q.status === "Pending").length;
  completedQuestionsEl.textContent = questions.filter(q => q.status === "Completed").length;
  totalEarningsEl.textContent = `$${questions.reduce((acc, q) => (q.status === "Completed" ? acc + q.amount : acc), 0)}`;
}

// =========================
// Modal Functions
// =========================
function showQuestionModal() { document.getElementById("question-modal").style.display = "block"; }
function hideQuestionModal() { document.getElementById("question-modal").style.display = "none"; }

// =========================
// Student Submits Question
// =========================
if (questionForm) {
  questionForm.addEventListener("submit", e => {
    e.preventDefault();

    const studentId = localStorage.getItem("studentId") || `stu_${Date.now()}`;
    const studentName = document.getElementById("student-name").value || "Anonymous";

    localStorage.setItem("studentId", studentId);

    const newQuestion = {
      studentId,
      studentName,
      title: document.getElementById("question-title").value,
      description: document.getElementById("question-description").value,
      subject: document.getElementById("question-subject").value,
      topic: document.getElementById("question-topic").value,
      deadline: new Date(document.getElementById("question-deadline").value),
      amount: parseFloat(document.getElementById("question-amount").value),
      status: "Pending",
      postedAt: new Date(),
      views: 0,
      documentUrl: document.getElementById("question-document").files[0] ? URL.createObjectURL(document.getElementById("question-document").files[0]) : "",
      imageUrl: document.getElementById("question-image").files[0] ? URL.createObjectURL(document.getElementById("question-image").files[0]) : "",
      answerFile: null
    };

    questions.unshift(newQuestion);
    localStorage.setItem("questions", JSON.stringify(questions));
    renderQuestions();
    hideQuestionModal();
    questionForm.reset();
    alert("Question posted successfully!");
  });
}

// =========================
// Logout
// =========================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) logoutBtn.addEventListener("click", e => {
  e.preventDefault();
  localStorage.removeItem("tutorToken");
  window.location.href = "index.html";
});

// =========================
// Auto-refresh Questions
// =========================
setInterval(() => {
  const latestQuestions = JSON.parse(localStorage.getItem("questions")) || [];
  if (JSON.stringify(latestQuestions) !== JSON.stringify(questions)) {
    questions = latestQuestions;
    renderQuestions();
  }
}, 3000);

// =========================
// Initial Render
// =========================
renderQuestions();
renderRecommendedDocuments();
