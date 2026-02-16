(function() {
  'use strict';

  // State
  const state = {
    tasks: [],
    currentFilter: 'all',
    searchQuery: ''
  };

  // DOM elements
  const $ = (selector) => document.querySelector(selector);
  const taskForm = $('#task-form');
  const taskInput = $('#task-input');
  const searchInput = $('#search-input');
  const searchClear = $('#search-clear');
  const taskList = $('#task-list');
  const spinner = $('#spinner');
  const emptyState = $('#empty-state');
  const emptyStateTitle = $('#empty-state-title');
  const emptyStateHint = $('#empty-state-hint');
  const themeToggle = $('#theme-toggle');
  const toast = $('#toast');
  const countAll = $('#count-all');
  const countActive = $('#count-active');
  const countCompleted = $('#count-completed');

  // Debounce utility
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // API Service
  const API = {
    async getTasks() {
      const res = await fetch('/tasks');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      const result = await res.json();
      return result.data;
    },

    async createTask(title) {
      const res = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create task');
      }
      return res.json();
    },

    async updateTask(id, data) {
      const res = await fetch(`/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update task');
      }
      return res.json();
    },

    async deleteTask(id) {
      const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete task');
      }
    }
  };

  // Utility: format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // Toast notification
  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // Filter tasks
  function getFilteredTasks() {
    return state.tasks.filter(task => {
      // Apply filter
      if (state.currentFilter === 'active' && task.completed) return false;
      if (state.currentFilter === 'completed' && !task.completed) return false;
      // Apply search
      if (state.searchQuery) {
        return task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      }
      return true;
    });
  }

  // Update filter counts
  function updateFilterCounts() {
    const all = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const active = all - completed;
    countAll.textContent = all;
    countActive.textContent = active;
    countCompleted.textContent = completed;
  }

  // Update empty state message based on context
  function updateEmptyStateMessage() {
    if (state.searchQuery) {
      emptyStateTitle.textContent = 'No matching tasks';
      emptyStateHint.textContent = 'Try a different search term';
    } else if (state.currentFilter === 'active') {
      emptyStateTitle.textContent = 'No active tasks';
      emptyStateHint.textContent = 'All tasks are completed!';
    } else if (state.currentFilter === 'completed') {
      emptyStateTitle.textContent = 'No completed tasks';
      emptyStateHint.textContent = 'Complete a task to see it here';
    } else {
      emptyStateTitle.textContent = 'No tasks yet';
      emptyStateHint.textContent = 'Add your first task above to get started';
    }
  }

  // Helper: Create checkbox
  function createCheckbox(task, li) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Toggle task completion');

    checkbox.addEventListener('change', async () => {
      const newCompleted = checkbox.checked;
      li.classList.toggle('completed', newCompleted);
      try {
        const updated = await API.updateTask(task.id, { completed: newCompleted });
        task.completed = updated.completed;
        task.updatedAt = updated.updatedAt;
        updateFilterCounts();
        // Re-render if filter would hide this task
        if (state.currentFilter !== 'all') {
          renderTasks();
        }
      } catch (err) {
        // Revert on error
        checkbox.checked = !newCompleted;
        li.classList.toggle('completed', !newCompleted);
        showToast(err.message);
      }
    });

    return checkbox;
  }

  // Helper: Create task content
  function createTaskContent(task) {
    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    title.tabIndex = 0;
    title.setAttribute('role', 'button');
    title.setAttribute('aria-label', 'Task: ' + task.title + '. Press Enter to edit');
    title.setAttribute('title', 'Double-click or press Enter to edit');

    const dates = document.createElement('div');
    dates.className = 'task-dates';
    dates.textContent = 'Created ' + formatDate(task.createdAt);
    if (task.updatedAt && task.updatedAt !== task.createdAt) {
      dates.textContent += ' · Updated ' + formatDate(task.updatedAt);
    }

    content.appendChild(title);
    content.appendChild(dates);

    return { content, title, dates };
  }

  // Helper: Create action buttons
  function createActionButtons(task, li, title, dates, startEditMode) {
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-edit-btn';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
    editBtn.addEventListener('click', startEditMode);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this task?')) return;
      try {
        await API.deleteTask(task.id);
        state.tasks = state.tasks.filter(t => t.id !== task.id);
        renderTasks();
      } catch (err) {
        showToast(err.message);
      }
    });

    return { editBtn, deleteBtn };
  }

  // Create task element
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = createCheckbox(task, li);
    const { content, title, dates } = createTaskContent(task);

    li.appendChild(checkbox);
    li.appendChild(content);

    // Edit mode logic
    function startEditMode() {
      if (title.querySelector('input')) return; // Already editing

      const currentText = task.title;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.maxLength = 255;
      title.textContent = '';
      title.classList.add('editing');
      title.appendChild(input);

      // Character counter
      const charCounter = document.createElement('div');
      charCounter.className = 'task-char-counter';
      charCounter.textContent = input.value.length + ' / 255';
      if (255 - input.value.length < 20) charCounter.classList.add('warning');
      title.appendChild(charCounter);

      input.addEventListener('input', () => {
        const remaining = 255 - input.value.length;
        charCounter.textContent = input.value.length + ' / 255';
        charCounter.classList.toggle('warning', remaining < 20);
      });

      // Hide edit and delete buttons
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';

      // Save/Cancel action buttons
      const editActions = document.createElement('div');
      editActions.className = 'task-edit-actions';

      const saveActionBtn = document.createElement('button');
      saveActionBtn.className = 'task-action-btn task-action-save';
      saveActionBtn.setAttribute('aria-label', 'Save changes');
      saveActionBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

      const cancelActionBtn = document.createElement('button');
      cancelActionBtn.className = 'task-action-btn task-action-cancel';
      cancelActionBtn.setAttribute('aria-label', 'Cancel editing');
      cancelActionBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      editActions.appendChild(saveActionBtn);
      editActions.appendChild(cancelActionBtn);
      li.appendChild(editActions);

      input.focus();
      input.select();

      let isProcessing = false;

      function exitEditMode() {
        if (editActions.parentNode) editActions.remove();
        if (charCounter.parentNode) charCounter.remove();
        editBtn.style.display = '';
        deleteBtn.style.display = '';
      }

      async function saveEdit() {
        if (isProcessing) return;
        isProcessing = true;
        const newTitle = input.value.trim();
        title.classList.remove('editing');
        exitEditMode();

        if (!newTitle || newTitle === currentText) {
          title.textContent = currentText;
          title.focus();
          return;
        }

        title.textContent = newTitle;
        try {
          const updated = await API.updateTask(task.id, { title: newTitle });
          task.title = updated.title;
          task.updatedAt = updated.updatedAt;
          dates.textContent = 'Created ' + formatDate(task.createdAt);
          if (task.updatedAt !== task.createdAt) {
            dates.textContent += ' · Updated ' + formatDate(task.updatedAt);
          }
        } catch (err) {
          title.textContent = currentText;
          showToast(err.message);
        }
        title.focus();
      }

      function cancelEdit() {
        if (isProcessing) return;
        isProcessing = true;
        title.classList.remove('editing');
        exitEditMode();
        title.textContent = currentText;
        title.focus();
      }

      saveActionBtn.addEventListener('click', saveEdit);
      cancelActionBtn.addEventListener('click', cancelEdit);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveEdit();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });

      input.addEventListener('blur', (e) => {
        // Don't auto-save if clicking save/cancel buttons
        if (e.relatedTarget === saveActionBtn || e.relatedTarget === cancelActionBtn) return;
        // Use requestAnimationFrame instead of setTimeout
        requestAnimationFrame(() => {
          if (!isProcessing) saveEdit();
        });
      });
    }

    // Double-click to edit title
    title.addEventListener('dblclick', startEditMode);

    // Enter key to edit title
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !title.classList.contains('editing')) {
        e.preventDefault();
        startEditMode();
      }
    });

    const { editBtn, deleteBtn } = createActionButtons(task, li, title, dates, startEditMode);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  }

  // Render tasks
  function renderTasks() {
    const filtered = getFilteredTasks();
    updateFilterCounts();
    updateEmptyStateMessage();

    if (filtered.length === 0) {
      taskList.classList.add('hidden');
      emptyState.classList.remove('hidden');
    } else {
      taskList.classList.remove('hidden');
      emptyState.classList.add('hidden');
      while (taskList.firstChild) {
        taskList.removeChild(taskList.firstChild);
      }
      filtered.forEach(task => {
        taskList.appendChild(createTaskElement(task));
      });
    }
  }

  // Form submit handler
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) {
      taskInput.classList.add('input-error');
      setTimeout(() => taskInput.classList.remove('input-error'), 300);
      return;
    }

    const submitBtn = taskForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    try {
      const newTask = await API.createTask(title);
      state.tasks.unshift(newTask);
      taskInput.value = '';
      renderTasks();
    } catch (err) {
      showToast(err.message);
    } finally {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      taskInput.focus();
    }
  });

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      state.currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Arrow key navigation for filter tabs
  document.querySelector('.filter-tabs').addEventListener('keydown', (e) => {
    const tabs = Array.from(filterTabs);
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (current + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (current - 1 + tabs.length) % tabs.length;
    }
    if (next !== undefined) {
      tabs[next].focus();
      tabs[next].click();
    }
  });

  // Search input with debounce
  searchInput.addEventListener('input', debounce(() => {
    state.searchQuery = searchInput.value.trim();
    searchClear.classList.toggle('hidden', !searchInput.value);
    renderTasks();
  }, 200));

  // Search clear button
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.add('hidden');
    renderTasks();
    searchInput.focus();
  });

  // Dark mode
  function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const sunIcon = themeToggle.querySelector('.icon-sun');
    const moonIcon = themeToggle.querySelector('.icon-moon');
    if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
    if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
  });

  // Initialize
  async function init() {
    initDarkMode();
    try {
      const tasks = await API.getTasks();
      state.tasks = tasks;
    } catch (err) {
      showToast(err.message);
    } finally {
      spinner.classList.add('hidden');
      renderTasks();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
