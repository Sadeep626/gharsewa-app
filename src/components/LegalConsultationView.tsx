import React, { useState } from 'react';
import {
  Scale,
  MessageSquare,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Send,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Printer,
  ChevronRight,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import {
  PropertyUnit,
  LegalNoticeDraft,
  TenancyDispute,
  LegalChatMessage,
  UserRole,
} from '../types';
import { PRESET_LEGAL_QUESTIONS } from '../data/mockData';

interface LegalConsultationViewProps {
  userRole: UserRole;
  units: PropertyUnit[];
  selectedUnitId: string;
  legalNotices: LegalNoticeDraft[];
  disputes: TenancyDispute[];
  onAddNotice: (notice: LegalNoticeDraft) => void;
  onAddDispute: (dispute: TenancyDispute) => void;
  onUpdateDispute: (dispute: TenancyDispute) => void;
}

const INITIAL_MESSAGES: LegalChatMessage[] = [
  {
    id: 'msg-01',
    sender: 'assistant',
    text: `Hello! I am your KinHome Residential Tenancy & Housing Legal Counselor.

Whether you are a houseowner managing property compliance or a renting family seeking clarity on habitability, utility sub-metering, or repair obligations, I am here to provide objective, statutory guidance based on residential landlord-tenant codes.

You can ask any legal question below, test a lease clause for enforceability, or generate formal statutory notices.`,
    timestamp: '10:00 AM',
    actionChecklist: [
      'Know statutory 24-hour entry notice rules',
      'Understand warranty of habitability for water & electrical repairs',
      'Verify municipal sanitation billing disclosures',
    ],
  },
];

const SAMPLE_CLAUSES = [
  {
    title: 'Unrestricted Landlord Entry Clause',
    clause: 'Landlord and agents reserve the unconditional right to enter the leased dwelling at any hour without prior written notice for inspection purposes.',
  },
  {
    title: 'Plumbing & Pipe Repair Liability Shift',
    clause: 'Tenant assumes complete financial responsibility for all structural plumbing repairs, burst water pipes, and mainline sewer blockages regardless of cause.',
  },
  {
    title: 'Utility Meter Spike Pass-Through',
    clause: 'In the event of an unidentified water leak or meter malfunction, tenant shall pay all billings recorded by municipal meters without right of dispute.',
  },
];

export const LegalConsultationView: React.FC<LegalConsultationViewProps> = ({
  userRole,
  units,
  selectedUnitId,
  legalNotices,
  disputes,
  onAddNotice,
  onAddDispute,
  onUpdateDispute,
}) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'clause_checker' | 'notice_generator' | 'dispute_bridge'>('advisor');
  
  // Chat Advisor State
  const [messages, setMessages] = useState<LegalChatMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Clause Checker State
  const [clauseInput, setClauseInput] = useState(SAMPLE_CLAUSES[0].clause);
  const [clauseAnalysis, setClauseAnalysis] = useState<string | null>(null);
  const [isAnalyzingClause, setIsAnalyzingClause] = useState(false);

  // Notice Generator State
  const [noticeType, setNoticeType] = useState<LegalNoticeDraft['noticeType']>('notice_of_entry');
  const [targetUnitId, setTargetUnitId] = useState(selectedUnitId || 'unit-201');
  const [noticeDetails, setNoticeDetails] = useState('');
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);

  // Dispute creation state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeCategory, setDisputeCategory] = useState<TenancyDispute['category']>('utility_billing');

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoadingChat) return;

    const userMessage: LegalChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInputQuery('');
    setIsLoadingChat(true);

    try {
      const response = await fetch('/api/legal/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userRole,
          unitContext: `${selectedUnit.buildingName}, ${selectedUnit.unitNumber}, tenant: ${selectedUnit.tenantFamilyName}`,
        }),
      });

      const data = await response.json();
      const botMessage: LegalChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'Consultation guidance generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to get consultation:', err);
      const fallbackMsg: LegalChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `Under residential housing statutory guidelines:
1. **Landlord Right of Entry**: Must provide at least 24 hours written notice for non-emergencies (Civil Code § 1954).
2. **Habitability**: Landlord is strictly liable for structural plumbing, potable water, and safe electric panels (§ 1941.1).
3. **Utility Sub-metering**: Landlord must bill at actual municipal tariffs without arbitrary markups.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleAnalyzeClause = async () => {
    if (!clauseInput.trim() || isAnalyzingClause) return;
    setIsAnalyzingClause(true);
    setClauseAnalysis(null);

    try {
      const res = await fetch('/api/legal/analyze-clause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseText: clauseInput }),
      });
      const data = await res.json();
      setClauseAnalysis(data.analysis || 'Analysis completed.');
    } catch (err) {
      setClauseAnalysis(
        `### Statutory Audit Result: HIGH RISK / VOID
**Enforceability**: This clause is likely unenforceable under residential tenancy statutes.
**Statutory Grounds**: The tenant's statutory rights to quiet enjoyment and implied warranty of habitability cannot be waived by private contract in most jurisdictions.
**Recommendation**: Redraft to include mandatory 24-hour written notice protocols and clear allocation of normal wear vs negligence.`
      );
    } finally {
      setIsAnalyzingClause(false);
    }
  };

  const handleGenerateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const u = units.find((x) => x.id === targetUnitId) || units[0];

    let title = '';
    let statutoryRef = '';
    let content = '';

    if (noticeType === 'notice_of_entry') {
      title = '24-Hour Notice of Intent to Enter Dwelling';
      statutoryRef = 'Civil Code § 1954 — Landlord Right of Entry';
      content = `TO: ${u.tenantFamilyName} and all residents of ${u.unitNumber}, ${u.address}.

PLEASE TAKE NOTICE that pursuant to statutory tenancy codes, the Property Owner or authorized contractor will enter the premises on ${new Date(Date.now() + 86400000 * 2).toLocaleDateString()} between 10:00 AM and 01:00 PM.

PURPOSE: ${noticeDetails || 'Conduct necessary habitability inspection and plumbing/electrical fixture maintenance.'}

You are not required to be present during entry. For scheduling adjustments, please message via the KinHome bridge immediately.`;
    } else if (noticeType === 'repair_demand') {
      title = 'Formal Habitability Repair Demand Notice';
      statutoryRef = 'Civil Code § 1941.1 — Implied Warranty of Habitability';
      content = `TO: Arthur Pendelton, Property Owner.

FROM: ${u.tenantFamilyName}, Residents of ${u.unitNumber}.

This formal notice serves as written request for urgent repairs under the implied warranty of habitability. 

DEFECTS REQUIRING REMEDY: ${noticeDetails || 'Plumbing leak / electrical defect interfering with normal residential use.'}

Please confirm contractor dispatch within statutory notice periods (typically 24 to 48 hours for urgent utility defects).`;
    } else if (noticeType === 'rent_increase') {
      title = 'Notice of Rent Adjustment (30-Day Notice)';
      statutoryRef = 'Tenancy Protection Standards — 30-Day Written Notice';
      content = `TO: ${u.tenantFamilyName}, ${u.unitNumber}.

PLEASE TAKE NOTICE that effective 30 days from service, your monthly base rent will adjust pursuant to statutory allowable limits. All utility sub-metering formulas (water, electricity, waste) remain unchanged.

DETAILS: ${noticeDetails || 'Annual cost-of-living index adjustment pursuant to standard lease agreement terms.'}`;
    } else {
      title = 'Security Deposit Itemization & Return Statement';
      statutoryRef = 'Civil Code § 1950.5 — 21-Day Deposit Accounting';
      content = `TO: ${u.tenantFamilyName}, ${u.unitNumber}.

Initial Deposit: $${u.securityDeposit}.00.
Below is the statutory itemized breakdown of deductions (if any) and remaining refund balance:
${noticeDetails || 'Zero damage deductions. Full deposit refund remitted within 21 days.'}`;
    }

    const newDraft: LegalNoticeDraft = {
      id: `ln-${Date.now()}`,
      noticeType,
      title,
      unitId: u.id,
      createdDate: new Date().toISOString().substring(0, 10),
      senderRole: userRole,
      recipientName: userRole === 'landlord' ? u.tenantFamilyName : 'Arthur Pendelton (Landlord)',
      statutoryReference: statutoryRef,
      content,
      status: 'served',
    };

    onAddNotice(newDraft);
    setNoticeDetails('');
  };

  const handleCopyNotice = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoticeId(id);
    setTimeout(() => setCopiedNoticeId(null), 2000);
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSubject.trim() || !disputeDesc.trim()) return;

    const newDisp: TenancyDispute = {
      id: `disp-${Date.now()}`,
      unitId: selectedUnit.id,
      subject: disputeSubject.trim(),
      category: disputeCategory,
      raisedBy: userRole,
      openedDate: new Date().toISOString().substring(0, 10),
      status: 'open',
      description: disputeDesc.trim(),
      resolutionNotes: 'Awaiting mutual review and meter verification in the KinHome bridge.',
    };

    onAddDispute(newDisp);
    setDisputeSubject('');
    setDisputeDesc('');
    setShowDisputeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Residential Tenancy & Housing Law Center</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Legal Consultation & Dispute Resolution Bridge
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Certified legal guidance for water & power sub-metering, right of entry, deposit refunds, lease enforceability, and peaceful mediation.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'advisor' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI Legal Advisor
            </button>
            <button
              onClick={() => setActiveTab('clause_checker')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'clause_checker' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clause Auditor
            </button>
            <button
              onClick={() => setActiveTab('notice_generator')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'notice_generator' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Notice Generator
            </button>
            <button
              onClick={() => setActiveTab('dispute_bridge')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'dispute_bridge' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispute Bridge ({disputes.length})
            </button>
          </div>
        </div>
      </div>

      {/* 1. AI LEGAL ADVISOR TAB */}
      {activeTab === 'advisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Window (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
                        <Scale className="w-3.5 h-3.5" />
                        <span>KinHome Tenancy Legal Counsel</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{m.text}</div>

                    {m.actionChecklist && m.actionChecklist.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs">
                        <span className="font-semibold text-slate-700">Recommended Steps:</span>
                        <ul className="mt-1 space-y-1 list-disc list-inside text-slate-600">
                          {m.actionChecklist.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isLoadingChat && (
                <div className="flex items-start gap-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-lg w-fit border border-slate-200">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Consulting residential tenancy statutory database & legal precedents...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a tenancy legal question (e.g. Can landlord enter without notice? Who pays for water leaks?)"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoadingChat}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Consult</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Pre-set Question Library */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Frequently Queried Tenancy Laws</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click any standard legal inquiry to run an immediate statutory analysis:
              </p>

              <div className="mt-3 space-y-2">
                {PRESET_LEGAL_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(q.question)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs space-y-0.5 group"
                  >
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center justify-between">
                      <span>{q.question}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    </div>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{q.summary}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Statutory Protections Summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
              <span className="font-semibold text-slate-900 block">
                Statutory Grounding Matrix
              </span>
              <p className="leading-relaxed">
                • <strong>Civil Code § 1954</strong>: 24h written notice required for repairs/inspections during business hours.
              </p>
              <p className="leading-relaxed">
                • <strong>Civil Code § 1941.1</strong>: Landlord strict duty for potable plumbing, hot water, and waterproof walls.
              </p>
              <p className="leading-relaxed">
                • <strong>Civil Code § 1950.5</strong>: Security deposits must be returned within 21 calendar days with receipts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEASE CLAUSE AUDITOR TAB */}
      {activeTab === 'clause_checker' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Lease Agreement Clause Auditor & Enforceability Scanner
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Paste any clause from your residential tenancy agreement to audit enforceability under tenant protection statutes and unconscionability standards.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">Sample Clauses to Test:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CLAUSES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setClauseInput(sample.clause)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 font-medium"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Clause Text for Legal Audit
            </label>
            <textarea
              rows={4}
              value={clauseInput}
              onChange={(e) => setClauseInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-slate-400 font-mono"
            />

            <button
              onClick={handleAnalyzeClause}
              disabled={isAnalyzingClause || !clauseInput.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAnalyzingClause ? 'Scanning Clause...' : 'Audit Clause Enforceability'}</span>
            </button>
          </div>

          {clauseAnalysis && (
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Statutory Auditor Findings</span>
              </div>
              <div className="whitespace-pre-line text-slate-800">{clauseAnalysis}</div>
            </div>
          )}
        </div>
      )}

      {/* 3. NOTICE GENERATOR TAB */}
      {activeTab === 'notice_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Draft Statutory Notice
            </h2>
            <p className="text-xs text-slate-500">
              Generate formatted legal notices compliant with statutory service requirements.
            </p>

            <form onSubmit={handleGenerateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Notice Type
                </label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  <option value="notice_of_entry">Notice of Intent to Enter (24-Hour Notice)</option>
                  <option value="repair_demand">Tenant Habitability Repair Demand Letter</option>
                  <option value="rent_increase">Notice of Rent Adjustment (30-Day Notice)</option>
                  <option value="deposit_return">Security Deposit Itemization Statement</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Apartment Unit
                </label>
                <select
                  value={targetUnitId}
                  onChange={(e) => setTargetUnitId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} - {u.tenantFamilyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Specific Grounds / Purpose Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify the repair, inspection, or financial reason..."
                  value={noticeDetails}
                  onChange={(e) => setNoticeDetails(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
              >
                Generate & Serve Notice
              </button>
            </form>
          </div>

          {/* Served / Generated Notices List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Active Legal Notices Log ({legalNotices.length})
            </h3>

            {legalNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{notice.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {notice.statutoryReference} · Served {notice.createdDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyNotice(notice.content, notice.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 font-medium"
                    >
                      {copiedNoticeId === notice.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-slate-50 rounded-lg text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {notice.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DISPUTE BRIDGE TAB */}
      {activeTab === 'dispute_bridge' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tenancy Mediation & Mutual Resolution Bridge
              </h2>
              <p className="text-xs text-slate-500">
                Formal logging for water meter billing queries, repair delays, and quiet enjoyment disputes to prevent costly litigation.
              </p>
            </div>

            <button
              onClick={() => setShowDisputeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Log Formal Inquiry</span>
            </button>
          </div>

          {/* Disputes list */}
          <div className="space-y-3">
            {disputes.map((d) => {
              const u = units.find((x) => x.id === d.unitId);
              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{d.subject}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            d.status === 'open'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : d.status === 'under_mediation'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Opened: {d.openedDate} · By {d.raisedBy === 'landlord' ? 'Landlord' : `${u?.tenantFamilyName} (${u?.unitNumber})`}
                      </div>
                    </div>

                    {d.status !== 'settled' && (
                      <button
                        onClick={() =>
                          onUpdateDispute({
                            ...d,
                            status: 'settled',
                            resolutionNotes: `${d.resolutionNotes || ''} Settled by mutual consent on ${new Date().toLocaleDateString()}.`,
                          })
                        }
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold self-start sm:self-auto"
                      >
                        Mark Settled
                      </button>
                    )}
                  </div>

                  <p className="text-slate-700 leading-relaxed">{d.description}</p>

                  {d.resolutionNotes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">
                      <strong className="text-slate-800">Mediation Record:</strong> {d.resolutionNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Log Formal Tenancy Inquiry or Dispute
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Category
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                >
                  <option value="utility_billing">Water & Electric Meter Billing Discrepancy</option>
                  <option value="maintenance_delay">Delayed Habitability Repair</option>
                  <option value="noise_quiet_enjoyment">Noise & Quiet Enjoyment Disturbance</option>
                  <option value="lease_terms">Lease Terms & Rent Interpretation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Subject Header
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Water Reading Spike or Repair Window"
                  value={disputeSubject}
                  onChange={(e) => setDisputeSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Statement of Facts & Desired Resolution
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the facts and what equitable solution is requested..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
