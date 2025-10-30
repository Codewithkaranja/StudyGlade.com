// tutor-dashboard.js - Backend Ready Version
(() => {
  // ---------- Configuration ----------
  const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/api' 
      : 'https://studyglade-com.onrender.com/api',
    DEFAULT_ROWS_PER_PAGE: 5,
    MAX_FILE_MB: 5,
    ALLOWED_TYPES: [
      "application/pdf",
      "image/jpeg", "image/png", "image/gif",
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
      return this.request(`/tutor/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }

    async uploadAnswer(assignmentId, file) {
      const formData = new FormData();
      formData.append('answer', file);
      formData.append('assignmentId', assignmentId);

      const response = await fetch(`${this.baseURL}/tutor/assignments/${assignmentId}/upload-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tutorToken')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Answer upload failed');
      return response.json();
    }

    // Message endpoints
    async getMessages(assignmentId) {
      return this.request(`/tutor/assignments/${assignmentId}/messages`);
    }

    async sendMessage(assignmentId, message) {
      return this.request(`/tutor/assignments/${assignmentId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: message })
      });
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
      this.useBackend = false; // Enable when backend is ready
      this.assignments = [];
      this.students = [];
    }

    async initialize() {
      await this.loadAssignments();
    }

    async loadAssignments(filters = {}) {
      if (this.useBackend) {
        try {
          const response = await this.api.getAssignments(filters);
          this.assignments = response.assignments || [];
          this.students = response.students || this.extractStudents();
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
      const raw = JSON.parse(localStorage.getItem("questions")) || [];
      this.assignments = raw.map(item => this.normalizeAssignment(item));
      this.students = this.extractStudents();
    }

    normalizeAssignment(item) {
      return {
        id: item.id ?? (Date.now() + Math.floor(Math.random() * 10000)),
        student_id: item.student_id,
        student_name: item.student_name || item.studentName || item.student || "Unknown Student",
        title: item.title || "Untitled",
        description: item.description || item.question || "",
        subject: item.subject || "",
        topic: item.topic || "",
        deadline: item.deadline,
        amount: Number(item.amount) || 0,
        status: item.status?.toLowerCase() || "pending",
        created_at: item.created_at || item.postedAt || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        attachments: item.attachments || [item.file, item.doc, item.img].filter(Boolean).map(url => ({
          url,
          name: "Attachment",
          type: this.getFileType(url)
        })),
        answer_url: item.answer_url || item.answerFile,
        answer_file: item.answer_file
      };
    }

    extractStudents() {
      return [...new Set(this.assignments.map(a => a.student_name).filter(Boolean))];
    }

    getFileType(url) {
      if (typeof url === 'string') {
        if (url.includes('pdf')) return 'application/pdf';
        if (url.match(/\.(jpg|jpeg|png|gif)/i)) return 'image';
        if (url.match(/\.(doc|docx)/i)) return 'document';
      }
      return 'file';
    }

    async updateAssignment(id, updates) {
      if (this.useBackend) {
        try {
          await this.api.updateAssignment(id, updates);
          await this.loadAssignments(); // Reload fresh data
        } catch (error) {
          console.warn('Backend update failed, updating locally');
          this.useBackend = false;
          this.updateLocalAssignment(id, updates);
        }
      } else {
        this.updateLocalAssignment(id, updates);
      }
    }

    updateLocalAssignment(id, updates) {
      const allQuestions = JSON.parse(localStorage.getItem("questions")) || [];
      const index = allQuestions.findIndex(q => q.id == id);
      if (index !== -1) {
        allQuestions[index] = { ...allQuestions[index], ...updates };
        localStorage.setItem("questions", JSON.stringify(allQuestions));
        this.loadFromLocalStorage();
      }
    }

    async uploadAnswer(assignmentId, file) {
      if (this.useBackend) {
        try {
          const result = await this.api.uploadAnswer(assignmentId, file);
          await this.updateAssignment(assignmentId, {
            status: 'completed',
            answer_url: result.fileUrl,
            completed_at: new Date().toISOString()
          });
          return result;
        } catch (error) {
          throw error;
        }
      } else {
        // Local storage fallback - convert to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result;
            this.updateLocalAssignment(assignmentId, {
              status: 'completed',
              answerFile: base64Data,
              completedAt: new Date().toISOString()
            });
            resolve({ fileUrl: base64Data });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    }

    async sendMessage(assignmentId, message) {
      if (this.useBackend) {
        return this.api.sendMessage(assignmentId, message);
      } else {
        // Local storage fallback
        const assignment = this.assignments.find(a => a.id == assignmentId);
        if (!assignment) throw new Error('Assignment not found');

        const tutorKey = `chat_${assignment.student_name.replace(/\s+/g, '_')}_${assignmentId}`;
        const tutorMessages = JSON.parse(localStorage.getItem(tutorKey)) || [];
        tutorMessages.push({ sender: "Tutor", text: message, ts: Date.now() });
        localStorage.setItem(tutorKey, JSON.stringify(tutorMessages));
        
        return { success: true };
      }
    }

    async getMessages(assignmentId) {
      if (this.useBackend) {
        return this.api.getMessages(assignmentId);
      } else {
        const assignment = this.assignments.find(a => a.id == assignmentId);
        if (!assignment) return [];

        const tutorKey = `chat_${assignment.student_name.replace(/\s+/g, '_')}_${assignmentId}`;
        const studentKey = `messages_${assignmentId}`;
        
        const tutorMessages = JSON.parse(localStorage.getItem(tutorKey)) || [];
        const studentMessages = JSON.parse(localStorage.getItem(studentKey)) || [];
        
        return [...tutorMessages, ...studentMessages.map(msg => ({
          sender: msg.sender === 'student' ? assignment.student_name : 'Tutor',
          text: msg.text,
          sent_at: new Date(msg.timestamp || msg.ts).toISOString(),
          is_tutor: msg.sender !== 'student'
        }))].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
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
    if (file.size > CONFIG.MAX_FILE_MB * 1024 * 1024) {
      return { ok: false, msg: `File must be < ${CONFIG.MAX_FILE_MB} MB.` };
    }
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
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
    div.innerHTML = messages.map(m => {
      const isTutor = m.is_tutor || m.sender === "Tutor";
      const senderName = isTutor ? "You" : m.sender;
      
      return `
        <div class="message-bubble ${isTutor ? 'message-sent' : 'message-received'}">
          <div class="meta">
            <span>${senderName}</span>
            <span>${new Date(m.sent_at || m.ts).toLocaleTimeString()}</span>
          </div>
          <div class="text">${escapeHtml(m.text)}</div>
        </div>
      `;
    }).join("");
    
    div.scrollTop = div.scrollHeight;
  }

  function setupMessageForm() {
    const form = $("message-form");
    if (!form) return;
    
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = $("message-input");
      if (!input) return;
      
      const message = input.value.trim();
      if (!message) return;

      try {
        await tutorDataStore.sendMessage(currentChat.id, message);
        input.value = "";
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
        localStorage.setItem('darkMode', isDark);
        e.preventDefault();
      }
    });
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.body.classList.add('dark-mode');
    }
  }

  // ---------- Initial Boot ----------
  async function boot() {
    const tutorToken = localStorage.getItem("tutorToken");
    if (!tutorToken && !window.location.pathname.includes('index.html')) {
      window.location.href = "index.html";
      return;
    }
    
    try {
      await tutorDataStore.initialize();
      ensureToolbar();
      setupToolbarListeners();
      setupUploadForm();
      setupMessageForm();
      setupDarkModeToggle();
      updateStudentFilter();
      await renderAssignments();

      // Modal close handlers
      window.addEventListener("click", (e) => {
        ["upload-modal","assignment-details-modal","message-modal"].forEach(id => {
          const dlg = $(id);
          if (dlg && e.target === dlg) dlg.style.display = "none";
        });
      });

      // Logout handler
      const logoutBtn = $("logout-btn");
      if (logoutBtn) logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem('tutorToken');
          window.location.href = "index.html";
        }
      });

    } catch (error) {
      console.error('Tutor dashboard initialization failed:', error);
      UIState.showError('Failed to initialize tutor dashboard');
    }
  }

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
})();