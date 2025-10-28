let documents = [
  {
    title: "Calculus Notes",
    category: "notes",
    subject: "mathematics",
    uploader: "Admin",
    downloads: 120,
    uploadedAt: new Date("2025-10-01"),
    fileUrl: "#",
  },
  {
    title: "Physics Past Paper",
    category: "past-papers",
    subject: "physics",
    uploader: "Admin",
    downloads: 85,
    uploadedAt: new Date("2025-09-28"),
    fileUrl: "#",
  },
  {
    title: "Biology Study Guide",
    category: "guides",
    subject: "biology",
    uploader: "Admin",
    downloads: 60,
    uploadedAt: new Date("2025-09-30"),
    fileUrl: "#",
  },
];

const recentGrid = document.getElementById("recent-documents");
const popularGrid = document.getElementById("popular-documents");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const subjectFilter = document.getElementById("subject-filter");
const uploadBtn = document.getElementById("upload-btn");

// Map file extension to icon class
function getFileIcon(fileUrl) {
  const ext = fileUrl.split('.').pop().toLowerCase();
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

// Render Documents to UI
function renderSections() {
  const filteredDocs = documents.filter(d => d.visible !== false);

  // Recent (Newest first)
  const recent = [...filteredDocs].sort((a,b) => b.uploadedAt - a.uploadedAt);
  recentGrid.innerHTML = recent.length
    ? recent.map(doc => documentCardHTML(doc)).join('')
    : `<div class="no-results"><i class="fas fa-file-alt"></i><h3>No documents found</h3></div>`;

  // Popular (Most downloads)
  const popular = [...filteredDocs].sort((a,b) => b.downloads - a.downloads);
  popularGrid.innerHTML = popular.length
    ? popular.map(doc => documentCardHTML(doc)).join('')
    : `<div class="no-results"><i class="fas fa-file-alt"></i><h3>No documents found</h3></div>`;
}

function documentCardHTML(doc) {
  const iconClass = getFileIcon(doc.fileUrl);
  return `
    <div class="document-card">
      <div class="doc-thumbnail"><i class="${iconClass}"></i></div>
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
        <a href="${doc.fileUrl}" class="btn-download" target="_blank" onclick="incrementDownloads('${doc.title}')">Download</a>
        <button class="btn-view" onclick="viewDocument('${doc.title}','${doc.fileUrl}')">View</button>
      </div>
    </div>
  `;
}

// Increment downloads counter
function incrementDownloads(title) {
  const doc = documents.find(d => d.title === title);
  if (doc) {
    doc.downloads += 1;
    renderSections();
  }
}

// View Modal
function viewDocument(title, fileUrl) {
  document.getElementById("document-details").innerHTML = `
    <h2>${title}</h2>
    <iframe src="${fileUrl}" style="width:100%;height:400px;border:none;"></iframe>
  `;
  document.getElementById("document-modal").style.display = "block";
}

function hideDocumentModal() {
  document.getElementById("document-modal").style.display = "none";
}

// Upload handler
if (uploadBtn) {
  uploadBtn.addEventListener("click", () => {
    const title = document.getElementById("doc-title").value.trim();
    const category = document.getElementById("doc-category").value;
    const subject = document.getElementById("doc-subject").value;
    const file = document.getElementById("doc-file").files[0];

    if (!title || !file) return alert("Please enter a title and select a file.");

    const newDoc = {
      title,
      category,
      subject,
      uploader: "You",
      downloads: 0,
      uploadedAt: new Date(),
      fileUrl: URL.createObjectURL(file),
    };

    documents.push(newDoc);
    renderSections();
    alert("Document uploaded successfully!");

    // Reset fields
    document.getElementById("doc-title").value = "";
    document.getElementById("doc-file").value = "";
  });
}

// Filters
function filterDocuments() {
  const term = searchInput?.value.toLowerCase() || "";
  const cat = categoryFilter?.value || "";
  const sub = subjectFilter?.value || "";

  documents.forEach(d => {
    d.visible = (!cat || d.category === cat)
             && (!sub || d.subject === sub)
             && (!term || d.title.toLowerCase().includes(term));
  });

  renderSections();
}

if (searchInput) searchInput.addEventListener("input", filterDocuments);
if (categoryFilter) categoryFilter.addEventListener("change", filterDocuments);
if (subjectFilter) subjectFilter.addEventListener("change", filterDocuments);

// First Page Load
renderSections();
