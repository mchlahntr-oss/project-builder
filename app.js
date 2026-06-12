const STORAGE_KEY = 'houseProjectTracker.v1';
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = value => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const moneyExact = value => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const uid = prefix => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
const byDate = value => value ? new Date(`${value}T12:00:00`) : null;
const escapeHTML = str => String(str ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

const starterData = {
  projects: [
    {
      id: 'proj_pa',
      name: 'Pennsylvania House',
      location: 'Manns Choice / Bedford area',
      budget: 12000,
      goal: '',
      notes: 'Short-term rental readiness, cedar hot tub work, cabinet painting, basement cleanup, guest setup.'
    },
    {
      id: 'proj_logan',
      name: 'Logan House',
      location: 'Logan, Ohio',
      budget: 6500,
      goal: '',
      notes: 'Potential Airbnb readiness, home theater updates, repairs, guest-friendly setup.'
    },
    {
      id: 'proj_general',
      name: 'General House Admin',
      location: 'Both properties',
      budget: 2500,
      goal: '',
      notes: 'Insurance, supplies, utilities, photos, listing details, punch-list planning.'
    }
  ],
  tasks: [
    { id: 'task_1', projectId: 'proj_pa', title: 'Finish painting cabinet doors', area: 'Kitchen', priority: 'High', status: 'In progress', due: '', notes: 'Finish remaining doors and touch-ups before staging.' },
    { id: 'task_2', projectId: 'proj_pa', title: 'Install cedar hot tub vinyl liner', area: 'Hot tub', priority: 'High', status: 'Not started', due: '', notes: 'Remove or work around bench as needed; inspect surface before liner install.' },
    { id: 'task_3', projectId: 'proj_pa', title: 'Add basement door lock', area: 'Basement', priority: 'Medium', status: 'Not started', due: '', notes: 'Needed before guests have access to the property.' },
    { id: 'task_4', projectId: 'proj_pa', title: 'Paint basement ceiling and TV wall', area: 'Basement', priority: 'Medium', status: 'Not started', due: '', notes: 'Prep area, tape, paint, then inspect lighting.' },
    { id: 'task_5', projectId: 'proj_pa', title: 'Declutter and stage main rooms', area: 'Whole house', priority: 'High', status: 'In progress', due: '', notes: 'Prioritize photo-facing spaces first.' },
    { id: 'task_6', projectId: 'proj_pa', title: 'Build Airbnb room-by-room item list', area: 'STR setup', priority: 'High', status: 'Not started', due: '', notes: 'Kitchen, bedrooms, bathrooms, entry, laundry, outdoor/hot tub area.' },
    { id: 'task_7', projectId: 'proj_logan', title: 'Finish black theater wall and slat detail', area: 'Theater room', priority: 'Medium', status: 'Not started', due: '', notes: 'Dark walnut slats with clean spacing.' },
    { id: 'task_8', projectId: 'proj_logan', title: 'Check guest readiness for Airbnb option', area: 'Whole house', priority: 'Medium', status: 'Not started', due: '', notes: 'List gaps in furniture, locks, linens, cleaning, parking, and photos.' },
    { id: 'task_9', projectId: 'proj_general', title: 'Create photo checklist for both properties', area: 'Listings', priority: 'Medium', status: 'Not started', due: '', notes: 'Exterior, main rooms, bedrooms, bathrooms, amenities, parking, local attractions.' }
  ],
  expenses: [
    { id: 'exp_1', projectId: 'proj_pa', title: 'Paint and supplies', amount: 185, date: todayISO(), category: 'Materials', paid: true, vendor: 'Estimated starter entry' },
    { id: 'exp_2', projectId: 'proj_pa', title: 'Hot tub liner allowance', amount: 650, date: todayISO(), category: 'Materials', paid: false, vendor: 'Planned' },
    { id: 'exp_3', projectId: 'proj_logan', title: 'Theater wall materials', amount: 250, date: todayISO(), category: 'Materials', paid: false, vendor: 'Planned' }
  ],
  activeProjectId: 'all',
  activeTaskFilter: 'Open',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

let state = loadState();
let route = 'dashboard';

const app = document.getElementById('app');
const screenTitle = document.getElementById('screenTitle');
const taskDialog = document.getElementById('taskDialog');
const projectDialog = document.getElementById('projectDialog');
const expenseDialog = document.getElementById('expenseDialog');
const settingsDialog = document.getElementById('settingsDialog');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(starterData);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(starterData),
      ...parsed,
      projects: parsed.projects?.length ? parsed.projects : starterData.projects,
      tasks: parsed.tasks || [],
      expenses: parsed.expenses || []
    };
  } catch (error) {
    console.warn('Unable to load data. Resetting starter data.', error);
    return structuredClone(starterData);
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function projectById(id) {
  return state.projects.find(project => project.id === id) || { name: 'Unknown project', location: '' };
}

function filteredTasks() {
  let tasks = [...state.tasks];
  if (state.activeProjectId !== 'all') tasks = tasks.filter(task => task.projectId === state.activeProjectId);

  switch (state.activeTaskFilter) {
    case 'This week':
      return tasks.filter(task => task.status !== 'Done' && (isDueWithin(task.due, 7) || task.priority === 'High'));
    case 'High':
      return tasks.filter(task => task.status !== 'Done' && task.priority === 'High');
    case 'Blocked':
      return tasks.filter(task => task.status === 'Blocked');
    case 'Done':
      return tasks.filter(task => task.status === 'Done');
    case 'Open':
    default:
      return tasks.filter(task => task.status !== 'Done');
  }
}

function isDueWithin(dateString, days) {
  if (!dateString) return false;
  const target = byDate(dateString);
  const today = byDate(todayISO());
  const diff = (target - today) / (1000 * 60 * 60 * 24);
  return diff <= days && diff >= 0;
}

function overdue(dateString) {
  if (!dateString) return false;
  const target = byDate(dateString);
  const today = byDate(todayISO());
  return target < today;
}

function getStats(projectId = 'all') {
  const tasks = projectId === 'all' ? state.tasks : state.tasks.filter(task => task.projectId === projectId);
  const expenses = projectId === 'all' ? state.expenses : state.expenses.filter(expense => expense.projectId === projectId);
  const total = tasks.length;
  const done = tasks.filter(task => task.status === 'Done').length;
  const blocked = tasks.filter(task => task.status === 'Blocked').length;
  const open = tasks.filter(task => task.status !== 'Done').length;
  const high = tasks.filter(task => task.status !== 'Done' && task.priority === 'High').length;
  const dueSoon = tasks.filter(task => task.status !== 'Done' && (isDueWithin(task.due, 7) || overdue(task.due))).length;
  const spent = expenses.filter(expense => expense.paid).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const planned = expenses.filter(expense => !expense.paid).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const budget = projectId === 'all'
    ? state.projects.reduce((sum, project) => sum + Number(project.budget || 0), 0)
    : Number(projectById(projectId).budget || 0);
  const progress = total ? Math.round((done / total) * 100) : 0;
  return { total, done, blocked, open, high, dueSoon, spent, planned, budget, progress };
}

function render() {
  saveState();
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
  const routeTitles = { dashboard: 'Dashboard', tasks: 'Tasks', projects: 'Projects', budget: 'Budget', add: 'Add item' };
  screenTitle.textContent = routeTitles[route] || 'Dashboard';

  if (route === 'dashboard') renderDashboard();
  if (route === 'tasks') renderTasks();
  if (route === 'projects') renderProjects();
  if (route === 'budget') renderBudget();
  if (route === 'add') renderAdd();
}

function renderDashboard() {
  const stats = getStats();
  const priorityTasks = state.tasks
    .filter(task => task.status !== 'Done')
    .sort(taskSort)
    .slice(0, 5);

  app.innerHTML = `
    <section class="card hero">
      <h2>${stats.open} open house tasks</h2>
      <p>${stats.high} high priority, ${stats.dueSoon} due soon or overdue, ${stats.blocked} blocked.</p>
      <div class="stat-row">
        <div class="stat"><strong>${stats.progress}%</strong><span>complete</span></div>
        <div class="stat"><strong>${money(stats.spent)}</strong><span>spent</span></div>
        <div class="stat"><strong>${money(stats.planned)}</strong><span>planned</span></div>
      </div>
    </section>

    <section class="section-head">
      <h2>Fast actions</h2>
    </section>
    <div class="quick-actions">
      <button class="primary" data-action="new-task">Add task</button>
      <button class="secondary" data-action="new-expense">Add expense</button>
      <button class="secondary" data-action="new-project">Add project</button>
      <button class="secondary" data-route-jump="tasks">View tasks</button>
    </div>

    <section class="section-head">
      <h2>Priority this week</h2>
      <p class="muted">Top 5</p>
    </section>
    <div class="grid">${priorityTasks.length ? priorityTasks.map(taskCard).join('') : emptyState('No priority tasks yet', 'High-priority and due-soon items will appear here.')}</div>

    <section class="section-head">
      <h2>Projects</h2>
      <p class="muted">Progress</p>
    </section>
    <div class="grid">${state.projects.map(projectCard).join('')}</div>
  `;
}

function renderTasks() {
  const tasks = filteredTasks().sort(taskSort);
  app.innerHTML = `
    ${projectFilters()}
    <div class="filters" aria-label="Task filters">
      ${['Open', 'This week', 'High', 'Blocked', 'Done'].map(filter => `<button class="chip ${state.activeTaskFilter === filter ? 'active' : ''}" data-task-filter="${filter}">${filter}</button>`).join('')}
    </div>
    <section class="section-head">
      <h2>${state.activeTaskFilter} tasks</h2>
      <button class="primary" data-action="new-task">Add task</button>
    </section>
    <div class="grid">${tasks.length ? tasks.map(taskCard).join('') : emptyState('No tasks match this view', 'Change the filter or add a new task.')}</div>
  `;
}

function renderProjects() {
  app.innerHTML = `
    <section class="section-head">
      <h2>House projects</h2>
      <button class="primary" data-action="new-project">Add</button>
    </section>
    <div class="grid">${state.projects.length ? state.projects.map(projectCard).join('') : emptyState('No projects yet', 'Add your first property or renovation project.')}</div>
  `;
}

function renderBudget() {
  const stats = getStats(state.activeProjectId);
  const expenses = state.expenses
    .filter(expense => state.activeProjectId === 'all' || expense.projectId === state.activeProjectId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const remaining = stats.budget - stats.spent - stats.planned;

  app.innerHTML = `
    ${projectFilters()}
    <section class="card">
      <h2>Budget snapshot</h2>
      <div class="kpi-list">
        <div class="kpi-item"><span class="muted">Target budget</span><strong>${money(stats.budget)}</strong></div>
        <div class="kpi-item"><span class="muted">Paid spend</span><strong>${money(stats.spent)}</strong></div>
        <div class="kpi-item"><span class="muted">Planned spend</span><strong>${money(stats.planned)}</strong></div>
        <div class="kpi-item"><span class="muted">Remaining after planned</span><strong class="amount ${remaining < 0 ? 'negative' : ''}">${money(remaining)}</strong></div>
      </div>
    </section>
    <section class="section-head">
      <h2>Expenses</h2>
      <button class="primary" data-action="new-expense">Add expense</button>
    </section>
    <div class="grid">${expenses.length ? expenses.map(expenseCard).join('') : emptyState('No expenses yet', 'Track materials, labor, furniture, utilities, and other house costs.')}</div>
  `;
}

function renderAdd() {
  app.innerHTML = `
    <section class="card">
      <h2>Add something</h2>
      <p class="muted">Use this to keep project work, spending, and property details in one place.</p>
      <div class="stack">
        <button class="primary" data-action="new-task">Add task</button>
        <button class="secondary" data-action="new-expense">Add expense</button>
        <button class="secondary" data-action="new-project">Add project</button>
      </div>
    </section>
    <section class="card">
      <h2>Recommended setup</h2>
      <div class="kpi-list">
        <div class="kpi-item"><span>Use projects for each property</span><strong>PA / Logan</strong></div>
        <div class="kpi-item"><span>Use areas for rooms or systems</span><strong>Kitchen, hot tub</strong></div>
        <div class="kpi-item"><span>Use priority for weekly planning</span><strong>High first</strong></div>
        <div class="kpi-item"><span>Export a backup weekly</span><strong>JSON</strong></div>
      </div>
    </section>
  `;
}

function projectFilters() {
  return `
    <div class="filters" aria-label="Project filters">
      <button class="chip ${state.activeProjectId === 'all' ? 'active' : ''}" data-project-filter="all">All houses</button>
      ${state.projects.map(project => `<button class="chip ${state.activeProjectId === project.id ? 'active' : ''}" data-project-filter="${project.id}">${escapeHTML(project.name)}</button>`).join('')}
    </div>
  `;
}

function projectCard(project) {
  const stats = getStats(project.id);
  const spentPlusPlanned = stats.spent + stats.planned;
  return `
    <article class="card project-card" data-project-id="${project.id}">
      <div class="project-top">
        <div>
          <h3 class="project-title">${escapeHTML(project.name)}</h3>
          <p class="muted small">${escapeHTML(project.location || 'No location set')}</p>
        </div>
        <button class="ghost" data-action="edit-project" data-id="${project.id}">Edit</button>
      </div>
      <div>
        <div class="progress-track"><div class="progress-fill" style="width:${stats.progress}%"></div></div>
      </div>
      <div class="meta-row">
        <span class="pill">${stats.progress}% complete</span>
        <span class="pill">${stats.open} open</span>
        <span class="pill high">${stats.high} high</span>
        <span class="pill">${money(spentPlusPlanned)} / ${money(stats.budget)}</span>
      </div>
      ${project.notes ? `<p class="muted">${escapeHTML(project.notes)}</p>` : ''}
    </article>
  `;
}

function taskCard(task) {
  const project = projectById(task.projectId);
  const statusClass = task.status === 'Done' ? 'done' : task.status === 'Blocked' ? 'blocked' : '';
  const dueCopy = task.due ? `${overdue(task.due) && task.status !== 'Done' ? 'Overdue: ' : 'Due: '}${formatDate(task.due)}` : 'No due date';
  return `
    <article class="card task-card" data-task-id="${task.id}">
      <button class="check-btn ${task.status === 'Done' ? 'checked' : ''}" data-action="toggle-task" data-id="${task.id}" aria-label="Toggle done">✓</button>
      <div>
        <h3>${escapeHTML(task.title)}</h3>
        <p class="muted small">${escapeHTML(project.name)}${task.area ? ` · ${escapeHTML(task.area)}` : ''}</p>
        <div class="meta-row">
          <span class="pill ${task.priority.toLowerCase()}">${task.priority}</span>
          <span class="pill ${statusClass}">${task.status}</span>
          <span class="pill ${overdue(task.due) && task.status !== 'Done' ? 'blocked' : ''}">${dueCopy}</span>
        </div>
        ${task.notes ? `<p class="muted">${escapeHTML(task.notes)}</p>` : ''}
      </div>
      <div class="task-actions">
        <button class="ghost" data-action="edit-task" data-id="${task.id}">Edit</button>
      </div>
    </article>
  `;
}

function expenseCard(expense) {
  const project = projectById(expense.projectId);
  return `
    <article class="card expense-card" data-expense-id="${expense.id}">
      <div class="pill ${expense.paid ? 'done' : 'medium'}">${expense.paid ? 'Paid' : 'Planned'}</div>
      <div>
        <h3>${escapeHTML(expense.title)}</h3>
        <p class="muted small">${escapeHTML(project.name)} · ${escapeHTML(expense.category || 'Other')} · ${formatDate(expense.date)}</p>
        <div class="meta-row">
          <span class="pill">${escapeHTML(expense.vendor || 'No vendor')}</span>
        </div>
      </div>
      <div class="expense-actions">
        <div class="amount">${moneyExact(expense.amount)}</div>
        <button class="ghost" data-action="edit-expense" data-id="${expense.id}">Edit</button>
      </div>
    </article>
  `;
}

function emptyState(title, body) {
  return `
    <section class="empty-state">
      <div class="empty-icon">⌂</div>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(body)}</p>
    </section>
  `;
}

function taskSort(a, b) {
  const priority = { High: 0, Medium: 1, Low: 2 };
  const status = { Blocked: 0, 'In progress': 1, 'Not started': 2, Done: 3 };
  const aDue = a.due || '9999-12-31';
  const bDue = b.due || '9999-12-31';
  return (priority[a.priority] - priority[b.priority]) || aDue.localeCompare(bDue) || (status[a.status] - status[b.status]) || a.title.localeCompare(b.title);
}

function formatDate(dateString) {
  if (!dateString) return 'No date';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(byDate(dateString));
}

function populateProjectSelect(select) {
  select.innerHTML = state.projects.map(project => `<option value="${project.id}">${escapeHTML(project.name)}</option>`).join('');
}

function openTaskForm(id = null) {
  populateProjectSelect(document.getElementById('taskProject'));
  const task = id ? state.tasks.find(item => item.id === id) : null;
  document.getElementById('taskFormTitle').textContent = task ? 'Edit task' : 'Add task';
  document.getElementById('taskId').value = task?.id || '';
  document.getElementById('taskTitle').value = task?.title || '';
  document.getElementById('taskProject').value = task?.projectId || (state.activeProjectId !== 'all' ? state.activeProjectId : state.projects[0]?.id || '');
  document.getElementById('taskArea').value = task?.area || '';
  document.getElementById('taskPriority').value = task?.priority || 'Medium';
  document.getElementById('taskStatus').value = task?.status || 'Not started';
  document.getElementById('taskDue').value = task?.due || '';
  document.getElementById('taskNotes').value = task?.notes || '';
  document.getElementById('deleteTask').classList.toggle('hidden', !task);
  taskDialog.showModal();
}

function openProjectForm(id = null) {
  const project = id ? state.projects.find(item => item.id === id) : null;
  document.getElementById('projectFormTitle').textContent = project ? 'Edit project' : 'Add project';
  document.getElementById('projectId').value = project?.id || '';
  document.getElementById('projectName').value = project?.name || '';
  document.getElementById('projectLocation').value = project?.location || '';
  document.getElementById('projectBudget').value = project?.budget || '';
  document.getElementById('projectGoal').value = project?.goal || '';
  document.getElementById('projectNotes').value = project?.notes || '';
  document.getElementById('deleteProject').classList.toggle('hidden', !project);
  projectDialog.showModal();
}

function openExpenseForm(id = null) {
  populateProjectSelect(document.getElementById('expenseProject'));
  const expense = id ? state.expenses.find(item => item.id === id) : null;
  document.getElementById('expenseFormTitle').textContent = expense ? 'Edit expense' : 'Add expense';
  document.getElementById('expenseId').value = expense?.id || '';
  document.getElementById('expenseTitle').value = expense?.title || '';
  document.getElementById('expenseAmount').value = expense?.amount || '';
  document.getElementById('expenseDate').value = expense?.date || todayISO();
  document.getElementById('expenseProject').value = expense?.projectId || (state.activeProjectId !== 'all' ? state.activeProjectId : state.projects[0]?.id || '');
  document.getElementById('expenseCategory').value = expense?.category || 'Materials';
  document.getElementById('expensePaid').value = String(expense?.paid ?? true);
  document.getElementById('expenseVendor').value = expense?.vendor || '';
  document.getElementById('deleteExpense').classList.toggle('hidden', !expense);
  expenseDialog.showModal();
}

app.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  const routeButton = event.target.closest('[data-route-jump]');
  const projectFilter = event.target.closest('[data-project-filter]');
  const taskFilter = event.target.closest('[data-task-filter]');

  if (routeButton) {
    route = routeButton.dataset.routeJump;
    render();
    return;
  }

  if (projectFilter) {
    state.activeProjectId = projectFilter.dataset.projectFilter;
    render();
    return;
  }

  if (taskFilter) {
    state.activeTaskFilter = taskFilter.dataset.taskFilter;
    render();
    return;
  }

  if (!actionButton) return;
  const { action, id } = actionButton.dataset;

  if (action === 'new-task') openTaskForm();
  if (action === 'edit-task') openTaskForm(id);
  if (action === 'toggle-task') {
    const task = state.tasks.find(item => item.id === id);
    if (task) task.status = task.status === 'Done' ? 'Not started' : 'Done';
    render();
  }
  if (action === 'new-project') openProjectForm();
  if (action === 'edit-project') openProjectForm(id);
  if (action === 'new-expense') openExpenseForm();
  if (action === 'edit-expense') openExpenseForm(id);
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    route = btn.dataset.route;
    render();
  });
});

document.getElementById('taskForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = document.getElementById('taskId').value || uid('task');
  const payload = {
    id,
    title: document.getElementById('taskTitle').value.trim(),
    projectId: document.getElementById('taskProject').value,
    area: document.getElementById('taskArea').value.trim(),
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    due: document.getElementById('taskDue').value,
    notes: document.getElementById('taskNotes').value.trim()
  };
  const index = state.tasks.findIndex(task => task.id === id);
  if (index >= 0) state.tasks[index] = payload;
  else state.tasks.unshift(payload);
  taskDialog.close();
  render();
});

document.getElementById('projectForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = document.getElementById('projectId').value || uid('proj');
  const payload = {
    id,
    name: document.getElementById('projectName').value.trim(),
    location: document.getElementById('projectLocation').value.trim(),
    budget: Number(document.getElementById('projectBudget').value || 0),
    goal: document.getElementById('projectGoal').value,
    notes: document.getElementById('projectNotes').value.trim()
  };
  const index = state.projects.findIndex(project => project.id === id);
  if (index >= 0) state.projects[index] = payload;
  else state.projects.unshift(payload);
  projectDialog.close();
  render();
});

document.getElementById('expenseForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = document.getElementById('expenseId').value || uid('exp');
  const payload = {
    id,
    title: document.getElementById('expenseTitle').value.trim(),
    amount: Number(document.getElementById('expenseAmount').value || 0),
    date: document.getElementById('expenseDate').value || todayISO(),
    projectId: document.getElementById('expenseProject').value,
    category: document.getElementById('expenseCategory').value,
    paid: document.getElementById('expensePaid').value === 'true',
    vendor: document.getElementById('expenseVendor').value.trim()
  };
  const index = state.expenses.findIndex(expense => expense.id === id);
  if (index >= 0) state.expenses[index] = payload;
  else state.expenses.unshift(payload);
  expenseDialog.close();
  render();
});

document.getElementById('deleteTask').addEventListener('click', () => {
  const id = document.getElementById('taskId').value;
  if (!id || !confirm('Delete this task?')) return;
  state.tasks = state.tasks.filter(task => task.id !== id);
  taskDialog.close();
  render();
});

document.getElementById('deleteProject').addEventListener('click', () => {
  const id = document.getElementById('projectId').value;
  if (!id || !confirm('Delete this project and its tasks/expenses?')) return;
  state.projects = state.projects.filter(project => project.id !== id);
  state.tasks = state.tasks.filter(task => task.projectId !== id);
  state.expenses = state.expenses.filter(expense => expense.projectId !== id);
  if (state.activeProjectId === id) state.activeProjectId = 'all';
  projectDialog.close();
  render();
});

document.getElementById('deleteExpense').addEventListener('click', () => {
  const id = document.getElementById('expenseId').value;
  if (!id || !confirm('Delete this expense?')) return;
  state.expenses = state.expenses.filter(expense => expense.id !== id);
  expenseDialog.close();
  render();
});

document.getElementById('openSettings').addEventListener('click', () => settingsDialog.showModal());
document.getElementById('closeSettings').addEventListener('click', () => settingsDialog.close());

document.getElementById('exportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `house-project-backup-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importData').addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.projects) || !Array.isArray(imported.tasks) || !Array.isArray(imported.expenses)) {
        throw new Error('Invalid backup format');
      }
      state = { ...structuredClone(starterData), ...imported };
      settingsDialog.close();
      render();
    } catch (error) {
      alert('That backup file could not be imported.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('resetData').addEventListener('click', () => {
  if (!confirm('Reset the app to starter data? This will overwrite data on this device.')) return;
  state = structuredClone(starterData);
  settingsDialog.close();
  render();
});

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js?v=12').then(registration => {
      registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }).catch(console.warn);
  });
}


function updateViewportDiagnostics() {
  const el = document.getElementById('viewportDebug');
  if (!el) return;
  const shell = document.querySelector('.app-shell');
  const nav = document.querySelector('.bottom-nav');
  const shellRect = shell ? shell.getBoundingClientRect() : null;
  const navRect = nav ? nav.getBoundingClientRect() : null;
  const navStyle = nav ? getComputedStyle(nav) : null;
  const visual = window.visualViewport ? Math.round(window.visualViewport.height) : 'n/a';
  const inner = Math.round(window.innerHeight || 0);
  const client = Math.round(document.documentElement.clientHeight || 0);
  const navHeight = navRect ? Math.round(navRect.height) : 'n/a';
  const navBottom = navRect ? Math.round(navRect.bottom) : 'n/a';
  const shellBottom = shellRect ? Math.round(shellRect.bottom) : 'n/a';
  const paddingBottom = navStyle ? navStyle.paddingBottom : 'n/a';
  el.textContent = `Viewport: inner ${inner}px · visual ${visual}px · client ${client}px · nav ${navHeight}px · nav bottom ${navBottom}px · shell bottom ${shellBottom}px · nav pad ${paddingBottom}`;
}

['load', 'resize', 'orientationchange', 'pageshow'].forEach(eventName => {
  window.addEventListener(eventName, () => setTimeout(updateViewportDiagnostics, 80));
});
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(updateViewportDiagnostics, 80));
setTimeout(updateViewportDiagnostics, 250);

render();
