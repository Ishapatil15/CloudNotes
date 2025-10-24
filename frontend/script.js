// 🌐 Base URL of your deployed Render Service
// *** IMPORTANT: REPLACE THIS WITH YOUR ACTUAL RENDER URL ***
const BASE_URL = "https://YOUR-RENDER-SERVICE-NAME.onrender.com"; 
// Note: We removed the Firebase-specific path (us-central1-cloudnotes-df49f.cloudfunctions.net/api)
// and now point directly to the base URL of your Express server.

// ========================= SIGNUP =========================
async function signup(event) {
  event.preventDefault();
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) window.location.href = "index.html";
}

// ========================= LOGIN =========================
async function login(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok && data.success) {
    localStorage.setItem("username", data.username);
    alert("Login successful!");
    window.location.href = "dashboard.html";
  } else {
    alert(data.message || "Login failed");
  }
}

// ========================= LOGOUT =========================
function logout() {
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

// ========================= ADD NOTE =========================
async function addNote(event) {
  event.preventDefault();
  const username = localStorage.getItem("username");
  const title = document.getElementById("note-title").value;
  const content = document.getElementById("note-content").value;
  const file = document.getElementById("note-file").files[0];

  const formData = new FormData();
  formData.append("username", username);
  formData.append("title", title);
  formData.append("content", content);
  if (file) formData.append("file", file);

  const res = await fetch(`${BASE_URL}/addNote`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  alert(data.message);
  loadNotes();
}

// ========================= LOAD NOTES =========================
async function loadNotes() {
  const username = localStorage.getItem("username");
  if (!username) return window.location.href = "index.html";

  const res = await fetch(`${BASE_URL}/notes/${username}`);
  const notes = await res.json();

  const notesContainer = document.getElementById("notes");
  notesContainer.innerHTML = "";

  if (!Array.isArray(notes) || notes.length === 0) {
    notesContainer.innerHTML = "<p>No notes found.</p>";
    return;
  }

  notes.forEach(note => {
    const div = document.createElement("div");
    div.classList.add("note");

    // The file URL now correctly points to the Render service base URL
    div.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      ${note.file ? `<a href="${BASE_URL}/uploads/${note.file}" target="_blank">📎 View Attachment</a>` : ""}
      <small>${note.date}</small>
      <div class="note-actions">
        <button onclick="deleteNote('${note.id}')">🗑️ Delete</button>
        <button onclick="editNote('${note.id}', '${note.title}', '${note.content}')">✏️ Edit</button>
      </div>
    `;
    notesContainer.appendChild(div);
  });
}

// ========================= DELETE NOTE =========================
async function deleteNote(id) {
  const username = localStorage.getItem("username");
  const res = await fetch(`${BASE_URL}/deleteNote/${username}/${id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.message);
  loadNotes();
}

// ========================= EDIT NOTE =========================
function editNote(id, oldTitle, oldContent) {
  const title = prompt("Edit Title:", oldTitle);
  const content = prompt("Edit Content:", oldContent);
  if (title === null || content === null) return;
  updateNote(id, title, content);
}

async function updateNote(id, title, content) {
  const username = localStorage.getItem("username");
  const res = await fetch(`${BASE_URL}/editNote/${username}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  alert(data.message);
  loadNotes();
}
