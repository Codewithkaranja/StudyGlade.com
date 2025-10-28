// =========================
// Auth: Check tutor login
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
let currentStudent = localStorage.getItem("studentName") || prompt("Enter your name:");
localStorage.setItem("studentName", currentStudent);

// =========================
// DOM Elements
// =========================
const postForm = document.getElementById("question-form");
const questionsList = document.getElementById("questionsList");
const totalQuestionsEl = document.getElementById("total-questions");
const pendingQuestionsEl = document.getElementById("pending-questions");
const completedQuestionsEl = document.getElementById("completed-questions");
const totalEarningsEl = document.getElementById("total-earnings");
//const subjectsEl = document.getElementById("subjects-covered");
//if(subjectsEl) subjectsEl.textContent = subjectsCovered.join(", ");
const subjectsCovered = [...new Set(questions.map(q => q.subject).filter(s => s))];

// =========================
// Helper: Convert file to Base64
// =========================
const convertFileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

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
          <span>Student: ${q.student}</span>
          <span>Subject: ${q.subject || ""}</span>
          <span>Topic: ${q.topic || ""}</span>
          <span>Deadline: ${q.deadline ? new Date(q.deadline).toLocaleString() : ""}</span>
          <span>Amount: $${q.amount || 0}</span>
          <span>Status: ${q.status}</span>
        </div>
        <div class="question-attachments">
          ${q.doc ? `<a href="${q.doc}" download class="btn-attach">📄 Document</a>` : ""}
          ${q.img ? `<a href="${q.img}" target="_blank" class="btn-attach">🖼 Image</a>` : ""}
          ${q.answerFile ? `<a href="${q.answerFile}" download class="btn-primary">Download Answer</a>` : ""}
        </div>
      </div>
    `).join("");

  updateStats();
}

function updateStats() {
  const all = questions;
  if (totalQuestionsEl) totalQuestionsEl.textContent = all.length;
  if (pendingQuestionsEl) pendingQuestionsEl.textContent = all.filter(q => q.status === "Pending" || q.status === "Pending Payment").length;
  if (completedQuestionsEl) completedQuestionsEl.textContent = all.filter(q => q.status === "Completed").length;
  if (totalEarningsEl) totalEarningsEl.textContent = `$${all.reduce((acc, q) => (q.status === "Completed" ? acc + q.amount : acc), 0)}`;

  // Subjects Covered
  const subjectsEl = document.getElementById("subjects-covered");
  if (subjectsEl) {
    const uniqueSubjects = [...new Set(all.map(q => q.subject).filter(s => s))]; // filter out empty subjects
    subjectsEl.textContent = uniqueSubjects.length;
  }
}

// =========================
// Load Student Questions
// =========================
function loadStudentQuestions() {
  if (!questionsList) return;
  questionsList.innerHTML = "";

  questions
    .filter(q => q.student === currentStudent)
    .forEach(q => {
      const div = document.createElement("div");
      div.classList.add("question-item");
      div.innerHTML = `
        <h3>${q.title}</h3>
        <p>${q.description}</p>
        <small>Status: <strong>${q.status}</strong></small>
        ${q.answerFile ? `<br><a href="${q.answerFile}" download="Answer_${q.id}.pdf" class="btn">Download Answer</a>` : ""}
      `;
      questionsList.appendChild(div);
    });
}

// =========================
// Post New Question (Base64)
// =========================
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("questionTitle").value.trim();
  const description = document.getElementById("questionDescription").value.trim();
  const docFile = document.getElementById("questionDocument").files[0];
  const imgFile = document.getElementById("questionImage").files[0];

  if (!title || !description) return alert("Please fill in all fields!");

  // ======= File Size Check (5MB Max) =======
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (docFile && docFile.size > MAX_SIZE) {
    return alert("Document file too large! Maximum size is 5MB.");
  }
  if (imgFile && imgFile.size > MAX_SIZE) {
    return alert("Image file too large! Maximum size is 5MB.");
  }

  // ======= Convert Files to Base64 =======
  const [docData, imgData] = await Promise.all([
    convertFileToBase64(docFile),
    convertFileToBase64(imgFile)
  ]);

  const newQuestion = {
    id: Date.now(),
    student: currentStudent,
    title,
    description,
    doc: docData,
    img: imgData,
    status: "Pending",
    postedAt: new Date(),
    views: 0,
    subject: document.getElementById("questionSubject")?.value || "",
    topic: document.getElementById("questionTopic")?.value || "",
    deadline: document.getElementById("questionDeadline")?.value || "",
    amount: parseFloat(document.getElementById("questionAmount")?.value) || 0,
    answerFile: null
  };

  questions.unshift(newQuestion);
  localStorage.setItem("questions", JSON.stringify(questions));

  postForm.reset();
  renderQuestions();
  loadStudentQuestions();

  // Open payment modal for the new question
  openPaymentModal(newQuestion);
});


// ======= Modal Elements =======
const questionModal = document.getElementById("question-modal");
const paymentModal = document.getElementById("payment-modal");
const assignmentsModal = document.getElementById("assignments-modal");
const assignmentDetailsModal = document.getElementById("assignment-details-modal");

const MIN_AMOUNT_PER_PAGE = 3;
const numPagesInput = document.getElementById("numPages");
const totalAmountInput = document.getElementById("total-amount");
const questionAmountInput = document.getElementById("questionAmount"); // student's original offer

function updateTotalAmount() {
  const pages = parseInt(numPagesInput.value) || 1;
  const minRequired = pages * MIN_AMOUNT_PER_PAGE;
  const studentOffer = parseFloat(questionAmountInput.value) || 0;

  let totalToPay;

  if (studentOffer >= minRequired) {
    // Profit secured → use student's offer
    totalToPay = studentOffer;
  } else {
    // Student’s offer too low for the pages → use minimum-per-page
    totalToPay = minRequired;
  }

  totalAmountInput.value = `$${totalToPay.toFixed(2)}`;
}

// Listen for changes
numPagesInput?.addEventListener("input", updateTotalAmount);
questionAmountInput?.addEventListener("input", updateTotalAmount);

// Prefill modal when opening
function openPaymentModal(question) {
  if (!question) return;

  // Force student offer ≥ MIN_AMOUNT_PER_PAGE
  questionAmountInput.value = Math.max(question.amount || MIN_AMOUNT_PER_PAGE, MIN_AMOUNT_PER_PAGE);
  numPagesInput.value = 1;

  updateTotalAmount();

  let paymentTitle = document.getElementById("payment-question-title");
  if (!paymentTitle) {
    paymentTitle = document.createElement("h3");
    paymentTitle.id = "payment-question-title";
    paymentModal.querySelector(".modal-content").prepend(paymentTitle);
  }
  paymentTitle.textContent = question.title;

  paymentModal.style.display = "block";
}



// Ensure minimum $3 per page
questionAmountInput?.addEventListener("input", () => {
  let val = parseFloat(questionAmountInput.value);
  if (isNaN(val) || val < 3) questionAmountInput.value = 3;
  updateTotalAmount();
});

// Update total whenever numPages changes
//numPagesInput?.addEventListener("input", updateTotalAmount);



// When opening payment modal, prefill total and ensure minimum $3 per page
// When opening the payment modal


// ======= Open/Close Modals =======
function showQuestionModal() { questionModal.style.display = "block"; }
function hideQuestionModal() { questionModal.style.display = "none"; }



function hidePaymentModal() { paymentModal.style.display = "none"; }

function showAssignmentsModal() {
  renderAssignmentsTable();
  assignmentsModal.style.display = "block";
}
function hideAssignmentsModal() { assignmentsModal.style.display = "none"; }

function showAssignmentDetails(id) {
  const q = questions.find(q => q.id === id);
  if (!q) return;

  document.getElementById("details-title").textContent = q.title;
  document.getElementById("details-subject").textContent = q.subject;
  document.getElementById("details-topic").textContent = q.topic;
  document.getElementById("details-status").textContent = q.status;
  document.getElementById("details-deadline").textContent = new Date(q.deadline || q.postedAt).toLocaleString();
  document.getElementById("details-amount").textContent = q.amount;
  document.getElementById("details-description").textContent = q.description;

  const filesDiv = document.getElementById("details-file-links");
  filesDiv.innerHTML = "";
  if (q.doc) {
    const a = document.createElement("a");
    a.href = q.doc; a.textContent = "📄 Document"; a.download = `Doc_${q.id}`;
    filesDiv.appendChild(a);
  }
  if (q.img) {
    const a = document.createElement("a");
    a.href = q.img; a.textContent = "🖼 Image"; a.target = "_blank";
    filesDiv.appendChild(a);
  }

  assignmentDetailsModal.style.display = "block";
}
function closeDetailsModal() { assignmentDetailsModal.style.display = "none"; }

// ======= Assignments Table =======
function renderAssignmentsTable() {
  const tbody = document.getElementById("assignments-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  questions.forEach(q => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#" onclick="showAssignmentDetails(${q.id})">${q.title}</a></td>
      <td>${q.subject}</td>
      <td>${q.topic}</td>
      <td>${new Date(q.deadline || q.postedAt).toLocaleString()}</td>
      <td>${q.status}</td>
      <td>$${q.amount}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ======= Payment Form Submission =======
const paymentForm = document.getElementById("payment-form");
if (paymentForm) {
  paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const latestQuestion = questions.find(q => q.student === currentStudent && q.status === "Pending");
  if (latestQuestion) {
    // Remove the $ sign and parse as float
    latestQuestion.amount = parseFloat(totalAmountInput.value.replace('$', '')) || MIN_AMOUNT_PER_PAGE;
    latestQuestion.status = "Pending Payment";

    localStorage.setItem("questions", JSON.stringify(questions));
  }

  hidePaymentModal();
  hideQuestionModal();

  alert("Payment successful! Assignment posted.");

  renderQuestions();
  loadStudentQuestions();
  updateStats();
});

}

// ======= Bank Option =======
document.getElementById("paymentMethod")?.addEventListener("change", function () {
  document.getElementById("bank-details").style.display = this.value === "bank" ? "block" : "none";
});


// ======= Close Modals by Clicking Outside =======
window.addEventListener("click", e => {
  if (e.target === questionModal) hideQuestionModal();
  if (e.target === paymentModal) hidePaymentModal();
  if (e.target === assignmentsModal) hideAssignmentsModal();
  if (e.target === assignmentDetailsModal) closeDetailsModal();
});

// ======= Hook Up "My Assignments" Button =======
document.querySelector(".section-title")?.addEventListener("click", showAssignmentsModal);
let currentPage = 1;
let rowsPerPage = parseInt(document.getElementById("rowsPerPageSelect")?.value) || 5;

// Render table with pagination
function renderAssignmentsTable(page = 1) {
  const tbody = document.getElementById("assignments-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedQuestions = questions.slice(start, end);

  paginatedQuestions.forEach(q => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#" onclick="showAssignmentDetails(${q.id})">${q.title}</a></td>
      <td>${q.subject}</td>
      <td>${q.topic}</td>
      <td>${new Date(q.deadline || q.postedAt).toLocaleString()}</td>
      <td>${q.status}</td>
      <td>$${q.amount}</td>
    `;
    tbody.appendChild(tr);
  });

  renderPaginationControls(page);
}

// Render pagination controls with Next / Previous
function renderPaginationControls(page) {
  const totalPages = Math.ceil(questions.length / rowsPerPage);
  const controls = document.getElementById("pagination-controls");
  controls.innerHTML = "";

  // Previous Button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    renderAssignmentsTable(currentPage);
  });
  controls.appendChild(prevBtn);

  // Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === page ? "active-page" : "";
    btn.addEventListener("click", () => {
      currentPage = i;
      renderAssignmentsTable(currentPage);
    });
    controls.appendChild(btn);
  }

  // Next Button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => {
    currentPage = Math.min(totalPages, currentPage + 1);
    renderAssignmentsTable(currentPage);
  });
  controls.appendChild(nextBtn);
}

// Rows per page dropdown
document.getElementById("rowsPerPageSelect")?.addEventListener("change", (e) => {
  rowsPerPage = parseInt(e.target.value);
  currentPage = 1; // reset to first page
  renderAssignmentsTable(currentPage);
});

// Show modal and reset pagination
function showAssignmentsModal() {
  currentPage = 1;
  rowsPerPage = parseInt(document.getElementById("rowsPerPageSelect")?.value) || 5;
  renderAssignmentsTable(currentPage);
  assignmentsModal.style.display = "block";
}

// =========================
// Initial Render
// =========================
renderQuestions();
loadStudentQuestions();
updateStats();
