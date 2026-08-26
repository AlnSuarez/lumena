"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Filter,
    AlertTriangle,
    Loader2,
    X,
    Trash2,
    CircleHelp,
    ChevronDown,
} from "lucide-react";
import "../assignments.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

const STATUS_OPTIONS = ["TO_DO", "IN_PROGRESS", "QA", "IN_REVISION", "CLIENT_REVIEW", "APPROVED", "DONE"];

const STATUS_LABELS = {
    TO_DO: "To Do",
    IN_PROGRESS: "In Progress",
    QA: "QA",
    IN_REVISION: "In Revision",
    CLIENT_REVIEW: "Client Review",
    APPROVED: "Approved",
    DONE: "Done",
};

const TYPE_OPTIONS = [
    { id: "ALL", label: "All" },
    { id: "MONTHLY_CONTENT", label: "Monthly" },
    { id: "VIDEO_SHOOT", label: "Video shoot" },
    { id: "CONTENT_REQUEST", label: "Request" },
];

const HEALTH_OPTIONS = [
    { id: "ALL", label: "All" },
    { id: "AT_RISK", label: "At risk" },
    { id: "UNASSIGNED_CREATOR", label: "No creator" },
    { id: "UNASSIGNED_QA", label: "No QA" },
    { id: "OVERDUE", label: "Overdue" },
];

const FLOW_STEPS = [
    { id: "filter", number: 1, name: "Filter", meaning: "Narrow by type, person, or health" },
    { id: "load", number: 2, name: "Load", meaning: "See who already has active work" },
    { id: "assign", number: 3, name: "Assign", meaning: "Set creator, QA, and stage" },
    { id: "open", number: 4, name: "Open", meaning: "Inspect a task or remove it" },
];

const PIPELINE_STAGES = [
    { id: "TO_DO", number: 1, name: "To Do", meaning: "Waiting to start" },
    { id: "IN_PROGRESS", number: 2, name: "In Progress", meaning: "Being created" },
    { id: "QA", number: 3, name: "QA", meaning: "Internal review" },
    { id: "IN_REVISION", number: 4, name: "In Revision", meaning: "Changes requested" },
    { id: "CLIENT_REVIEW", number: 5, name: "Client Review", meaning: "Waiting on client" },
    { id: "APPROVED", number: 6, name: "Approved", meaning: "Ready to schedule" },
    { id: "DONE", number: 7, name: "Done", meaning: "Published" },
];

function Toast({ message, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="as-toast">
            <AlertTriangle size={16} />
            {message}
            <button type="button" onClick={onClose} aria-label="Dismiss">
                <X size={14} />
            </button>
        </div>
    );
}

export default function AssignmentsPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [creatorStats, setCreatorStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("ALL");
    const [filterUser, setFilterUser] = useState("ALL");
    const [filterHealth, setFilterHealth] = useState("ALL");
    const [showFilter, setShowFilter] = useState(false);
    const [showLearn, setShowLearn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [savingKey, setSavingKey] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState(null);

    const loadAssignments = async (role, userId) => {
        const reqUrl = new URL(`${API_BASE}/contents/monthly-requests/`);
        reqUrl.searchParams.append("role", role);
        if (userId) reqUrl.searchParams.append("user_id", userId);

        const response = await fetch(reqUrl.toString());
        if (!response.ok) return [];
        return response.json();
    };

    useEffect(() => {
        const load = async () => {
            const role = localStorage.getItem("userRole") || "GUEST";
            const userId = localStorage.getItem("userId") || "";
            setCurrentUserId(userId);

            setLoading(true);
            try {
                const [requestsData, usersResponse, creatorStatsResponse] = await Promise.all([
                    loadAssignments(role, userId),
                    fetch(`${API_BASE}/users/manage/`),
                    fetch(`${API_BASE}/contents/creator-workload-stats/`),
                ]);

                setRequests(Array.isArray(requestsData) ? requestsData : []);
                if (usersResponse.ok) setUsers(await usersResponse.json());
                if (creatorStatsResponse.ok) setCreatorStats(await creatorStatsResponse.json());
            } catch (error) {
                console.error("Error loading assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const getDueDate = (req) => {
        if (!req?.month) return null;
        const monthDate = new Date(req.month);
        if (Number.isNaN(monthDate.getTime())) return null;
        return new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    };

    const formatDate = (value) => {
        if (!value) return "-";
        const dt = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(dt.getTime())) return "-";
        return dt.toLocaleDateString();
    };

    const isOverdue = (req) => {
        if (req.status === "DONE") return false;
        const dueDate = getDueDate(req);
        if (!dueDate) return false;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return dueDate < todayStart;
    };

    const getOverdueDays = (req) => {
        const dueDate = getDueDate(req);
        if (!dueDate) return 0;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const diffMs = todayStart.getTime() - dueDate.getTime();
        if (diffMs <= 0) return 0;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };

    const filtered = useMemo(() => {
        return requests.filter((req) => {
            const matchesType = filterType === "ALL" || req.request_type === filterType;
            const matchesUser =
                filterUser === "ALL" ||
                String(req.client_details?.id || "") === filterUser ||
                String(req.assigned_to_details?.id || "") === filterUser ||
                String(req.qa_assigned_to_details?.id || "") === filterUser;

            let matchesHealth = true;
            if (filterHealth === "UNASSIGNED_CREATOR") matchesHealth = !req.assigned_to_details;
            if (filterHealth === "UNASSIGNED_QA") matchesHealth = !req.qa_assigned_to_details;
            if (filterHealth === "OVERDUE") matchesHealth = isOverdue(req);
            if (filterHealth === "AT_RISK") matchesHealth = isOverdue(req) || !req.assigned_to_details || !req.qa_assigned_to_details;

            return matchesType && matchesUser && matchesHealth;
        });
    }, [requests, filterType, filterUser, filterHealth]);

    const creatorAssigned = filtered.filter((req) => !!req.assigned_to_details).length;
    const qaAssigned = filtered.filter((req) => !!req.qa_assigned_to_details).length;
    const creatorMissing = filtered.filter((req) => !req.assigned_to_details).length;
    const qaMissing = filtered.filter((req) => !req.qa_assigned_to_details).length;
    const overdueCount = filtered.filter((req) => isOverdue(req)).length;
    const creators = users.filter((u) => u.role === "CONTENT_CREATOR");
    const qaUsers = users.filter((u) => u.role === "QA");

    const qaWorkload = useMemo(() => {
        return qaUsers
            .map((qa) => {
                const active = requests.filter(
                    (req) =>
                        String(req.qa_assigned_to_details?.id || "") === String(qa.id) &&
                        req.status !== "DONE"
                ).length;
                return { id: qa.id, username: qa.username, active };
            })
            .sort((a, b) => b.active - a.active);
    }, [qaUsers, requests]);

    const formatDateTime = (value) => {
        if (!value) return "-";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return value;
        return dt.toLocaleString();
    };

    const refreshOnlyRequests = async () => {
        const role = localStorage.getItem("userRole") || "GUEST";
        const userId = localStorage.getItem("userId") || "";
        const data = await loadAssignments(role, userId);
        setRequests(Array.isArray(data) ? data : []);
    };

    const handleReassignCreator = async (requestId, creatorId) => {
        if (!creatorId) return;
        const key = `creator-${requestId}`;
        setSavingKey(key);
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/reassign/`);
            if (currentUserId) url.searchParams.append("user_id", currentUserId);
            const response = await fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creator_id: creatorId }),
            });
            if (response.ok) await refreshOnlyRequests();
            else setToast("Failed to reassign content creator.");
        } catch (error) {
            console.error("Error reassigning creator:", error);
            setToast("Network error while reassigning creator.");
        } finally {
            setSavingKey("");
        }
    };

    const handleReassignQa = async (requestId, qaId) => {
        if (!qaId) return;
        const key = `qa-${requestId}`;
        setSavingKey(key);
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/reassign-qa/`);
            if (currentUserId) url.searchParams.append("user_id", currentUserId);
            const response = await fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qa_id: qaId }),
            });
            if (response.ok) await refreshOnlyRequests();
            else setToast("Failed to reassign QA.");
        } catch (error) {
            console.error("Error reassigning QA:", error);
            setToast("Network error while reassigning QA.");
        } finally {
            setSavingKey("");
        }
    };

    const handleStatusChange = async (requestId, status) => {
        if (!status) return;
        const key = `status-${requestId}`;
        setSavingKey(key);
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/`);
            if (currentUserId) url.searchParams.append("user_id", currentUserId);
            const response = await fetch(url.toString(), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (response.ok) await refreshOnlyRequests();
            else setToast("Failed to update status.");
        } catch (error) {
            console.error("Error updating status:", error);
            setToast("Network error while updating status.");
        } finally {
            setSavingKey("");
        }
    };

    const handleDeleteRequest = async (requestId) => {
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/`);
            if (currentUserId) url.searchParams.append("user_id", currentUserId);
            const response = await fetch(url.toString(), {
                method: "DELETE",
            });
            if (response.ok) {
                await refreshOnlyRequests();
                setConfirmDeleteId(null);
            } else {
                setToast("Failed to delete task.");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            setToast("Network error while deleting task.");
        }
    };

    const activeFilterCount = [filterType !== "ALL", filterUser !== "ALL", filterHealth !== "ALL"].filter(Boolean).length;

    const toggleHealth = (id) => {
        setFilterHealth((prev) => (prev === id ? "ALL" : id));
    };

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        window.setTimeout(() => {
            if (stepId === "filter") setShowFilter(true);
            else document.getElementById(`as-${stepId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
    };

    const clientName = (req) =>
        req.client_details?.client_profile?.practice_name || req.client_details?.username || `Client #${req.client}`;

    return (
        <div className="assignments">
            <header className="as-header">
                <div className="as-header__titles">
                    <h1>Assignments</h1>
                    <p>See who owns each piece, fill gaps, and move it on the Content Board.</p>
                </div>
                <div className="as-header__actions">
                    <span className="as-chip">
                        <span className="as-chip__dot" />
                        Moves the board
                    </span>
                    {overdueCount > 0 && (
                        <span className="as-chip">
                            <span className="as-chip__dot is-due" />
                            {overdueCount} overdue
                        </span>
                    )}
                    <div className="as-filter">
                        <button
                            type="button"
                            className={`as-filter__trigger${showFilter ? " is-open" : ""}`}
                            onClick={() => setShowFilter((v) => !v)}
                        >
                            <Filter size={16} />
                            {filtered.length} tasks
                            {activeFilterCount > 0 && <span className="as-filter__count">{activeFilterCount}</span>}
                            <ChevronDown size={14} />
                        </button>
                        {showFilter && (
                            <>
                                <div className="as-filter__scrim" onClick={() => setShowFilter(false)} />
                                <div className="as-filter__panel" id="as-filter">
                                    <div className="as-filter__group">
                                        <label>Type</label>
                                        <div className="as-chips">
                                            {TYPE_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    className={`as-chip-opt${filterType === opt.id ? " is-on" : ""}`}
                                                    onClick={() => setFilterType(opt.id)}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="as-filter__group">
                                        <label htmlFor="as-filter-user">Person</label>
                                        <select
                                            id="as-filter-user"
                                            value={filterUser}
                                            onChange={(e) => setFilterUser(e.target.value)}
                                        >
                                            <option value="ALL">All people</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="as-filter__group">
                                        <label>Health</label>
                                        <div className="as-chips">
                                            {HEALTH_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    className={`as-chip-opt${filterHealth === opt.id ? " is-on" : ""}`}
                                                    onClick={() => setFilterHealth(opt.id)}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            className="as-btn as-btn--ghost as-filter__clear"
                                            onClick={() => {
                                                setFilterType("ALL");
                                                setFilterUser("ALL");
                                                setFilterHealth("ALL");
                                            }}
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        className={`as-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="as-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                </div>
            </header>

            {showLearn && (
                <div className="as-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        id="as-learn-panel"
                        className="as-learn"
                        role="dialog"
                        aria-labelledby="as-learn-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="as-learn__head">
                            <div>
                                <h2 id="as-learn-title">How assignments work</h2>
                                <p>This is the admin view of the board. Changing stage here moves the piece on the Content Board.</p>
                            </div>
                            <button type="button" className="as-icon-btn" onClick={() => setShowLearn(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="as-learn__label">On this page</p>
                        <nav className="as-flow" aria-label="Assignment steps">
                            {FLOW_STEPS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`as-flow__step${s.id === "assign" ? " is-active" : ""}`}
                                    onClick={() => handleFlowClick(s.id)}
                                >
                                    <div className="as-flow__top">
                                        <span className="as-flow__num">{s.number}</span>
                                        <span className="as-flow__name">{s.name}</span>
                                    </div>
                                    <p className="as-flow__meaning">{s.meaning}</p>
                                </button>
                            ))}
                        </nav>
                        <div className="as-destination">
                            <p className="as-learn__label">Content Board pipeline</p>
                            <div className="as-destination__track">
                                {PIPELINE_STAGES.map((stage) => (
                                    <div
                                        key={stage.id}
                                        className="as-dest is-here"
                                        data-stage={stage.id}
                                    >
                                        <div className="as-dest__top">
                                            <span className="as-dest__num">{stage.number}</span>
                                            <span className="as-dest__name">{stage.name}</span>
                                        </div>
                                        <p className="as-dest__meaning">{stage.meaning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="as-workspace">
                <div className="as-stats" id="as-filter-stats">
                    <button type="button" className="as-stat" onClick={() => setFilterHealth("ALL")}>
                        Creator assigned <b>{creatorAssigned}</b>
                    </button>
                    <button type="button" className="as-stat" onClick={() => setFilterHealth("ALL")}>
                        QA assigned <b>{qaAssigned}</b>
                    </button>
                    <button
                        type="button"
                        className={`as-stat is-warn${filterHealth === "UNASSIGNED_CREATOR" ? " is-on" : ""}`}
                        onClick={() => toggleHealth("UNASSIGNED_CREATOR")}
                    >
                        No creator <b>{creatorMissing}</b>
                    </button>
                    <button
                        type="button"
                        className={`as-stat is-warn${filterHealth === "UNASSIGNED_QA" ? " is-on" : ""}`}
                        onClick={() => toggleHealth("UNASSIGNED_QA")}
                    >
                        No QA <b>{qaMissing}</b>
                    </button>
                    <button
                        type="button"
                        className={`as-stat is-danger${filterHealth === "OVERDUE" ? " is-on" : ""}`}
                        onClick={() => toggleHealth("OVERDUE")}
                    >
                        Overdue <b>{overdueCount}</b>
                    </button>
                </div>

                <div className="as-loads" id="as-load">
                    <section className="as-load">
                        <h2>Creator workload</h2>
                        <div className="as-load__list">
                            {creatorStats.length === 0 ? (
                                <p className="as-empty">No data.</p>
                            ) : (
                                creatorStats.map((s) => (
                                    <div key={`creator-workload-${s.creator.id}`} className="as-load__row">
                                        <strong>{s.creator.username}</strong>
                                        <span>Active <b>{s.active_requests}</b></span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                    <section className="as-load">
                        <h2>QA workload</h2>
                        <div className="as-load__list">
                            {qaWorkload.length === 0 ? (
                                <p className="as-empty">No QA users.</p>
                            ) : (
                                qaWorkload.map((s) => (
                                    <div key={`qa-workload-${s.id}`} className="as-load__row">
                                        <strong>{s.username}</strong>
                                        <span>Active <b>{s.active}</b></span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <div className="as-table-wrap" id="as-assign">
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Client</th>
                                <th>Creator</th>
                                <th>QA</th>
                                <th>Stage</th>
                                <th>Due</th>
                                <th>SLA</th>
                                <th className="as-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="as-table-empty">Loading assignments...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="as-table-empty">No assignments found.</td>
                                </tr>
                            ) : (
                                filtered.map((req) => (
                                    <tr key={req.id}>
                                        <td>
                                            <button
                                                type="button"
                                                className="as-task"
                                                onClick={() => setSelectedRequest(req)}
                                                title="View task details"
                                                id={filtered[0]?.id === req.id ? "as-open" : undefined}
                                            >
                                                {req.notes || req.request_type}
                                            </button>
                                        </td>
                                        <td>{clientName(req)}</td>
                                        <td>
                                            <div className="as-cell-select">
                                                <select
                                                    value={req.assigned_to_details?.id || ""}
                                                    onChange={(e) => handleReassignCreator(req.id, e.target.value)}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {creators.map((creator) => (
                                                        <option key={`creator-opt-${creator.id}`} value={creator.id}>{creator.username}</option>
                                                    ))}
                                                </select>
                                                {savingKey === `creator-${req.id}` && <Loader2 size={14} className="as-spin" />}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="as-cell-select">
                                                <select
                                                    value={req.qa_assigned_to_details?.id || ""}
                                                    onChange={(e) => handleReassignQa(req.id, e.target.value)}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {qaUsers.map((qa) => (
                                                        <option key={`qa-opt-${qa.id}`} value={qa.id}>{qa.username}</option>
                                                    ))}
                                                </select>
                                                {savingKey === `qa-${req.id}` && <Loader2 size={14} className="as-spin" />}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="as-cell-select">
                                                <select
                                                    className="as-status"
                                                    data-stage={req.status}
                                                    value={req.status}
                                                    onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                                >
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <option key={`status-opt-${status}`} value={status}>
                                                            {STATUS_LABELS[status] || status}
                                                        </option>
                                                    ))}
                                                </select>
                                                {savingKey === `status-${req.id}` && <Loader2 size={14} className="as-spin" />}
                                            </div>
                                        </td>
                                        <td>{formatDate(getDueDate(req))}</td>
                                        <td>
                                            {isOverdue(req) ? (
                                                <span className="as-sla is-late">Overdue ({getOverdueDays(req)}d)</span>
                                            ) : (
                                                <span className="as-sla">On time</span>
                                            )}
                                        </td>
                                        <td className="as-actions">
                                            <button
                                                type="button"
                                                className="as-icon-btn is-danger"
                                                onClick={() => setConfirmDeleteId(req.id)}
                                                title="Delete task"
                                                aria-label="Delete task"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRequest && (
                <div className="as-overlay" onClick={() => setSelectedRequest(null)}>
                    <div
                        className="as-detail"
                        role="dialog"
                        aria-labelledby="as-detail-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="as-detail__head">
                            <div>
                                <h2 id="as-detail-title">Task details</h2>
                            </div>
                            <button type="button" className="as-icon-btn" onClick={() => setSelectedRequest(null)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="as-detail__body">
                            <div className="as-meta">
                                <p>Task</p>
                                <strong>{selectedRequest.notes || selectedRequest.request_type}</strong>
                            </div>
                            <div className="as-meta">
                                <p>Stage</p>
                                <span className="as-stage" data-stage={selectedRequest.status}>
                                    {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                                </span>
                            </div>
                            <div className="as-meta">
                                <p>Client</p>
                                <strong>{clientName(selectedRequest)}</strong>
                            </div>
                            <div className="as-meta">
                                <p>Request type</p>
                                <strong>{selectedRequest.request_type}</strong>
                            </div>
                            <div className="as-meta">
                                <p>Creator</p>
                                <strong>{selectedRequest.assigned_to_details?.username || "Unassigned"}</strong>
                            </div>
                            <div className="as-meta">
                                <p>QA</p>
                                <strong>{selectedRequest.qa_assigned_to_details?.username || "Unassigned"}</strong>
                            </div>
                            <div className="as-meta">
                                <p>Month</p>
                                <strong>{selectedRequest.month || "-"}</strong>
                            </div>
                            <div className="as-meta">
                                <p>Due date</p>
                                <strong>{formatDate(getDueDate(selectedRequest))}</strong>
                                {isOverdue(selectedRequest) && (
                                    <span className="as-sla is-late">
                                        {getOverdueDays(selectedRequest)} day(s) overdue
                                    </span>
                                )}
                            </div>
                            <div className="as-meta">
                                <p>Updated at</p>
                                <strong>{formatDateTime(selectedRequest.updated_at)}</strong>
                            </div>

                            {selectedRequest.linked_image_details?.image_url && (
                                <div className="as-meta is-wide">
                                    <p>Linked image</p>
                                    <img
                                        src={selectedRequest.linked_image_details.image_url}
                                        alt={selectedRequest.linked_image_details.title || "Linked image"}
                                    />
                                    <code>{selectedRequest.linked_image_details.folio || "-"}</code>
                                </div>
                            )}

                            {selectedRequest.content_text && (
                                <div className="as-meta is-wide">
                                    <p>Content text</p>
                                    <pre>{selectedRequest.content_text}</pre>
                                </div>
                            )}

                            {selectedRequest.ai_caption && (
                                <div className="as-meta is-wide">
                                    <p>AI caption</p>
                                    <pre>{selectedRequest.ai_caption}</pre>
                                </div>
                            )}

                            {selectedRequest.feedback && (
                                <div className="as-meta is-wide is-warn">
                                    <p>QA feedback</p>
                                    <pre>{selectedRequest.feedback}</pre>
                                </div>
                            )}

                            {Array.isArray(selectedRequest.history) && selectedRequest.history.length > 0 && (
                                <div className="as-meta is-wide">
                                    <p>Recent history</p>
                                    <div className="as-history">
                                        {selectedRequest.history.slice(0, 5).map((h) => (
                                            <div key={h.id}>
                                                <strong>{STATUS_LABELS[h.previous_status] || h.previous_status || "-"} → {STATUS_LABELS[h.new_status] || h.new_status}</strong>
                                                <small>
                                                    {formatDateTime(h.timestamp)}
                                                    {h.changed_by_details?.username ? ` by ${h.changed_by_details.username}` : ""}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteId && (
                <div className="as-overlay" onClick={() => setConfirmDeleteId(null)}>
                    <div className="as-dialog" role="dialog" aria-labelledby="as-delete-title" onClick={(e) => e.stopPropagation()}>
                        <h2 id="as-delete-title">Delete this task?</h2>
                        <p>This cannot be undone.</p>
                        <div className="as-dialog__actions">
                            <button type="button" className="as-btn as-btn--ghost" onClick={() => setConfirmDeleteId(null)}>
                                Cancel
                            </button>
                            <button type="button" className="as-btn as-btn--danger" onClick={() => handleDeleteRequest(confirmDeleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
