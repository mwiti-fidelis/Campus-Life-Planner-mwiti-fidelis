(function(){
    'use strict';
    const STORAGE = 'campus_planner_activities';
    let activities = [];
    let currentRegexsearch = null;
    let currentSort = {field: "date", direction: "desc"};

    function init() {
        loadData();
        setupViewSwitching();
        setupFormHandling();
        setupTableSorting();
        setupRegexSearch();
        setupImportExport();
        setupKeyboardNavigation();
        setupDarkModeToggle();
        setupAutoSave();
        setupCharacterCounter();
        renderDashboard();
        renderTable();
        renderCategoryPieChart();
        updateDarkModeButtonIcon();
        announceStatus('Campus Life Planner loaded successfully', 'info');
        switchView('dashboard');
    }

    function loadData(){
        try{
            const dataFromLocal = localStorage.getItem(STORAGE);
            if(dataFromLocal){
                const parsedData = JSON.parse(dataFromLocal);
                if(Array.isArray(parsedData) && parsedData.every(isValidActivity)){
                    activities = parsedData;
                    console.log("Data loaded from local storage");
                } else{
                    throw new Error("Invalid data structure");
                }
            } else{
                const seed = document.getElementById("seed-data");
                if(seed){
                    const seedData = JSON.parse(seed.textContent);
                    activities = seedData.map(activity => ({
                        ...activity,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));
                    saveData();
                }
            }
        } catch(error){
            console.log("Error loading data:", error);
            activities = [];
            saveData();
            announceStatus("Error loading Data. Starting fresh.", "error");
        }
    }

    function saveData(){
        try{
            localStorage.setItem(STORAGE, JSON.stringify(activities));
            console.log("Data saved to local storage");
        } catch(error){
            console.log("Error saving data", error);
            announceStatus("Failed to save data.", "error");
        }
    }

    function isValidActivity(activity){
        return (
            typeof activity === 'object' &&
            activity !== null &&
            typeof activity.id === "string" &&
            typeof activity.title === "string" &&
            typeof activity.dueDate === "string" &&
            typeof activity.duration === "number" &&
            typeof activity.tag === "string" &&
            typeof activity.description === "string" &&
            typeof activity.createdAt === "string" &&
            typeof activity.updatedAt === "string"
        );
    }

    function generateId(){
        return `actv_${Date.now()}_${Math.random()*10000}`;
    }

    function addActivity(activity){
        const timestamp = new Date().toISOString();
        const newActivity = {
            id: generateId(),
            ...activity,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        activities.unshift(newActivity);
        saveData();
        announceStatus(`Activity "${activity.title}" added successfully`, "success");
        return newActivity;
    }

    function updateActivity(id, updates){
        const timestamp = new Date().toISOString();
        const index = activities.findIndex(a=> a.id === id);
        if(index === -1) return null;
        activities[index] = {
            ...activities[index],
            ...updates,
            updatedAt: timestamp
        };
        saveData();
        announceStatus(`Activity "${updates.title || activities[index].title}" updated.`, "success");
        return activities[index];
    }

    function deleteActivity(id){
        const activity = activities.find(a=>a.id ===id);
        if(!activity) return false;
        activities=activities.filter(a=>a.id !==id);
        saveData();
        announceStatus(`Activity "${activity.title}" deleted successfully.`, "success");
        return true;
    }

    function setupRegexSearch(){
        const searchInput = document.getElementById("search-bar");
        if(!searchInput) return;
        let searchTimeout;
        searchInput.addEventListener("input", (e)=>{
            clearTimeout(searchTimeout);
            searchTimeout= setTimeout(()=>{
                performSearchByRegex(e.target.value);
            }, 300);
        });
    }

    function performSearchByRegex(pattern){
        const foundActivitiesDiv = document.getElementById("found-status");
        if(!foundActivitiesDiv) return;
        if(!pattern.trim()){
            currentRegexsearch = null;
            foundActivitiesDiv.textContent = "";
            foundActivitiesDiv.className = "found-status";
            renderTable();
            return;
        }
        try{
            const regexFlags = pattern.includes("/") ? "" : "gi";
            currentRegexsearch = new RegExp(pattern, regexFlags);
            const matches = activities.filter(activity =>
                regexMatchesActivity(currentRegexsearch, activity)
            ).length;
            foundActivitiesDiv.textContent = `${matches} matching activities found`;
            foundActivitiesDiv.className = "found-status success";
            renderTable();
        } catch(error){
            currentRegexsearch = null;
            foundActivitiesDiv.textContent = `Invalid regex: ${error.message}`;
            foundActivitiesDiv.className = 'found-status error';
            renderTable();
        }
    }

    function regexMatchesActivity(regex, activity){
        const searchArea = [activity.title, activity.description, activity.tag, activity.dueDate, activity.duration.toString()];
        return searchArea.some(area => area && regex.test(area));
    }

    function highlightMatches(text) {
        if (!currentRegexsearch || !text) return escapeHtml(text);
        try {
            return text.replace(currentRegexsearch, match =>
                `<mark>${escapeHtml(match)}</mark>`
            );
        } catch (error) {
            return escapeHtml(text);
        }
    }

    function renderDashboard(){
        const total = document.getElementById("stat-total");
        if(total) total.textContent = activities.length;
        const average = document.getElementById("stat-avg");
        if(average){
            const avg = activities.length > 0 ?
            Math.round(activities.reduce((acc, curr) => acc + curr.duration, 0) / activities.length) : 0;
            average.textContent = `${avg} min`;
        }
        const nextDueDate = document.getElementById('stat-next');
        if (nextDueDate) {
            if (activities.length > 0) {
                const sorted = [...activities].sort((a, b) =>
                    new Date(a.dueDate) - new Date(b.dueDate)
                );
                const next = sorted[0];
                nextDueDate.textContent = `${formatDate(next.dueDate)} - ${next.title}`;
            } else {
                nextDueDate.textContent = '—';
            }
        }
        renderCategoryPieChart();
    }

    function renderCategoryPieChart(){
        const canvas = document.getElementById("category-pie-chart");
        if(!canvas) return;
        const ctx = canvas.getContext("2d");
        if(!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const categories = ['Study', 'Event', 'Personal'];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];

        const total = activities.length;
        if (total > 0) {
            const studyCount = activities.filter(a => a.tag === 'Study').length;
            const eventCount = activities.filter(a => a.tag === 'Event').length;
            const personalCount = activities.filter(a => a.tag === 'Personal').length;

            document.getElementById('study-percent').textContent = `${Math.round((studyCount / total) * 100)}%`;
            document.getElementById('event-percent').textContent = `${Math.round((eventCount / total) * 100)}%`;
            document.getElementById('personal-percent').textContent = `${Math.round((personalCount / total) * 100)}%`;
        } else {
            document.getElementById('study-percent').textContent = '0%';
            document.getElementById('event-percent').textContent = '0%';
            document.getElementById('personal-percent').textContent = '0%';
        }
        if (total === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No activities yet', canvas.width/2, canvas.height/2);
            return;
        }
        const counts = categories.map(category =>
            activities.filter(a => a.tag === category).length
        );
        const percentages = counts.map(count => count / total * 100);
        let startAngle = -Math.PI / 2;
        for (let i = 0; i < categories.length; i++) {
            if (counts[i] === 0) continue;
            const percentage = percentages[i];
            const endAngle = startAngle + (percentage / 100 * 2 * Math.PI);
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, canvas.height/2);
            ctx.arc(canvas.width/2, canvas.height/2, 90, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelRadius = 110;
            const labelX = canvas.width/2 + Math.cos(midAngle) * labelRadius;
            const labelY = canvas.height/2 + Math.sin(midAngle) * labelRadius;
            ctx.beginPath();
            ctx.moveTo(canvas.width/2 + Math.cos(midAngle) * 95, canvas.height/2 + Math.sin(midAngle) * 95);
            ctx.lineTo(labelX, labelY);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
                labelX > canvas.width/2 ? labelX - 5 : labelX - 70,
                labelY - 10,
                70,
                20
            );
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = colors[i];
            ctx.textAlign = labelX > canvas.width/2 ? 'left' : 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${categories[i]} ${Math.round(percentage)}%`,
                labelX > canvas.width/2 ? labelX + 2 : labelX - 2,
                labelY
            );
            startAngle = endAngle;
        }
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, canvas.width/2, canvas.height/2 - 5);
        ctx.font = '10px Arial';
        ctx.fillText('activities', canvas.width/2, canvas.height/2 + 8);

    }

    function setupImportExport(){
        const exportBtn = document.getElementById("download-btn");
        if(exportBtn){
            exportBtn.addEventListener("click", exportData);
        }
        const importBtn = document.getElementById("upload-btn");
        if(importBtn){
            importBtn.addEventListener("click", ()=>{
                const fileInput = document.getElementById("import-file");
                if(fileInput && fileInput.files.length > 0){
                    importData(fileInput.files[0]);
                } else{
                    announceStatus("Please select a JSON file first", "error");
                }
            });
        }
    }

    function exportData() {
        try {
            const dataStr = JSON.stringify(activities, null, 2);
            const dataUri = `application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
            const exportFileDefaultName = `campus-planner-${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            announceStatus(`Exported ${activities.length} activities successfully!`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            announceStatus('Failed to export data', 'error');
        }
    }

    function importData(file){
        const statusDiv = document.getElementById("import-status");
        if(!statusDiv) return;
        const fileReader = new FileReader();
        fileReader.onload = (e)=>{
            try{
                const importedFile = JSON.parse(e.target.result);
                if(!Array.isArray(importedFile)){
                    throw new Error("Invalid JSON format! Expected array");
                }
                const validActivities = importedFile.filter(isValidActivity);
                if(validActivities.length === 0){
                    throw new Error("No valid activities found in file");
                }
                const existingIds = new Set(activities.map(a=> a.id));
                const newActivities = validActivities.filter(a=> !existingIds.has(a.id));
                activities = [...newActivities, ...activities];
                saveData();
                renderDashboard();
                renderTable();
                let message = `Imported ${newActivities.length} new activities`;
                const invalidCount = importedFile.length - validActivities.length;
                if(invalidCount > 0){
                    message += `. Skipped ${invalidCount} invalid entries.`;
                }
                announceStatus(message, "success");
                statusDiv.textContent = message;
                statusDiv.className = "status-message success";
            } catch(error){
                console.error('Import error:', error);
                statusDiv.textContent = `Import failed: ${error.message}`;
                statusDiv.className = 'status-message error';
                announceStatus('Failed to import data', 'error');
            }
        };
        fileReader.onerror = ()=>{
            announceStatus("Error reading file", "error");
        };
        fileReader.readAsText(file);
    }

    function announceStatus(message, type = 'info') {
        const alertDiv = document.getElementById('status-alert');
        if (!alertDiv) return;
        alertDiv.textContent = message;
        alertDiv.className = `status-message ${type}`;
        alertDiv.classList.remove('hidden');
        setTimeout(() => {
            alertDiv.classList.add('hidden');
        }, 5000);
    }

    function setupAutoSave() {
        const form = document.getElementById('activity-form');
        if (!form) return;
        form.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const formData = getFormData();
                const errors = validateForm(formData);
                if (Object.keys(errors).length === 0) {
                    saveData();
                }
            }
        }, true);
    }

    function setupDarkModeToggle(){
        const toggleBtn = document.getElementById("dark-mode-toggle");
        if(!toggleBtn) return;
        toggleBtn.addEventListener("click", toggleLightDarkMode);
    }

    function toggleLightDarkMode(){
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if(isDark){
            document.documentElement.removeAttribute("data-theme");
        } else{
            document.documentElement.setAttribute("data-theme", "dark");
        }
        updateDarkModeButtonIcon();
        announceStatus(`Switched to ${isDark ? "light" : "dark"} mode`, "info");
    }

    function updateDarkModeButtonIcon() {
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (!toggleBtn) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        toggleBtn.innerHTML = isDark ? 'Light Mode' : 'Dark Mode';
    }

    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const formSection = document.getElementById('form');
                if (formSection && formSection.classList.contains('active')) {
                    resetForm();
                    switchView('records');
                }
            }
        });
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return text;
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function setupViewSwitching() {
        const navButtons = document.querySelectorAll('.nav-bar button[data-view]');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewName = button.dataset.view;
                switchView(viewName);
            });
        });
    }

    function switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            document.querySelectorAll('.nav-bar button').forEach(btn => {
                btn.removeAttribute('aria-current');
            });
            const activeBtn = document.querySelector(`.nav-bar button[data-view="${viewName}"]`);
            if (activeBtn) {
                activeBtn.setAttribute('aria-current', 'page');
            }
        }
    }

    function setupFormHandling() {
        const form = document.getElementById('activity-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = getFormData();
            const errors = validateForm(formData);
            if (Object.keys(errors).length > 0) {
                displayErrors(errors);
                announceStatus('Please fix form errors', 'error');
                return;
            }
            const isEditing = form.dataset.editingId;
            if (isEditing) {
                updateActivity(isEditing, formData);
            } else {
                addActivity(formData);
            }
            resetForm();
            switchView('records');
        });
        document.getElementById('cancel-btn').addEventListener('click', () => {
            resetForm();
            switchView('records');
        });
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
        });
    }

    function getFormData() {
        return {
            title: document.getElementById('title').value.trim(),
            duration: parseInt(document.getElementById('duration').value) || 0,
            dueDate: document.getElementById('due-date').value,
            tag: document.getElementById('tag').value,
            description: document.getElementById('description').value.trim()
        };
    }

    function validateForm(data) {
        const errors = {};
        if (!data.title || data.title.length < 3) errors.title = 'Title required (min 3 chars)';
        if (!data.duration || data.duration <= 0) errors.duration = 'Valid duration required';
        if (!data.dueDate) errors.dueDate = 'Due date required';
        if (!data.tag) errors.tag = 'Category required';
        return errors;
    }

    function displayErrors(errors) {
        Object.keys(errors).forEach(field => {
            const el = document.getElementById(`${field}-error`);
            if (el) {
                el.textContent = errors[field];
                el.style.display = 'block';
            }
        });
    }

    function validateField(input) {
        const field = input.id;
        const value = input.value.trim();
        const errorDiv = document.getElementById(`${field}-error`);
        if (!errorDiv) return true;
        let error = '';
        if (field === 'title' && (!value || value.length < 3)) error = 'Min 3 characters';
        if (field === 'duration' && (!value || parseInt(value) <= 0)) error = 'Must be positive number';
        if (field === 'due-date' && !value) error = 'Required';
        if (field === 'tag' && !value) error = 'Required';
        if (error) {
            errorDiv.textContent = error;
            errorDiv.style.display = 'block';
            input.style.borderColor = 'var(--danger, #dc2626)';
            return false;
        } else {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            input.style.borderColor = '';
            return true;
        }
    }

    function resetForm() {
        const form = document.getElementById('activity-form');
        if (form) {
            form.reset();
            form.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
            form.querySelectorAll('input, select, textarea').forEach(el => {
                el.style.borderColor = '';
            });
            delete form.dataset.editingId;
        }
    }

    function setupTableSorting() {
        document.querySelectorAll('th button[data-sort]').forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.sort;
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }
                renderTable();
            });
        });
    }

    function renderTable() {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        if (activities.length === 0) {
            tbody.innerHTML = `<tr class="placeholder-row"><td colspan="5">No activities recorded yet. Add new Activities</td></tr>`;
            return;
        }
        const sorted = [...activities].sort((a, b) => {
            let cmp = 0;
            if (currentSort.field === 'title') cmp = a.title.localeCompare(b.title);
            else if (currentSort.field === 'duration') cmp = a.duration - b.duration;
            else if (currentSort.field === 'date') cmp = new Date(a.dueDate) - new Date(b.dueDate);
            else if (currentSort.field === 'tag') cmp = a.tag.localeCompare(b.tag);
            return currentSort.direction === 'asc' ? cmp : -cmp;
        });
        const filtered = currentRegexsearch ?
            sorted.filter(a => regexMatchesActivity(currentRegexsearch, a)) :
            sorted;
        tbody.innerHTML = filtered.map(a => `
            <tr>
                <td>${escapeHtml(a.title)}</td>
                <td>${a.duration} min</td>
                <td>${formatDate(a.dueDate)}</td>
                <td>${a.tag}</td>
                <td>
                    <button class="btn-edit" data-id="${a.id}" aria-label="Edit ${a.title}">✏️</button>
                    <button class="btn-delete" data-id="${a.id}" aria-label="Delete ${a.title}">🗑️</button>
                </td>
            </tr>
        `).join('');
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const act = activities.find(a => a.id === id);
                if (act) populateForm(act);
            });
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Delete this activity?')) {
                    deleteActivity(e.currentTarget.dataset.id);
                }
            });
        });
    }

    function populateForm(activity) {
        document.getElementById('title').value = activity.title;
        document.getElementById('duration').value = activity.duration;
        document.getElementById('due-date').value = activity.dueDate;
        document.getElementById('tag').value = activity.tag;
        document.getElementById('description').value = activity.description || '';
        document.getElementById('activity-form').dataset.editingId = activity.id;
        switchView('form');
    }

    function setupCharacterCounter() {
        const textarea = document.getElementById('description');
        const counter = document.getElementById('char-count');
        if (!textarea || !counter) return;
        textarea.addEventListener('input', () => {
            const text = textarea.value;
            const count = text.length;
            counter.textContent = `Characters: ${count}/75`;
            if (count > 75) {
                counter.style.color = 'var(--danger, #dc2626)';
                textarea.style.borderColor = 'var(--danger, #dc2626)';
                textarea.value = text.substring(0, 75);
                counter.textContent = `Characters: 75/75`;
            } else {
                counter.style.color = '';
                textarea.style.borderColor = '';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.app = {
        activities,
        addActivity,
        updateActivity,
        deleteActivity,
        renderTable,
        renderDashboard
    };
})();