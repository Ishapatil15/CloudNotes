// 🌐 Base URL of your deployed Render Service
const BASE_URL = "https://cloudnotes-ll4q.onrender.com"; 

// ========================= EVENT HANDLERS =========================

// Function to handle the actual login process
async function handleLogin(event) {
    // Check if the event object exists before calling preventDefault()
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    // Get input values using the correct IDs from index.html
    const emailInput = document.getElementById("username").value; // Assuming 'username' ID is used for email/username
    const passwordInput = document.getElementById("password").value;

    if (!emailInput || !passwordInput) {
        return alert("Please enter both credentials.");
    }

    // API Call
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend expects 'email' and 'password'. We're sending the same value for simplicity.
        body: JSON.stringify({ email: emailInput, password: passwordInput }) 
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


// Function to handle the actual signup process
async function handleSignup(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    // Get input values using the correct IDs from index.html
    const usernameInput = document.getElementById("username").value; 
    const passwordInput = document.getElementById("password").value;
    
    // For signup, we send the same value for both username and email for simplicity,
    // as your backend requires both.
    const emailInput = usernameInput; 

    if (!usernameInput || !passwordInput) {
        return alert("Please enter both username and password.");
    }
    
    // API Call
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, email: emailInput, password: passwordInput })
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "index.html";
}


// ========================= ATTACH LISTENERS (THE CRITICAL MISSING PIECE) =========================

function initializeIndexPage() {
    // 1. Attach listener for the Login button
    const loginButton = document.getElementById('loginBtn');
    if (loginButton) {
        // We use an anonymous function here to call handleLogin, just in case 
        // the button is inside a form which would need the 'event' object.
        loginButton.addEventListener('click', handleLogin);
    } else {
        console.error("Login button (id='loginBtn') not found. Listeners not attached.");
    }

    // 2. Attach listener for the Sign Up button
    const signupButton = document.getElementById('signupBtn');
    if (signupButton) {
        signupButton.addEventListener('click', handleSignup);
    } else {
        console.error("Sign Up button (id='signupBtn') not found. Listeners not attached.");
    }
}

function initializeDashboardPage() {
    loadNotes();
    // Attach listener for the Add Note form submission on dashboard.html
    const addNoteForm = document.getElementById('add-note-form'); // Assuming you have an ID 'add-note-form' on the dashboard form
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', addNote);
    }
    
    // Set up logout button listener (assuming button has id='logoutBtn' on dashboard.html)
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}


// ========================= PAGE INITIALIZATION =========================
// This runs once the entire HTML is loaded
window.onload = function() {
    if (document.title.includes("Login")) {
        initializeIndexPage();
    }
    if (document.title.includes("Dashboard")) {
        initializeDashboardPage();
    }
};


// ========================= REMAINING DASHBOARD FUNCTIONS =========================

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
    // Ensure we are on dashboard and logged in
    if (document.title.includes("Dashboard") && !username) {
        return window.location.href = "index.html";
    }
    if (!username) return;

    const res = await fetch(`${BASE_URL}/notes/${username}`);
    const notes = await res.json();

    const notesContainer = document.getElementById("notes");
    if (!notesContainer) return;

    notesContainer.innerHTML = "";

    if (!Array.isArray(notes) || notes.length === 0) {
        notesContainer.innerHTML = "<p>No notes found.</p>";
        return;
    }

    notes.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note");

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