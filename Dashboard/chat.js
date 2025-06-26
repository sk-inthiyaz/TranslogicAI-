// Simple chat widget logic for fixed chat
const chatWidget = document.getElementById('chatWidget');
const openChat = document.getElementById('openChat');
const closeChat = document.getElementById('closeChat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

openChat.addEventListener('click', () => {
  chatWidget.classList.remove('hidden');
  openChat.style.display = 'none';
});

closeChat.addEventListener('click', () => {
  chatWidget.classList.add('hidden');
  openChat.style.display = 'block';
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  appendMessage('You', message, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  // Send to backend
  try {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    appendMessage('AI', data.reply || 'No reply', 'ai');
  } catch (err) {
    appendMessage('AI', 'Error contacting AI service.', 'ai');
  }
  chatInput.disabled = false;
  chatInput.focus();
});

function appendMessage(sender, text, type) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + type;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
