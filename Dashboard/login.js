// ── TransLogic AI Admin Login Logic ──────────────────────────────────────────

// If already logged in, go straight to dashboard
const existingToken = localStorage.getItem('adminToken');
if (existingToken) {
  verifyAndRedirect(existingToken);
}

async function verifyAndRedirect(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      window.location.href = 'index.html';
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
    }
  } catch {
    // Can't reach server — stay on login page
  }
}

// ── DOM Elements ────────────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('adminEmail');
const passwordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const btnText = loginBtn.querySelector('.btn-text');
const btnLoader = loginBtn.querySelector('.btn-loader');
const messageDiv = document.getElementById('loginMessage');
const togglePasswordBtn = document.getElementById('togglePassword');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');

// ── Toggle Password Visibility ──────────────────────────────────────────────
togglePasswordBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.querySelector('.eye-open').classList.toggle('hidden', !isPassword);
  togglePasswordBtn.querySelector('.eye-closed').classList.toggle('hidden', isPassword);
});

// ── Show Message ────────────────────────────────────────────────────────────
function showMessage(text, type = 'error') {
  messageDiv.textContent = text;
  messageDiv.className = `login-message ${type}`;
  // Re-trigger animation
  messageDiv.style.animation = 'none';
  requestAnimationFrame(() => {
    messageDiv.style.animation = '';
  });
}

function hideMessage() {
  messageDiv.className = 'login-message hidden';
}

// ── Set Loading State ───────────────────────────────────────────────────────
function setLoading(loading) {
  loginBtn.disabled = loading;
  btnText.classList.toggle('hidden', loading);
  btnLoader.classList.toggle('hidden', !loading);
  emailInput.disabled = loading;
  passwordInput.disabled = loading;
}

// ── Clear Validation Errors ─────────────────────────────────────────────────
function clearErrors() {
  emailGroup.classList.remove('error');
  passwordGroup.classList.remove('error');
  hideMessage();
}

// ── Form Submit ─────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Client-side validation
  if (!email) {
    emailGroup.classList.add('error');
    showMessage('Please enter your email address');
    emailInput.focus();
    return;
  }

  if (!password) {
    passwordGroup.classList.add('error');
    showMessage('Please enter your password');
    passwordInput.focus();
    return;
  }

  // Email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailGroup.classList.add('error');
    showMessage('Please enter a valid email address');
    emailInput.focus();
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Success — save token and redirect
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.admin.email);

      showMessage('✅ Login successful! Redirecting...', 'success');

      // Small delay for the success message to show
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 600);
    } else {
      // Error from server
      setLoading(false);
      if (response.status === 401) {
        emailGroup.classList.add('error');
        passwordGroup.classList.add('error');
        showMessage('Invalid email or password');
      } else {
        showMessage(data.error || 'Login failed. Please try again.');
      }
    }
  } catch (err) {
    setLoading(false);
    console.error('Login error:', err);
    showMessage('Cannot connect to server. Please check if the backend is running.');
  }
});

// ── Clear errors on input ───────────────────────────────────────────────────
emailInput.addEventListener('input', () => {
  emailGroup.classList.remove('error');
  hideMessage();
});

passwordInput.addEventListener('input', () => {
  passwordGroup.classList.remove('error');
  hideMessage();
});

// ── Enter key on password → submit ──────────────────────────────────────────
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    loginForm.dispatchEvent(new Event('submit'));
  }
});
