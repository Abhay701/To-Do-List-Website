// Global task array
let tasks = [];

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const highPriorityTasks = document.getElementById("highPriorityTasks");
const progressBar = document.getElementById("progressBar");
const modeToggle = document.getElementById("modeToggle");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterButtons = document.querySelectorAll(".filter-btn");

// Modal elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editDueDate = document.getElementById("editDueDate");
const editPriority = document.getElementById("editPriority");
const closeModal = document.getElementById("closeModal");

let currentEditId = null;

// Add Task
todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const task = {
        id: Date.now(),
        title: todoInput.value.trim(),
        description: "",
        dueDate: "",
        priority: "medium",
        completed: false,
        starred: false,
        createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    todoInput.value = "";
    renderTasks();
});

// Render tasks
function renderTasks(filter = "all") {
    todoList.innerHTML = "";
    const filtered = getFilteredTasks(filter);
    const sorted = sortTasks(filtered);

    if (sorted.length === 0) {
        emptyState.style.display = "flex";
    } else {
        emptyState.style.display = "none";
        sorted.forEach((task) => {
            const taskItem = document.createElement("div");
            taskItem.className = `task-item ${task.completed ? "completed" : ""}`;

            taskItem.innerHTML = `
          <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleComplete(${task.id})">
          <span class="task-title">${task.title}</span>
          <span class="badge ${task.priority}">${task.priority}</span>
          <div class="actions">
            <button onclick="openEditModal(${task.id})"><i class="fas fa-edit"></i></button>
            <button onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
          </div>
        `;
            todoList.appendChild(taskItem);
        });
    }

    updateStats();
    updateProgress();
}

// Toggle complete
function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    task.completed = !task.completed;
    renderTasks();
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
}

// Update statistics
function updateStats() {
    totalTasks.textContent = tasks.length;
    completedTasks.textContent = tasks.filter((t) => t.completed).length;
    pendingTasks.textContent = tasks.filter((t) => !t.completed).length;
    highPriorityTasks.textContent = tasks.filter((t) => t.priority === "high").length;
}

// Progress bar update
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : (completed / total) * 100;
    progressBar.style.width = `${percent}%`;
}

// Modal Logic
function openEditModal(id) {
    const task = tasks.find((t) => t.id === id);
    currentEditId = id;
    editTitle.value = task.title;
    editDescription.value = task.description || "";
    editDueDate.value = task.dueDate || "";
    editPriority.value = task.priority;
    editModal.style.display = "flex";
}

closeModal.onclick = () => {
    editModal.style.display = "none";
};

editForm.onsubmit = (e) => {
    e.preventDefault();
    const task = tasks.find((t) => t.id === currentEditId);
    task.title = editTitle.value;
    task.description = editDescription.value;
    task.dueDate = editDueDate.value;
    task.priority = editPriority.value;
    editModal.style.display = "none";
    renderTasks();
};

// Dark Mode Toggle
modeToggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    modeToggle.innerHTML = document.body.classList.contains("dark-mode")
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
};

// Filter Buttons
filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelector(".filter-btn.active").classList.remove("active");
        btn.classList.add("active");
        renderTasks(btn.dataset.filter);
    });
});

// Search
searchInput.addEventListener("input", () => {
    renderTasks(document.querySelector(".filter-btn.active").dataset.filter);
});

// Sort
sortSelect.addEventListener("change", () => {
    renderTasks(document.querySelector(".filter-btn.active").dataset.filter);
});

function getFilteredTasks(filter) {
    let filtered = [...tasks];
    if (filter === "completed") filtered = tasks.filter((t) => t.completed);
    else if (filter === "active") filtered = tasks.filter((t) => !t.completed);
    else if (filter === "high") filtered = tasks.filter((t) => t.priority === "high");
    else if (filter === "starred") filtered = tasks.filter((t) => t.starred);
    return filtered.filter((task) =>
        task.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
}

function sortTasks(taskList) {
    const sort = sortSelect.value;
    if (sort === "alphabetical") {
        return taskList.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "priority") {
        const p = { high: 1, medium: 2, low: 3 };
        return taskList.sort((a, b) => p[a.priority] - p[b.priority]);
    } else if (sort === "dueDate") {
        return taskList.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    } else {
        return taskList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

// Drag & Drop JSON Import
const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    tasks = [...tasks, ...imported.map((t) => ({ ...t, id: Date.now() + Math.random() }))];
                    renderTasks();
                } else {
                    alert("Invalid JSON format.");
                }
            } catch {
                alert("Could not parse the file.");
            }
        };
        reader.readAsText(file);
    } else {
        alert("Please drop a valid JSON file.");
    }
});

// Initial render
renderTasks();
