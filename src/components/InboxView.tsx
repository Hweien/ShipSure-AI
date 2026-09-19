import React, { useState } from "react";
import { 
  Inbox, 
  Search, 
  Filter, 
  Paperclip, 
  ArrowUpDown, 
  ExternalLink, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  FileText
} from "lucide-react";
import { EmailCategory, EmailRecord, ShipmentCase } from "../types";
import { datasetProvider } from "../services/datasetProvider";

interface InboxViewProps {
  emails: EmailRecord[];
  cases: ShipmentCase[];
  onSelectCase: (caseId: string) => void;
  onAskCopilotAboutEmail: (email: EmailRecord) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  emails,
  cases,
  onSelectCase,
  onAskCopilotAboutEmail
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [selectedAttachmentText, setSelectedAttachmentText] = useState<{ path: string; text: string } | null>(null);

  // Link cases to emails
  const filteredEmails = emails.filter((e) => {
    const relatedCase = cases.find((c) => c.emailId === e.email_id);
    const category = relatedCase ? relatedCase.category : "GENERAL";

    if (selectedCategory !== "ALL" && category !== selectedCategory) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSubject = e.subject.toLowerCase().includes(term);
      const matchFrom = (e.from || e.sender || "").toLowerCase().includes(term);
      const matchBody = e.body.toLowerCase().includes(term);
      const matchRef = relatedCase?.shipmentReference.toLowerCase().includes(term);
      return matchSubject || matchFrom || matchBody || matchRef;
    }

    return true;
  });

  const getCategoryBadge = (category: EmailCategory) => {
    switch (category) {
      case "BL_COMPARISON":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">BL Check</span>;
      case "SI_REQUEST":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">SI Request</span>;
      case "INVOICE_QUERY":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Invoice</span>;
      case "GENERAL":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">General</span>;
      case "SPAM":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600 border border-slate-300">Spam</span>;
    }
  };

  const openAttachment = (path: string) => {
    const text = datasetProvider.getAttachmentText(path);
    setSelectedAttachmentText({ path, text });
  };

  return (
    <div id="inbox-view" className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            Intelligent Operations Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming operational messages triaged by the Inbox Intelligence Agent into official hackathon categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sender, subject, reference..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "ALL", label: "All Messages", count: emails.length },
          { id: "BL_COMPARISON", label: "Document Checks (BL)", count: cases.filter(c => c.category === "BL_COMPARISON").length },
          { id: "SI_REQUEST", label: "SI Requests", count: cases.filter(c => c.category === "SI_REQUEST").length },
          { id: "INVOICE_QUERY", label: "Invoice Queries", count: cases.filter(c => c.category === "INVOICE_QUERY").length },
          { id: "GENERAL", label: "General", count: cases.filter(c => c.category === "GENERAL").length },
          { id: "SPAM", label: "Spam", count: cases.filter(c => c.category === "SPAM").length },
        ].map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emails Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-4">Subject / Case</th>
              <th className="py-3 px-4">Sender</th>
              <th className="py-3 px-4">AI Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Attachments</th>
              <th className="py-3 px-4">Received</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmails.map((e) => {
              const relatedCase = cases.find((c) => c.emailId === e.email_id);
              const category = relatedCase ? relatedCase.category : "GENERAL";
              const priority = relatedCase ? relatedCase.priorityScore : 10;

              return (
                <tr
                  key={e.email_id}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => setSelectedEmail(e)}
                >
                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-sm truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{e.subject}</span>
                    </div>
                    {relatedCase && (
                      <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                        Ref: {relatedCase.shipmentReference}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {e.from || e.sender}
                  </td>
                  <td className="py-3.5 px-4">
                    {getCategoryBadge(category)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className={`w-2 h-2 rounded-full ${
                        priority >= 80 ? "bg-red-500" : priority >= 50 ? "bg-amber-500" : "bg-slate-300"
                      }`} />
                      {priority}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {e.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        {e.attachments.length} file{e.attachments.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {category === "BL_COMPARISON" && relatedCase && (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onSelectCase(relatedCase.id);
                        }}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded transition border border-blue-200"
                      >
                        Verify SI vs BL
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Email Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  From: <span className="font-semibold text-slate-700">{selectedEmail.from || selectedEmail.sender}</span> • {selectedEmail.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Body */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {selectedEmail.body}
            </div>

            {/* Attachments Section */}
            {selectedEmail.attachments.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Attachments ({selectedEmail.attachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((att, i) => (
                    <button
                      key={i}
                      onClick={() => openAttachment(att)}
                      className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{att.split("/").pop()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  onAskCopilotAboutEmail(selectedEmail);
                  setSelectedEmail(null);
                }}
                className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <Bot className="w-4 h-4 text-blue-600" />
                <span>Ask ShipSure About This Email</span>
              </button>

              <div className="flex items-center gap-2">
                {cases.find((c) => c.emailId === selectedEmail.email_id && c.category === "BL_COMPARISON") && (
                  <button
                    onClick={() => {
                      const c = cases.find((item) => item.emailId === selectedEmail.email_id);
                      if (c) {
                        onSelectCase(c.id);
                        setSelectedEmail(null);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                  >
                    Open SI vs BL Verification
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Text Viewer Modal */}
      {selectedAttachmentText && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{selectedAttachmentText.path}</span>
              </div>
              <button
                onClick={() => setSelectedAttachmentText(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
              {selectedAttachmentText.text}
            </pre>
            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedAttachmentText(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
