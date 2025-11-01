// tutor-dashboard.js - Backend Ready Version
(() => {
  // ---------- Configuration ----------
 const CONFIG = {
  // Base API URL depending on environment
  API_BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://studyglade-com.onrender.com/api',

  // Pagination
  DEFAULT_ROWS_PER_PAGE: 5,

  // File upload constraints
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // convenience property in bytes

  // Allowed MIME types for file uploads
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
  ]
};


  // ---------- API Service ----------
  class TutorApiService {
    constructor() {
      this.baseURL = CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const token = localStorage.getItem('tutorToken');
      
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
        console.error('Tutor API Request failed:', error);
        this.showError(error.message);
        throw error;
      }
    }

    handleUnauthorized() {
      localStorage.removeItem('tutorToken');
      window.location.href = 'index.html';
    }

    showError(message) {
      alert(`Tutor Error: ${message}`);
    }

    // Assignment endpoints
    async getAssignments(filters = {}) {
      const queryParams = new URLSearchParams(filters).toString();
      return this.request(`/tutor/assignments?${queryParams}`);
    }

  async updateAssignment(id, updates) {
  const token = localStorage.getItem('tutorToken');

  const response = await fetch(`${this.baseURL}/tutor/assignments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    let message = 'Failed to update assignment';
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch (e) {}
    throw new Error(message);
  }

  return response.json();
}
  




    async uploadAnswer(assignmentId, file) {
  const formData = new FormData();
  formData.append('answer', file);
  formData.append('assignmentId', assignmentId);

  const token = localStorage.getItem('tutorToken');

  try {
    const response = await fetch(`${this.baseURL}/tutor/assignments/${assignmentId}/upload-answer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}` // no Content-Type here for FormData
      },
      body: formData
    });

    if (!response.ok) {
      let errorMsg = 'Answer upload failed';
      try {
        const errData = await response.json();
        if (errData?.message) errorMsg = errData.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}


    // ---------- Tutor Message Endpoints ----------
async getMessages(assignmentId) {
  return this.request(`/tutor/assignments/${assignmentId}/messages`);
}

async sendMessage(assignmentId, messageText, selectedFile = null) {
  const formData = new FormData();
  formData.append('assignmentId', assignmentId);
  formData.append('text', messageText);
  if (selectedFile) formData.append('file', selectedFile);

  const token = localStorage.getItem('tutorToken'); // Use tutorToken for consistency

  const response = await fetch(`${this.baseURL}/tutor/assignments/${assignmentId}/messages`
, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to send message');
  }

  return await response.json();
}


    // Report/Dispute endpoints
    async reportAssignment(assignmentId, reason) {
      return this.request(`/tutor/assignments/${assignmentId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    }
  }

  // ---------- Data Store ----------
  class TutorDataStore {
    constructor() {
      this.api = new TutorApiService();
      this.useBackend = true; // Enable when backend is ready
      this.assignments = [];
      this.students = [];
    }

    async initialize() {
      await this.loadAssignments();
    }

    async loadAssignments(filters = {}) {
  try {
    if (this.useBackend) {
      const response = await this.api.getAssignments(filters);
      this.assignments = (response.assignments || []).map(a => this.normalizeAssignment(a));
      this.students = response.students || this.extractStudents();
    } else {
      this.loadFromLocalStorage();
    }
  } catch (error) {
    console.warn('Failed to load assignments from backend, falling back to local storage', error);
    this.useBackend = true;
    this.loadFromLocalStorage();
  }
}

async uploadAnswer(assignmentId, file) {
  if (!file) throw new Error("No file selected for upload");

  if (this.useBackend) {
    return this.api.uploadAnswer(assignmentId, file);
  } else {
    const assignment = this.assignments.find(a => a.id == assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Convert file to base64 for local storage
    const reader = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    assignment.answer_file = reader;
    assignment.answer_url = reader; // Using base64 URL as fallback
    assignment.status = "completed";
    assignment.updated_at = new Date().toISOString();

    localStorage.setItem("assignments", JSON.stringify(this.assignments));
    return { success: true };
  }
}

    loadFromLocalStorage() {
      const raw = JSON.parse(localStorage.getItem("assignments")) || [];
      this.assignments = raw.map(item => this.normalizeAssignment(item));
      this.students = this.extractStudents();
    }

  normalizeAssignment(item) {
  const now = new Date().toISOString();
  const attachments = (item.attachments || [
    item.file,
    item.doc,
    item.img,
    ...(Array.isArray(item.files) ? item.files : [])
  ].filter(Boolean))
    .map((att, i) => {
      if (typeof att === 'string') return { url: att, name: `Attachment ${i + 1}`, type: this.getFileType(att) };
      if (att?.url) return { url: att.url, name: att.name || `Attachment ${i + 1}`, type: att.type || this.getFileType(att.url) };
      return null;
    })
    .filter(Boolean);

  return {
    id: item.id ?? (Date.now() + Math.floor(Math.random() * 10000)),
    student_id: item.student_id ?? item.studentId,
    student_name: item.student_name || item.studentName || item.student || "Unknown Student",
    title: item.title || item.assignmentTitle || "Untitled",
    description: item.description || item.question || item.details || "",
    subject: item.subject || "",
    topic: item.topic || "",
    deadline: item.deadline || item.dueDate || null,
    amount: Number(item.amount ?? item.price ?? 0),
    status: (typeof item.status === "string" ? item.status : "pending").toLowerCase(),
    created_at: new Date(item.created_at || item.postedAt || item.createdAt || now).toISOString(),
    updated_at: new Date(item.updated_at || item.updatedAt || now).toISOString(),
    attachments,
    answer_url: item.answer_url || item.answerFile || item.answer?.url || null,
    answer_file: item.answer_file || item.answer?.file || null,
    completed_at: item.completed_at || item.completedAt || null,
    dispute_reason: item.dispute_reason || item.disputeReason || null
  };
}


extractStudents() {
  return [...new Set(this.assignments.map(a => a.student_name).filter(Boolean))];
}

getFileType(url) {
  if (typeof url !== 'string') return 'file';
  const ext = url.split('.').pop()?.toLowerCase();
  if (!ext) return 'file';
  if (ext === 'pdf') return 'application/pdf';
  if (['jpg','jpeg','png','gif'].includes(ext)) return 'image';
  if (['doc','docx'].includes(ext)) return 'document';
  if (['xls','xlsx'].includes(ext)) return 'spreadsheet';
  if (['ppt','pptx'].includes(ext)) return 'presentation';
  return 'file';
}


 async sendMessage(assignmentId, messageText, file = null) {
  if (!messageText && !file) throw new Error("Cannot send empty message");

  // 🔹 Backend mode
  if (this.useBackend) {
    return this.api.sendMessage(assignmentId, messageText, file);
  }

  // 🔹 Local fallback
  const assignment = this.assignments.find(a => a.id == assignmentId);
  if (!assignment) throw new Error("Assignment not found");

  const key = `messages_${assignmentId}`;
  const messages = JSON.parse(localStorage.getItem(key)) || [];

  const newMessage = {
    sender: "Tutor",
    text: messageText,
    is_tutor: true,
    ts: Date.now()
  };

  // Handle file uploads (convert to base64)
  if (file) {
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newMessage.file = base64Data;
      newMessage.file_name = file.name;
      newMessage.file_type = file.type;
    } catch (err) {
      console.error("File conversion failed:", err);
    }
  }

  messages.push(newMessage);
  localStorage.setItem(key, JSON.stringify(messages));

  return { success: true, message: newMessage };
}


  async getMessages(assignmentId) {
  const assignment = this.assignments.find(a => a.id == assignmentId);
  if (!assignment) return [];

  if (this.useBackend) {
    // Load messages directly from backend API
    return this.api.getMessages(assignmentId);
  } else {
    // Unified localStorage key for all messages (tutor + student)
    const key = `messages_${assignmentId}`;
    const allMessages = JSON.parse(localStorage.getItem(key)) || [];

    // Normalize message objects
    const normalized = allMessages.map(m => ({
      sender: m.is_tutor ? "You" : (assignment.student_name || "Student"),
      text: m.text,
      sent_at: new Date(m.timestamp || m.ts || Date.now()).toISOString(),
      is_tutor: m.is_tutor ?? (m.sender === "tutor"),
      file_url: m.file || m.file_url || null,
      file_name: m.fileName || m.file_name || null,
      file_type: m.fileType || m.file_type || null
    }));

    // Sort chronologically
    return normalized.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  }
}
  }



  // ---------- Global Instances ----------
  const tutorDataStore = new TutorDataStore();
  const tutorApiService = new TutorApiService();

  // ---------- State ----------
  let currentPage = 1;
  let rowsPerPage = CONFIG.DEFAULT_ROWS_PER_PAGE;
  let currentUploadIndex = null;
  let currentChat = { student: "", id: null };
  let currentFilterStudent = "all";
  let currentSearch = "";
  let currentSort = "newest";

  // ---------- DOM helpers ----------
  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const hasId = (id) => !!$(id);
  const studentFilterId = hasId("studentFilter") ? "studentFilter" : "student-filter";

  // ---------- UI Utilities ----------
  const UIState = {
    setLoading(loading) {
      const buttons = document.querySelectorAll('button[data-action="upload"]');
      buttons.forEach(btn => {
        if (loading && btn.getAttribute('data-loading') !== 'true') {
          btn.setAttribute('data-original-text', btn.innerHTML);
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          btn.disabled = true;
          btn.setAttribute('data-loading', 'true');
        } else if (!loading && btn.getAttribute('data-loading') === 'true') {
          btn.innerHTML = btn.getAttribute('data-original-text');
          btn.disabled = false;
          btn.removeAttribute('data-loading');
        }
      });
    },

    showError(message) {
      alert(`Error: ${message}`);
    },

    showSuccess(message) {
      alert(`Success: ${message}`);
    }
  };

  function escapeHtml(str) {
    if (typeof str !== "string") return str ?? "";
    return str.replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[s]);
  }
  
  function validateFile(file) {
    if (!file) return { ok: false, msg: "No file selected." };
    if (file.size > CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
  return { ok: false, msg: `File must be < ${CONFIG.MAX_FILE_SIZE_MB} MB.` };
}

    if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type))
 {
      return { ok: false, msg: "File type not allowed. Allowed: PDF, Word, Excel, PowerPoint, images." };
    }
    return { ok: true };
  }
  
  function formatMoney(n) {
    const val = Number(n) || 0;
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ---------- Render / Filter / Sort / Paginate ----------
  function applySearchSortFilter(list) {
    let out = [...list];

    // search
    const s = (currentSearch || "").trim().toLowerCase();
    if (s) {
      out = out.filter(a => {
        const hay = `${a.title || ""} ${a.student_name || ""} ${a.subject || ""} ${a.topic || ""} ${a.description || ""}`.toLowerCase();
        return hay.includes(s);
      });
    }

    // student filter
    if (currentFilterStudent && currentFilterStudent !== "all") {
      out = out.filter(a => a.student_name === currentFilterStudent);
    }

    // sort
    switch (currentSort) {
      case "deadline":
        out.sort((x,y) => {
          const dx = x.deadline ? new Date(x.deadline).getTime() : Infinity;
          const dy = y.deadline ? new Date(y.deadline).getTime() : Infinity;
          return dx - dy;
        });
        break;
      case "amount-asc":
        out.sort((x,y) => (Number(x.amount)||0) - (Number(y.amount)||0));
        break;
      case "amount-desc":
        out.sort((x,y) => (Number(y.amount)||0) - (Number(x.amount)||0));
        break;
      case "newest":
      default:
        out.sort((x,y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
        break;
    }

    return out;
  }

  async function renderAssignments() {
    await tutorDataStore.loadAssignments();
    const tbody = $("assignments-list");
    if (!tbody) return;

    const filtered = applySearchSortFilter(tutorDataStore.assignments);
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filtered.slice(start, start + rowsPerPage);

    tbody.innerHTML = pageItems.map(a => {
      const statusClass = `badge-${a.status.toLowerCase().replace(' ', '')}`;
      
      const uploadHtml = a.status === "pending" || a.status === "pending_payment"
        ? `<button class="btn btn-primary btn-compact" data-action="upload" data-id="${a.id}" title="Upload Answer">
             <i class="fas fa-upload"></i>
           </button>`
        : (a.answer_url ? `<a class="btn btn-success btn-compact" href="${a.answer_url}" target="_blank" title="View Answer">
             <i class="fas fa-file-check"></i>
           </a>` : "—");

      const viewBtn = `<button class="btn btn-view btn-compact" data-action="view" data-id="${a.id}" title="View Details">
         <i class="fas fa-eye"></i>
       </button>`;
       
      const msgBtn = `<button class="btn btn-chat btn-compact" data-action="msg" data-id="${a.id}" data-student="${escapeHtml(a.student_name)}" title="Message Student">
         <i class="fas fa-comment"></i>
       </button>`;
       
      const disputeBtn = a.status !== "completed" 
        ? `<button class="btn btn-warn btn-compact" data-action="dispute" data-id="${a.id}" title="Report Issue">
             <i class="fas fa-flag"></i>
           </button>`
        : '';

      return `
        <tr>
          <td>${escapeHtml(a.student_name)}</td>
          <td>${escapeHtml(a.title)}</td>
          <td>${escapeHtml(a.subject || "")}</td>
          <td>${escapeHtml(a.topic || "")}</td>
          <td>${a.deadline ? escapeHtml(new Date(a.deadline).toLocaleString()) : "No deadline"}</td>
          <td><span class="status-badge ${statusClass}">${escapeHtml(a.status)}</span></td>
          <td>$${formatMoney(a.amount)}</td>
          <td class="actions">
            ${uploadHtml}
            ${viewBtn}
            ${msgBtn}
            ${disputeBtn}
          </td>
        </tr>
      `;
    }).join("");

    updateTutorStats(filtered);

    const pageInfo = $("page-info");
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    wireTableButtons();
  }

  function updateTutorStats(filtered) {
    const totalEl = $("total-assignments");
    const pendingEl = $("pending-assignments");
    const completedEl = $("completed-assignments");
    const earningsEl = $("total-earnings");
    const pendingEarningsEl = $("pending-earnings");
    const pastDueEl = $("past-due-assignments");

    if (totalEl) totalEl.textContent = filtered.length;
    if (pendingEl) pendingEl.textContent = filtered.filter(a => 
      a.status === "pending" || a.status === "pending_payment").length;
    if (completedEl) completedEl.textContent = filtered.filter(a => a.status === "completed").length;
    
    if (pastDueEl) {
      pastDueEl.textContent = filtered.filter(a => 
        a.deadline && 
        new Date(a.deadline) < new Date() && 
        a.status !== "completed"
      ).length;
    }
    
    if (earningsEl) earningsEl.textContent = "$" + formatMoney(filtered.reduce((s,a) => 
      s + (a.status === "completed" ? (Number(a.amount)||0) : 0), 0));
    if (pendingEarningsEl) pendingEarningsEl.textContent = "$" + formatMoney(filtered.reduce((s,a) => 
      s + (a.status !== "completed" ? (Number(a.amount)||0) : 0), 0));
  }

  // ---------- Table Button Wiring ----------
  function wireTableButtons() {
    const tbody = $("assignments-list");
    if (!tbody) return;
    
    tbody.querySelectorAll("[data-action]").forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", (e) => {
        const action = newBtn.getAttribute("data-action");
        const id = newBtn.getAttribute("data-id");
        if (!action || !id) return;
        
        switch(action) {
          case "upload":
            currentUploadIndex = id;
            showUploadModal();
            break;
          case "view":
            viewAssignmentById(Number(id));
            break;
          case "msg":
            const studentName = newBtn.getAttribute("data-student");
            openMessageModal(studentName, Number(id));
            break;
          case "dispute":
            markDispute(Number(id));
            break;
        }
      });
    });
  }

  // ---------- Upload Handler ----------
  function setupUploadForm() {
    const uploadForm = $("upload-form");
    if (!uploadForm) return;
    
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!currentUploadIndex) {
        UIState.showError("No assignment selected to upload.");
        return;
      }
      
      const fileInput = $("answer-file");
      const file = fileInput?.files?.[0];
      const validation = validateFile(file);
      
      if (!validation.ok) {
        UIState.showError(validation.msg);
        return;
      }

      UIState.setLoading(true);

      try {
        await tutorDataStore.uploadAnswer(currentUploadIndex, file);
        
        fileInput.value = "";
        currentUploadIndex = null;
        hideUploadModal();
        await renderAssignments();
        
        UIState.showSuccess("Answer uploaded successfully! Assignment marked as Completed.");
        
      } catch (error) {
        UIState.showError("Error uploading file: " + error.message);
      } finally {
        UIState.setLoading(false);
      }
    });
  }

  // ---------- Enhanced Messaging System ----------
  async function openMessageModal(studentName, assignmentId) {
    currentChat = { student: studentName, id: assignmentId };
    const modal = $("message-modal");
    if (!modal) return UIState.showError("Message modal missing.");
    
    const title = $("message-modal-title");
    if (title) title.textContent = `💬 Message Student - ${studentName}`;
    
    await loadChatMessages(assignmentId);
    modal.style.display = "block";
  }
  
  async function loadChatMessages(assignmentId) {
    const div = $("message-history");
    if (!div) return;
    
    div.innerHTML = '<div class="loading">Loading messages...</div>';

    try {
      const messages = await tutorDataStore.getMessages(assignmentId);
      renderMessages(messages);
    } catch (error) {
      UIState.showError('Failed to load messages');
      div.innerHTML = '<div class="error">Failed to load messages</div>';
    }
  }

function renderMessages(messages) {
  const div = $("message-history");
  if (!div) return;

  div.innerHTML = messages.map(m => {
    const isTutor = m.is_tutor || m.sender === "Tutor";
    const senderName = isTutor ? "You" : m.sender;

    let fileHtml = "";
    if (m.file_url) {
      const fileName = att.name || att.url.split('/').pop() || `Attachment_${i+1}`;

      fileHtml = `
        <div class="message-file">
          <a href="${m.file_url}" target="_blank" download="${fileName}">
            📎 ${fileName}
          </a>
        </div>
      `;
    }

    return `
      <div class="message-bubble ${isTutor ? 'message-sent' : 'message-received'}">
        <div class="meta">
          <span>${senderName}</span>
          <span>${new Date(m.sent_at || m.ts).toLocaleTimeString()}</span>
        </div>
        <div class="text">${escapeHtml(m.text || "")}</div>
        ${fileHtml}
      </div>
    `;
  }).join("");

  div.scrollTop = div.scrollHeight;
}

 // ---------- Enhanced Messaging System ----------
function setupMessageForm() {
  const form = $("message-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("message-input");
    const fileInput = $("message-file"); // Make sure your form has this input
    if (!input && !fileInput) return;

    const messageText = input?.value.trim() || "";
    const file = fileInput?.files?.[0] || null;

    if (!messageText && !file) return; // Nothing to send

    try {
      await tutorDataStore.sendMessage(currentChat.id, messageText, file);
      input.value = "";
      if (fileInput) fileInput.value = "";
      await loadChatMessages(currentChat.id);
    } catch (error) {
      UIState.showError('Failed to send message: ' + error.message);
    }
  });
}

  // ---------- View Details + File Preview ----------
  async function viewAssignmentById(id) {
    await tutorDataStore.loadAssignments();
    const assignment = tutorDataStore.assignments.find(x => x.id === id);
    if (!assignment) return UIState.showError("Assignment not found.");
    
    const dlg = $("assignment-details-modal");
    if (!dlg) return UIState.showError("Details modal missing.");

    document.getElementById("details-title").textContent = assignment.title;
    document.getElementById("details-subject").textContent = assignment.subject || "—";
    document.getElementById("details-topic").textContent = assignment.topic || "—";
    document.getElementById("details-status").textContent = assignment.status || "—";
    document.getElementById("details-deadline").textContent = assignment.deadline ? 
      new Date(assignment.deadline).toLocaleString() : "—";
    document.getElementById("details-amount").textContent = "$" + formatMoney(assignment.amount);
    document.getElementById("details-description").textContent = assignment.description || "No description provided.";

    const filesArea = $("details-file-links");
    filesArea.innerHTML = "";
    
    // Show question attachments
    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach((att, i) => {
        const wrapper = document.createElement("div");
        wrapper.className = "file-preview";
        wrapper.innerHTML = `
          <a href="${att.url}" download="${att.name}" class="btn btn-download" style="display:block;margin:5px 0;">
            📎 ${att.name || `Attachment ${i+1}`}
          </a>
        `;
        filesArea.appendChild(wrapper);
      });
    } else {
      filesArea.innerHTML = "<em>No question files attached</em>";
    }

    // Show answer if exists
    if (assignment.answer_url) {
      const answerDiv = document.createElement("div");
      answerDiv.innerHTML = `
        <h4>Submitted Answer</h4>
        <a href="${assignment.answer_url}" download="answer_${assignment.id}" class="btn btn-success">
          <i class="fas fa-download"></i> Download Answer
        </a>
      `;
      filesArea.appendChild(answerDiv);
    }

    dlg.style.display = "block";
  }

  // ---------- Dispute/Report ----------
  async function markDispute(id) {
    const reason = prompt("Describe the issue / reason for dispute:");
    if (!reason) return;
    
    try {
      if (tutorDataStore.useBackend) {
        await tutorApiService.reportAssignment(id, reason);
      } else {
        await tutorDataStore.updateAssignment(id, {
          status: "dispute",
          dispute_reason: reason,
          updated_at: new Date().toISOString()
        });
      }
      
      await renderAssignments();
      UIState.showSuccess("Assignment reported. Student has been notified.");
    } catch (error) {
      UIState.showError("Failed to report assignment: " + error.message);
    }
  }

  // ---------- Toolbar & UI Setup ----------
  function ensureToolbar() {
    const container = $("tutorQuestions") || q(".assignments-table") || document.body;
    if (!container) return;

    if ($("tutor-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.id = "tutor-toolbar";
    toolbar.className = "tutor-toolbar";
    toolbar.innerHTML = `
      <div class="toolbar-left">
        <label>Search: <input id="searchInput" placeholder="search title, student, subject..." /></label>
        <label>Sort:
          <select id="sortSelect">
            <option value="newest">Newest</option>
            <option value="deadline">Nearest Deadline</option>
            <option value="amount-desc">Amount (high → low)</option>
            <option value="amount-asc">Amount (low → high)</option>
          </select>
        </label>
      </div>
      <div class="toolbar-right">
        <label>Rows:
          <select id="rowsPerPageSelect">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>
        <button id="toggle-dark" class="btn-secondary">Toggle Dark</button>
      </div>
      <div style="clear:both;"></div>
    `;

    const assignTable = $("assignments-list")?.closest("table") || q(".assignments-table");
    if (assignTable && assignTable.parentNode) {
      assignTable.parentNode.insertBefore(toolbar, assignTable);
    } else {
      container.prepend(toolbar);
    }
  }

  function setupToolbarListeners() {
    ensureToolbar();

    const searchInput = $("searchInput");
    const sortSelect = $("sortSelect");
    const rowsSelect = $("rowsPerPageSelect");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        renderAssignments();
      });
    }
    
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderAssignments();
      });
    }
    
    if (rowsSelect) {
      rowsSelect.addEventListener("change", (e) => {
        rowsPerPage = parseInt(e.target.value) || CONFIG.DEFAULT_ROWS_PER_PAGE;
        currentPage = 1;
        renderAssignments();
      });
    }

    const sf = $(studentFilterId);
    if (sf) {
      // Students will be populated after data load
      sf.addEventListener("change", (e) => {
        currentFilterStudent = e.target.value;
        currentPage = 1;
        renderAssignments();
      });
    }
  }

  function updateStudentFilter() {
    const sf = $(studentFilterId);
    if (sf) {
      sf.innerHTML = `<option value="all">All Students</option>` + 
        tutorDataStore.students.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join("");
    }
  }

  // ---------- Modal Management ----------
  function showUploadModal() {
    const modal = $("upload-modal");
    if (modal) modal.style.display = "block";
  }

  function hideUploadModal() {
    const modal = $("upload-modal");
    if (modal) modal.style.display = "none";
    currentUploadIndex = null;
  }

  function closeDetailsModal() {
    const modal = $("assignment-details-modal");
    if (modal) modal.style.display = "none";
  }

  function closeMessageModal() {
    const modal = $("message-modal");
    if (modal) modal.style.display = "none";
  }

  // ---------- Dark Mode Toggle ----------
  function setupDarkModeToggle() {
    document.addEventListener('click', function(e) {
      if (e.target && (e.target.id === 'toggle-dark' || e.target.closest('#toggle-dark'))) {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');

        e.preventDefault();
      }
    });
    
   const savedDark = localStorage.getItem('darkMode') === 'true';
if (savedDark) document.body.classList.add('dark-mode');

  }

  // ---------- Initial Boot ----------
 async function boot() {
  const tutorToken = localStorage.getItem("tutorToken");
  const onLoginPage = window.location.pathname.includes("index.html");

  // 🔐 Redirect if not logged in
  if (!tutorToken && !onLoginPage) {
    window.location.href = "index.html";
    return;
  }

  try {
    // 🧩 Initialize data
    await tutorDataStore.initialize();

    // 🧰 Setup all UI event handlers
    ensureToolbar();
    setupToolbarListeners();
    setupUploadForm();
    setupMessageForm();
    setupDarkModeToggle();
    updateStudentFilter();

    // 🎯 Render dashboard content
    await renderAssignments();

    // 🪟 Handle modal close clicks
    window.addEventListener("click", (e) => {
      ["upload-modal", "assignment-details-modal", "message-modal"].forEach((id) => {
        const dlg = $(id);
        if (dlg && e.target === dlg) dlg.style.display = "none";
      });
    });

    // 🚪 Logout handler
    const logoutBtn = $("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const confirmLogout = confirm("Are you sure you want to logout?");
        if (!confirmLogout) return;

        localStorage.removeItem("tutorToken");
        UIState.showLoading("Logging out...");
        await new Promise((res) => setTimeout(res, 500)); // graceful UX delay
        window.location.href = "index.html";
      });
    }

    console.log("%cTutor Dashboard initialized successfully ✅", "color: #00c853");

  } catch (error) {
    console.error("Tutor dashboard initialization failed:", error);
    UIState.showError("⚠️ Failed to initialize tutor dashboard. Please reload.");
  }
}

// ✅ Run boot when DOM is ready
document.addEventListener("DOMContentLoaded", boot);


  // ---------- Global Exposes ----------
  window.viewAssignmentById = viewAssignmentById;
  window.openMessageModal = openMessageModal;
  window.closeMessageModal = closeMessageModal;
  window.hideUploadModal = hideUploadModal;
  window.closeDetailsModal = closeDetailsModal;
  window.showUploadModal = showUploadModal;

  // ---------- Backend Migration Helper ----------
  async function enableBackendMode() {
    tutorDataStore.useBackend = true;
    await tutorDataStore.initialize();
    await renderAssignments();
    UIState.showSuccess('Backend mode enabled!');
  }

  window.enableBackendMode = enableBackendMode;
  window.tutorDataStore = tutorDataStore; // For debugging

  // Final boot
  boot();
})() 