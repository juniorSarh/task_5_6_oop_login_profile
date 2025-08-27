// main.js
class UserAuth {
  async signup(username, email, password) {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(err.message || 'Signup failed');
    }
    return await res.json();
  }

  async login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Invalid credentials' };
    }
    return data;
  }

  async logout() {
    const res = await fetch('/api/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
    return await res.json();
  }

  async getProfile() {
    const res = await fetch('/api/profile');
    if (res.status === 401) {
      // not logged in
      return null;
    }
    if (!res.ok) throw new Error('Failed to load profile');
    return await res.json();
  }
}

const auth = new UserAuth();

// DOM wiring
document.addEventListener('DOMContentLoaded', async () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const msg = document.getElementById('signup-msg');
      msg.textContent = '';

      try {
        await auth.signup(username, email, password);
        msg.textContent = 'Signup successful. Redirecting to your profile...';
        setTimeout(() => (window.location.href = 'profile.html'), 800);
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const msg = document.getElementById('login-msg');
      msg.textContent = '';

      const result = await auth.login(username, password);
      if (result.success) {
        msg.textContent = 'Login successful. Redirecting...';
        setTimeout(() => (window.location.href = 'profile.html'), 600);
      } else {
        msg.textContent = result.message || 'Login failed';
      }
    });
  }

  // Profile page logic
  if (document.getElementById('profile')) {
    try {
      const profile = await auth.getProfile();
      if (!profile) {
        // Not logged in -> redirect
        window.location.href = 'index.html';
        return;
      }
      // Fill UI
      document.getElementById('p-username').textContent = profile.username;
      document.getElementById('p-email').textContent = profile.email;
      document.getElementById('p-created').textContent = profile.createdAt;
      document.getElementById('p-logged').textContent = String(profile.loggedIn);

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        const msg = document.getElementById('profile-msg');
        msg.textContent = '';
        try {
          await auth.logout();
          window.location.href = 'index.html';
        } catch (e) {
          msg.textContent = 'Logout failed';
        }
      });
    } catch (e) {
      // On any failure, redirect to login
      window.location.href = 'index.html';
      return;
    }
  }
});
