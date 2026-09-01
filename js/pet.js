class FinPet {
  constructor() {
    this.emojis = { happy: '😺', warning: '😿', sad: '🙀' };
    this.currentMood = 'happy';
    this.init();
  }

  init() {
    this.renderWidget();
    this.bindEvents();
  }

  renderWidget() {
    const html = `
      <div id="pet-widget-container">
        <div class="pet-chat-box" id="petChatBox">
          <div class="pet-chat-header">
            <span>🐾 FinPet</span>
            <span id="petMoodText" style="font-size:11px; font-weight:normal;">Senang</span>
          </div>
          <div class="pet-chat-body" id="petChatBody">
            <div class="chat-msg bot">Halo! Gw FinPet. Mau cek sisa budget atau pengeluaran?</div>
          </div>
          <div class="pet-chat-footer">
            <input type="text" id="petInput" placeholder="Ketik pesan..." />
            <button id="petSendBtn">Kirim</button>
          </div>
        </div>
        <button class="pet-avatar-btn" id="petAvatarBtn">
          <span id="petEmoji">😺</span>
          <span class="pet-status-badge status-happy" id="petBadge"></span>
        </button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  bindEvents() {
    const btn = document.getElementById('petAvatarBtn');
    const box = document.getElementById('petChatBox');
    const sendBtn = document.getElementById('petSendBtn');
    const input = document.getElementById('petInput');

    btn.addEventListener('click', () => box.classList.toggle('active'));
    sendBtn.addEventListener('click', () => this.handleUserMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserMessage();
    });
  }

  updateMood(budgetRatio = 0.5) {
    const emojiEl = document.getElementById('petEmoji');
    const badgeEl = document.getElementById('petBadge');
    const moodText = document.getElementById('petMoodText');

    if (budgetRatio < 0.7) {
      this.currentMood = 'happy';
      moodText.textContent = 'Senang 🟢';
    } else if (budgetRatio < 0.9) {
      this.currentMood = 'warning';
      moodText.textContent = 'Waspada 🟡';
    } else {
      this.currentMood = 'sad';
      moodText.textContent = 'Pusing 🔴';
    }

    emojiEl.textContent = this.emojis[this.currentMood];
    badgeEl.className = `pet-status-badge status-${this.currentMood}`;
  }

  handleUserMessage() {
    const input = document.getElementById('petInput');
    const text = input.value.trim();
    if (!text) return;

    this.appendMessage(text, 'user');
    input.value = '';

    setTimeout(() => {
      const reply = this.generateResponse(text.toLowerCase());
      this.appendMessage(reply, 'bot');
    }, 250);
  }

  appendMessage(msg, sender) {
    const body = document.getElementById('petChatBody');
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.textContent = msg;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  generateResponse(query) {
    if (query.includes('budget') || query.includes('sisa')) {
      return 'Penggunaan budget bulan ini masih terukur dengan baik.';
    } else if (query.includes('pengeluaran') || query.includes('keluar')) {
      return 'Rincian pengeluaran lengkap bisa dicek pada tab Analytics.';
    } else if (query.includes('halo') || query.includes('hai')) {
      return 'Halo! Ada transaksi baru yang mau dicatat hari ini?';
    }
    return 'FinPet belum paham. Coba tanya "sisa budget", "pengeluaran", atau salam "halo".';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.finPet = new FinPet();
});
