import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { FileText, Download, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { ErrorState } from '@/components/ErrorState';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';

const ReportsPage = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reportHistory, setReportHistory] = useState([]); // In real app, fetch from DB

  const templates = [
    { id: 'user_summary', name: 'User Summary Report', desc: 'Overview of user growth and roles.' },
    { id: 'activity', name: 'System Activity Report', desc: 'Audit logs and security events.' },
    { id: 'system_health', name: 'System Health Report', desc: 'Uptime and performance metrics.' },
  ];

  const handleGenerate = async (templateId) => {
    setGenerating(true);
    setError(null);
    try {
      // Fetch data based on template
      let data = [];
      let headers = [];
      let title = '';

      if (templateId === 'user_summary') {
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('email, role, company_name, created_at');
        if (profileError) throw profileError;
        data = profiles.map(p => [p.email, p.role, p.company_name, format(new Date(p.created_at), 'yyyy-MM-dd')]);
        headers = [['Email', 'Role', 'Company', 'Joined Date']];
        title = 'User Summary Report';
      } else if (templateId === 'activity') {
        const { data: logs, error: logsError } = await supabase.from('activity_logs').select('created_at, action, details, status').limit(50);
        if (logsError) throw logsError;
        data = logs?.map(l => [format(new Date(l.created_at), 'Pp'), l.action, l.details, l.status]) || [];
        headers = [['Timestamp', 'Action', 'Details', 'Status']];
        title = 'Activity Report';
      } else {
        // Mock data for system health
        data = [['Database', 'Connected', '12ms'], ['Auth Service', 'Active', '-'], ['Storage', 'Available', '45% Used']];
        headers = [['Component', 'Status', 'Metrics']];
        title = 'System Health Report';
      }

      // Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
      
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] } // Orange header
      });

      doc.save(`${templateId}_${Date.now()}.pdf`);

      // Add to history (mock)
      setReportHistory(prev => [{
        id: Date.now(),
        name: title,
        date: new Date(),
        format: 'PDF'
      }, ...prev]);

    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ControlCentreLayout>
      <Helmet>
        <title>Reports - Ghost Portal</title>
      </Helmet>

      {error && (
        <div className="mb-6 bg-red-950/30 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-400 font-medium">Error generating report</p>
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports Center</h1>
          <p className="text-gray-400">Generate and download system reports.</p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-[#FF6B35] transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-4 group-hover:bg-[#FF6B35]/10 group-hover:text-[#FF6B35] transition-colors text-gray-400">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{template.desc}</p>
              
              <button
                onClick={() => handleGenerate(template.id)}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-gray-800"
              >
                {generating ? <Loader2 className="animate-spin w-4 h-4" /> : <Download size={16} />}
                Generate PDF
              </button>
            </div>
          ))}
        </div>

        {/* Report History */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white">Recent Reports</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs uppercase">
                <th className="p-4">Report Name</th>
                <th className="p-4">Date Generated</th>
                <th className="p-4">Format</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {reportHistory.length > 0 ? (
                reportHistory.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-900/50">
                    <td className="p-4 text-white font-medium">{report.name}</td>
                    <td className="p-4 text-gray-400">{format(report.date, 'PP p')}</td>
                    <td className="p-4"><span className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded text-xs border border-red-800">PDF</span></td>
                    <td className="p-4 text-right">
                       <button className="text-[#FF6B35] hover:underline text-xs">Re-download</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No reports generated in this session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ControlCentreLayout>
  );
};

export default ReportsPage;