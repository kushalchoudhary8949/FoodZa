import React, { useState } from 'react';
import { useStoreManager } from '../../context/StoreManagerContext';
import {
  MessageSquareWarning,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Send,
  User,
  Shield,
  Filter,
  Search,
  Bike,
  FileText,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { IssueCategory, IssuePriority, IssueTicket } from '../../types';

interface IssueBoxViewProps {
  initialOrderId?: string;
}

export const IssueBoxView: React.FC<IssueBoxViewProps> = ({ initialOrderId }) => {
  const {
    currentStore,
    currentManager,
    issues,
    createIssueTicket,
    addIssueMessage,
  } = useStoreManager();

  const [selectedIssue, setSelectedIssue] = useState<IssueTicket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(!!initialOrderId);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New ticket form state
  const [category, setCategory] = useState<IssueCategory>(
    initialOrderId ? 'ORDER_ISSUE' : 'DELIVERY_PARTNER_ISSUE'
  );
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [subject, setSubject] = useState(initialOrderId ? `Issue with Order #${initialOrderId}` : '');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [deliveryPartnerId, setDeliveryPartnerId] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Reply state for selected issue
  const [replyText, setReplyText] = useState('');

  if (!currentStore || !currentManager) return null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    createIssueTicket({
      category,
      priority,
      subject,
      description,
      orderId: orderId.trim() || undefined,
      deliveryPartnerId: deliveryPartnerId.trim() || undefined,
      attachments: attachmentName ? [attachmentName] : undefined,
    });

    // Reset & close
    setSubject('');
    setDescription('');
    setOrderId('');
    setDeliveryPartnerId('');
    setAttachmentName('');
    setIsCreateModalOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !replyText.trim()) return;

    addIssueMessage(selectedIssue.id, replyText);
    setReplyText('');

    // Update locally selected ticket view
    const updated = issues.find((i) => i.id === selectedIssue.id);
    if (updated) setSelectedIssue(updated);
  };

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        issue.id.toLowerCase().includes(q) ||
        issue.subject.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        (issue.orderId && issue.orderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Issue Box & Admin Escalations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Direct Admin Link
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Report rider delays, order conflicts, refunds, or system issues directly to Platform Ops.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Tickets ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'OPEN'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Open ({issues.filter((i) => i.status === 'OPEN').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            In Progress ({issues.filter((i) => i.status === 'IN_PROGRESS').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Resolved ({issues.filter((i) => i.status === 'RESOLVED').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, keyword..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No active issues recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All operations and delivery runs are smooth. If you encounter delayed riders or system glitches, report them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => {
            const isOpen = issue.status === 'OPEN';
            const isInProgress = issue.status === 'IN_PROGRESS';
            const isResolved = issue.status === 'RESOLVED';

            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{issue.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isOpen
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isInProgress
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {issue.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Subject */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
                      {issue.subject}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-medium">
                      {issue.category.replace(/_/g, ' ')}
                    </span>
                    {issue.orderId && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[10px] font-mono border border-amber-200 font-semibold">
                        Order #{issue.orderId}
                      </span>
                    )}
                    {issue.deliveryPartnerId && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-mono border border-blue-200 font-semibold">
                        Rider: {issue.deliveryPartnerId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  <span className="text-slate-600 font-semibold">
                    {issue.messages.length} message{issue.messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Ticket Conversation & Resolution Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    #{selectedIssue.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedIssue.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedIssue.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase border border-slate-200">
                    Priority: {selectedIssue.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedIssue.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-2">
              {/* Original Issue Description */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Store Manager ({currentManager.name})</span>
                  <span>{new Date(selectedIssue.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {selectedIssue.description}
                </p>
                {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                  <div className="pt-2 flex gap-2">
                    {selectedIssue.attachments.map((att, idx) => (
                      <span key={idx} className="text-[10px] text-amber-800 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-medium">
                        <Paperclip className="w-3 h-3" />
                        {att}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up messages */}
              {selectedIssue.messages.map((msg) => {
                const isAdmin = msg.senderRole === 'ADMIN';

                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs space-y-1 max-w-[85%] ${
                      isAdmin
                        ? 'bg-amber-50 border border-amber-200 ml-auto'
                        : 'bg-slate-50 border border-slate-200 mr-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={isAdmin ? 'text-amber-900' : 'text-slate-600'}>
                        {isAdmin ? '🛡️ Central Platform Admin' : `🏪 Manager (${msg.senderName})`}
                      </span>
                      <span className="text-slate-400 font-normal">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-200 flex gap-2 shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response or additional details to Admin..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create New Issue Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Report Issue to Admin</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="DELIVERY_PARTNER_ISSUE">Delivery Partner Issue</option>
                    <option value="ORDER_ISSUE">Order Issue / Conflict</option>
                    <option value="PAYMENT_ISSUE">Payment / Payout Issue</option>
                    <option value="SYSTEM_APP_ISSUE">System / App Issue</option>
                    <option value="OTHER">Other Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Urgency Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="LOW">Low - General Inquiry</option>
                    <option value="MEDIUM">Medium - Normal</option>
                    <option value="HIGH">High - Active Impact</option>
                    <option value="URGENT">Urgent - Immediate Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Delivery Partner delayed > 30 minutes for Order #FC1024"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. FC1024"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Delivery Partner ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryPartnerId}
                    onChange={(e) => setDeliveryPartnerId(e.target.value)}
                    placeholder="e.g. DP-882"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Issue Description & Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, timestamp, and how admin should intervene..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Attach Screenshot / Proof (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. rider_chat_screenshot.png or receipt.pdf"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentName('kitchen_evidence_' + Date.now() + '.jpg')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Simulate Attach
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
                >
                  [ SUBMIT ISSUE ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
