const express = require("express");
const crypto = require("crypto");
const db = require("./db");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks").all();

    res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    const id = crypto.randomUUID();

    const statement = db.prepare(`
        INSERT INTO tasks (id, title)
        VALUES (?, ?)
    `);

    statement.run(id, title.trim());

    res.status(201).json({
        id,
        title: title.trim(),
        completed: false
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});