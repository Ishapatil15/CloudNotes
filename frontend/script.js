// 🌐 Base URL of your deployed Render Service
const BASE_URL = "https://cloudnotes-ll4q.onrender.com"; 

// ========================= EVENT HANDLERS (Login/Signup) =========================

async function handleLogin(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    // Get input values using the correct IDs from index.html
    const emailInput = document.getElementById("username").value; 
    const passwordInput = document.getElementById("password").value;

    if (!emailInput || !passwordInput) {
        alert("Please enter both credentials.");
        return; 
    }

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" // Crucial for CORS validation
            },
            body: JSON.stringify({ email: emailInput, password: passwordInput }) 
        });

        const data = await res.json();
        if (res.ok && data.success) {
            localStorage.setItem("username", data.username);
            alert("Login successful!");
            window.location.href = "dashboard.html";
        } else {
            alert(data.message || "Login failed due to invalid credentials.");
        }
    } catch (error) {
        console.error("Fetch Error during Login:", error);
        alert("An error occurred. Check the browser console. Did you Hard Reload?");
    }
}

async function handleSignup(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    const usernameInput = document.getElementById("username").value; 
    const passwordInput = document.getElementById("password").value;
    const emailInput = usernameInput; // Using username as email for simplicity

    if (!usernameInput || !passwordInput) {
        alert("Please enter both username and password.");
        return; 
    }
    
    try {
        const res = await fetch(`${BASE_URL}/signup`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" // Crucial for CORS validation
            },
            body: JSON.stringify({ username: usernameInput, email: emailInput, password: passwordInput })
        });

        const data = await res.json();
        alert(data.message);
        if (res.ok) window.location.href = "index.html";
    } catch (error) {
        console.error("Fetch Error during Signup:", error);
        alert("An error occurred. Did you push and deploy the CORS fix to Render?");
    }
}


// ========================= PAGE INITIALIZATION (Attaches Listeners) =========================

function initializeIndexPage() {
    const loginButton = document.getElementById('loginBtn');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    } else {
        console.error("Login button (id='loginBtn') not found.");
    }

    const signupButton = document.getElementById('signupBtn');
    if (signupButton) {
        signupButton.addEventListener('click', handleSignup);
    } else {
        console.error("Sign Up button (id='signupBtn') not found.");
    }
}

function initializeDashboardPage() {
    loadNotes();
    
    const addNoteForm = document.getElementById('add-note-form'); // Assuming ID is 'add-note-form'
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', addNote);
    }
    
    const logoutButton = document.getElementById('logoutBtn'); // Assuming ID is 'logoutBtn'
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

window.onload = function() {
    if (document.title.includes("Login")) {
        initializeIndexPage();
    }
    if (document.title.includes("Dashboard")) {
        initializeDashboardPage();
    }
};


// ========================= DASHBOARD FUNCTIONS =========================

function logout() {
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

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

async function loadNotes() {
    const username = localStorage.getItem("username");
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

async function deleteNote(id) {
    const username = localStorage.getItem("username");
    const res = await fetch(`${BASE_URL}/deleteNote/${username}/${id}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message);
    loadNotes();
}

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