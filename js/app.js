/* ============================================================
   LIFE DASHBOARD — app.js
   Features: Greeting + Custom Name · Light/Dark Mode ·
             Focus Timer · Tasks (with duplicate check) ·
             Quick Links · Toast
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ===========================================================
     TOAST (declared first so other sections can call it)
     =========================================================== */

  let toastTimer = null;

  function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 250);
    }, duration);
  }


  /* ===========================================================
     LIGHT / DARK MODE
     =========================================================== */

  const themeToggle = document.getElementById('theme-toggle');
  const THEME_KEY   = 'dashboard_theme';

  // Apply saved theme on load
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '\u2600\uFE0F'; // sun emoji
  }

  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    themeToggle.textContent = isLight ? '\u2600\uFE0F' : '\uD83C\uDF19';
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    showToast(isLight ? 'Switched to light mode' : 'Switched to dark mode');
  });


  /* ===========================================================
     GREETING + CUSTOM NAME
     =========================================================== */

  const greetingMsg  = document.getElementById('greeting-msg');
  const greetingDate = document.getElementById('greeting-date');
  const greetingTime = document.getElementById('greeting-time');
  const editNameBtn  = document.getElementById('edit-name-btn');

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const NAME_KEY = 'dashboard_name';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getGreetingBase(hour) {
    if (hour >= 5  && hour <= 11) return 'Good morning \u2600\uFE0F';
    if (hour >= 12 && hour <= 17) return 'Good afternoon \uD83C\uDF24\uFE0F';
    if (hour >= 18 && hour <= 21) return 'Good evening \uD83C\uDF06';
    return 'Good night \uD83C\uDF19';
  }

  function updateGreeting() {
    const now  = new Date();
    const hour = now.getHours();

    // Clock
    greetingTime.textContent =
      `${pad(hour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Date
    greetingDate.textContent =
      `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

    // Greeting with optional name
    const name = localStorage.getItem(NAME_KEY) || '';
    const base = getGreetingBase(hour);
    greetingMsg.textContent = name ? `${base}, ${name}` : base;
  }

  // Click greeting text to set / change name
  function promptForName() {
    const current = localStorage.getItem(NAME_KEY) || '';
    const input   = prompt('What is your name?', current);
    if (input === null) return;           // cancelled
    const trimmed = input.trim();
    if (trimmed) {
      localStorage.setItem(NAME_KEY, trimmed);
      showToast(`Hey, ${trimmed}! \uD83D\uDC4B`);
    } else {
      localStorage.removeItem(NAME_KEY);
      showToast('Name cleared');
    }
    updateGreeting();
  }

  greetingMsg.addEventListener('click', promptForName);
  editNameBtn.addEventListener('click', promptForName);

  updateGreeting();
  setInterval(updateGreeting, 1000);


  /* ===========================================================
     FOCUS TIMER
     =========================================================== */

  const timerDisplay = document.getElementById('timer-display');
  const timerStart   = document.getElementById('timer-start');
  const timerStop    = document.getElementById('timer-stop');
  const timerReset   = document.getElementById('timer-reset');
  const timerLabel   = document.getElementById('timer-label');

  let timerSeconds  = 25 * 60;
  let timerInterval = null;
  let isRunning     = false;

  function formatTime(secs) {
    return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
  }

  function setTimerClasses(...classes) {
    timerDisplay.classList.remove('running', 'warning', 'finished');
    classes.forEach(c => c && timerDisplay.classList.add(c));
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
  }

  timerStart.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timerStart.disabled = true;
    timerStop.disabled  = false;
    timerLabel.textContent = 'Focusing...';
    setTimerClasses('running');

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();

      if (timerSeconds < 60 && timerSeconds > 0) {
        setTimerClasses('warning');
      }

      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        timerStart.disabled = false;
        timerStop.disabled  = true;
        setTimerClasses('finished');
        timerLabel.textContent = 'Session complete! \uD83C\uDF89';
        showToast('Focus session complete! \uD83C\uDF89', 3500);
      }
    }, 1000);
  });

  timerStop.addEventListener('click', () => {
    if (!isRunning) return;
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    timerStart.disabled = false;
    timerStop.disabled  = true;
    timerLabel.textContent = 'Paused';
    timerDisplay.classList.remove('running', 'warning');
  });

  timerReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    timerSeconds = 25 * 60;
    updateTimerDisplay();
    timerStart.disabled = false;
    timerStop.disabled  = true;
    timerLabel.textContent = 'Ready to focus?';
    setTimerClasses();
  });

  updateTimerDisplay();
  timerStop.disabled = true;


  /* ===========================================================
     TASKS  (with duplicate prevention)
     =========================================================== */

  const taskInput    = document.getElementById('task-input');
  const addTaskBtn   = document.getElementById('add-task-btn');
  const taskList     = document.getElementById('task-list');
  const taskEmpty    = document.getElementById('task-empty');
  const taskCount    = document.getElementById('task-count');
  const activeCount  = document.getElementById('active-count');
  const clearDoneBtn = document.getElementById('clear-done-btn');
  const filterTabs   = document.querySelectorAll('.tab');

  const TASKS_KEY   = 'dashboard_tasks';
  let tasks         = [];
  let currentFilter = 'all';

  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveTasks() {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }
    catch (e) { /* silent fail */ }
  }

  function getFilteredTasks() {
    if (currentFilter === 'active')    return tasks.filter(t => !t.done);
    if (currentFilter === 'completed') return tasks.filter(t => t.done);
    return tasks;
  }

  function renderTasks() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      taskEmpty.classList.remove('hidden');
    } else {
      taskEmpty.classList.add('hidden');
      filtered.forEach(task => taskList.appendChild(buildTaskItem(task)));
    }

    const total  = tasks.length;
    const active = tasks.filter(t => !t.done).length;
    taskCount.textContent   = `${total} task${total !== 1 ? 's' : ''}`;
    activeCount.textContent = `${active} task${active !== 1 ? 's' : ''} left`;
  }

  function buildTaskItem(task) {
    const li = document.createElement('li');
    li.className  = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked   = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'active' : 'done'}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;

    const actions   = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className   = 'icon-btn';
    editBtn.title       = 'Edit';
    editBtn.textContent = '\u270F\uFE0F';
    editBtn.addEventListener('click', () => startEdit(li, task));

    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'icon-btn';
    deleteBtn.title       = 'Delete';
    deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    return li;
  }

  function startEdit(li, task) {
    const span = li.querySelector('.task-text');
    if (!span) return;

    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'task-edit-input';
    input.value     = task.text;
    input.maxLength = 120;

    li.replaceChild(input, span);
    input.focus();
    input.select();

    let committed = false;

    function commitEdit() {
      if (committed) return;
      committed = true;
      editTask(task.id, input.value);
    }

    function cancelEdit() {
      committed = true;
      if (input.parentNode === li) li.replaceChild(span, input);
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
      if (e.key === 'Escape') { cancelEdit(); }
    });
    input.addEventListener('blur', commitEdit);
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // --- DUPLICATE PREVENTION ---
    const isDuplicate = tasks.some(
      t => t.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      // Shake the input and show toast
      taskInput.classList.remove('shake');
      // Force reflow so re-adding class restarts animation
      void taskInput.offsetWidth;
      taskInput.classList.add('shake');
      taskInput.addEventListener('animationend', () => {
        taskInput.classList.remove('shake');
      }, { once: true });
      showToast('\u26A0\uFE0F Task already exists!');
      return;
    }
    // ----------------------------

    tasks.push({ id: Date.now(), text: trimmed, done: false });
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; saveTasks(); renderTasks(); }
  }

  function editTask(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) { renderTasks(); return; }
    const task = tasks.find(t => t.id === id);
    if (task) { task.text = trimmed; saveTasks(); renderTasks(); }
  }

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addTask(taskInput.value); taskInput.value = ''; }
  });

  addTaskBtn.addEventListener('click', () => {
    addTask(taskInput.value);
    taskInput.value = '';
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  clearDoneBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    saveTasks();
    renderTasks();
    showToast('Done tasks cleared');
  });

  tasks = loadTasks();
  renderTasks();


  /* ===========================================================
     QUICK LINKS
     =========================================================== */

  const addLinkBtn    = document.getElementById('add-link-btn');
  const linkForm      = document.getElementById('link-form');
  const linkNameInput = document.getElementById('link-name-input');
  const linkUrlInput  = document.getElementById('link-url-input');
  const saveLinkBtn   = document.getElementById('save-link-btn');
  const cancelLinkBtn = document.getElementById('cancel-link-btn');
  const linksList     = document.getElementById('links-list');
  const linksEmpty    = document.getElementById('links-empty');
  const linkNameError = document.getElementById('link-name-error');
  const linkUrlError  = document.getElementById('link-url-error');

  const LINKS_KEY = 'dashboard_links';
  let links       = [];

  function loadLinks() {
    try {
      const raw = localStorage.getItem(LINKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveLinks() {
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); }
    catch (e) { /* silent fail */ }
  }

  function renderLinks() {
    linksList.innerHTML = '';
    if (links.length === 0) {
      linksEmpty.classList.remove('hidden');
      return;
    }
    linksEmpty.classList.add('hidden');
    links.forEach(link => {
      const li      = document.createElement('li');
      li.className  = 'link-item';

      const a       = document.createElement('a');
      a.href        = link.url;
      a.target      = '_blank';
      a.rel         = 'noopener noreferrer';
      a.textContent = link.name;

      const actions       = document.createElement('div');
      actions.className   = 'link-actions';

      const deleteBtn       = document.createElement('button');
      deleteBtn.className   = 'icon-btn';
      deleteBtn.title       = 'Delete';
      deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
      deleteBtn.addEventListener('click', () => deleteLink(link.id));

      actions.appendChild(deleteBtn);
      li.appendChild(a);
      li.appendChild(actions);
      linksList.appendChild(li);
    });
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
    showToast('Link removed');
  }

  function clearLinkErrors() {
    [linkNameError, linkUrlError].forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  function showLinkError(field, message) {
    const el = field === 'name' ? linkNameError : linkUrlError;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideLinkForm() {
    linkForm.classList.add('hidden');
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    clearLinkErrors();
  }

  addLinkBtn.addEventListener('click', () => {
    if (linkForm.classList.contains('hidden')) {
      linkForm.classList.remove('hidden');
      linkNameInput.focus();
    } else {
      hideLinkForm();
    }
  });

  saveLinkBtn.addEventListener('click', () => {
    clearLinkErrors();
    const name = linkNameInput.value.trim();
    const url  = linkUrlInput.value.trim();
    let valid  = true;

    if (!name) { showLinkError('name', 'Link name is required.'); valid = false; }
    if (!url)  { showLinkError('url', 'URL is required.'); valid = false; }
    else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showLinkError('url', 'URL must start with http:// or https://'); valid = false;
    } else if (links.some(l => l.url === url)) {
      showLinkError('url', 'This URL is already saved.'); valid = false;
    }

    if (!valid) return;

    links.push({ id: Date.now(), name, url });
    saveLinks();
    renderLinks();
    hideLinkForm();
    showToast(`"${name}" added`);
  });

  cancelLinkBtn.addEventListener('click', hideLinkForm);

  [linkNameInput, linkUrlInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveLinkBtn.click();
    });
  });

  links = loadLinks();
  renderLinks();

}); // end DOMContentLoaded
