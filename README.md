# Simple OOP Login & Profile System

A minimal web-based login/profile app using **JavaScript (classes & methods)**, **SQLite3**, and **DOM manipulation**.  
Implements: **Sign up → Login → Profile → Logout**.

## Files
- `index.html` — Login page
- `signup.html` — Sign-up page
- `profile.html` — Profile page
- `main.js` — `UserAuth` class (OOP) + DOM wiring
- `server.js` — Node/Express API with SQLite3
- `users.db` — SQLite database (auto-created at runtime)
- `styles.css` — Minimal UI styling
- `package.json` — Node dependencies and start script

## How it Works
- **Signup** (`POST /api/signup`): creates a user with `loggedIn = 0` and `createdAt = ISO time`
- **Login** (`POST /api/login`): validates credentials, sets all `loggedIn = 0` then sets the user to `loggedIn = 1`
- **Profile** (`GET /api/profile`): returns the single user with `loggedIn = 1` or `401` if none
- **Logout** (`POST /api/logout`): sets any `loggedIn = 1` user back to `0`
- **Access control**: `profile.html` requests `/api/profile`; if 401, it redirects to `index.html`

## Setup & Run
1. Ensure you have **Node.js 18+** installed.
2. In a terminal, go to the project folder and install deps:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm start
   ```
4. Open the UI in your browser:
   - Login page: `http://localhost:3000/index.html`
   - Sign up page: `http://localhost:3000/signup.html`
   - Profile page (redirects to login if not logged in): `http://localhost:3000/profile.html`

The SQLite database file `users.db` will be created automatically on first run. It will also seed a demo user if the table is empty.

## Example Credentials for Testing
- **Username:** `junior`  
- **Password:** `sah123`
- **Email:** `sahjnr@gmail.com`

> You can also create your own user via the Sign Up page.

## Notes
- This implementation keeps things intentionally simple to match the assignment requirements. In production, always **hash passwords** (e.g., with `bcrypt`) and use proper session handling.
- Styling is minimal; feel free to enhance `styles.css`.
- Repo preview image: add an image (e.g., `screenshot.png`) to your repo root if required by your course instructions.

## Folder Structure
```
.
├── index.html
├── signup.html
├── profile.html
├── main.js
├── server.js
├── styles.css
├── users.db          # created at runtime
└── package.json
```

## Attribution
Built to align with the assignment brief.
