
class ChatManager {
  constructor() {
    this.chats = [];
    this.activeChatId = null;
    this.currentUser = { _id: 'dummy', name: 'User' }; // Dummy user
    this.init();
  }

  async init() {
    // await this.checkAuth(); // Uncomment when backend is ready
    this.setupEventListeners();
    await this.loadChats();
  }

  /*
  async checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Not authenticated');
      this.currentUser = await res.json();
      document.getElementById('sidebar-username').textContent = this.currentUser.name;
    } catch (err) {
      localStorage.removeItem('token');
      window.location.href = '../index.html';
    }
  }
  */

  setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const startChatBtn = document.getElementById('start-chat-btn');
    const sendBtn = document.getElementById('send-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        this.logout();
      });
    }

    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.showNewChatModal());
    }

    if (startChatBtn) {
      startChatBtn.addEventListener('click', () => this.showNewChatModal());
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const input = document.getElementById('message-input');
        const text = input?.value.trim();
        if (text && this.activeChatId) {
          this.sendMessage(this.activeChatId, text);
          input.value = '';
        }
      });
    }
  }

  logout() {
    // localStorage.removeItem('token'); // optional
    alert('Logout clicked'); // temporary alert
  }

  async loadChats() {
    // Dummy data for demo
    this.chats = [
      {
        _id: 'chat1',
        participants: [
          { _id: 'dummy', name: 'User' },
          { _id: 'admin', name: 'Admin' }
        ],
        lastMessage: 'Hello there!'
      },
      {
        _id: 'chat2',
        participants: [
          { _id: 'dummy', name: 'User' },
          { _id: 'support', name: 'Support' }
        ],
        lastMessage: 'How can I help you?'
      }
    ];
    this.renderChatList();
  }

  renderChatList() {
    const container = document.getElementById('chat-list');
    if (!container) return;

    if (!this.chats.length) {
      container.innerHTML = '<p>No chats found.</p>';
      return;
    }

    container.innerHTML = this.chats
      .map(chat => {
        const partner = chat.participants.find(u => u._id !== this.currentUser._id);
        return `
          <div class="chat-item" onclick="chatManager.selectChat('${chat._id}')">
            <div class="chat-partner-avatar"><i class="fas fa-user-tie"></i></div>
            <div class="chat-partner-info">
              <span class="chat-partner-name">${partner.name}</span>
              <span class="chat-last-message">${chat.lastMessage || 'No messages yet'}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  async selectChat(chatId) {
    this.activeChatId = chatId;
    this.toggleSection('chat-welcome', false);
    this.toggleSection('chat-active', true);
    await this.loadMessages(chatId);
  }

  async loadMessages(chatId) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    // Dummy messages
    const messages = [
      { sender: { _id: 'dummy', name: 'User' }, text: 'Hi!', createdAt: new Date() },
      { sender: { _id: 'admin', name: 'Admin' }, text: 'Hello!', createdAt: new Date() }
    ];

    messagesContainer.innerHTML = messages
      .map(msg => this.renderMessage(msg))
      .join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update chat header
    const chat = this.chats.find(c => c._id === chatId);
    if (!chat) return;
    const partner = chat.participants.find(u => u._id !== this.currentUser._id);
    document.getElementById('partner-name').textContent = partner.name;
    document.getElementById('partner-status').textContent = 'Online';
  }

  renderMessage(msg) {
    const isSent = msg.sender._id === this.currentUser._id;
    return `
      <div class="message ${isSent ? 'sent' : 'received'}">
        <span class="message-sender">${msg.sender.name}</span>
        <p class="message-text">${msg.text}</p>
        <span class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</span>
      </div>
    `;
  }

  async sendMessage(chatId, text) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const newMsg = {
      sender: this.currentUser,
      text,
      createdAt: new Date()
    };

    messagesContainer.insertAdjacentHTML('beforeend', this.renderMessage(newMsg));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showNewChatModal() {
    this.toggleModal('new-chat-modal', true);
    this.loadUsersForNewChat();
  }

  hideNewChatModal() {
    this.toggleModal('new-chat-modal', false);
  }

  toggleModal(id, show = true) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = show ? 'block' : 'none';
  }

  toggleSection(id, show = true) {
    const section = document.getElementById(id);
    if (section) section.style.display = show ? 'flex' : 'none';
  }

  async loadUsersForNewChat() {
    // Dummy users
    const users = [
      { _id: 'admin', name: 'Admin' },
      { _id: 'support', name: 'Support' }
    ];

    const container = document.getElementById('user-list');
    if (!container) return;

    container.innerHTML = users
      .map(
        u => `
        <div class="user-item" onclick="chatManager.startNewChat('${u._id}')">
          <div class="user-avatar"><i class="fas fa-user"></i></div>
          <span class="user-name">${u.name}</span>
        </div>
      `
      )
      .join('');
  }

  async startNewChat(userId) {
    alert('Starting new chat with user ID: ' + userId);
    this.hideNewChatModal();
    await this.loadChats();
  }
}


// Initialize chat manager
let chatManager;
document.addEventListener('DOMContentLoaded', () => {
  chatManager = new ChatManager();
});

