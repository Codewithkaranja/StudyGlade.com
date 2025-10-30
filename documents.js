// documents.js - Backend Ready Version

// ---------- Configuration ----------
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://your-backend-domain.com/api',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
};

// ---------- API Service ----------
class DocumentsApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken') || localStorage.getItem('tutorToken');
    
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
      console.error('Documents API Request failed:', error);
      this.showError(error.message);
      throw error;
    }
  }

  handleUnauthorized() {
    // Don't redirect, just show login prompt for documents
    this.showError('Please login to access documents');
  }

  showError(message) {
    // Could be enhanced with toast notifications
    console.error('Documents Error:', message);
    alert(`Documents Error: ${message}`);
  }

  // Document endpoints
  async getDocuments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/documents?${queryParams}`);
  }

  async uploadDocument(documentData) {
    const formData = new FormData();
    formData.append('title', documentData.title);
    formData.append('category', documentData.category);
    formData.append('subject', documentData.subject);
    formData.append('file', documentData.file);

    const response = await fetch(`${this.baseURL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('tutorToken')}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Document upload failed');
    return response.json();
  }

  async incrementDownload(documentId) {
    return this.request(`/documents/${documentId}/download`, {
      method: 'POST'
    });
  }

  async getCategories() {
    return this.request('/documents/categories');
  }

  async getSubjects() {
    return this.request('/documents/subjects');
  }
}

// ---------- Data Store ----------
class DocumentsDataStore {
  constructor() {
    this.api = new DocumentsApiService();
    this.useBackend = false; // Enable when backend is ready
    this.documents = [];
    this.categories = [];
    this.subjects = [];
  }

  async initialize() {
    await this.loadDocuments();
    await this.loadFilters();
  }

  async loadDocuments(filters = {}) {
    if (this.useBackend) {
      try {
        const response = await this.api.getDocuments(filters);
        this.documents = response.documents || [];
      } catch (error) {
        console.warn('Failed to load documents from backend, using local storage');
        this.useBackend = false;
        this.loadFromLocalStorage();
      }
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    const stored = JSON.parse(localStorage.getItem('documents')) || [];
    // Merge with default documents if empty
    if (stored.length === 0) {
      this.documents = this.getDefaultDocuments();
      this.saveToLocalStorage();
    } else {
      this.documents = stored;
    }
  }

  getDefaultDocuments() {
    return [
      {
        id: 1,
        title: "Calculus Notes",
        category: "notes",
        subject: "mathematics",
        uploader: "Admin",
        downloads: 120,
        uploaded_at: new Date("2025-10-01").toISOString(),
        file_url: "#",
        file_type: "pdf",
        file_size: "2.4 MB"
      },
      {
        id: 2,
        title: "Physics Past Paper",
        category: "past-papers",
        subject: "physics",
        uploader: "Admin",
        downloads: 85,
        uploaded_at: new Date("2025-09-28").toISOString(),
        file_url: "#",
        file_type: "pdf",
        file_size: "1.8 MB"
      },
      {
        id: 3,
        title: "Biology Study Guide",
        category: "guides",
        subject: "biology",
        uploader: "Admin",
        downloads: 60,
        uploaded_at: new Date("2025-09-30").toISOString(),
        file_url: "#",
        file_type: "docx",
        file_size: "3.2 MB"
      }
    ];
  }

  saveToLocalStorage() {
    localStorage.setItem('documents', JSON.stringify(this.documents));
  }

  async loadFilters() {
    if (this.useBackend) {
      try {
        const [categories, subjects] = await Promise.all([
          this.api.getCategories(),
          this.api.getSubjects()
        ]);
        this.categories = categories;
        this.subjects = subjects;
      } catch (error) {
        console.warn('Failed to load filters from backend, using defaults');
        this.useBackend = false;
        this.setDefaultFilters();
      }
    } else {
      this.setDefaultFilters();
    }
  }

  setDefaultFilters() {
    this.categories = ['notes', 'past-papers', 'guides', 'books', 'presentations'];
    this.subjects = ['mathematics', 'physics', 'biology', 'chemistry', 'english', 'history'];
  }

  async uploadDocument(documentData) {
    if (this.useBackend) {
      try {
        const result = await this.api.uploadDocument(documentData);
        await this.loadDocuments(); // Reload to get the new document
        return result;
      } catch (error) {
        throw error;
      }
    } else {
      // Local storage fallback
      return new Promise((resolve) => {
        const newDoc = {
          id: Date.now(),
          title: documentData.title,
          category: documentData.category,
          subject: documentData.subject,
          uploader: "You",
          downloads: 0,
          uploaded_at: new Date().toISOString(),
          file_url: URL.createObjectURL(documentData.file),
          file_type: documentData.file.type,
          file_size: this.formatFileSize(documentData.file.size),
          file_name: documentData.file.name
        };

        this.documents.push(newDoc);
        this.saveToLocalStorage();
        resolve({ document: newDoc, message: 'Document uploaded successfully!' });
      });
    }
  }

  async incrementDownload(documentId) {
    if (this.useBackend) {
      try {
        await this.api.incrementDownload(documentId);
        await this.loadDocuments(); // Reload to get updated download count
      } catch (error) {
        console.warn('Failed to increment download on backend');
        this.useBackend = false;
        this.incrementLocalDownload(documentId);
      }
    } else {
      this.incrementLocalDownload(documentId);
    }
  }

  incrementLocalDownload(documentId) {
    const doc = this.documents.find(d => d.id == documentId);
    if (doc) {
      doc.downloads += 1;
      this.saveToLocalStorage();
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateFile(file) {
    if (!file) {
      return { ok: false, message: 'Please select a file' };
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { 
        ok: false, 
        message: `File must be smaller than ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        ok: false, 
        message: 'File type not allowed. Allowed: PDF, Word, PowerPoint, Text, Images' 
      };
    }

    return { ok: true };
  }
}

// ---------- Global Instances ----------
const documentsDataStore = new DocumentsDataStore();
const documentsApiService = new DocumentsApiService();

// ---------- DOM Elements ----------
const recentGrid = document.getElementById("recent-documents");
const popularGrid = document.getElementById("popular-documents");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const subjectFilter = document.getElementById("subject-filter");
const uploadBtn = document.getElementById("upload-btn");

// ---------- UI State Management ----------
const UIState = {
  setLoading(loading) {
    if (uploadBtn) {
      if (loading) {
        uploadBtn.setAttribute('data-original-text', uploadBtn.textContent);
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadBtn.disabled = true;
      } else {
        uploadBtn.textContent = uploadBtn.getAttribute('data-original-text') || 'Upload Document';
        uploadBtn.disabled = false;
      }
    }
  },

  showError(message) {
    alert(`Error: ${message}`);
  },

  showSuccess(message) {
    alert(`Success: ${message}`);
  }
};

// ---------- Document Rendering ----------
function getFileIcon(fileType, fileName = '') {
  if (fileType.includes('pdf')) return 'fas fa-file-pdf pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word word';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint ppt';
  if (fileType.includes('image')) return 'fas fa-file-image image';
  if (fileType.includes('text')) return 'fas fa-file-alt text';
  
  // Fallback based on file extension
  const ext = fileName.split('.').pop().toLowerCase();
  switch(ext) {
    case 'pdf': return 'fas fa-file-pdf pdf';
    case 'doc':
    case 'docx': return 'fas fa-file-word word';
    case 'ppt':
    case 'pptx': return 'fas fa-file-powerpoint ppt';
    case 'jpg':
    case 'jpeg':
    case 'png': return 'fas fa-file-image image';
    case 'txt': return 'fas fa-file-alt text';
    default: return 'fas fa-file';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

async function renderSections() {
  const filteredDocs = documentsDataStore.documents.filter(d => d.visible !== false);

  // Recent (Newest first)
  const recent = [...filteredDocs].sort((a,b) => 
    new Date(b.uploaded_at) - new Date(a.uploaded_at)
  );
  
  recentGrid.innerHTML = recent.length
    ? recent.map(doc => documentCardHTML(doc)).join('')
    : `<div class="no-results">
         <i class="fas fa-file-alt"></i>
         <h3>No documents found</h3>
         <p>Try changing your filters or upload a new document</p>
       </div>`;

  // Popular (Most downloads)
  const popular = [...filteredDocs].sort((a,b) => b.downloads - a.downloads);
  popularGrid.innerHTML = popular.length
    ? popular.map(doc => documentCardHTML(doc)).join('')
    : `<div class="no-results">
         <i class="fas fa-file-alt"></i>
         <h3>No documents found</h3>
         <p>Try changing your filters or upload a new document</p>
       </div>`;
}

function documentCardHTML(doc) {
  const iconClass = getFileIcon(doc.file_type, doc.file_name || doc.file_url);
  const uploadDate = formatDate(doc.uploaded_at);
  
  return `
    <div class="document-card" data-document-id="${doc.id}">
      <div class="doc-thumbnail">
        <i class="${iconClass}"></i>
      </div>
      <div class="doc-title" title="${doc.title}">${doc.title}</div>
      <div class="doc-meta">
        <span class="subject-badge">${doc.subject}</span>
        <span class="category-badge">${doc.category}</span>
      </div>
      <div class="doc-meta">
        <span>By ${doc.uploader}</span>
        <span>${uploadDate}</span>
      </div>
      <div class="doc-meta">
        <span><i class="fas fa-download"></i> ${doc.downloads} downloads</span>
        ${doc.file_size ? `<span>${doc.file_size}</span>` : ''}
      </div>
      <div class="doc-actions">
        <a href="${doc.file_url}" 
           class="btn-download" 
           target="_blank" 
           download="${doc.file_name || doc.title}"
           onclick="handleDownload(${doc.id}, '${doc.title}')">
          Download
        </a>
        <button class="btn-view" onclick="viewDocument(${doc.id})">
          View
        </button>
      </div>
    </div>
  `;
}

// ---------- Document Actions ----------
async function handleDownload(documentId, title) {
  try {
    await documentsDataStore.incrementDownload(documentId);
    await renderSections(); // Refresh to show updated download count
    
    // Track download analytics
    console.log(`Document downloaded: ${title} (ID: ${documentId})`);
  } catch (error) {
    console.error('Failed to track download:', error);
  }
}

async function viewDocument(documentId) {
  const doc = documentsDataStore.documents.find(d => d.id == documentId);
  if (!doc) {
    UIState.showError('Document not found');
    return;
  }

  const modal = document.getElementById("document-modal");
  const details = document.getElementById("document-details");
  
  if (!modal || !details) {
    UIState.showError('Document modal not found');
    return;
  }

  details.innerHTML = `
    <div class="document-modal-header">
      <h2>${doc.title}</h2>
      <div class="document-meta">
        <span><strong>Subject:</strong> ${doc.subject}</span>
        <span><strong>Category:</strong> ${doc.category}</span>
        <span><strong>Uploaded by:</strong> ${doc.uploader}</span>
        <span><strong>Downloads:</strong> ${doc.downloads}</span>
        ${doc.file_size ? `<span><strong>Size:</strong> ${doc.file_size}</span>` : ''}
      </div>
    </div>
    <div class="document-preview">
      ${getDocumentPreviewHTML(doc)}
    </div>
    <div class="document-actions">
      <a href="${doc.file_url}" 
         class="btn-download" 
         target="_blank" 
         download="${doc.file_name || doc.title}"
         onclick="handleDownload(${doc.id}, '${doc.title}')">
        <i class="fas fa-download"></i> Download
      </a>
      <button class="btn-secondary" onclick="hideDocumentModal()">
        <i class="fas fa-times"></i> Close
      </button>
    </div>
  `;

  modal.style.display = "block";
}

function getDocumentPreviewHTML(doc) {
  if (doc.file_type.includes('pdf')) {
    return `<iframe src="${doc.file_url}" style="width:100%;height:500px;border:none;"></iframe>`;
  } else if (doc.file_type.includes('image')) {
    return `<img src="${doc.file_url}" alt="${doc.title}" style="max-width:100%;max-height:500px;">`;
  } else {
    return `
      <div class="unsupported-preview">
        <i class="fas fa-file ${doc.file_type.includes('word') ? 'word' : doc.file_type.includes('powerpoint') ? 'ppt' : ''}"></i>
        <h3>Preview not available</h3>
        <p>This file type cannot be previewed in the browser.</p>
        <p>Please download the file to view it.</p>
      </div>
    `;
  }
}

function hideDocumentModal() {
  const modal = document.getElementById("document-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// ---------- Upload Handler ----------
if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const title = document.getElementById("doc-title")?.value.trim();
    const category = document.getElementById("doc-category")?.value;
    const subject = document.getElementById("doc-subject")?.value;
    const fileInput = document.getElementById("doc-file");
    const file = fileInput?.files[0];

    if (!title) {
      UIState.showError("Please enter a document title");
      return;
    }

    if (!file) {
      UIState.showError("Please select a file");
      return;
    }

    // Validate file
    const validation = documentsDataStore.validateFile(file);
    if (!validation.ok) {
      UIState.showError(validation.message);
      return;
    }

    UIState.setLoading(true);

    try {
      const documentData = {
        title,
        category: category || 'other',
        subject: subject || 'general',
        file
      };

      const result = await documentsDataStore.uploadDocument(documentData);
      
      // Reset form
      document.getElementById("doc-title").value = "";
      document.getElementById("doc-file").value = "";
      if (document.getElementById("doc-category")) document.getElementById("doc-category").value = "";
      if (document.getElementById("doc-subject")) document.getElementById("doc-subject").value = "";

      await renderSections();
      UIState.showSuccess(result.message || "Document uploaded successfully!");

    } catch (error) {
      UIState.showError("Upload failed: " + error.message);
    } finally {
      UIState.setLoading(false);
    }
  });
}

// ---------- Filters and Search ----------
async function filterDocuments() {
  const term = searchInput?.value.toLowerCase() || "";
  const cat = categoryFilter?.value || "";
  const sub = subjectFilter?.value || "";

  documentsDataStore.documents.forEach(d => {
    d.visible = (!cat || d.category === cat) &&
                (!sub || d.subject === sub) &&
                (!term || 
                  d.title.toLowerCase().includes(term) ||
                  d.subject.toLowerCase().includes(term) ||
                  d.category.toLowerCase().includes(term) ||
                  d.uploader.toLowerCase().includes(term)
                );
  });

  await renderSections();
}

function setupFilters() {
  // Populate category filter
  if (categoryFilter) {
    categoryFilter.innerHTML = `
      <option value="">All Categories</option>
      ${documentsDataStore.categories.map(cat => 
        `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}</option>`
      ).join('')}
    `;
  }

  // Populate subject filter
  if (subjectFilter) {
    subjectFilter.innerHTML = `
      <option value="">All Subjects</option>
      ${documentsDataStore.subjects.map(sub => 
        `<option value="${sub}">${sub.charAt(0).toUpperCase() + sub.slice(1)}</option>`
      ).join('')}
    `;
  }

  // Add event listeners
  if (searchInput) searchInput.addEventListener("input", debounce(filterDocuments, 300));
  if (categoryFilter) categoryFilter.addEventListener("change", filterDocuments);
  if (subjectFilter) subjectFilter.addEventListener("change", filterDocuments);
}

// ---------- Utility Functions ----------
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ---------- Backend Migration Helper ----------
async function enableBackendMode() {
  documentsDataStore.useBackend = true;
  await documentsDataStore.initialize();
  await renderSections();
  setupFilters();
  UIState.showSuccess('Documents backend mode enabled!');
}

// ---------- Initialization ----------
async function initializeDocuments() {
  try {
    await documentsDataStore.initialize();
    setupFilters();
    await renderSections();

    // Modal close handler
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("document-modal");
      if (e.target === modal) {
        hideDocumentModal();
      }
    });

  } catch (error) {
    console.error('Documents initialization failed:', error);
    UIState.showError('Failed to initialize documents');
  }
}

// ---------- Global Exports ----------
window.handleDownload = handleDownload;
window.viewDocument = viewDocument;
window.hideDocumentModal = hideDocumentModal;
window.enableBackendMode = enableBackendMode;
window.documentsDataStore = documentsDataStore; // For debugging

// Start the application
document.addEventListener('DOMContentLoaded', initializeDocuments);