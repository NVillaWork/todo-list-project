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

// Responsible for creating a new task and adding it to our list.
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = taskTitle.value.trim();
    if (!title) {
        taskTitle.focus();
        return;
    }

    const newTask = new Task(title);
    tasks.push(newTask);

    const taskCard = document.createElement("article");
    taskCard.classList.add("task-card");
    const taskLabel = document.createElement("span");
    taskLabel.classList.add("task-title");
    taskLabel.textContent = newTask.title;

    const completionCheckbox = document.createElement("input");
    completionCheckbox.type = "checkbox";
    completionCheckbox.checked = newTask.completed;
    completionCheckbox.setAttribute("aria-label", `Mark "${newTask.title}" as completed`);
    completionCheckbox.addEventListener("change", () => {
        newTask.completed = completionCheckbox.checked;
    });

    taskCard.append(taskLabel, completionCheckbox);
    taskGrid.append(taskCard);
    allTasksButton.textContent = `All (${tasks.length})`;

    taskForm.reset();
    taskDialog.close();
});
