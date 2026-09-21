import React, {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  ShieldCheck,
  Cpu,
  ChevronRight,
  Printer,
  Clock,
} from "lucide-react";

import {
  AgentEvent,
  getAgentEvents,
} from "../services/orchestrationClient.ts";

import { ShipmentCase } from "../types";

interface AgentActivityViewProps {
  cases: ShipmentCase[];
  onOpenCase: (caseId: string) => void;
}

export const AgentActivityView:
  React.FC<AgentActivityViewProps> = ({
    cases,
    onOpenCase,
  }) => {
    // ------------------------------------------------------------
    // Selected shipment case
    // ------------------------------------------------------------

    const [
      selectedCaseId,
      setSelectedCaseId,
    ] = useState<string>(
      cases[0]?.id || ""
    );

    const activeCase =
      cases.find(
        (c) =>
          c.id === selectedCaseId
      ) || cases[0];

    // ------------------------------------------------------------
    // Real backend agent events
    // ------------------------------------------------------------

    const [
      events,
      setEvents,
    ] = useState<AgentEvent[]>([]);

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      loadError,
      setLoadError,
    ] = useState<string | null>(
      null
    );

    // ------------------------------------------------------------
    // Cases may arrive asynchronously from /api/cases.
    // Automatically select the first real case once available.
    // ------------------------------------------------------------

    useEffect(() => {
      if (
        cases.length > 0 &&
        !cases.some(
          (c) =>
            c.id === selectedCaseId
        )
      ) {
        setSelectedCaseId(
          cases[0].id
        );
      }
    }, [
      cases,
      selectedCaseId,
    ]);

    // ------------------------------------------------------------
    // Load real orchestration events whenever selected case changes
    // ------------------------------------------------------------

    useEffect(() => {
      let cancelled = false;

      async function loadEvents() {
        if (!selectedCaseId) {
          setEvents([]);
          return;
        }

        try {
          setLoading(true);
          setLoadError(null);

          const result =
            await getAgentEvents(
              selectedCaseId
            );

          if (!cancelled) {
            setEvents(
              Array.isArray(result)
                ? result
                : []
            );
          }
        } catch (error: any) {
          console.error(
            "Failed to load agent events:",
            error
          );

          if (!cancelled) {
            setEvents([]);

            setLoadError(
              error?.message ||
                "Unable to load agent activity."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadEvents();

      return () => {
        cancelled = true;
      };
    }, [selectedCaseId]);

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------

    const getStatusBadge = (
      status: string
    ) => {
      switch (status) {
        case "completed":
          return (
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
              Completed
            </span>
          );

        case "requires_review":
          return (
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
              Human Review
            </span>
          );

        case "started":
          return (
            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
              Started
            </span>
          );

        default:
          return (
            <span className="text-[10px] text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase">
              {status || "Unknown"}
            </span>
          );
      }
    };

    const formatAgentName = (
      agent: string
    ) => {
      return agent
        .replace(/_/g, " ")
        .replace(
          /\b\w/g,
          (char) =>
            char.toUpperCase()
        );
    };

    const formatTimestamp = (
      timestamp: string
    ) => {
      const date =
        new Date(timestamp);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return timestamp;
      }

      return date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    };

    const comparedFieldCount =
      activeCase
        ?.fieldComparisons
        ?.length ?? 0;

    // ------------------------------------------------------------
    // No cases yet
    // ------------------------------------------------------------

    if (!activeCase) {
      return (
        <div
          id="agent-activity-view"
          className="p-6 max-w-7xl mx-auto"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />

            <h2 className="text-sm font-bold text-slate-800">
              No processed cases yet
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Agent activity will appear
              after ShipSure processes a
              shipment case.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        id="agent-activity-view"
        className="p-6 space-y-6 max-w-7xl mx-auto"
      >
        {/* ======================================================
            Header
        ====================================================== */}

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />

            Agent Activity Traces
            & AI Decision Passport
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Structured operational
            audit trail of agent
            actions, evidence,
            decisions, and handoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ====================================================
              LEFT:
              Real multi-agent activity
          ==================================================== */}

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">

            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between gap-3">

              <span>
                Autonomous Execution
                Trail for{" "}
                {
                  activeCase
                    .shipmentReference
                }
              </span>

              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200 whitespace-nowrap">
                Live Audit Stream
              </span>
            </h2>

            <div className="space-y-3">

              {/* Loading */}

              {loading && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                  Loading agent
                  activity...
                </div>
              )}

              {/* Error */}

              {!loading &&
                loadError && (
                  <div className="p-4 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200">
                    {loadError}
                  </div>
                )}

              {/* Real events */}

              {!loading &&
                !loadError &&
                events.length > 0 &&
                events.map(
                  (trace) => (
                    <div
                      key={
                        trace.id
                      }
                      className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 transition text-xs space-y-2 bg-slate-50/50"
                    >

                      {/* Agent + time */}

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2 font-bold text-slate-800">

                          <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />

                          <span>
                            {formatAgentName(
                              trace.agent
                            )}
                          </span>

                          <span className="text-[10px] text-slate-400 font-normal">
                            •{" "}
                            {
                              activeCase
                                .shipmentReference
                            }
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 whitespace-nowrap">

                          <Clock className="w-3 h-3" />

                          {formatTimestamp(
                            trace.timestamp
                          )}
                        </span>
                      </div>

                      {/* Action */}

                      <div className="font-semibold text-slate-700 text-[11px]">
                        Action:{" "}
                        {
                          trace.action
                        }
                      </div>

                      {/* Summary */}

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {
                          trace.summary
                        }
                      </p>

                      {/* Handoff */}

                      {trace.handoffTo && (
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800">

                          <div className="font-semibold">
                            Handoff →{" "}
                            {formatAgentName(
                              trace.handoffTo
                            )}
                          </div>

                          {trace.handoffReason && (
                            <div className="mt-0.5 text-blue-700">
                              {
                                trace.handoffReason
                              }
                            </div>
                          )}
                        </div>
                      )}

                      {/* Evidence */}

                      {trace.evidence &&
                        Object.keys(
                          trace.evidence
                        ).length >
                          0 && (
                          <details className="mt-1">

                            <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700 font-medium">
                              View evidence
                            </summary>

                            <pre className="mt-1 p-2 bg-slate-100 rounded text-[9px] text-slate-600 overflow-x-auto whitespace-pre-wrap break-words">
                              {JSON.stringify(
                                trace.evidence,
                                null,
                                2
                              )}
                            </pre>

                          </details>
                        )}

                      {/* Footer */}

                      <div className="pt-1 flex items-center justify-between gap-3">

                        {getStatusBadge(
                          trace.status
                        )}

                        <button
                          onClick={() =>
                            onOpenCase(
                              activeCase.id
                            )
                          }
                          className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>
                            Inspect Details
                          </span>

                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                )}

              {/* No events */}

              {!loading &&
                !loadError &&
                events.length ===
                  0 && (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    No recorded
                    orchestration events
                    for this shipment yet.
                  </div>
                )}
            </div>
          </div>

          {/* ====================================================
              RIGHT:
              Decision Passport
          ==================================================== */}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">

            <div>

              {/* Header */}

              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">

                <div className="flex items-center gap-2">

                  <ShieldCheck className="w-5 h-5 text-emerald-600" />

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      AI Decision
                      Passport
                    </h3>

                    <p className="text-[10px] text-slate-500">
                      Verification &
                      orchestration record
                    </p>
                  </div>
                </div>

                <select
                  value={
                    selectedCaseId
                  }
                  onChange={(e) =>
                    setSelectedCaseId(
                      e.target.value
                    )
                  }
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 text-slate-800 cursor-pointer max-w-[150px]"
                >
                  {cases.map(
                    (c) => (
                      <option
                        key={
                          c.id
                        }
                        value={
                          c.id
                        }
                      >
                        {
                          c.shipmentReference
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-3 text-xs">

                {/* Passport ID */}

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">

                  <div className="text-[11px] text-slate-500 font-medium">
                    Passport
                    Identifier
                  </div>

                  <div className="font-mono text-xs font-bold text-slate-900 break-all">
                    PASSPORT-
                    {
                      activeCase.id
                    }
                    -V
                    {
                      activeCase
                        .blVersion ??
                      1
                    }
                  </div>

                  {activeCase.receivedDate && (
                    <div className="text-[10px] text-slate-400">
                      Recorded:{" "}
                      {new Date(
                        activeCase.receivedDate
                      ).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Verification outcome */}

                <div className="space-y-1.5">

                  <div className="font-semibold text-slate-700">
                    Verification
                    Outcome:
                  </div>

                  <div className="font-bold text-slate-900 flex items-center gap-1.5">

                    {activeCase.verificationStatus ===
                    "MISMATCH" ? (
                      <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                        Defects
                        Confirmed
                      </span>
                    ) : activeCase.verificationStatus ===
                      "NEEDS_REVIEW" ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        Human Review
                        Required
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        Verification
                        Passed
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}

                <div className="space-y-1">
                  <div className="font-semibold text-slate-700">
                    Email
                    Classification:
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    {
                      activeCase.category
                    }
                  </div>
                </div>

                {/* Audit source */}

                <div className="space-y-1">

                  <div className="font-semibold text-slate-700">
                    Audit Source:
                  </div>

                  <div className="font-mono text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded">
                    ShipSure
                    deterministic
                    verification &
                    orchestration engine
                  </div>
                </div>

                {/* Field comparison count */}

                <div className="space-y-1">

                  <div className="font-semibold text-slate-700">
                    Verification
                    Fields Audited:
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    {
                      comparedFieldCount
                    }{" "}
                    of 7 core fields
                    produced comparison
                    results.
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Shipper,
                    Consignee, Notify
                    Party, Port of
                    Loading, Port of
                    Discharge,
                    Container Count,
                    Gross Weight.
                  </div>
                </div>

                {/* Defects */}

                {activeCase
                  .defectFields &&
                  activeCase
                    .defectFields
                    .length >
                    0 && (
                    <div className="space-y-1">

                      <div className="font-semibold text-slate-700">
                        Defect
                        Fields:
                      </div>

                      <div className="flex flex-wrap gap-1">

                        {activeCase.defectFields.map(
                          (
                            field
                          ) => (
                            <span
                              key={
                                field
                              }
                              className="text-[10px] bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5"
                            >
                              {
                                field
                              }
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Review reason */}

                {activeCase.reviewReason && (
                  <div className="space-y-1">

                    <div className="font-semibold text-slate-700">
                      Review
                      Reason:
                    </div>

                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      {
                        activeCase.reviewReason
                      }
                    </div>
                  </div>
                )}

                {/* Event count */}

                <div className="space-y-1">

                  <div className="font-semibold text-slate-700">
                    Recorded Agent
                    Events:
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    {
                      events.length
                    }{" "}
                    structured
                    orchestration
                    events.
                  </div>
                </div>

                {/* Auditability */}

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-900 text-[11px]">

                  <strong>
                    Auditability:
                  </strong>{" "}

                  Available
                  extraction
                  evidence,
                  verification
                  results, agent
                  actions, handoffs,
                  and human-review
                  decisions can be
                  retained for
                  inspection.
                </div>
              </div>
            </div>

            {/* ==================================================
                Footer actions
            ================================================== */}

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">

              <button
                onClick={() =>
                  onOpenCase(
                    activeCase.id
                  )
                }
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Inspect SI vs BL

                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  window.print()
                }
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />

                <span>
                  Print
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };