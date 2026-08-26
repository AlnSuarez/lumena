"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    UserPlus, Trash2, Edit, Save, X, Search, Users,
    Shield, BarChart3, Link2
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./manage-users.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_INSIGHTS = {
    timeframe: "Last 30 days",
    key_metrics: [
        { label: "Reach", value: "0", change: "+0%", period: "last month" },
        { label: "Saves", value: "0", change: "+0%", period: "last month" },
        { label: "Save Rate", value: "0%", change: "+0%", period: "last month" },
        { label: "Profile Visits", value: "0", change: "+0%", period: "last month" },
    ],
    performance_snapshot: [
        "Posting consistency: On track",
        "Content focus: Educational + Authority",
        "Engagement trend: Improving",
        "Platform focus: Primary focus on Instagram",
    ],
    opportunity_title: "Opportunity Insight",
    opportunity_description: "Add a short opportunity insight for this client.",
    focus_next_month: [
        "Define next month priority #1",
        "Define next month priority #2",
        "Define next month priority #3",
    ],
};

const ROLES = [
    { value: "CONTENT_CREATOR", label: "Content Creator" },
    { value: "EDITOR", label: "Editor" },
    { value: "QA", label: "QA" },
    { value: "CLIENT", label: "Client" },
];

const ROLE_FILTERS = [
    { id: "ALL", label: "All", meaning: "Everyone in the workspace" },
    { id: "CONTENT_CREATOR", label: "Creators", meaning: "Make content" },
    { id: "EDITOR", label: "Editors", meaning: "Edit video" },
    { id: "QA", label: "QA", meaning: "Review work" },
    { id: "CLIENT", label: "Clients", meaning: "Client accounts" },
];

const PERMISSION_SECTIONS = [
    { key: "dashboards", label: "Overview (Content Board)" },
    { key: "submit_requests", label: "Create (requests & plans)" },
    { key: "content_production", label: "Produce (monthly & QA)" },
    { key: "video_production", label: "Video production" },
    { key: "customization", label: "Workspace" },
    { key: "your_insights", label: "Client insights" },
    { key: "administration", label: "Admin" },
];


const ROLE_LABELS = {
    CONTENT_CREATOR: "Content Creator",
    EDITOR: "Editor",
    QA: "QA",
    CLIENT: "Client",
    SUPERUSER: "Superuser",
};

function normalizeInsightsMetrics(raw) {
    const safe = raw && typeof raw === "object" ? raw : {};
    const keyMetrics = Array.isArray(safe.key_metrics) ? safe.key_metrics.slice(0, 4) : [];
    while (keyMetrics.length < 4) {
        keyMetrics.push(DEFAULT_INSIGHTS.key_metrics[keyMetrics.length]);
    }

    return {
        timeframe: safe.timeframe || DEFAULT_INSIGHTS.timeframe,
        key_metrics: keyMetrics.map((metric, idx) => ({
            label: metric?.label || DEFAULT_INSIGHTS.key_metrics[idx].label,
            value: metric?.value || DEFAULT_INSIGHTS.key_metrics[idx].value,
            change: metric?.change || DEFAULT_INSIGHTS.key_metrics[idx].change,
            period: metric?.period || DEFAULT_INSIGHTS.key_metrics[idx].period,
        })),
        performance_snapshot: Array.isArray(safe.performance_snapshot) && safe.performance_snapshot.length > 0
            ? safe.performance_snapshot
            : DEFAULT_INSIGHTS.performance_snapshot,
        opportunity_title: safe.opportunity_title || DEFAULT_INSIGHTS.opportunity_title,
        opportunity_description: safe.opportunity_description || DEFAULT_INSIGHTS.opportunity_description,
        focus_next_month: Array.isArray(safe.focus_next_month) && safe.focus_next_month.length > 0
            ? safe.focus_next_month
            : DEFAULT_INSIGHTS.focus_next_month,
    };
}

function displayName(user) {
    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.username;
}

function emptyUserForm() {
    return {
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "CONTENT_CREATOR",
        password: "",
        access_permissions: {},
    };
}

export default function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [editingUser, setEditingUser] = useState(null);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [editingInsightsUser, setEditingInsightsUser] = useState(null);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [socialModalUser, setSocialModalUser] = useState(null);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [isConnectingSocial, setIsConnectingSocial] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState(emptyUserForm());
    const [insightsFormData, setInsightsFormData] = useState(normalizeInsightsMetrics({}));

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) setCurrentUserId(parseInt(userId, 10));
        fetchUsers();

        const params = new URLSearchParams(window.location.search);
        if (params.get("connect_success") === "true") {
            toast.success("Social network connected.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const response = await fetch(`${API_BASE}/api/users/manage/`);
            if (response.ok) {
                setUsers(await response.json());
            } else {
                setUsers([]);
                setLoadError(true);
                toast.error("Could not load users.");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
            setLoadError(true);
            toast.error("Network error while loading users.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode("add");
        setEditingUser(null);
        setFormData(emptyUserForm());
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setModalMode("edit");
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            role: user.role,
            password: "",
            access_permissions: user.access_permissions || {},
        });
        setIsModalOpen(true);
    };

    const handleInsightsEditClick = (user) => {
        setEditingInsightsUser(user);
        setInsightsFormData(normalizeInsightsMetrics(user.insights_metrics));
        setIsInsightsModalOpen(true);
    };

    const fetchSocialAccounts = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/api/scheduler/social-accounts/?client_id=${userId}`);
            if (response.ok) setSocialAccounts(await response.json());
        } catch (error) {
            console.error("Error fetching social accounts:", error);
        }
    };

    const handleSocialEditClick = async (user) => {
        setSocialModalUser(user);
        setIsSocialModalOpen(true);
        fetchSocialAccounts(user.id);
    };

    const handleConnectNetwork = async (platform) => {
        setIsConnectingSocial(true);
        try {
            const response = await fetch(`${API_BASE}/api/scheduler/social-accounts/connect/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: socialModalUser.id,
                    platform,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.url) window.location.href = data.url;
                else toast.error("Could not get the connection URL.");
            } else {
                const err = await response.json();
                toast.error(err.error || "Could not start the connection.");
            }
        } catch (error) {
            console.error("Error connecting network:", error);
            toast.error("Network error while connecting.");
        } finally {
            setIsConnectingSocial(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE}/api/users/manage/${deletingUser.id}/delete/`, {
                method: "DELETE",
            });
            if (response.ok || response.status === 204) {
                setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
                setDeletingUser(null);
                toast.success("User deleted.");
            } else {
                toast.error("Could not delete this user.");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Network error while deleting.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePermissionChange = (key, value) => {
        setFormData((prev) => {
            const newPerms = { ...prev.access_permissions };
            if (value === "default") delete newPerms[key];
            else newPerms[key] = value === "grant";
            return { ...prev, access_permissions: newPerms };
        });
    };

    const getPermissionValue = (key) => {
        if (formData.access_permissions[key] === true) return "grant";
        if (formData.access_permissions[key] === false) return "revoke";
        return "default";
    };

    const handleInsightMetricChange = (index, field, value) => {
        setInsightsFormData((prev) => {
            const metrics = [...prev.key_metrics];
            metrics[index] = { ...metrics[index], [field]: value };
            return { ...prev, key_metrics: metrics };
        });
    };

    const handleInsightTextAreaChange = (field, value) => {
        const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
        setInsightsFormData((prev) => ({ ...prev, [field]: lines }));
    };

    const handleInsightsSubmit = async (e) => {
        e.preventDefault();
        if (!editingInsightsUser) return;

        try {
            const response = await fetch(`${API_BASE}/api/users/manage/${editingInsightsUser.id}/update/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ insights_metrics: insightsFormData }),
            });

            if (response.ok) {
                await fetchUsers();
                setIsInsightsModalOpen(false);
                setEditingInsightsUser(null);
                toast.success("Insights updated.");
            } else {
                toast.error("Could not update insights.");
            }
        } catch (error) {
            console.error("Error updating insights:", error);
            toast.error("Network error.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = modalMode === "add"
            ? `${API_BASE}/api/users/manage/add/`
            : `${API_BASE}/api/users/manage/${editingUser.id}/update/`;
        const payload = { ...formData };
        if (modalMode === "edit" && !payload.password) delete payload.password;

        try {
            const response = await fetch(url, {
                method: modalMode === "add" ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await fetchUsers();
                setIsModalOpen(false);
                toast.success(modalMode === "add" ? "User added." : "User updated.");
            } else {
                toast.error("Could not save this user.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Network error.");
        }
    };

    const counts = useMemo(() => ({
        total: users.length,
        creators: users.filter((u) => u.role === "CONTENT_CREATOR").length,
        editors: users.filter((u) => u.role === "EDITOR").length,
        qa: users.filter((u) => u.role === "QA").length,
        clients: users.filter((u) => u.role === "CLIENT").length,
    }), [users]);

    const filteredUsers = users.filter((user) => {
        if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
        const q = searchTerm.toLowerCase();
        if (!q) return true;
        return (
            user.username.toLowerCase().includes(q)
            || (user.first_name && user.first_name.toLowerCase().includes(q))
            || (user.last_name && user.last_name.toLowerCase().includes(q))
            || (user.email && user.email.toLowerCase().includes(q))
        );
    });

    const chipCounts = {
        ALL: counts.total,
        CONTENT_CREATOR: counts.creators,
        EDITOR: counts.editors,
        QA: counts.qa,
        CLIENT: counts.clients,
    };

    return (
        <div className="content-board manage-users">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Manage Users</h1>
                    <p>Accounts, roles, and who can see each part of the workspace.</p>
                </div>
                <div className="cb-header__actions">
                    <button type="button" className="cb-btn cb-btn--primary" onClick={handleAddClick}>
                        <UserPlus size={16} />
                        Add user
                    </button>
                </div>
            </div>

            <div className="cb-summary">
                {ROLE_FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        type="button"
                        className={`cb-chip${roleFilter === filter.id ? " is-active" : ""}`}
                        onClick={() => setRoleFilter(filter.id)}
                    >
                        <span>{filter.label}<small>{filter.meaning}</small></span>
                        <strong>{chipCounts[filter.id]}</strong>
                    </button>
                ))}
            </div>

            <div className="mu-toolbar">
                <div className="mu-search">
                    <Search size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name, username, or email"
                        aria-label="Search users"
                    />
                </div>
            </div>

            <div className="mu-panel">
                {isLoading ? (
                    <div className="cb-empty">
                        <strong>Loading users…</strong>
                    </div>
                ) : loadError ? (
                    <div className="cb-empty">
                        <div className="cb-empty__icon"><Users size={18} /></div>
                        <strong>Could not load users</strong>
                        <p>Sign in with an admin account, then try again.</p>
                        <button type="button" className="cb-btn cb-btn--ghost" onClick={fetchUsers}>Retry</button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="cb-empty">
                        <div className="cb-empty__icon"><Search size={18} /></div>
                        <strong>No users found</strong>
                        <p>{users.length === 0 ? "Add the first account to this workspace." : "Try another search or role filter."}</p>
                    </div>
                ) : (
                    <table className="mu-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="mu-user">
                                            <span className="mu-avatar">{(user.username || "?").charAt(0).toUpperCase()}</span>
                                            <div>
                                                <strong>
                                                    {displayName(user)}
                                                    {currentUserId === user.id && <span className="mu-you">You</span>}
                                                </strong>
                                                <span className="mu-handle">@{user.username}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="mu-badge" data-role={user.role}>
                                            {ROLE_LABELS[user.role] || user.role.replaceAll("_", " ")}
                                        </span>
                                    </td>
                                    <td className="mu-email">{user.email || "—"}</td>
                                    <td>
                                        <div className="mu-actions">
                                            <button type="button" className="mu-icon-btn" onClick={() => handleEditClick(user)} title="Edit user" aria-label="Edit user">
                                                <Edit size={15} />
                                            </button>
                                            {user.role === "CLIENT" && (
                                                <>
                                                    <button type="button" className="mu-icon-btn" onClick={() => handleInsightsEditClick(user)} title="Edit insights" aria-label="Edit insights">
                                                        <BarChart3 size={15} />
                                                    </button>
                                                    <button type="button" className="mu-icon-btn" onClick={() => handleSocialEditClick(user)} title="Social networks" aria-label="Social networks">
                                                        <Link2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                className="mu-icon-btn mu-icon-btn--danger"
                                                onClick={() => setDeletingUser(user)}
                                                disabled={currentUserId === user.id}
                                                title={currentUserId === user.id ? "You cannot delete your own account" : "Delete user"}
                                                aria-label="Delete user"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="cb-overlay">
                    <div className="mu-dialog">
                        <div className="mu-dialog__head">
                            <div>
                                <h2>{modalMode === "add" ? "Add user" : "Edit user"}</h2>
                                <p>{modalMode === "add" ? "Create an account and set access." : `Update @${editingUser?.username}.`}</p>
                            </div>
                            <button type="button" className="cb-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mu-dialog__scroll">
                                <div className="mu-form-grid">
                                    <div className="cb-field">
                                        <label htmlFor="mu-first">First name</label>
                                        <input id="mu-first" type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="John" />
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="mu-last">Last name</label>
                                        <input id="mu-last" type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Doe" />
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="mu-username">Username</label>
                                        <input id="mu-username" type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="johndoe" required />
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="mu-email">Email</label>
                                        <input id="mu-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="mu-role">Role</label>
                                        <select id="mu-role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                            {ROLES.map((role) => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="mu-password">{modalMode === "add" ? "Password" : "New password"}</label>
                                        <input
                                            id="mu-password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={modalMode === "add" ? "Required" : "Leave blank to keep"}
                                            required={modalMode === "add"}
                                        />
                                    </div>
                                    <div className="cb-field mu-span-2">
                                        <label><Shield size={12} /> Sidebar access</label>
                                        <p className="mu-hint">Override the default access for this role. Leave inherit unless you need an exception.</p>
                                        <div className="mu-perm-list">
                                            {PERMISSION_SECTIONS.map((section) => (
                                                <div key={section.key} className="mu-perm">
                                                    <span>{section.label}</span>
                                                    <select value={getPermissionValue(section.key)} onChange={(e) => handlePermissionChange(section.key, e.target.value)}>
                                                        <option value="default">Inherit</option>
                                                        <option value="grant">Grant</option>
                                                        <option value="revoke">Revoke</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="cb-dialog__actions">
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="cb-btn cb-btn--primary"><Save size={15} /> Save user</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isInsightsModalOpen && editingInsightsUser && (
                <div className="cb-overlay">
                    <div className="mu-dialog mu-dialog--wide">
                        <div className="mu-dialog__head">
                            <div>
                                <h2>Edit insights</h2>
                                <p>What @{editingInsightsUser.username} sees on their insights page.</p>
                            </div>
                            <button type="button" className="cb-icon-btn" onClick={() => { setIsInsightsModalOpen(false); setEditingInsightsUser(null); }} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleInsightsSubmit}>
                            <div className="mu-dialog__scroll">
                                <div className="cb-field">
                                    <label htmlFor="mu-timeframe">Timeframe</label>
                                    <input id="mu-timeframe" type="text" value={insightsFormData.timeframe} onChange={(e) => setInsightsFormData({ ...insightsFormData, timeframe: e.target.value })} />
                                </div>
                                <div className="cb-field">
                                    <label>Key metrics</label>
                                    <div className="mu-metrics">
                                        {insightsFormData.key_metrics.map((metric, idx) => (
                                            <div key={`metric-${idx}`} className="mu-metric">
                                                <p>Metric {idx + 1}</p>
                                                <input type="text" value={metric.label} onChange={(e) => handleInsightMetricChange(idx, "label", e.target.value)} placeholder="Label" />
                                                <div className="mu-metric-row">
                                                    <input type="text" value={metric.value} onChange={(e) => handleInsightMetricChange(idx, "value", e.target.value)} placeholder="Value" />
                                                    <input type="text" value={metric.change} onChange={(e) => handleInsightMetricChange(idx, "change", e.target.value)} placeholder="+10%" />
                                                </div>
                                                <input type="text" value={metric.period} onChange={(e) => handleInsightMetricChange(idx, "period", e.target.value)} placeholder="last month" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="mu-snapshot">Performance snapshot</label>
                                    <textarea id="mu-snapshot" rows={4} value={(insightsFormData.performance_snapshot || []).join("\n")} onChange={(e) => handleInsightTextAreaChange("performance_snapshot", e.target.value)} />
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="mu-opp-title">Opportunity title</label>
                                    <input id="mu-opp-title" type="text" value={insightsFormData.opportunity_title} onChange={(e) => setInsightsFormData({ ...insightsFormData, opportunity_title: e.target.value })} />
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="mu-opp-desc">Opportunity description</label>
                                    <textarea id="mu-opp-desc" rows={3} value={insightsFormData.opportunity_description} onChange={(e) => setInsightsFormData({ ...insightsFormData, opportunity_description: e.target.value })} />
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="mu-focus">Focus for next month</label>
                                    <textarea id="mu-focus" rows={4} value={(insightsFormData.focus_next_month || []).join("\n")} onChange={(e) => handleInsightTextAreaChange("focus_next_month", e.target.value)} />
                                </div>
                            </div>
                            <div className="cb-dialog__actions">
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => { setIsInsightsModalOpen(false); setEditingInsightsUser(null); }}>Cancel</button>
                                <button type="submit" className="cb-btn cb-btn--primary"><Save size={15} /> Save insights</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSocialModalOpen && socialModalUser && (
                <div className="cb-overlay">
                    <div className="mu-dialog mu-dialog--narrow">
                        <div className="mu-dialog__head">
                            <div>
                                <h2>Social networks</h2>
                                <p>Connected accounts for @{socialModalUser.username}.</p>
                            </div>
                            <button type="button" className="cb-icon-btn" onClick={() => { setIsSocialModalOpen(false); setSocialModalUser(null); }} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="mu-dialog__body">
                            <div className="mu-dialog__scroll">
                                <div className="cb-field">
                                    <label>Linked accounts</label>
                                    {socialAccounts.length === 0 ? (
                                        <div className="cb-empty">
                                            <strong>None linked</strong>
                                            <p>Connect a network below.</p>
                                        </div>
                                    ) : (
                                        socialAccounts.map((account) => (
                                            <div key={account.id} className="mu-social">
                                                <div className="mu-social__who">
                                                    {account.avatar_url ? (
                                                        <img src={account.avatar_url} alt="" />
                                                    ) : (
                                                        <span className="mu-social__mark">{account.platform.charAt(0).toUpperCase()}</span>
                                                    )}
                                                    <div>
                                                        <strong>{account.name}</strong>
                                                        <span>{account.platform}</span>
                                                    </div>
                                                </div>
                                                <span className="mu-badge" data-role="CLIENT">{account.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="cb-field">
                                    <label>Connect a network</label>
                                    <div className="mu-connect">
                                        <button type="button" className="mu-connect--linkedin" disabled={isConnectingSocial} onClick={() => handleConnectNetwork("linkedin")}>LinkedIn</button>
                                        <button type="button" className="mu-connect--instagram" disabled={isConnectingSocial} onClick={() => handleConnectNetwork("instagram")}>Instagram</button>
                                        <button type="button" className="mu-connect--tiktok" disabled={isConnectingSocial} onClick={() => handleConnectNetwork("tiktok")}>TikTok</button>
                                    </div>
                                    {isConnectingSocial && <p className="mu-note">Redirecting to authorization…</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deletingUser && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon"><Trash2 size={20} /></div>
                                <div>
                                    <h3>Delete user</h3>
                                    <p>This cannot be undone.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Remove <strong>{displayName(deletingUser)}</strong> (@{deletingUser.username})?
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setDeletingUser(null)} disabled={isDeleting}>Cancel</button>
                            <button type="button" className="cb-btn cb-btn--danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
