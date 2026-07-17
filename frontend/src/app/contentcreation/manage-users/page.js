"use client";

import React, { useState, useEffect } from "react";
import {
    UserPlus, Trash2, Edit, Save, X, Search,
    Shield, ShieldCheck, Lock, BarChart3, Link2
} from "lucide-react";

export default function ManageUsersPage() {
    const defaultInsightsMetrics = {
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

    const normalizeInsightsMetrics = (raw) => {
        const safe = raw && typeof raw === "object" ? raw : {};
        const keyMetrics = Array.isArray(safe.key_metrics) ? safe.key_metrics.slice(0, 4) : [];
        while (keyMetrics.length < 4) {
            keyMetrics.push(defaultInsightsMetrics.key_metrics[keyMetrics.length]);
        }

        return {
            timeframe: safe.timeframe || defaultInsightsMetrics.timeframe,
            key_metrics: keyMetrics.map((metric, idx) => ({
                label: metric?.label || defaultInsightsMetrics.key_metrics[idx].label,
                value: metric?.value || defaultInsightsMetrics.key_metrics[idx].value,
                change: metric?.change || defaultInsightsMetrics.key_metrics[idx].change,
                period: metric?.period || defaultInsightsMetrics.key_metrics[idx].period,
            })),
            performance_snapshot: Array.isArray(safe.performance_snapshot) && safe.performance_snapshot.length > 0
                ? safe.performance_snapshot
                : defaultInsightsMetrics.performance_snapshot,
            opportunity_title: safe.opportunity_title || defaultInsightsMetrics.opportunity_title,
            opportunity_description: safe.opportunity_description || defaultInsightsMetrics.opportunity_description,
            focus_next_month: Array.isArray(safe.focus_next_month) && safe.focus_next_month.length > 0
                ? safe.focus_next_month
                : defaultInsightsMetrics.focus_next_month,
        };
    };

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
    const [editingUser, setEditingUser] = useState(null);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [editingInsightsUser, setEditingInsightsUser] = useState(null);

    // Social Accounts Connection State
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [socialModalUser, setSocialModalUser] = useState(null);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [isConnectingSocial, setIsConnectingSocial] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "CONTENT_CREATOR",
        password: "",
        access_permissions: {}
    });
    const [insightsFormData, setInsightsFormData] = useState(normalizeInsightsMetrics({}));

    const roles = [
        { value: "CONTENT_CREATOR", label: "Content Creator" },
        { value: "EDITOR", label: "Editor" },
        { value: "QA", label: "QA" },
        { value: "CLIENT", label: "Client" },
    ];

    const permissionSections = [
        { key: 'dashboards', label: 'Dashboards' },
        { key: 'content_production', label: 'Content Production' },
        { key: 'video_production', label: 'Video Production' },
        { key: 'submit_requests', label: 'Submit Requests' },
        { key: 'customization', label: 'Customization' },
        { key: 'your_insights', label: 'Your Insights' },
        { key: 'administration', label: 'Administration' },
    ];

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            setCurrentUserId(parseInt(userId));
        }
        fetchUsers();

        // Check for redirect success from Postproxy
        const params = new URLSearchParams(window.location.search);
        if (params.get('connect_success') === 'true') {
            alert("Red social vinculada exitosamente a través de Postproxy!");
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/users/manage/');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode("add");
        setEditingUser(null);
        setFormData({
            username: "",
            email: "",
            first_name: "",
            last_name: "",
            role: "CONTENT_CREATOR",
            password: "",
            access_permissions: {}
        });
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
            password: "", // Blank by default, only fill if changing
            access_permissions: user.access_permissions || {}
        });
        setIsModalOpen(true);
    };

    const handleInsightsEditClick = (user) => {
        setEditingInsightsUser(user);
        setInsightsFormData(normalizeInsightsMetrics(user.insights_metrics));
        setIsInsightsModalOpen(true);
    };

    const handleSocialEditClick = async (user) => {
        setSocialModalUser(user);
        setIsSocialModalOpen(true);
        fetchSocialAccounts(user.id);
    };

    const fetchSocialAccounts = async (userId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scheduler/social-accounts/?client_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setSocialAccounts(data);
            }
        } catch (error) {
            console.error("Error fetching social accounts:", error);
        }
    };

    const handleConnectNetwork = async (platform) => {
        setIsConnectingSocial(true);
        try {
            const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/scheduler/social-accounts/connect/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: socialModalUser.id,
                    platform: platform
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert("No se pudo obtener la URL de conexión.");
                }
            } else {
                const err = await response.json();
                alert(err.error || "Error al iniciar conexión.");
            }
        } catch (error) {
            console.error("Error connecting network:", error);
            alert("Error de conexión al servidor.");
        } finally {
            setIsConnectingSocial(false);
        }
    };


    const handleDeleteClick = async (userId) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/manage/${userId}/delete/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId));
                alert("User deleted successfully.");
            } else {
                alert("Failed to delete user.");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handlePermissionChange = (key, value) => {
        setFormData(prev => {
            const newPerms = { ...prev.access_permissions };
            if (value === 'default') {
                delete newPerms[key];
            } else {
                newPerms[key] = value === 'grant';
            }
            return { ...prev, access_permissions: newPerms };
        });
    };

    const getPermissionValue = (key) => {
        if (formData.access_permissions[key] === true) return 'grant';
        if (formData.access_permissions[key] === false) return 'revoke';
        return 'default';
    };

    const handleInsightMetricChange = (index, field, value) => {
        setInsightsFormData(prev => {
            const metrics = [...prev.key_metrics];
            metrics[index] = { ...metrics[index], [field]: value };
            return { ...prev, key_metrics: metrics };
        });
    };

    const handleInsightTextAreaChange = (field, value) => {
        const lines = value
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        setInsightsFormData(prev => ({
            ...prev,
            [field]: lines
        }));
    };

    const handleInsightsSubmit = async (e) => {
        e.preventDefault();
        if (!editingInsightsUser) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/manage/${editingInsightsUser.id}/update/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ insights_metrics: insightsFormData })
            });

            if (response.ok) {
                await fetchUsers();
                setIsInsightsModalOpen(false);
                setEditingInsightsUser(null);
                alert("Insights updated successfully!");
            } else {
                const err = await response.json();
                console.error(err);
                alert("Failed to update insights.");
            }
        } catch (error) {
            console.error("Error updating insights:", error);
            alert("Network error.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = modalMode === "add"
            ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/users/manage/add/'
            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/manage/${editingUser.id}/update/`;

        const method = modalMode === "add" ? 'POST' : 'PATCH';

        // Prepare payload (remove empty password if editing and not changing)
        const payload = { ...formData };
        if (modalMode === "edit" && !payload.password) {
            delete payload.password;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchUsers();
                setIsModalOpen(false);
                alert(`User ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
            } else {
                const err = await response.json();
                console.error(err);
                alert("Operation failed. Check console for details.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Network error.");
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="w-full flex flex-col px-0 py-2">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground">Manage Users</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Administer user accounts, roles, and permissions.</p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={20} className="text-primary-foreground" />
                        Add New User
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-card rounded-2xl p-6 flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* Search Bar */}
                    <div className="mb-4 relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading users...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-slate-500">No users found.</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="group hover:bg-indigo-50/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-foreground">{user.first_name} {user.last_name}</p>
                                                            {currentUserId === user.id && (
                                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`
                                                px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${user.role === 'CLIENT' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'QA' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-100 text-blue-700'}
                                            `}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">{user.email}</td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    {user.role === 'CLIENT' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleInsightsEditClick(user)}
                                                                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                                                                title="Edit Insights"
                                                            >
                                                                <BarChart3 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSocialEditClick(user)}
                                                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                                title="Manage Social Networks"
                                                            >
                                                                <Link2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteClick(user.id)}
                                                        disabled={currentUserId === user.id}
                                                        className={`p-2 rounded-lg transition-colors ${currentUserId === user.id ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-500'}`}
                                                        title={currentUserId === user.id ? "Cannot delete your own account" : "Delete User"}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-3 md:p-5 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl border border-border shadow-2xl w-[96vw] max-w-7xl h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 md:p-7 flex items-center justify-between text-primary-foreground border-b border-white/15">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {modalMode === 'add' ? <UserPlus size={24} className="text-primary-foreground" /> : <Edit size={24} className="text-primary-foreground" />}
                                {modalMode === 'add' ? "Add New User" : "Edit User"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="h-[calc(92vh-92px)] flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-min">

                            <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                        placeholder="Doe"
                                    />
                                </div>

                            <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Username *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Role *</label>
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none appearance-none"
                                    >
                                        {roles.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                    <ShieldCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Sidebar Permissions */}
                            <div className="space-y-3 p-5 bg-muted/40 rounded-2xl border border-border xl:col-span-2">
                                <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                    <Shield size={16} /> Sidebar Access Permissions
                                </h3>
                                <p className="text-xs text-muted-foreground mb-2">Override default role-based access for specific sections.</p>

                                <div className="grid grid-cols-1 gap-3">
                                    {permissionSections.map(section => (
                                        <div key={section.key} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                                            <span className="text-sm font-medium text-foreground">{section.label}</span>
                                            <select
                                                value={getPermissionValue(section.key)}
                                                onChange={(e) => handlePermissionChange(section.key, e.target.value)}
                                                className="bg-card border border-border text-xs rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                                            >
                                                <option value="default">Inherit (Role Default)</option>
                                                <option value="grant">Grant Access</option>
                                                <option value="revoke">Revoke Access</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border xl:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Lock size={12} />
                                    {modalMode === 'add' ? 'Password *' : 'Change Password (leave blank to keep)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    placeholder="••••••••"
                                    required={modalMode === 'add'}
                                />
                            </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 md:px-8 py-4 border-t border-border bg-card/95 backdrop-blur-sm flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} className="text-primary-foreground" />
                                    Save User
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {isInsightsModalOpen && editingInsightsUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-3 md:p-5 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl border border-border shadow-2xl w-[96vw] max-w-6xl h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 md:p-7 flex items-center justify-between text-white border-b border-white/15">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 size={24} />
                                Edit Insights for @{editingInsightsUser.username}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsInsightsModalOpen(false);
                                    setEditingInsightsUser(null);
                                }}
                                className="hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInsightsSubmit} className="h-[calc(90vh-92px)] flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Timeframe</label>
                                    <input
                                        type="text"
                                        value={insightsFormData.timeframe}
                                        onChange={(e) => setInsightsFormData({ ...insightsFormData, timeframe: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                        placeholder="Last 30 days"
                                    />
                                </div>

                                <div className="space-y-3 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Key Metrics</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {insightsFormData.key_metrics.map((metric, idx) => (
                                            <div key={`insights-metric-${idx}`} className="p-3 rounded-xl border border-border bg-card space-y-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase">Metric {idx + 1}</p>
                                                <input
                                                    type="text"
                                                    value={metric.label}
                                                    onChange={(e) => handleInsightMetricChange(idx, "label", e.target.value)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                                                    placeholder="Metric label"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={metric.value}
                                                        onChange={(e) => handleInsightMetricChange(idx, "value", e.target.value)}
                                                        className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                                                        placeholder="Value"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={metric.change}
                                                        onChange={(e) => handleInsightMetricChange(idx, "change", e.target.value)}
                                                        className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                                                        placeholder="+10%"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={metric.period}
                                                    onChange={(e) => handleInsightMetricChange(idx, "period", e.target.value)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                                                    placeholder="last month"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Performance Snapshot (1 per line)</label>
                                    <textarea
                                        rows={4}
                                        value={(insightsFormData.performance_snapshot || []).join("\n")}
                                        onChange={(e) => handleInsightTextAreaChange("performance_snapshot", e.target.value)}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Opportunity Title</label>
                                    <input
                                        type="text"
                                        value={insightsFormData.opportunity_title}
                                        onChange={(e) => setInsightsFormData({ ...insightsFormData, opportunity_title: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                        placeholder="Opportunity Insight"
                                    />
                                </div>

                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Opportunity Description</label>
                                    <textarea
                                        rows={3}
                                        value={insightsFormData.opportunity_description}
                                        onChange={(e) => setInsightsFormData({ ...insightsFormData, opportunity_description: e.target.value })}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1 p-5 bg-muted/40 rounded-2xl border border-border">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Focus For Next Month (1 per line)</label>
                                    <textarea
                                        rows={4}
                                        value={(insightsFormData.focus_next_month || []).join("\n")}
                                        onChange={(e) => handleInsightTextAreaChange("focus_next_month", e.target.value)}
                                        className="w-full p-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 md:px-8 py-4 border-t border-border bg-card/95 backdrop-blur-sm flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsInsightsModalOpen(false);
                                        setEditingInsightsUser(null);
                                    }}
                                    className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Insights
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSocialModalOpen && socialModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-3 md:p-5 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl border border-border shadow-2xl w-[96vw] max-w-2xl h-[70vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 md:p-7 flex items-center justify-between text-white border-b border-white/15">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Link2 size={24} />
                                Redes Sociales - @{socialModalUser.username}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsSocialModalOpen(false);
                                    setSocialModalUser(null);
                                }}
                                className="hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="h-[calc(70vh-92px)] flex flex-col p-6 md:p-8 space-y-6 overflow-y-auto">
                            <div>
                                <h3 className="text-sm font-bold text-foreground uppercase mb-3">Redes Vinculadas</h3>
                                {socialAccounts.length === 0 ? (
                                    <div className="text-center py-6 bg-muted/40 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                                        No hay redes sociales vinculadas a este cliente.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {socialAccounts.map(account => (
                                            <div key={account.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border">
                                                <div className="flex items-center gap-3">
                                                    {account.avatar_url ? (
                                                        <img src={account.avatar_url} alt={account.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                                            {account.platform.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{account.name}</p>
                                                        <p className="text-xs text-muted-foreground uppercase">{account.platform}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {account.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border pt-6">
                                <h3 className="text-sm font-bold text-foreground uppercase mb-3">Vincular Nueva Red</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        disabled={isConnectingSocial}
                                        onClick={() => handleConnectNetwork("linkedin")}
                                        className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                        </svg>
                                        LinkedIn
                                    </button>
                                    <button
                                        disabled={isConnectingSocial}
                                        onClick={() => handleConnectNetwork("instagram")}
                                        className="flex items-center justify-center gap-2 p-4 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                        </svg>
                                        Instagram
                                    </button>
                                    <button
                                        disabled={isConnectingSocial}
                                        onClick={() => handleConnectNetwork("tiktok")}
                                        className="flex items-center justify-center gap-2 p-4 bg-slate-900 hover:bg-slate-950 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.43-.43-.62-.67-.02 3.28.01 6.56-.01 9.84-.04 1.66-.56 3.37-1.68 4.6-1.52 1.73-4.01 2.58-6.26 2.1-2.6-.53-4.63-2.79-4.88-5.4-.33-3.04 1.73-6.02 4.74-6.53v4.07c-1.46.22-2.58 1.56-2.45 3.05.12 1.34 1.25 2.42 2.6 2.42 1.5 0 2.65-1.3 2.51-2.79.03-4.73.01-9.46.02-14.19-.01-.33.01-.67-.01-1z"/>
                                        </svg>
                                        TikTok
                                    </button>
                                </div>
                                {isConnectingSocial && (
                                    <p className="text-xs text-muted-foreground text-center mt-4 animate-pulse">Redireccionando al portal de autorización...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
