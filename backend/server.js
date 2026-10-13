const express = require("express");
const crypto = require("crypto");
const db = require("./db");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Parse JSON request bodies and allow the separately served frontend to call this API.
app.use(express.json());
app.use(cors());

// Return database integer flags as booleans so the API has a consistent task shape.
app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks").all();

    res.json(tasks.map((task) => ({
        ...task,
        completed: Boolean(task.completed)
    })));
});

app.post("/api/tasks", (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    // Generate the ID on the server so it remains stable across clients and reloads.
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

app.patch("/api/tasks/:id", (req, res) => {
    const { completed } = req.body;

    // Reject values other than true/false rather than storing ambiguous completion data.
    if (typeof completed !== "boolean") {
        return res.status(400).json({
            error: "Completed must be a boolean"
        });
    }

    // Store booleans as SQLite integers and report missing task IDs to the caller.
    const result = db.prepare(`
        UPDATE tasks
        SET completed = ?
        WHERE id = ?
    `).run(completed ? 1 : 0, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    const task = db.prepare(`
        SELECT id, title, completed
        FROM tasks
        WHERE id = ?
    `).get(req.params.id);

    res.json({
        ...task,
        completed: Boolean(task.completed)
    });
});

app.delete("/api/tasks/:id", (req, res) => {
    // Delete by ID and report when the requested task does not exist.
    const result = db.prepare(`
        DELETE FROM tasks
        WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    res.status(204).end();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});