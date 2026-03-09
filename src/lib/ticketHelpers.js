export const TICKET_CATEGORIES = ['Order Issue', 'Document Problem', 'General Enquiry'];
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export const getPriorityColor = (p) => ({
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high:   'bg-amber-50 text-amber-600 border-amber-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
}[p] || 'bg-slate-100 text-slate-500 border-slate-200');

export const getStatusColor = (s) => ({
  open:          'bg-emerald-50 text-emerald-600 border-emerald-200',
  'in-progress': 'bg-orange-50 text-orange-600 border-orange-200',
  resolved:      'bg-purple-50 text-purple-600 border-purple-200',
  closed:        'bg-slate-100 text-slate-500 border-slate-200',
}[s] || 'bg-slate-100 text-slate-400 border-slate-200');
