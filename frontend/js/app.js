const API_URL = "http://localhost:5000/api/tasks";
// Keep the full task list in memory; the selected filter only affects rendering.
const tasks = [];
// Prevent repeated checkbox changes while that task's save request is in flight.
const pendingTaskUpdates = new Set();
const pendingTaskDeletes = new Set();
let currentFilter = "all";
const addButton = document.querySelector("#add-task");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskTitle = document.querySelector("#task-title");
const cancelButton = document.querySelector("#cancel-task");
const taskGrid = document.querySelector("#task-grid");
const allTasksButton = document.querySelector("#all-tasks");
const activeTasksButton = document.querySelector("#active-tasks");
const completedTasksButton = document.querySelector("#completed-tasks");

const filterButtons = {
    all: allTasksButton,
    active: activeTasksButton,
    completed: completedTasksButton
};

// Recalculate counts and draw only tasks that match the selected filter.
function renderTasks() {
    const activeCount = tasks.filter((task) => !task.completed).length;
    const completedCount = tasks.length - activeCount;

    allTasksButton.textContent = `All (${tasks.length})`;
    activeTasksButton.textContent = `Active (${activeCount})`;
    completedTasksButton.textContent = `Completed (${completedCount})`;

    for (const [filter, button] of Object.entries(filterButtons)) {
        button.setAttribute("aria-pressed", String(currentFilter === filter));
    }

    taskGrid.replaceChildren();

    const visibleTasks = tasks.filter((task) => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    for (const task of visibleTasks) {
        renderTask(task);
    }
}

function setFilter(filter) {
    currentFilter = filter;
    renderTasks();
}

// Open the creation dialog and place the cursor in its title field.
addButton.addEventListener("click", () => {
    taskDialog.showModal();
    taskTitle.focus();
});

// Discard the form contents when the user cancels task creation.
cancelButton.addEventListener("click", () => {
    taskForm.reset();
    taskDialog.close();
});

allTasksButton.addEventListener("click", () => setFilter("all"));
activeTasksButton.addEventListener("click", () => setFilter("active"));
completedTasksButton.addEventListener("click", () => setFilter("completed"));

// Create the task on the server before adding it to the local list.
taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        taskTitle.focus();
        return;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title
        })
    });

    if (!response.ok) {
        console.error("Failed to create task");
        return;
    }

    const newTask = await response.json();
    tasks.push(newTask);
    renderTasks();

    taskForm.reset();
    taskDialog.close();
});

async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Failed to load tasks (${response.status})`);
        }

        // SQLite stores booleans as 0/1, so normalize the API values for the UI.
        tasks.push(...(await response.json()).map((task) => ({
            ...task,
            completed: Boolean(task.completed)
        })));
        renderTasks();
    } catch (error) {
        console.error("Failed to load tasks", error);
    }
}

async function updateTaskCompletion(task, completed) {
    const previousCompleted = task.completed;
    // Update immediately for responsive feedback, then restore if saving fails.
    task.completed = completed;
    pendingTaskUpdates.add(task.id);
    renderTasks();

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(task.id)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ completed })
        });

        if (!response.ok) {
            throw new Error(`Failed to update task (${response.status})`);
        }

        const updatedTask = await response.json();
        task.completed = Boolean(updatedTask.completed);
    } catch (error) {
        task.completed = previousCompleted;
        console.error("Failed to update task", error);
    } finally {
        pendingTaskUpdates.delete(task.id);
        renderTasks();
    }
}

async function deleteTask(task) {
    pendingTaskDeletes.add(task.id);
    renderTasks();

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(task.id)}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`Failed to delete task (${response.status})`);
        }

        const taskIndex = tasks.findIndex((item) => item.id === task.id);
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);
        }
    } catch (error) {
        console.error("Failed to delete task", error);
    } finally {
        pendingTaskDeletes.delete(task.id);
        renderTasks();
    }
}

function renderTask(task) {
    const taskCard = document.createElement("article");
    taskCard.classList.add("task-card");
    if (task.completed) {
        taskCard.classList.add("completed");
    }

    const taskLabel = document.createElement("span");
    taskLabel.classList.add("task-title");
    taskLabel.textContent = task.title;

    const completionCheckbox = document.createElement("input");
    completionCheckbox.type = "checkbox";
    completionCheckbox.checked = task.completed;
    completionCheckbox.disabled =
        pendingTaskUpdates.has(task.id) || pendingTaskDeletes.has(task.id);
    completionCheckbox.setAttribute(
        "aria-label",
        task.completed
            ? `Mark "${task.title}" as active`
            : `Mark "${task.title}" as completed`
    );
    // The change handler saves the new state and redraws counts and visible cards.
    completionCheckbox.addEventListener("change", () => {
        updateTaskCompletion(task, completionCheckbox.checked);
    });

    const taskActions = document.createElement("div");
    taskActions.classList.add("task-actions");
    taskActions.append(completionCheckbox);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.classList.add("delete-task");
    deleteButton.textContent = "Delete";
    deleteButton.disabled =
        pendingTaskUpdates.has(task.id) || pendingTaskDeletes.has(task.id);
    deleteButton.setAttribute("aria-label", `Delete "${task.title}"`);
    deleteButton.addEventListener("click", () => {
        deleteTask(task);
    });
    taskActions.append(deleteButton);

    taskCard.append(taskLabel, taskActions);
    taskGrid.append(taskCard);
}

// Populate the interface from persisted tasks when the page starts.
loadTasks();