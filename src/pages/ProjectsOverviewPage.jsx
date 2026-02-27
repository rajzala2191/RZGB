import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { useClientProjects } from '@/contexts/ClientContext';
import { Briefcase, ArrowRight, Clock, CheckCircle, Loader2, AlertCircle, Folder, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectsOverviewPage = () => {
  const { projects, loading, error } = useClientProjects();
  const navigate = useNavigate();

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center p-24 h-full">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-20 h-20 mb-6 animate-pulse" />
          <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
          <p className="text-slate-400 font-medium text-lg">RZ Global Solutions is loading your projects...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="p-16 flex flex-col items-center text-red-400 gap-4 bg-[#0f172a] rounded-xl border border-slate-800 mt-8">
          <img src="https://horizons-cdn.hostinger.com/23dd5419-ae91-4a08-9a43-379efd2912c4/572f4264785907121da08b9cd8e3daf2.png" alt="RZ Global Solutions" className="w-16 h-16 opacity-50 grayscale" />
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle size={24} /> RZ Global Solutions Error
          </div>
          <p>Failed to load projects: {error}</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'ACTIVE': return 'bg-cyan-950 text-cyan-400 border-cyan-900';
      case 'IN_PROGRESS': return 'bg-blue-950 text-blue-400 border-blue-900';
      case 'COMPLETED': return 'bg-emerald-950 text-emerald-400 border-emerald-900';
      case 'ON_HOLD': return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <ClientDashboardLayout>
      <Helmet><title>My Projects - Client Portal</title></Helmet>
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
            <Folder className="text-cyan-500" size={32} />
            Projects Overview
          </h1>
          <p className="text-slate-400">Manage and track your overarching projects and their associated orders.</p>
        </div>
        <button 
           onClick={() => navigate('/client-dashboard/create-project')}
           className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
           <Plus size={18} /> New Project
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
         {projects.length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-4">
               <Folder size={48} className="text-slate-700" />
               <p>No projects found. Create one to organize your orders and RFQs.</p>
            </div>
         ) : projects.map(project => {
            const status = project.status || 'DRAFT';
            
            return (
              <div key={project.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all group relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{project.project_name || 'Unnamed Project'}</h3>
                      <p className="text-slate-500 font-mono text-xs mt-1">ID: {project.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(status)}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                </div>

                <div className="flex-1 space-y-4">
                    <p className="text-sm text-slate-400 line-clamp-3">
                      {project.description || 'No description provided for this project.'}
                    </p>

                    {project.expected_completion_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-300 bg-[#1e293b] p-2 rounded-md border border-slate-700">
                        <Clock size={16} className="text-cyan-500" />
                        <span>Due: {new Date(project.expected_completion_date).toLocaleDateString()}</span>
                      </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => navigate(`/client-dashboard/projects/${project.id}`)} 
                      className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center gap-1 group-hover:underline"
                    >
                      View Details <ArrowRight size={14} />
                    </button>
                </div>
              </div>
            );
         })}
      </div>
    </ClientDashboardLayout>
  );
};

export default ProjectsOverviewPage;