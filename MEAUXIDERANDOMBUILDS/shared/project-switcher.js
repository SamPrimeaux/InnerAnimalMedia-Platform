/**
 * Google Cloud-level Project Switcher Component
 * Sitewide project selection with search and filtering
 */

class ProjectSwitcher {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.isOpen = false;
        this.apiBase = window.DASHBOARD_API_BASE || 'https://iaccess-api.meauxbility.workers.dev';
    }

    async init() {
        await this.loadProjects();
        this.render();
        this.attachEventListeners();
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBase}/api/projects`);
            const data = await response.json();
            if (data.success && data.data) {
                this.projects = data.data;
                // Get current project from localStorage or first project
                const savedProjectId = localStorage.getItem('currentProjectId');
                this.currentProject = this.projects.find(p => p.id === savedProjectId) || this.projects[0] || null;
                if (this.currentProject) {
                    localStorage.setItem('currentProjectId', this.currentProject.id);
                }
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    }

    render() {
        const existingSwitcher = document.getElementById('projectSwitcher');
        if (existingSwitcher) {
            existingSwitcher.remove();
        }

        const switcher = document.createElement('div');
        switcher.id = 'projectSwitcher';
        switcher.className = 'project-switcher-container';
        switcher.innerHTML = `
            <button class="project-switcher-trigger" id="projectSwitcherBtn">
                <div class="project-switcher-info">
                    <span class="project-switcher-label">Project</span>
                    <span class="project-switcher-name" id="currentProjectName">${this.currentProject?.name || 'Select Project'}</span>
                </div>
                <i data-lucide="chevron-down" class="project-switcher-icon"></i>
            </button>
            <div class="project-switcher-dropdown" id="projectSwitcherDropdown" style="display: none;">
                <div class="project-switcher-search">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" id="projectSearchInput" placeholder="Search projects..." autocomplete="off">
                </div>
                <div class="project-switcher-list" id="projectSwitcherList">
                    ${this.renderProjectList()}
                </div>
                <div class="project-switcher-footer">
                    <button class="project-switcher-action" id="newProjectBtn">
                        <i data-lucide="plus"></i>
                        <span>New Project</span>
                    </button>
                </div>
            </div>
        `;

        // Insert before top-actions
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            const topActions = topBar.querySelector('.top-actions');
            if (topActions) {
                topBar.insertBefore(switcher, topActions);
            } else {
                topBar.appendChild(switcher);
            }
        }

        lucide.createIcons();
    }

    renderProjectList(filteredProjects = null) {
        const projects = filteredProjects || this.projects;
        if (projects.length === 0) {
            return '<div class="project-switcher-empty">No projects found</div>';
        }

        return projects.map(project => `
            <div class="project-switcher-item ${project.id === this.currentProject?.id ? 'active' : ''}" 
                 data-project-id="${project.id}">
                <div class="project-switcher-item-info">
                    <div class="project-switcher-item-name">${project.name}</div>
                    ${project.description ? `<div class="project-switcher-item-desc">${project.description}</div>` : ''}
                </div>
                ${project.id === this.currentProject?.id ? '<i data-lucide="check" class="project-switcher-check"></i>' : ''}
            </div>
        `).join('');
    }

    attachEventListeners() {
        const btn = document.getElementById('projectSwitcherBtn');
        const dropdown = document.getElementById('projectSwitcherDropdown');
        const searchInput = document.getElementById('projectSearchInput');
        const list = document.getElementById('projectSwitcherList');
        const newProjectBtn = document.getElementById('newProjectBtn');

        // Toggle dropdown
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close on outside click
        const switcherEl = document.getElementById('projectSwitcher');
        document.addEventListener('click', (e) => {
            if (switcherEl && !switcherEl.contains(e.target)) {
                this.close();
            }
        });

        // Search
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.projects.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
            list.innerHTML = this.renderProjectList(filtered);
            lucide.createIcons();
        });

        // Project selection
        list?.addEventListener('click', (e) => {
            const item = e.target.closest('.project-switcher-item');
            if (item) {
                const projectId = item.dataset.projectId;
                this.selectProject(projectId);
            }
        });

        // New project
        newProjectBtn?.addEventListener('click', () => {
            window.location.href = '/dashboard/projects?action=create';
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const dropdown = document.getElementById('projectSwitcherDropdown');
        if (dropdown) {
            dropdown.style.display = this.isOpen ? 'block' : 'none';
            if (this.isOpen) {
                document.getElementById('projectSearchInput')?.focus();
            }
        }
    }

    close() {
        this.isOpen = false;
        const dropdown = document.getElementById('projectSwitcherDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    async selectProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        this.currentProject = project;
        localStorage.setItem('currentProjectId', projectId);

        // Update UI
        const nameEl = document.getElementById('currentProjectName');
        if (nameEl) {
            nameEl.textContent = project.name;
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('projectChanged', { detail: { project } }));

        this.close();
        this.render(); // Re-render to update active state
    }

    getCurrentProject() {
        return this.currentProject;
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.ProjectSwitcher = ProjectSwitcher;
    document.addEventListener('DOMContentLoaded', () => {
        const switcher = new ProjectSwitcher();
        switcher.init();
        window.projectSwitcher = switcher; // Global access
    });
}
