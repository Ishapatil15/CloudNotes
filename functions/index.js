import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

// For __dirname support in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- RENDER CONFIGURATION ---
// Render uses process.env.PORT, default to 3000 for local testing
const PORT = process.env.PORT || 3000;
// ----------------------------

const app = express();

// ----------------------------------------------------
// !!! CRITICAL FIX: EXPLICIT CORS CONFIGURATION !!!
// Add your live Firebase Hosting URL to the allowed origins.
// ----------------------------------------------------
const allowedOrigins = [
    'https://cloudnotes-df49f.web.app', // Your Live Frontend URL (MUST BE ADDED)
    'http://localhost:3000',           // For Local Testing
    'https://cloudnotes-ll4q.onrender.com' // Your Render Backend URL (Good practice)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or local file access)
        if (!origin) return callback(null, true); 
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies/authorization headers
    optionsSuccessStatus: 204
}));
// ----------------------------------------------------

app.use(express.json());

// File storage setup
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "_" + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// File paths (Relative to the index.js location)
const usersPath = path.join(__dirname, "db", "users.json");
const notesPath = path.join(__dirname, "db", "notes.json");

// Ensure db files exist (important for a file-based DB)
const initializeDB = () => {
    if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, "[]");
    if (!fs.existsSync(notesPath)) fs.writeFileSync(notesPath, "[]");
};
initializeDB();


// --------- LOGIN ----------
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    // **Using synchronous reads here is only suitable for small projects/testing.**
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const user = users.find(u => u.email === email && u.password === password);
    if (user) res.json({ success: true, username: user.username });
    else res.status(401).json({ success: false, message: "Invalid credentials" });
});

// --------- SIGNUP ----------
app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    users.push({ username, email, password });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.json({ success: true, message: "User registered successfully!" });
});

// --------- GET NOTES ----------
app.get("/notes/:username?", (req, res) => {
    const notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
    const { username } = req.params;

    if (username) {
        const userNotes = notes.filter(n => n.username === username);
        res.json(userNotes);
    } else {
        res.json(notes);
    }
});

// --------- ADD NOTE (with file) ----------
app.post("/addNote", upload.single("file"), (req, res) => {
    const { username, title, content } = req.body;
    if (!username || !title || !content) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));

    const note = {
        id: Date.now().toString(),
        username,
        title,
        content,
        date: new Date().toLocaleString(),
        file: req.file ? req.file.filename : null
    };

    notes.push(note);
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
    res.json({ success: true, message: "Note added!" });
});

// --------- DELETE NOTE ----------
app.delete("/deleteNote/:username/:id", (req, res) => {
    const { username, id } = req.params;
    let notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));

    const noteIndex = notes.findIndex(n => n.id === id && n.username === username);
    if (noteIndex === -1) return res.status(404).json({ success: false, message: "Note not found" });

    // delete file if exists
    if (notes[noteIndex].file) {
        const filePath = path.join(uploadsDir, notes[noteIndex].file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    notes.splice(noteIndex, 1);
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
    res.json({ success: true, message: "Note deleted!" });
});

// --------- EDIT NOTE (can update title/content only) ----------
app.put("/editNote/:username/:id", (req, res) => {
    const { username, id } = req.params;
    const { title, content } = req.body;
    let notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));

    const noteIndex = notes.findIndex(n => n.id === id && n.username === username);
    if (noteIndex === -1) return res.status(404).json({ success: false, message: "Note not found" });

    notes[noteIndex].title = title;
    notes[noteIndex].content = content;
    notes[noteIndex].date = new Date().toLocaleString();

    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
    res.json({ success: true, message: "Note updated!" });
});

// --------- Serve uploaded files ----------
app.use("/uploads", express.static(uploadsDir));


// Listen on the port provided by Render
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});