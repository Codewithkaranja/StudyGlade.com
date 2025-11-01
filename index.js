// =========================
// Configuration
// =========================
const CONFIG = {
  // Base API URL depending on environment
  API_BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://studyglade-com.onrender.com/api',

  // Pagination
  DEFAULT_ROWS_PER_PAGE: 5,

  // File upload constraints
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,

  // Allowed MIME types
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ],

  // ✅ Minimum amount per page for assignments
  MIN_AMOUNT_PER_PAGE: 3
};



// =========================
// API Service Layer
// =========================
// API Service Layer
// =========================
class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      this.showError(error.message);
      throw error;
    }
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentStudent');
    window.location.href = 'index.html';
  }

  showError(message) {
    alert(`Error: ${message}`);
  }

  // Auth endpoints
  async loginStudent(email, password) {
    return this.request('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async registerStudent(studentData) {
    return this.request('/auth/student-register', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  }

  // Get current logged-in user
  async getCurrentUser() {
    try {
      return await this.request('/auth/me'); // Make sure your backend has /auth/me endpoint
    } catch (err) {
      console.warn('No current user found or not logged in.');
      return null;
    }
  }

  // Assignment endpoints
  async getAssignments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/assignments?${queryParams}`);
  }

  async createAssignment(assignmentData) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  }

  async updateAssignment(id, updates) {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async uploadFile(file, assignmentId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  }

// ---------- Message Endpoints ----------
async getMessages(assignmentId) {
  // 🔹 Backend mode
  if (this.useBackend) {
    return this.request(`/assignments/${assignmentId}/messages`);
  }

  // 🔹 Local mode
  const assignment = this.assignments.find(a => a.id == assignmentId);
  if (!assignment) return [];

  const key = `messages_${assignmentId}`; // ✅ unified for both tutor & student
  const messages = JSON.parse(localStorage.getItem(key)) || [];

  // Normalize and shape data for UI
  return messages.map(msg => ({
    sender: msg.is_tutor ? "Tutor" : (assignment.student_name || "Student"),
    text: msg.text || "",
    sent_at: new Date(msg.ts || msg.timestamp || Date.now()).toISOString(),
    is_tutor: !!msg.is_tutor,
    file_url: msg.file || msg.file_url || null,
    file_name: msg.file_name || msg.fileName || null,
    file_type: msg.file_type || msg.fileType || null
  })).sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
}


async sendMessage(assignmentId, messageText, selectedFile = null) {
  if (!messageText && !selectedFile) throw new Error("Cannot send empty message");

  // 🔹 If backend is active
  if (this.useBackend) {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("text", messageText);
    if (selectedFile) formData.append("file", selectedFile);

    const token = localStorage.getItem("studentToken");

    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send message");
    }

    return await response.json();
  }

  // 🔹 Local storage fallback
  const assignment = this.assignments.find(a => a.id == assignmentId);
  if (!assignment) throw new Error("Assignment not found");

  const key = `messages_${assignmentId}`; // ✅ unified key
  const messages = JSON.parse(localStorage.getItem(key)) || [];

  const newMessage = {
    sender: assignment.student_name || "Student",
    text: messageText,
    is_tutor: false,
    ts: Date.now()
  };

  // Handle file upload as base64
  if (selectedFile) {
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      newMessage.file = base64Data;
      newMessage.file_name = selectedFile.name;
      newMessage.file_type = selectedFile.type;
    } catch (err) {
      console.error("File conversion failed:", err);
    }
  }

  messages.push(newMessage);
  localStorage.setItem(key, JSON.stringify(messages));

  return { success: true, message: newMessage };
}




  // Payment endpoints
  async createPaymentIntent(assignmentId, amount) {
    return this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, amount })
    });
  }

  async confirmPayment(assignmentId, paymentMethodId) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, paymentMethodId })
    });
  }
}


// =========================
// Data Store with Backend Fallback
// =========================
class DataStore {
  constructor() {
    this.api = new ApiService();
    this.useBackend = false; // Will be enabled when backend is ready
    this.questions = [];
    this.currentStudent = null;
  }

  // Initialize store
  async initialize() {
    await this.initializeSession();
    await this.loadQuestions();
  }

  // Session management
  async initializeSession() {
    let student = localStorage.getItem('currentStudent');
    const authToken = localStorage.getItem('authToken');

    if (!student && !authToken) {
      // New user flow
      student = await this.handleNewStudent();
    } else if (authToken && this.useBackend) {
      // Backend session flow
      try {
        const userData = await this.api.getCurrentUser();
        this.currentStudent = userData;
        localStorage.setItem('currentStudent', userData.name);
      } catch (error) {
        console.warn('Backend session failed, falling back to local storage');
        this.useBackend = false;
        this.currentStudent = student;
      }
    } else {
      // Local storage fallback
      this.currentStudent = student;
    }

    this.updateStudentDisplay();
  }

  async handleNewStudent() {
    if (this.useBackend) {
      // Backend registration flow
      const email = prompt('Enter your email:');
      const password = prompt('Choose a password:');
      const name = prompt('Enter your name:');
      
      try {
        const result = await this.api.registerStudent({ email, password, name });
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentStudent', result.user.name);
        return result.user.name;
      } catch (error) {
        alert('Registration failed, using local storage mode');
        this.useBackend = false;
        return this.createLocalStudent();
      }
    } else {
      // Local storage fallback
      return this.createLocalStudent();
    }
  }

  createLocalStudent() {
    const name = prompt('Enter your name:') || `Student_${Date.now()}`;
    localStorage.setItem('currentStudent', name);
    return name;
  }

  // Questions management
  async loadQuestions() {
    if (this.useBackend) {
      try {
        this.questions = await this.api.getAssignments();
      } catch (error) {
        console.warn('Failed to load from backend, using local storage');
        this.useBackend = false;
        this.loadFromLocalStorage();
      }
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    const allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
    this.questions = allQuestions.filter(q => q.student === this.currentStudent);
  }

  async saveQuestion(question) {
    if (this.useBackend) {
      try {
        if (question.id) {
          await this.api.updateAssignment(question.id, question);
        } else {
          const result = await this.api.createAssignment(question);
          question.id = result.id;
        }
      } catch (error) {
        console.warn('Backend save failed, saving locally');
        this.useBackend = false;
        this.saveToLocalStorage(question);
      }
    } else {
      this.saveToLocalStorage(question);
    }

    this.loadQuestions(); // Reload to ensure consistency
  }

  saveToLocalStorage(question) {
    const allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
    const filteredQuestions = allQuestions.filter(q => q.id !== question.id);
    filteredQuestions.push(question);
    localStorage.setItem('questions', JSON.stringify(filteredQuestions));
  }

  async uploadAssignmentFiles(questionId, files) {
    if (!this.useBackend) {
      console.warn('File upload requires backend');
      return files.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
    }

    const uploadPromises = files.map(file => 
      this.api.uploadFile(file, questionId)
    );
    
    return Promise.all(uploadPromises);
  }

  updateStudentDisplay() {
    const studentNameEl = document.getElementById('student-name');
    if (studentNameEl && this.currentStudent) {
      studentNameEl.textContent = this.currentStudent;
    }
  }
}

// =========================
// Global Instances
// =========================
const dataStore = new DataStore();
const apiService = new ApiService();

// =========================
// DOM Elements
// =========================
const postForm = document.getElementById('question-form');
const questionsList = document.getElementById('questionsList');
const totalQuestionsEl = document.getElementById('total-questions');
const pendingQuestionsEl = document.getElementById('pending-questions');
const inProgressQuestionsEl = document.getElementById('inprogress-questions');
const completedQuestionsEl = document.getElementById('completed-questions');
const totalEarningsEl = document.getElementById('total-earnings');
const subjectsCoveredEl = document.getElementById('subjects-covered');

// Modal Elements
const questionModal = document.getElementById('question-modal');
const paymentModal = document.getElementById('payment-modal');
const assignmentsModal = document.getElementById('assignments-modal');
const assignmentDetailsModal = document.getElementById('assignment-details-modal');
const messageModal = document.getElementById('message-modal');

// Payment elements
const numPagesInput = document.getElementById('numPages');
const totalAmountInput = document.getElementById('total-amount');
const questionAmountInput = document.getElementById('questionAmount');

// Pagination
let currentPage = 1;
let rowsPerPage = CONFIG.DEFAULT_ROWS_PER_PAGE;

// =========================
// UI State Management
// =========================
const UIState = {
  setLoading(loading) {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(btn => {
      if (loading) {
        btn.setAttribute('data-original-text', btn.innerHTML);
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
      } else {
        btn.innerHTML = btn.getAttribute('data-original-text') || btn.innerHTML;
        btn.disabled = false;
      }
    });
  },

  showError(message) {
    // Replace with toast notification in production
    alert(`Error: ${message}`);
  },

  showSuccess(message) {
    alert(`Success: ${message}`);
  }
};

// =========================
// Validation Utilities
// =========================
const Validators = {
  assignmentForm(data) {
    const errors = [];

    if (!data.title?.trim() || data.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!data.description?.trim() || data.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (data.amount < CONFIG.MIN_AMOUNT_PER_PAGE) {
      errors.push(`Amount must be at least $${CONFIG.MIN_AMOUNT_PER_PAGE}`);
    }

    if (data.deadline && new Date(data.deadline) < new Date()) {
      errors.push('Deadline must be in the future');
    }

    return errors;
  },

  file(file) {
    if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {

      return `File must be smaller than ${CONFIG.MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  }
};

// =========================
// Enhanced Post New Question
// =========================
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  UIState.setLoading(true);

  try {
    const formData = {
      title: document.getElementById('questionTitle').value.trim(),
      description: document.getElementById('questionDescription').value.trim(),
      subject: document.getElementById('questionSubject').value,
      topic: document.getElementById('questionTopic').value,
      deadline: document.getElementById('questionDeadline').value,
      amount: parseFloat(document.getElementById('questionAmount').value) || 0
    };

    // Validate form data
    const errors = Validators.assignmentForm(formData);
    if (errors.length > 0) {
      UIState.showError(errors.join('\n'));
      return;
    }

    // Handle file uploads
    const docFile = document.getElementById('questionDocument').files[0];
    const imgFile = document.getElementById('questionImage').files[0];
    const files = [docFile, imgFile].filter(Boolean);

    // Validate files
    for (const file of files) {
      const fileError = Validators.file(file);
      if (fileError) {
        UIState.showError(fileError);
        return;
      }
    }

    // Create assignment object
    const newQuestion = {
      title: formData.title,
      description: formData.description,
      subject: formData.subject,
      topic: formData.topic,
      deadline: formData.deadline,
      amount: formData.amount,
      status: 'pending',
      student: dataStore.currentStudent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0  // initialize views
    };

    // Save assignment
    await dataStore.saveQuestion(newQuestion);

    // Upload files if any
    if (files.length > 0 && dataStore.useBackend) {
      const uploadedFiles = await dataStore.uploadAssignmentFiles(newQuestion.id, files);
      newQuestion.attachments = uploadedFiles;
      await dataStore.saveQuestion(newQuestion);
    }

    // Reset form and update UI
    postForm.reset();
    await renderQuestions();
    updateStats();
    
    UIState.showSuccess('Assignment posted successfully!');
    openPaymentModal(newQuestion);

  } catch (error) {
    UIState.showError('Failed to post assignment: ' + error.message);
  } finally {
    UIState.setLoading(false);
  }
});

// =========================
// Payment System
// =========================

function updateTotalAmount() {
  const pages = parseInt(numPagesInput.value) || 1;
  const minRequired = pages * CONFIG.MIN_AMOUNT_PER_PAGE;
  const studentOffer = parseFloat(questionAmountInput.value) || 0;

  const totalToPay = studentOffer >= minRequired ? studentOffer : minRequired;
  totalAmountInput.value = `$${totalToPay.toFixed(2)}`;
}



// =========================
// ================================
// 💰 Open Payment Modal & Unified Handler
// ================================

function openPaymentModal(question) {
  if (!question) return;

  // Set the global current question
  window.currentQuestion = question;

  // Initialize inputs
  questionAmountInput.value = Math.max(
    question.amount || CONFIG.MIN_AMOUNT_PER_PAGE,
    CONFIG.MIN_AMOUNT_PER_PAGE
  );
  numPagesInput.value = 1;
  updateTotalAmount();

  // Modal title
  let paymentTitle = document.getElementById("payment-question-title");
  if (!paymentTitle) {
    paymentTitle = document.createElement("h3");
    paymentTitle.id = "payment-question-title";
    paymentModal.querySelector(".modal-content")?.prepend(paymentTitle);
  }
  paymentTitle.textContent = question.title;

  // Payment methods container
  let methodsContainer = paymentModal.querySelector(".payment-methods");
  if (!methodsContainer) {
    methodsContainer = document.createElement("div");
    methodsContainer.classList.add("payment-methods");
    methodsContainer.innerHTML = `
      <label>
        <input type="radio" name="payment-method" value="card" checked> 💳 Card
      </label>
      <label>
        <input type="radio" name="payment-method" value="mpesa"> 📱 M-Pesa
      </label>
      <button id="proceedPaymentBtn" class="pay-btn">Proceed to Pay</button>
    `;
    const formEl = paymentModal.querySelector(".modal-content form");
    if (formEl) formEl.appendChild(methodsContainer);
  }

  // Show modal
  paymentModal.style.display = "block";
}

// ================================
// 💳 / 📱 Unified Payment Handler
// ================================

document.addEventListener("click", async (e) => {
  if (e.target?.id !== "proceedPaymentBtn") return;

  const btn = e.target;
  btn.disabled = true; // Prevent double clicks

  const selectedMethod = document.querySelector(
    "input[name='payment-method']:checked"
  )?.value;

  const amount = parseFloat(totalAmountInput.value.replace("$", "").trim());
  const assignmentId = currentQuestion?.id;

  if (!currentQuestion || isNaN(amount) || amount <= 0) {
    alert("❌ Invalid assignment or amount.");
    btn.disabled = false;
    return;
  }

  const mpesaEndpoint = `${CONFIG.API_BASE_URL}/payments/mpesa`;
  const stripeEndpoint = `${CONFIG.API_BASE_URL}/payments/create-payment-intent`;

  if (selectedMethod === "mpesa") {
    let phone = prompt("📱 Enter your M-Pesa number (e.g. 254712345678):")?.trim();
    if (!phone || !/^254\d{9}$/.test(phone)) {
      alert("❌ Invalid phone number.");
      btn.disabled = false;
      return;
    }

    try {
      const res = await fetch(mpesaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount, assignmentId }),
      });
      const data = await res.json();

      if (res.ok) {
        alert(`✅ Payment initiated! Check ${phone} to complete it.`);
        currentQuestion.status = "Pending Payment";
      } else {
        alert(`❌ Payment failed: ${data.message || "Unknown error"}`);
      }
      console.log("M-Pesa response:", data);
    } catch (err) {
      console.error("M-Pesa Fetch error:", err);
      alert("❌ Failed to connect to payment server.");
    }
  } else if (selectedMethod === "card") {
    try {
      const res = await fetch(stripeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100, currency: "usd" }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("💳 Card payment flow coming soon (Stripe Checkout)");
        console.log("Stripe PaymentIntent:", data);
      } else {
        alert("❌ Stripe error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Stripe Fetch error:", err);
      alert("❌ Failed to connect to Stripe server.");
    }
  }

  btn.disabled = false; // Re-enable button
  renderQuestions(); // Update UI in case status changed
});


// =========================
// Render Functions (Backend Ready)
// =========================
async function renderQuestions() {
  if (!questionsList) return;

  // ✅ Load questions once
  await dataStore.loadQuestions(); // Ensure fresh data
  const questions = dataStore.questions; // Cache in local variable

  questionsList.innerHTML = questions.map(q => `
    <div class="question-card">
      <div class="question-header">
        <h4>${q.title}</h4>
        <div class="badges">
          ${(new Date() - new Date(q.created_at || q.postedAt)) / (1000 * 60 * 60) < 24 ? '<span class="badge new">New</span>' : ''}
          ${q.views > 50 ? '<span class="badge popular">Popular</span>' : ''}
        </div>
      </div>
      <p>${q.description}</p>
      <div class="question-meta">
        <span>Student: ${q.student}</span>
        <span>Subject: ${q.subject || ''}</span>
        <span>Topic: ${q.topic || ''}</span>
        <span>Deadline: ${q.deadline ? new Date(q.deadline).toLocaleString() : ''}</span>
        <span>Amount: $${q.amount || 0}</span>
        <span>Status: ${q.status}</span>
      </div>
      <div class="question-attachments">
        ${(q.attachments || []).map(att => `
          <a href="${att.url}" download="${att.name}" class="btn-attach">
            ${att.type?.startsWith('image/') ? '🖼' : '📄'} ${att.name}
          </a>
        `).join('')}
        ${q.answer_url ? `
          <a href="${q.answer_url}" download class="btn-primary">Download Answer</a>
        ` : ''}
      </div>
    </div>
  `).join('');

  updateStats(); // ✅ Only called once after rendering
}


function updateStats() {
  const all = dataStore.questions;
  
  if (totalQuestionsEl) totalQuestionsEl.textContent = all.length;
  if (pendingQuestionsEl) pendingQuestionsEl.textContent = all.filter(q => 
    q.status === 'pending' || q.status === 'pending_payment').length;
  if (inProgressQuestionsEl) inProgressQuestionsEl.textContent = all.filter(q => 
    q.status === 'in_progress').length;
  if (completedQuestionsEl) completedQuestionsEl.textContent = all.filter(q => 
    q.status === 'completed').length;
  if (totalEarningsEl) totalEarningsEl.textContent = `$${all.reduce((acc, q) => 
    (q.status === 'completed' ? acc + (q.amount || 0) : acc), 0)}`;
  if (subjectsCoveredEl) {
    const uniqueSubjects = [...new Set(all.map(q => q.subject).filter(s => s))];
    subjectsCoveredEl.textContent = uniqueSubjects.length;
  }
}

// =========================
// Enhanced Message System
// =========================
async function openMessageModal(questionId) {
  const question = dataStore.questions.find(q => q.id === questionId && q.student === dataStore.currentStudent);
  if (!question) {
    UIState.showError('Question not found or access denied.');
    return;
  }

  document.getElementById('message-modal-title').textContent = `💬 Message Tutor - ${question.title}`;
  
  const messageHistory = document.getElementById('message-history');
  messageHistory.innerHTML = '<div class="loading">Loading messages...</div>';

  try {
    let messages = [];
    if (dataStore.useBackend) {
      messages = await apiService.getMessages(questionId);
    } else {
      // Fallback to localStorage
      const studentKey = `messages_${questionId}`;
      const tutorKey = `chat_${question.student.replace(/\s+/g, '_')}_${questionId}`;
      const studentMessages = JSON.parse(localStorage.getItem(studentKey)) || [];
      const tutorMessages = JSON.parse(localStorage.getItem(tutorKey)) || [];
      
      messages = [...studentMessages, ...tutorMessages.map(msg => ({
        text: msg.text,
        sender: msg.sender === 'Tutor' ? 'tutor' : 'student',
        timestamp: new Date(msg.timestamp || msg.timestamp).toISOString()

      }))].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    renderMessages(messages);
  } catch (error) {
    UIState.showError('Failed to load messages');
  }

  messageModal.style.display = 'block';
}

function renderMessages(messages) {
  const messageHistory = document.getElementById('message-history');
  messageHistory.innerHTML = messages.map(msg => {
    const isStudent = msg.sender === 'student';
    const fileHTML = msg.file ? `<a href="${msg.file}" target="_blank" class="file-attachment">📎 ${msg.file.split('/').pop()}</a>` : '';
    return `
      <div class="message-bubble ${isStudent ? 'message-sent' : 'message-received'}">
        <div class="meta">
          <span>${isStudent ? 'You' : 'Tutor'}</span>
          <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="text">${msg.text}</div>
        ${fileHTML}
      </div>
    `;
  }).join('');
  
  messageHistory.scrollTop = messageHistory.scrollHeight;
}


// =========================
// Event Listeners & Initialization
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await dataStore.initialize();
    await renderQuestions();
    
    // Initialize event listeners
    numPagesInput?.addEventListener('input', updateTotalAmount);
    questionAmountInput?.addEventListener('input', updateTotalAmount);
    
    document.getElementById('rowsPerPageSelect')?.addEventListener('change', (e) => {
      rowsPerPage = parseInt(e.target.value);
      currentPage = 1;
      renderAssignmentsTable(currentPage);
    });

    document.querySelector('.section-title')?.addEventListener('click', showAssignmentsModal);
    
    // Modal close handlers
    window.addEventListener('click', e => {
      if (e.target === questionModal) hideQuestionModal();
      if (e.target === paymentModal) hidePaymentModal();
      if (e.target === assignmentsModal) hideAssignmentsModal();
      if (e.target === assignmentDetailsModal) closeDetailsModal();
      if (e.target === messageModal) closeMessageModal();
    });

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentStudent');
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
      }
    });

  } catch (error) {
    console.error('Initialization failed:', error);
    UIState.showError('Failed to initialize application');
  }
});

// =========================
// Backend Migration Helper
// =========================
async function migrateToBackend() {
  if (dataStore.useBackend) {
    UIState.showError('Backend is already enabled');
    return;
  }

  const localQuestions = JSON.parse(localStorage.getItem('questions')) || [];
  const studentQuestions = localQuestions.filter(q => q.student === dataStore.currentStudent);

  try {
    UIState.setLoading(true);
    
    for (const question of studentQuestions) {
      // Convert to backend format
      const backendQuestion = {
        title: question.title,
        description: question.description,
        subject: question.subject,
        topic: question.topic,
        deadline: question.deadline,
        amount: question.amount,
        status: question.status,
        created_at: question.created_at || question.postedAt,
        student: dataStore.currentStudent
      };

      await apiService.createAssignment(backendQuestion);
    }

    // Enable backend mode
    dataStore.useBackend = true;
    await dataStore.loadQuestions();
    await renderQuestions();
    
    UIState.showSuccess('Successfully migrated to backend!');
  } catch (error) {
    UIState.showError('Migration failed: ' + error.message);
  } finally {
    UIState.setLoading(false);
  }
}

// Expose for debugging
window.migrateToBackend = migrateToBackend;
window.dataStore = dataStore;

// Note: Keep existing modal management functions (showQuestionModal, hideQuestionModal, etc.)
// They remain largely the same but should use dataStore instead of global variables
// =========================
// Modal Management Functions
// =========================
function showQuestionModal() { 
  questionModal.style.display = 'block'; 
}

function hideQuestionModal() { 
  questionModal.style.display = 'none'; 
}

function hidePaymentModal() { 
  paymentModal.style.display = 'none'; 
}

function showAssignmentsModal() {
  currentPage = 1;
  const rowsSelect = document.getElementById('rowsPerPageSelect');
  if (rowsSelect) {
    rowsPerPage = parseInt(rowsSelect.value) || CONFIG.DEFAULT_ROWS_PER_PAGE;
  }
  renderAssignmentsTable(currentPage);
  assignmentsModal.style.display = 'block';
}

function hideAssignmentsModal() { 
  assignmentsModal.style.display = 'none'; 
}

function showAssignmentDetails(id) {
  const question = dataStore.questions.find(q => q.id === id && q.student === dataStore.currentStudent);
  if (!question) {
    UIState.showError('Assignment not found or access denied.');
    return;
  }

  // ✅ Initialize views if missing, then increment
  question.views = (question.views || 0) + 1;

  // Optional: persist the updated question if you have a save function
  if (typeof dataStore.saveQuestion === 'function') {
    dataStore.saveQuestion(question);
  }

  document.getElementById('details-title').textContent = question.title;
  document.getElementById('details-subject').textContent = question.subject || '—';
  document.getElementById('details-topic').textContent = question.topic || '—';
  document.getElementById('details-status').textContent = question.status || '—';
  document.getElementById('details-deadline').textContent = question.deadline ? new Date(question.deadline).toLocaleString() : '—';
  document.getElementById('details-amount').textContent = question.amount || 0;
  document.getElementById('details-description').textContent = question.description || 'No description provided';

  // ✅ Display views
  const viewsEl = document.getElementById('details-views');
  if (viewsEl) {
    viewsEl.textContent = `Views: ${question.views}`;
  }

  const filesDiv = document.getElementById('details-file-links');
  filesDiv.innerHTML = '';
  
  if (question.attachments && question.attachments.length > 0) {
    question.attachments.forEach(att => {
      const a = document.createElement('a');
      a.href = att.url;
      a.textContent = `${att.type?.startsWith('image/') ? '🖼' : '📄'} ${att.name}`;
      a.download = att.name;
      a.className = 'btn-attach';
      a.style.display = 'block';
      a.style.marginBottom = '5px';
      filesDiv.appendChild(a);
    });
  } else {
    if (question.doc) {
      const a = document.createElement('a');
      a.href = question.doc;
      a.textContent = '📄 Document';
      a.download = `Doc_${question.id}`;
      a.className = 'btn-attach';
      a.style.display = 'block';
      a.style.marginBottom = '5px';
      filesDiv.appendChild(a);
    }
    if (question.img) {
      const a = document.createElement('a');
      a.href = question.img;
      a.textContent = '🖼 Image';
      a.target = '_blank';
      a.className = 'btn-attach';
      a.style.display = 'block';
      a.style.marginBottom = '5px';
      filesDiv.appendChild(a);
    }
  }

  if (filesDiv.children.length === 0) {
    filesDiv.innerHTML = '<em>No files attached</em>';
  }

  assignmentDetailsModal.style.display = 'block';
}


function closeDetailsModal() { 
  assignmentDetailsModal.style.display = 'none'; 
}

function closeMessageModal() { 
  messageModal.style.display = 'none'; 
}

// =========================
// Assignments Table with Pagination
// =========================
function renderAssignmentsTable(page = 1) {
  const tbody = document.getElementById('assignments-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedQuestions = dataStore.questions.slice(start, end);

  paginatedQuestions.forEach(q => {
    const tr = document.createElement('tr');
    
    const statusClass = `badge-${(q.status || '').toLowerCase().replace(' ', '')}`;
    const escapedStudent = (q.student || '').replace(/'/g, "\\'");
    
    tr.innerHTML = `
      <td><a href="#" onclick="showAssignmentDetails(${q.id})">${q.title || 'Untitled'}</a></td>
      <td>${q.subject || ''}</td>
      <td>${q.topic || ''}</td>
      <td>${q.deadline ? new Date(q.deadline).toLocaleString() : 'No deadline'}</td>
      <td><span class="status-badge ${statusClass}">${q.status || 'Unknown'}</span></td>
      <td>$${(q.amount || 0).toFixed(2)}</td>
      <td class="actions">
        <button class="btn btn-view" onclick="showAssignmentDetails(${q.id})">
          <i class="fa-solid fa-eye"></i> View
        </button>
        ${q.answer_url || q.answerFile ? `
          <a href="${q.answer_url || q.answerFile}" download="Answer_${q.id}.pdf" class="btn btn-download">
            <i class="fa-solid fa-download"></i> Download
          </a>
        ` : ''}
        <button class="btn btn-chat" onclick="openMessageModal(${q.id})">
          <i class="fa-solid fa-comment"></i> Chat
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPaginationControls(page);
}

function renderPaginationControls(page) {
  const totalPages = Math.ceil(dataStore.questions.length / rowsPerPage);
  const controls = document.getElementById('pagination-controls');
  if (!controls) return;
  
  controls.innerHTML = '';

  // Previous Button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1);
    renderAssignmentsTable(currentPage);
  });
  controls.appendChild(prevBtn);

  // Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === page ? 'active-page' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderAssignmentsTable(currentPage);
    });
    controls.appendChild(btn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener('click', () => {
    currentPage = Math.min(totalPages, currentPage + 1);
    renderAssignmentsTable(currentPage);
  });
  controls.appendChild(nextBtn);
}

// =========================
// Payment Form Submission
// =========================
// ✅ Handle payment form submission
const paymentForm = document.getElementById("payment-form");

paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentQuestion) {
    UIState.showError("No assignment selected for payment.");
    return;
  }

  const paymentMethod = document.querySelector(
    'input[name="payment-method"]:checked'
  )?.value;
  const pages = parseInt(numPagesInput.value) || 1;
  const baseAmount = parseFloat(questionAmountInput.value) || CONFIG.MIN_AMOUNT_PER_PAGE;
  const totalAmount = pages * baseAmount;

  try {
    if (paymentMethod === "mpesa") {
      // ✅ M-Pesa flow
      const phone = prompt("Enter your M-Pesa phone number (07XXXXXXXX):");
      if (!phone) {
        UIState.showError("Phone number is required for M-Pesa payment.");
        return;
      }

      const response = await apiService.request("/payments/mpesa", {
        method: "POST",
        body: JSON.stringify({
          phone,
          amount: totalAmount,
          assignmentId: currentQuestion.id,
        }),
      });

      UIState.showSuccess(
        "✅ M-Pesa payment initiated. Complete on your phone."
      );

      currentQuestion.status = "paid";
      await dataStore.saveQuestion(currentQuestion);
    } else {
      // 💳 Card payment flow (future Stripe integration)
      const response = await apiService.request("/payments/stripe", {
        method: "POST",
        body: JSON.stringify({
          amount: totalAmount * 100, // convert to cents for Stripe
          currency: "usd",
          assignmentId: currentQuestion.id,
        }),
      });

      UIState.showSuccess("💳 Payment initiated successfully.");
      currentQuestion.status = "paid";
      await dataStore.saveQuestion(currentQuestion);
    }

    hidePaymentModal();
    await renderQuestions();
    updateStats();
  } catch (err) {
    console.error(err);
    UIState.showError("Payment failed: " + err.message);
  }
});

// =========================
// Enhanced Message System - Message Submission
// =========================
const messageForm = document.getElementById('message-form');
if (messageForm) {
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('message-file');

    const messageText = messageInput.value.trim();
    const selectedFile = fileInput.files[0] || null;

    if (!messageText && !selectedFile) {
      UIState.showError('Please enter a message or select a file.');
      return;
    }

    const assignmentId = messageInput.getAttribute('data-assignment-id');
    if (!assignmentId) {
      UIState.showError('No assignment selected');
      return;
    }

    try {
      if (dataStore.useBackend) {
        await apiService.sendMessage(assignmentId, messageText, selectedFile);
        const messages = await apiService.getMessages(assignmentId);
        renderMessages(messages);
      } else {
        // Local storage fallback
        const question = dataStore.questions.find(q => q.id == assignmentId);
        if (!question) return;

        const studentKey = `messages_${assignmentId}`;
        const tutorKey = `chat_${question.student.replace(/\s+/g, '_')}_${assignmentId}`;
        
        const studentMessages = JSON.parse(localStorage.getItem(studentKey)) || [];
        studentMessages.push({
          text: messageText || (selectedFile ? `📎 ${selectedFile.name}` : ''),
          file: selectedFile ? URL.createObjectURL(selectedFile) : null,
          sender: 'student',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(studentKey, JSON.stringify(studentMessages));

        const tutorMessages = JSON.parse(localStorage.getItem(tutorKey)) || [];
        tutorMessages.push({
          sender: question.student,
          text: messageText || (selectedFile ? `📎 ${selectedFile.name}` : ''),
          ts: Date.now(),
          file: selectedFile ? URL.createObjectURL(selectedFile) : null
        });
        localStorage.setItem(tutorKey, JSON.stringify(tutorMessages));

        const allMessages = [...studentMessages, ...tutorMessages.map(msg => ({
          text: msg.text,
          sender: msg.sender === 'Tutor' ? 'tutor' : 'student',
          timestamp: new Date(msg.timestamp || msg.timestamp).toISOString(),
          file: msg.file || null
        }))].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        renderMessages(allMessages);

        setTimeout(() => simulateTutorReply(assignmentId, question.student), 2000);
      }

      messageInput.value = '';
      fileInput.value = '';
    } catch (error) {
      UIState.showError('Failed to send message: ' + error.message);
    }
  });
}


function simulateTutorReply(questionId, studentName) {
  if (dataStore.useBackend) return; // No simulation in backend mode

  const replies = [
    "I've received your question and will start working on it soon.",
    "Could you provide more details about this part?",
    "I'm currently working on your assignment and will have it ready by the deadline.",
    "The solution is almost ready. I'll upload it shortly.",
    "Thank you for the clarification. I'll incorporate this into the solution."
  ];
  
  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  
  const studentKey = `messages_${questionId}`;
  const tutorKey = `chat_${studentName.replace(/\s+/g, '_')}_${questionId}`;
  
  // Save in student format
  const studentMessages = JSON.parse(localStorage.getItem(studentKey)) || [];
  studentMessages.push({
    text: randomReply,
    sender: 'tutor',
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(studentKey, JSON.stringify(studentMessages));

  // Also save in tutor's expected format
  const tutorMessages = JSON.parse(localStorage.getItem(tutorKey)) || [];
  tutorMessages.push({
    sender: "Tutor",
    text: randomReply,
    ts: Date.now()
  });
  localStorage.setItem(tutorKey, JSON.stringify(tutorMessages));
  
  // Add to UI if modal is still open
  const messageHistory = document.getElementById('message-history');
  if (messageHistory && messageModal.style.display === 'block') {
    const allMessages = [...studentMessages, ...tutorMessages.map(msg => ({
      text: msg.text,
      sender: msg.sender === 'Tutor' ? 'tutor' : 'student',
      timestamp: new Date(msg.ts).toISOString()
    }))].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    renderMessages(allMessages);
  }
}

// =========================
// Bank Transfer & Payment Method
// =========================
document.getElementById('paymentMethod')?.addEventListener('change', function () {
  document.getElementById('bank-details').style.display = this.value === 'bank' ? 'block' : 'none';
});

document.getElementById('mark-paid-btn')?.addEventListener('click', function() {
  if (confirm('Have you completed the bank transfer?')) {
    document.querySelector('#payment-form button[type="submit"]').click();
  }
});

// =========================
// Global Exports for HTML onclick handlers
// =========================
window.showQuestionModal = showQuestionModal;
window.hideQuestionModal = hideQuestionModal;
window.showAssignmentDetails = showAssignmentDetails;
window.closeDetailsModal = closeDetailsModal;
window.openMessageModal = openMessageModal;
window.closeMessageModal = closeMessageModal;
window.showAssignmentsModal = showAssignmentsModal;