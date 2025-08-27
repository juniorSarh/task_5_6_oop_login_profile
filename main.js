// main.js — LocalStorage-only auth implementation
class LSAuth {
  static USERS_KEY = "app.users";
  static CURRENT_KEY = "app.currentUser"; // store username of logged-in user

  constructor(storage = window.localStorage) {
    this.store = storage;
  }

  // --- Utilities ---
  _getUsers() {
    const raw = this.store.getItem(LSAuth.USERS_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  _saveUsers(users) {
    this.store.setItem(LSAuth.USERS_KEY, JSON.stringify(users));
  }
  _getCurrentUsername() {
    return this.store.getItem(LSAuth.CURRENT_KEY);
  }
  _setCurrentUsername(username) {
    if (username === null || username === undefined) {
      this.store.removeItem(LSAuth.CURRENT_KEY);
    } else {
      this.store.setItem(LSAuth.CURRENT_KEY, username);
    }
  }

  // --- Public API ---
  async signup(username, email, password) {
    username = (username || "").trim();
    email = (email || "").trim().toLowerCase();
    if (!username || !email || !password) {
      throw new Error("Please fill in all fields");
    }
    const users = this._getUsers();
    if (
      users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      throw new Error("Username already exists");
    }
    if (users.some((u) => (u.email || "").toLowerCase() === email)) {
      throw new Error("Email already exists");
    }
    const user = {
      id: Date.now(),
      username,
      email,
      password, // NOTE: plaintext for demo. Do NOT use in production.
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this._saveUsers(users);
    return this._publicUser(user);
  }

  async login(username, password) {
    const users = this._getUsers();
    const user = users.find(
      (u) =>
        u.username.trim().toLowerCase() ===
        (username || "").trim().toLowerCase()
    );
    if (!user || user.password !== password) {
      throw new Error("Invalid username or password");
    }
    this._setCurrentUsername(user.username);
    return this._publicUser(user);
  }

  async me() {
    const username = this._getCurrentUsername();
    if (!username) throw new Error("Not logged in");
    const users = this._getUsers();
    const user = users.find((u) => u.username === username);
    if (!user) {
      this._setCurrentUsername(null);
      throw new Error("Session expired");
    }
    return this._publicUser(user, true);
  }

  async logout() {
    this._setCurrentUsername(null);
    return { success: true };
  }

  async deleteMyAccount() {
    const username = this._getCurrentUsername();
    if (!username) throw new Error("Not logged in");
    let users = this._getUsers();
    const before = users.length;
    users = users.filter((u) => u.username !== username);
    if (users.length === before) throw new Error("Account not found");
    this._saveUsers(users);
    this._setCurrentUsername(null);
    return { success: true };
  }

  _publicUser(u, loggedIn = false) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
      loggedIn,
    };
  }
}

// --- Page wiring ---
document.addEventListener("DOMContentLoaded", async () => {
  const auth = new LSAuth();

  // SIGNUP
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signup-username").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const msg = document.getElementById("signup-msg");
      msg.textContent = "";

      try {
        await auth.signup(username, email, password);
        msg.textContent = "Signup successful! Redirecting to login...";
        setTimeout(() => (location.href = "index.html"), 700);
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }

  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;
      const msg = document.getElementById("login-msg");
      msg.textContent = "";
      try {
        await auth.login(username, password);
        location.href = "profile.html";
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }

  // PROFILE
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const msg = document.getElementById("profile-msg");
    try {
      const me = await auth.me();
      document.getElementById("p-username").textContent = me.username;
      document.getElementById("p-email").textContent = me.email;
      document.getElementById("p-created").textContent = new Date(
        me.createdAt
      ).toLocaleString();
      document.getElementById("p-logged").textContent = me.loggedIn
        ? "Yes"
        : "No";
    } catch (err) {
      location.href = "index.html";
      return;
    }

    logoutBtn.addEventListener("click", async () => {
      await auth.logout();
      location.href = "index.html";
    });

    const delBtn = document.getElementById("deleteAccountBtn");
    delBtn?.addEventListener("click", async () => {
      if (
        !confirm(
          "This will permanently delete your account on this browser. Continue?"
        )
      )
        return;
      try {
        await auth.deleteMyAccount();
        location.href = "signup.html";
      } catch (e) {
        msg.textContent = e.message || "Delete failed";
      }
    });
  }
});
