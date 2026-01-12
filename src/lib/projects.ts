// Project management types and utilities

export interface ProjectSnapshot {
  id: string;
  canvasJson: string;
  thumbnail: string;
  timestamp: number;
  label: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
  canvasJson: string;
  history: ProjectSnapshot[];
  historyIndex: number;
}

const PROJECTS_KEY = 'traceflow_projects';
const ACTIVE_PROJECT_KEY = 'traceflow_active_project';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all projects from localStorage
export function getProjects(): Project[] {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save projects to localStorage
export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
}

// Create a new project
export function createProject(name: string, canvasJson: string = '', thumbnail: string = ''): Project {
  const now = Date.now();
  const project: Project = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    thumbnail,
    canvasJson,
    history: [],
    historyIndex: -1,
  };
  
  const projects = getProjects();
  projects.unshift(project);
  saveProjects(projects);
  
  return project;
}

// Get a specific project
export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

// Update a project
export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  saveProjects(projects);
  return projects[index];
}

// Delete a project
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  
  if (filtered.length === projects.length) return false;
  
  saveProjects(filtered);
  return true;
}

// Add a snapshot to project history
export function addProjectSnapshot(
  projectId: string, 
  canvasJson: string, 
  thumbnail: string, 
  label: string
): Project | null {
  const project = getProject(projectId);
  if (!project) return null;
  
  const snapshot: ProjectSnapshot = {
    id: generateId(),
    canvasJson,
    thumbnail,
    timestamp: Date.now(),
    label,
  };
  
  // Trim history if we're not at the end
  const newHistory = project.history.slice(0, project.historyIndex + 1);
  newHistory.push(snapshot);
  
  // Keep max 50 snapshots per project
  const maxSnapshots = 50;
  if (newHistory.length > maxSnapshots) {
    newHistory.shift();
  }
  
  return updateProject(projectId, {
    canvasJson,
    thumbnail,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  });
}

// Restore to a specific snapshot
export function restoreToSnapshot(projectId: string, snapshotIndex: number): Project | null {
  const project = getProject(projectId);
  if (!project || snapshotIndex < 0 || snapshotIndex >= project.history.length) {
    return null;
  }
  
  const snapshot = project.history[snapshotIndex];
  
  return updateProject(projectId, {
    canvasJson: snapshot.canvasJson,
    thumbnail: snapshot.thumbnail,
    historyIndex: snapshotIndex,
  });
}

// Get/set active project ID
export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

// Duplicate a project
export function duplicateProject(id: string): Project | null {
  const original = getProject(id);
  if (!original) return null;
  
  const now = Date.now();
  const duplicate: Project = {
    ...original,
    id: generateId(),
    name: `${original.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    history: [],
    historyIndex: -1,
  };
  
  const projects = getProjects();
  projects.unshift(duplicate);
  saveProjects(projects);
  
  return duplicate;
}

// Format date for display
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
