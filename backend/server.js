import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const port = 5000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// File upload setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// JSON database (stored in backend/db/users.json)
const usersFile = path.join(__dirname, "db", "users.json");

function getUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// ✅ SIGNUP
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  users.push({ username, password, notes: [] });
  saveUsers(users);
  res.json({ message: "Signup successful" });
});

// ✅ LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login successful", username });
});

// ✅ ADD NOTE
app.post("/addNote", upload.single("file"), (req, res) => {
  const { username, title, content } = req.body;
  const file = req.file ? req.file.filename : null;

  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  const note = {
    id: Date.now(),
    title,
    content,
    file,
    date: new Date().toLocaleString(),
  };

  user.notes.push(note);
  saveUsers(users);
  res.json({ message: "Note added successfully", note });
});

// ✅ GET NOTES
app.get("/notes/:username", (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.username === req.params.username);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.notes);
});

// ✅ DELETE NOTE
app.delete("/deleteNote/:username/:id", (req, res) => {
  const { username, id } = req.params;
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.notes = user.notes.filter((note) => note.id != id);
  saveUsers(users);
  res.json({ message: "Note deleted" });
});

// ✅ EDIT NOTE
app.put("/editNote/:username/:id", (req, res) => {
  const { username, id } = req.params;
  const { title, content } = req.body;
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  const note = user.notes.find((n) => n.id == id);
  if (!note) return res.status(404).json({ message: "Note not found" });

  note.title = title;
  note.content = content;
  saveUsers(users);
  res.json({ message: "Note updated" });
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
