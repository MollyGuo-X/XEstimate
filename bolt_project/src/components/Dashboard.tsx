import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectStatus } from '../types';
import { Plus, Home, Building2, Loader2, DollarSign, Wrench, X, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { format } from 'date-fns';

function ProjectCard({ project, isDragging = false }: { project: Project; isDragging?: boolean }) {
  return (
    <div className={`project-card ${isDragging ? 'project-card-dragging' : ''}`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500">
              {project.property_details.address}
            </p>
          </div>
          {project.property_details.property_type === 'Single Family House' ? (
            <Home className="h-8 w-8 text-blue-600" />
          ) : (
            <Building2 className="h-8 w-8 text-blue-600" />
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Ask Price</span>
            <span className="text-base font-semibold text-gray-900">
              <DollarSign className="inline-block h-4 w-4 text-gray-500 mr-0.5" />
              {project.economic_analysis.asking_price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ARV</span>
            <span className="text-base font-semibold text-gray-900">
              <DollarSign className="inline-block h-4 w-4 text-gray-500 mr-0.5" />
              {project.economic_analysis.arv.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              <Wrench className="inline-block h-4 w-4 text-gray-500 mr-1" />
              Renovation Cost
            </span>
            <span className="text-base font-semibold text-gray-900">
              <DollarSign className="inline-block h-4 w-4 text-gray-500 mr-0.5" />
              {project.renovation_costs.total.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-900">Profit</span>
            <span className={`text-lg font-bold ${
              project.economic_analysis.profit >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              <DollarSign className="inline-block h-4 w-4 mr-0.5" />
              {project.economic_analysis.profit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletionDateModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Enter Project Completion Date</h3>
        </div>
        <div className="modal-body">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completion Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(date)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const showSuccessMessage = location.state?.newProject;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setError(null);
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(projects || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedProject = projects.find(p => p.id === active.id);
    if (draggedProject) {
      setActiveProject(draggedProject);
      setDraggedProjectId(draggedProject.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.id) return;

    const projectId = active.id as string;
    const targetStatus = over.id as ProjectStatus;
    const project = projects.find(p => p.id === projectId);

    if (!project || project.status === targetStatus) return;

    if (targetStatus === 'completed') {
      setShowCompletionModal(true);
    } else {
      await updateProjectStatus(projectId, targetStatus);
    }
    
    setActiveProject(null);
    setDraggedProjectId(null);
  };

  const updateProjectStatus = async (projectId: string, status: ProjectStatus, completionDate?: string) => {
    try {
      const updateData: { status: ProjectStatus; completion_date?: string | null } = {
        status,
        completion_date: status === 'completed' ? completionDate : null
      };

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, ...updateData }
          : p
      ));
    } catch (err) {
      console.error('Error updating project status:', err);
    }
  };

  const handleCompletionDate = async (date: string) => {
    if (draggedProjectId) {
      await updateProjectStatus(draggedProjectId, 'completed', date);
      setShowCompletionModal(false);
      setDraggedProjectId(null);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const noGoProjects = projects.filter(p => p.status === 'no_go');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <button
              onClick={() => navigate('/projects/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </button>
          </div>

          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>Project created successfully!</span>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Projects */}
            <div id="active" className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
              <div className="droppable-area">
                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active projects
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <ProjectCard project={project} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Completed Projects */}
            <div id="completed" className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Completed Projects
              </h2>
              <div className="droppable-area">
                {completedProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No completed projects
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <ProjectCard project={project} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* No-go Projects */}
            <div id="no_go" className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <X className="h-5 w-5 mr-2 text-red-600" />
                No-go Projects
              </h2>
              <div className="droppable-area">
                {noGoProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No no-go projects
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noGoProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <ProjectCard project={project} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeProject ? <ProjectCard project={activeProject} isDragging /> : null}
          </DragOverlay>
        </div>

        <CompletionDateModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onConfirm={handleCompletionDate}
        />
      </div>
    </DndContext>
  );
}