import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import SupplierHubLayout from '@/components/SupplierHubLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, AlertCircle, CheckCircle2, Clock, Upload, FileText,
  ChevronRight, Package, Zap, Hourglass, ShieldCheck, Truck
} from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { id: 'MATERIAL', label: 'Material Sourcing', icon: Package, color: 'sky' },
  { id: 'CASTING', label: 'Casting', icon: Zap, color: 'orange' },
  { id: 'MACHINING', label: 'Machining', icon: Hourglass, color: 'violet' },
  { id: 'QC', label: 'Quality Control', icon: ShieldCheck, color: 'emerald' },
  { id: 'DISPATCH', label: 'Dispatch', icon: Truck, color: 'blue' },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, color: 'green' },
];

export default function SupplierProjectManager() {
  const { currentUser, userCompanyName } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [updatingProject, setUpdatingProject] = useState(null);
  const [document, setDocument] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [savingNotes, setSavingNotes] = useState({});

  const fetchAwardedProjects = async () => {
    try {
      if (!currentUser?.id) {
        setError('User not authenticated. Please log in again.');
        return;
      }

      // Fetch awarded projects using user ID (which is supplier_id in orders table)
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id, rz_job_id, part_name, material, order_status, 
          created_at, client:client_id(company_name),
          supplier_doc_status, supplier_notes
        `)
        .eq('supplier_id', currentUser.id)
        .in('order_status', ['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED'])
        .order('created_at', { ascending: false });

      if (err) throw err;
      
      setProjects(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(`Failed to load projects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwardedProjects();
  }, [currentUser]);

  const updateProjectStatus = async (projectId, newStatus) => {
    setUpdatingProject(projectId);
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          supplier_doc_status: 'pending_admin_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (err) throw err;

      // Add job update
      const project = projects.find(p => p.id === projectId);
      if (project) {
        await supabase.from('job_updates').insert({
          rz_job_id: project.rz_job_id,
          stage: newStatus,
          status: 'in_progress',
          notes: `Supplier moved project to ${STAGES.find(s => s.id === newStatus)?.label}`,
          created_by: currentUser?.email,
        });
      }

      fetchAwardedProjects();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update project status');
    } finally {
      setUpdatingProject(null);
    }
  };

  const handleDocumentUpload = async (e, projectId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `supplier-docs/${fileName}`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);

      // Save document record
      const { error: dbErr } = await supabase.from('documents').insert({
        order_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_url: data.publicUrl,
        uploaded_by: 'supplier',
        doc_type: 'supplier_submission',
        status: 'pending_admin_review',
        created_at: new Date().toISOString(),
      });

      if (dbErr) throw dbErr;

      setDocument(null);
      fetchAwardedProjects();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const saveNotes = async (projectId, notes) => {
    setSavingNotes(prev => ({ ...prev, [projectId]: true }));
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({
          supplier_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (err) throw err;

      setError(null);
      // Optionally show a brief toast/notification
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
    } finally {
      setSavingNotes(prev => ({ ...prev, [projectId]: false }));
    }
  };

  if (loading) {
    return (
      <SupplierHubLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin w-12 h-12 text-cyan-500" />
        </div>
      </SupplierHubLayout>
    );
  }

  return (
    <SupplierHubLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Awarded Projects</h1>
          <p className="text-slate-400 mt-1">
            Manage your manufacturing workflow for awarded projects
          </p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-semibold">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {projects.length === 0 && !error ? (
          <Card className="bg-[#0f172a] border-slate-700">
            <CardContent className="pt-12 text-center">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No awarded projects yet</p>
              <p className="text-slate-500 text-sm mt-2">Check back after your bids are accepted</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => {
              const currentStage = STAGES.find(s => s.id === project.order_status);
              const isExpanded = expandedProject === project.id;

              return (
                <Card
                  key={project.id}
                  className="bg-[#0f172a] border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedProject(isExpanded ? null : project.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded">
                            {project.id.slice(0, 8).toUpperCase()}
                          </span>
                          {project.part_name}
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          Client: {project.client?.company_name} • Material: {project.material}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                            project.order_status === 'DELIVERED'
                              ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                              : 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                          }`}
                        >
                          {currentStage?.icon && (
                            <currentStage.icon className="w-3 h-3" />
                          )}
                          {currentStage?.label}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-6 border-t border-slate-700 space-y-4">
                      {/* Status Update Dropdown */}
                      {project.order_status !== 'DELIVERED' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Move to Next Stage
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {STAGES.map(stage => {
                              const stageIndex = STAGES.findIndex(
                                s => s.id === stage.id
                              );
                              const currentIndex = STAGES.findIndex(
                                s => s.id === project.order_status
                              );
                              const isClickable = stageIndex > currentIndex;

                              return (
                                <Button
                                  key={stage.id}
                                  size="sm"
                                  disabled={
                                    !isClickable ||
                                    updatingProject === project.id
                                  }
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateProjectStatus(project.id, stage.id);
                                  }}
                                  variant={
                                    stageIndex === currentIndex
                                      ? 'default'
                                      : isClickable
                                      ? 'outline'
                                      : 'ghost'
                                  }
                                  className={`${
                                    isClickable ? 'cursor-pointer' : ''
                                  }`}
                                >
                                  {updatingProject === project.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <stage.icon className="w-3 h-3" />
                                  )}
                                  {stage.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Document Upload */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Upload Stage Documents
                        </label>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            onChange={e => handleDocumentUpload(e, project.id)}
                            disabled={uploadingDoc}
                            className="hidden"
                            id={`doc-upload-${project.id}`}
                          />
                          <label
                            htmlFor={`doc-upload-${project.id}`}
                            className="cursor-pointer flex items-center justify-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
                          >
                            {uploadingDoc ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Click to upload documents
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Update Notes
                        </label>
                        <textarea
                          rows="3"
                          placeholder="Add notes about this stage..."
                          defaultValue={project.supplier_notes || ''}
                          onChange={e => {
                            const updated = projects.map(p =>
                              p.id === project.id
                                ? { ...p, supplier_notes: e.target.value }
                                : p
                            );
                            setProjects(updated);
                          }}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 placeholder-slate-500"
                        />
                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            saveNotes(project.id, project.supplier_notes);
                          }}
                          disabled={savingNotes[project.id]}
                          size="sm"
                          className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          {savingNotes[project.id] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Notes'
                          )}
                        </Button>
                      </div>

                      {/* Status Info */}
                      <div className="bg-slate-800/50 rounded p-3 text-sm text-slate-300">
                        <p>
                          <strong>Status:</strong>{' '}
                          {project.supplier_doc_status === 'approved'
                            ? '✓ Documents approved by admin'
                            : project.supplier_doc_status ===
                              'pending_admin_review'
                            ? '⏳ Waiting for admin review'
                            : 'No documents submitted yet'}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SupplierHubLayout>
  );
}
