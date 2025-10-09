class ChatManager {
  constructor() {
    this.chats = [];
    this.activeChatId = null;
    this.currentUser = { _id: 'dummy', name: 'User' }; // dummy user
    this.init();
  }

  async init() {
    // await this.checkAuth(); // <-- auth check commented out
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
    document.getElementById('logout-btn').addEventListener('click', e => {
      e.preventDefault();
      this.logout();
    });

    document.getElementById('new-chat-btn').addEventListener('click', () => {
      this.showNewChatModal();
    });

    document.getElementById('start-chat-btn').addEventListener('click', () => {
      this.showNewChatModal();
    });

    document.getElementById('send-btn').addEventListener('click', () => {
      const input = document.getElementById('message-input');
      const text = input.value.trim();
      if (text && this.activeChatId) {
        this.sendMessage(this.activeChatId, text);
        input.value = '';
      }
    });
  }

  logout() {
    // localStorage.removeItem('token'); // optional
    alert('Logout clicked'); // temporary alert
  }

  async loadChats() {
    // For demo purposes, using dummy chats
    this.chats = [
      {
        _id: 'chat1',
        participants: [{ _id: 'dummy', name: 'User' }, { _id: 'admin', name: 'Admin' }],
        lastMessage: 'Hello there!'
      },
      {
        _id: 'chat2',
        participants: [{ _id: 'dummy', name: 'User' }, { _id: 'support', name: 'Support' }],
        lastMessage: 'How can I help you?'
      }
    ];
    this.renderChatList();
  }

  renderChatList() {
    const container = document.getElementById('chat-list');
    if (!this.chats.length) {
      container.innerHTML = '<p>No chats found.</p>';
      return;
    }

    container.innerHTML = this.chats.map(chat => {
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
    }).join('');
  }

  async selectChat(chatId) {
    this.activeChatId = chatId;
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('chat-active').style.display = 'flex';
    await this.loadMessages(chatId);
  }

  async loadMessages(chatId) {
    // Dummy messages for demo
    const messages = [
      { sender: { _id: 'dummy', name: 'User' }, text: 'Hi!', createdAt: new Date() },
      { sender: { _id: 'admin', name: 'Admin' }, text: 'Hello!', createdAt: new Date() }
    ];

    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = messages.map(msg => `
      <div class="message ${msg.sender._id === this.currentUser._id ? 'sent' : 'received'}">
        <span class="message-sender">${msg.sender.name}</span>
        <p class="message-text">${msg.text}</p>
        <span class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</span>
      </div>
    `).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update chat header
    const chat = this.chats.find(c => c._id === chatId);
    const partner = chat.participants.find(u => u._id !== this.currentUser._id);
    document.getElementById('partner-name').textContent = partner.name;
    document.getElementById('partner-status').textContent = 'Online';
  }

  async sendMessage(chatId, text) {
    // For demo: append message locally
    const messagesContainer = document.getElementById('messages');
    const newMsg = {
      sender: this.currentUser,
      text,
      createdAt: new Date()
    };
    const msgHtml = `
      <div class="message sent">
        <span class="message-sender">${newMsg.sender.name}</span>
        <p class="message-text">${newMsg.text}</p>
        <span class="message-time">${newMsg.createdAt.toLocaleTimeString()}</span>
      </div>
    `;
    messagesContainer.innerHTML += msgHtml;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showNewChatModal() {
    document.getElementById('new-chat-modal').style.display = 'block';
    this.loadUsersForNewChat();
  }

  hideNewChatModal() {
    document.getElementById('new-chat-modal').style.display = 'none';
  }

  async loadUsersForNewChat() {
    // Dummy users for demo
    const users = [
      { _id: 'admin', name: 'Admin' },
      { _id: 'support', name: 'Support' }
    ];

    const container = document.getElementById('user-list');
    container.innerHTML = users.map(u => `
      <div class="user-item" onclick="chatManager.startNewChat('${u._id}')">
        <div class="user-avatar"><i class="fas fa-user"></i></div>
        <span class="user-name">${u.name}</span>
      </div>
    `).join('');
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
