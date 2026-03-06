export const TICKET_CATEGORIES = ['Order Issue', 'Document Problem', 'General Enquiry'];
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export const getPriorityColor = (p) => ({
  low: 'bg-slate-800 text-slate-400 border-slate-700',
  medium: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  high: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
  urgent: 'bg-red-900/30 text-red-400 border-red-800/50',
}[p] || 'bg-slate-800 text-slate-400 border-slate-700');

export const getStatusColor = (s) => ({
  open: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
  'in-progress': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
  resolved: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
  closed: 'bg-slate-800 text-slate-500 border-slate-700',
}[s] || 'bg-slate-800 text-slate-400 border-slate-700');
