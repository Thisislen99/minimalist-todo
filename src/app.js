const STORAGE_KEY = "minimalist-todo";

const form = document.getElementById("new-todo");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");

let todos = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.replaceChildren(
    ...todos.map((todo) => {
      const li = document.createElement("li");
      li.className = todo.done ? "done" : "";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `todo-${todo.id}`;
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => update(todo.id, { done: checkbox.checked }));

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = todo.text;

      const del = document.createElement("button");
      del.className = "delete";
      del.type = "button";
      del.setAttribute("aria-label", `Delete "${todo.text}"`);
      del.textContent = "×";
      del.addEventListener("click", () => remove(todo.id));

      li.append(checkbox, label, del);
      return li;
    })
  );

  const remaining = todos.filter((t) => !t.done).length;
  footer.hidden = todos.length === 0;
  count.textContent = `${remaining} left`;
  clearDone.hidden = remaining === todos.length;
}

function update(id, changes) {
  todos = todos.map((t) => (t.id === id ? { ...t, ...changes } : t));
  save();
  render();
}

function remove(id) {
  todos = todos.filter((t) => t.id !== id);
  save();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: crypto.randomUUID(), text, done: false });
  input.value = "";
  save();
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
