"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, User as UserIcon, AlertTriangle, Loader2, X, Trash2 } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;
const STATUS_OPTIONS = ["TO_DO", "IN_PROGRESS", "QA", "IN_REVISION", "CLIENT_REVIEW", "APPROVED", "DONE"];

const statusBadge = (status) => {
    const map = {
        TO_DO: "bg-slate-100 text-slate-700",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700",
        QA: "bg-purple-100 text-purple-700",
        IN_REVISION: "bg-orange-100 text-orange-700",
        CLIENT_REVIEW: "bg-blue-100 text-blue-700",
        APPROVED: "bg-teal-100 text-teal-700",
        DONE: "bg-emerald-100 text-emerald-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
};

const statusSelectClass = (status) => {
    const map = {
        TO_DO: "bg-slate-100 text-slate-700 border-slate-200",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-200",
        QA: "bg-purple-100 text-purple-700 border-purple-200",
        IN_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
        CLIENT_REVIEW: "bg-blue-100 text-blue-700 border-blue-200",
        APPROVED: "bg-teal-100 text-teal-700 border-teal-200",
        DONE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
};

export default function AssignmentsPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [creatorStats, setCreatorStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("ALL");
    const [filterUser, setFilterUser] = useState("ALL");
    const [filterHealth, setFilterHealth] = useState("ALL");
    const [currentUserId, setCurrentUserId] = useState("");
    const [savingKey, setSavingKey] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
            else alert("Failed to reassign content creator.");
        } catch (error) {
            console.error("Error reassigning creator:", error);
            alert("Network error while reassigning creator.");
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
            else alert("Failed to reassign QA.");
        } catch (error) {
            console.error("Error reassigning QA:", error);
            alert("Network error while reassigning QA.");
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
            else alert("Failed to update status.");
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Network error while updating status.");
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
                alert("Failed to delete task.");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Network error while deleting task.");
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <ClipboardList size={30} className="text-primary" />
                            Assignment Monitor
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Track which tasks are assigned to clients, content creators and QA.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground outline-none"
                            >
                                <option value="ALL">All Types</option>
                                <option value="MONTHLY_CONTENT">Monthly</option>
                                <option value="VIDEO_SHOOT">Video Shoot</option>
                                <option value="CONTENT_REQUEST">Request</option>
                            </select>
                        </div>

                        <div className="relative">
                            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground outline-none"
                            >
                                <option value="ALL">All Users</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <AlertTriangle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select
                                value={filterHealth}
                                onChange={(e) => setFilterHealth(e.target.value)}
                                className="pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground outline-none"
                            >
                                <option value="ALL">All Health</option>
                                <option value="AT_RISK">At Risk</option>
                                <option value="UNASSIGNED_CREATOR">No Creator</option>
                                <option value="UNASSIGNED_QA">No QA</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Creator assigned: {creatorAssigned}</span>
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">QA assigned: {qaAssigned}</span>
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">No creator: {creatorMissing}</span>
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700">No QA: {qaMissing}</span>
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">Overdue: {overdueCount}</span>
                </div>

                <div className="mb-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Creator Workload</p>
                        <div className="space-y-2 max-h-28 overflow-y-auto">
                            {creatorStats.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data.</p>
                            ) : (
                                creatorStats.map((s) => (
                                    <div key={`creator-workload-${s.creator.id}`} className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-foreground">{s.creator.username}</span>
                                        <span className="text-muted-foreground">Active: <b className="text-foreground">{s.active_requests}</b></span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">QA Workload</p>
                        <div className="space-y-2 max-h-28 overflow-y-auto">
                            {qaWorkload.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No QA users.</p>
                            ) : (
                                qaWorkload.map((s) => (
                                    <div key={`qa-workload-${s.id}`} className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-foreground">{s.username}</span>
                                        <span className="text-muted-foreground">Active: <b className="text-foreground">{s.active}</b></span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Task</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Client</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Content Creator</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">QA</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Due Date</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">SLA</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="py-8 text-center text-muted-foreground">Loading assignments...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" className="py-8 text-center text-muted-foreground">No assignments found.</td></tr>
                            ) : (
                                filtered.map((req) => (
                                    <tr key={req.id} className="border-b border-border/60 hover:bg-muted/40">
                                        <td className="py-3 px-4 text-foreground font-medium">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRequest(req)}
                                                className="max-w-[360px] truncate text-left hover:text-primary transition-colors"
                                                title="View task details"
                                            >
                                                {req.notes || req.request_type}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-foreground">{req.client_details?.client_profile?.practice_name || req.client_details?.username || `Client #${req.client}`}</td>
                                        <td className="py-3 px-4 text-foreground">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={req.assigned_to_details?.id || ""}
                                                    onChange={(e) => handleReassignCreator(req.id, e.target.value)}
                                                    className="w-full min-w-[170px] px-2 py-1.5 rounded-lg border border-border bg-background text-xs outline-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {creators.map((creator) => (
                                                        <option key={`creator-opt-${creator.id}`} value={creator.id}>{creator.username}</option>
                                                    ))}
                                                </select>
                                                {savingKey === `creator-${req.id}` && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={req.qa_assigned_to_details?.id || ""}
                                                    onChange={(e) => handleReassignQa(req.id, e.target.value)}
                                                    className="w-full min-w-[150px] px-2 py-1.5 rounded-lg border border-border bg-background text-xs outline-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {qaUsers.map((qa) => (
                                                        <option key={`qa-opt-${qa.id}`} value={qa.id}>{qa.username}</option>
                                                    ))}
                                                </select>
                                                {savingKey === `qa-${req.id}` && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                                    className={`w-full min-w-[145px] px-2 py-1.5 rounded-lg border text-xs font-bold outline-none ${statusSelectClass(req.status)}`}
                                                >
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <option key={`status-opt-${status}`} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                                {savingKey === `status-${req.id}` && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-foreground font-medium">
                                            {formatDate(getDueDate(req))}
                                        </td>
                                        <td className="py-3 px-4">
                                            {isOverdue(req) ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                    Overdue ({getOverdueDays(req)}d)
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">On time</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(req.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete task"
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
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl h-[85vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/95">
                            <h3 className="text-xl font-black text-foreground">Task Details</h3>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Task</p>
                                    <p className="text-foreground font-semibold">{selectedRequest.notes || selectedRequest.request_type}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(selectedRequest.status)}`}>{selectedRequest.status}</span>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Client</p>
                                    <p className="text-foreground font-semibold">
                                        {selectedRequest.client_details?.client_profile?.practice_name || selectedRequest.client_details?.username || `Client #${selectedRequest.client}`}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Request Type</p>
                                    <p className="text-foreground font-semibold">{selectedRequest.request_type}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Content Creator</p>
                                    <p className="text-foreground font-semibold">{selectedRequest.assigned_to_details?.username || "Unassigned"}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">QA</p>
                                    <p className="text-foreground font-semibold">{selectedRequest.qa_assigned_to_details?.username || "Unassigned"}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Month</p>
                                    <p className="text-foreground font-semibold">{selectedRequest.month || "-"}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Due Date</p>
                                    <p className="text-foreground font-semibold">{formatDate(getDueDate(selectedRequest))}</p>
                                    {isOverdue(selectedRequest) && (
                                        <p className="text-xs font-bold text-red-700 mt-1">
                                            {getOverdueDays(selectedRequest)} day(s) overdue
                                        </p>
                                    )}
                                </div>
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Updated At</p>
                                    <p className="text-foreground font-semibold">{formatDateTime(selectedRequest.updated_at)}</p>
                                </div>
                            </div>

                            {selectedRequest.linked_image_details?.image_url && (
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Linked Image</p>
                                    <div className="rounded-xl overflow-hidden border border-border bg-background">
                                        <img
                                            src={selectedRequest.linked_image_details.image_url}
                                            alt={selectedRequest.linked_image_details.title || "Linked image"}
                                            className="w-full max-h-[360px] object-contain"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 font-mono">{selectedRequest.linked_image_details.folio || "-"}</p>
                                </div>
                            )}

                            {selectedRequest.content_text && (
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Content Text</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRequest.content_text}</p>
                                </div>
                            )}

                            {selectedRequest.ai_caption && (
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">AI Caption</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRequest.ai_caption}</p>
                                </div>
                            )}

                            {selectedRequest.feedback && (
                                <div className="p-4 rounded-2xl border border-border bg-red-50">
                                    <p className="text-xs font-bold text-red-700 uppercase mb-2">QA Feedback</p>
                                    <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedRequest.feedback}</p>
                                </div>
                            )}

                            {Array.isArray(selectedRequest.history) && selectedRequest.history.length > 0 && (
                                <div className="p-4 rounded-2xl border border-border bg-secondary/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Recent History</p>
                                    <div className="space-y-2">
                                        {selectedRequest.history.slice(0, 5).map((h) => (
                                            <div key={h.id} className="text-xs p-2 rounded-lg border border-border bg-background">
                                                <p className="font-semibold text-foreground">{h.previous_status || "-"} {" -> "} {h.new_status}</p>
                                                <p className="text-muted-foreground">{formatDateTime(h.timestamp)}{h.changed_by_details?.username ? ` by ${h.changed_by_details.username}` : ""}</p>
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
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            Confirm Delete
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Are you sure you want to delete this task? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteRequest(confirmDeleteId)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
