import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, AlertCircle, CheckCircle2, FileText, Download,
  Eye, X, Clock, Send
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDocumentReview() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvingDoc, setApprovingDoc] = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending_admin_review');

  useEffect(() => {
    fetchDocuments();
    const subscription = supabase
      .channel('admin-document-review')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `doc_type=eq.supplier_submission`,
        },
        () => fetchDocuments()
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error: err } = await supabase
        .from('documents')
        .select(`
          id, order_id, file_name, file_url, status, notes,
          created_at, updated_at, uploaded_by,
          order:order_id(id, part_name, rz_job_id, supplier:supplier_id(company_name))
        `)
        .eq('doc_type', 'supplier_submission')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setDocuments(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const approveDocument = async (docId, orderId) => {
    setApprovingDoc(docId);
    try {
      // Update document status
      const { error: docErr } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          notes: notes || 'Approved by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (docErr) throw docErr;

      // Update order timestamp
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          admin_sanitized_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      // Add audit log
      await supabase.from('audit_logs').insert({
        action: 'document_approved',
        resource_type: 'document',
        resource_id: docId,
        details: `Admin approved supplier document: ${notes}`,
        created_at: new Date().toISOString(),
      });

      fetchDocuments();
      setSelectedDoc(null);
      setNotes('');
    } catch (err) {
      console.error('Error approving document:', err);
      setError('Failed to approve document');
    } finally {
      setApprovingDoc(null);
    }
  };

  const rejectDocument = async (docId, orderId) => {
    setRejectingDoc(docId);
    try {
      const { error: docErr } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          notes: notes || 'Rejected by admin - requires resubmission',
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (docErr) throw docErr;

      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      await supabase.from('audit_logs').insert({
        action: 'document_rejected',
        resource_type: 'document',
        resource_id: docId,
        details: `Admin rejected supplier document: ${notes}`,
        created_at: new Date().toISOString(),
      });

      fetchDocuments();
      setSelectedDoc(null);
      setNotes('');
    } catch (err) {
      console.error('Error rejecting document:', err);
      setError('Failed to reject document');
    } finally {
      setRejectingDoc(null);
    }
  };

  const sendToClient = async (docId, orderId) => {
    try {
      const { error: err } = await supabase
        .from('documents')
        .update({
          status: 'sent_to_client',
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (err) throw err;

      await supabase.from('audit_logs').insert({
        action: 'document_sent_to_client',
        resource_type: 'document',
        resource_id: docId,
        details: 'Admin approved document sent to client',
        created_at: new Date().toISOString(),
      });

      fetchDocuments();
      setSelectedDoc(null);
    } catch (err) {
      console.error('Error sending document:', err);
      setError('Failed to send document');
    }
  };

  if (loading) {
    return (
      <ControlCentreLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin w-12 h-12 text-cyan-500" />
        </div>
      </ControlCentreLayout>
    );
  }

  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.status === filter;
  });

  return (
    <ControlCentreLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Supplier Document Review</h1>
          <p className="text-slate-400 mt-1">
            Review, sanitize, and approve documents from suppliers
          </p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          {[
            { value: 'pending_admin_review', label: 'Pending Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'sent_to_client', label: 'Sent to Client' },
            { value: 'all', label: 'All' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.value
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1 text-xs">
                  ({documents.filter(d => d.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="pt-12 text-center">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No documents in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocs.map(doc => (
              <Card
                key={doc.id}
                className={`bg-slate-900 border-slate-700 hover:border-cyan-500/50 transition-colors ${
                  selectedDoc?.id === doc.id ? 'border-cyan-500 ring-1 ring-cyan-500/30' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        {doc.file_name}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        Order: {doc.order?.id.slice(0, 8)} • Part: {doc.order?.part_name} • Supplier: {doc.order?.supplier?.company_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(doc.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          doc.status === 'pending_admin_review'
                            ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50'
                            : doc.status === 'approved'
                            ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                            : doc.status === 'rejected'
                            ? 'bg-red-900/40 text-red-300 border border-red-700/50'
                            : 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                        }`}
                      >
                        {doc.status === 'pending_admin_review' && (
                          <Clock className="w-3 h-3" />
                        )}
                        {doc.status === 'approved' && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {doc.status.replace('_', ' ').toUpperCase()}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)
                        }
                      >
                        {selectedDoc?.id === doc.id ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {selectedDoc?.id === doc.id && (
                  <CardContent className="pt-6 border-t border-slate-700 space-y-4">
                    {/* Document Preview */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Document Preview
                      </label>
                      <div className="bg-slate-800/50 rounded p-4 text-center">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                        >
                          <Download className="w-4 h-4" />
                          Download & View Document
                        </a>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Admin Notes / Sanitization
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Add sanitization notes, corrections made, or approval comments..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 placeholder-slate-500"
                      />
                    </div>

                    {/* Current Notes */}
                    {doc.notes && (
                      <div className="bg-slate-800/50 rounded p-3 text-sm">
                        <p className="text-slate-300">
                          <strong>Previous Notes:</strong> {doc.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {doc.status === 'pending_admin_review' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveDocument(doc.id, doc.order_id)}
                          disabled={approvingDoc === doc.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {approvingDoc === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve for Client
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => rejectDocument(doc.id, doc.order_id)}
                          disabled={rejectingDoc === doc.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          {rejectingDoc === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Reject & Request Resubmit
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {doc.status === 'approved' && (
                      <Button
                        onClick={() => sendToClient(doc.id, doc.order_id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Approved Document to Client
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
