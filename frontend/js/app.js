class Task {
    constructor(title) {
        this.id = crypto.randomUUID();
        this.title = title;
        this.completed = false;
    }
}

const tasks = [];
const addButton = document.querySelector("#add-task");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskTitle = document.querySelector("#task-title");
const cancelButton = document.querySelector("#cancel-task");
const taskGrid = document.querySelector("#task-grid");
const allTasksButton = document.querySelector("#all-tasks");

// Responsible for showing the task dialog.
addButton.addEventListener("click", () => {
    taskDialog.showModal();
    taskTitle.focus();
});

// Responsible for closing the task dialog without adding a new task.
cancelButton.addEventListener("click", () => {
    taskForm.reset();
    taskDialog.close();
});

// Responsible for creating a new task and adding it to the Database.
taskForm.addEventListener("submit", async (event) => {
   event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        taskTitle.focus();
        return;
    }

    const response = await fetch("http://localhost:5000/api/tasks", {
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
    renderTask(newTask);

    taskForm.reset();
    taskDialog.close();
});


function renderTask(task) {
    const taskCard = document.createElement("article");
    taskCard.classList.add("task-card");

    const taskLabel = document.createElement("span");
    taskLabel.classList.add("task-title");
    taskLabel.textContent = task.title;

    const completionCheckbox = document.createElement("input");
    completionCheckbox.type = "checkbox";
    completionCheckbox.checked = task.completed;
    completionCheckbox.setAttribute(
        "aria-label",
        `Mark "${task.title}" as completed`
    );

    taskCard.append(taskLabel, completionCheckbox);
    taskGrid.append(taskCard);
}