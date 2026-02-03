"use client";

import React, { useState, useEffect } from "react";
import {
    Users, UserPlus, Trash2, Edit, Save, X, Search,
    Shield, ShieldCheck, Mail, Lock
} from "lucide-react";

export default function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
    const [editingUser, setEditingUser] = useState(null);

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
        { key: 'administration', label: 'Administration' },
    ];

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            setCurrentUserId(parseInt(userId));
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/users/manage/');
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

    const handleDeleteClick = async (userId) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const response = await fetch(`http://localhost:8000/api/users/manage/${userId}/delete/`, {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = modalMode === "add"
            ? 'http://localhost:8000/api/users/manage/add/'
            : `http://localhost:8000/api/users/manage/${editingUser.id}/update/`;

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
            <div className="bg-[#F3F0E9] rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-semibold text-black">Manage Users</h1>
                        <p className="text-slate-600 mt-1 text-sm">Administer user accounts, roles, and permissions.</p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="bg-[#192853] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#203163] transition-all flex items-center gap-2"
                    >
                        <UserPlus size={20} className="text-[#FFE14F]" />
                        Add New User
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl p-6 flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* Search Bar */}
                    <div className="mb-4 relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#192853]/10 focus:border-[#192853] outline-none transition-all text-[#192853]"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-4 px-4 text-sm font-bold text-[#5B75A9] uppercase tracking-wider">User</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-[#5B75A9] uppercase tracking-wider">Role</th>
                                    <th className="text-left py-4 px-4 text-sm font-bold text-[#5B75A9] uppercase tracking-wider">Email</th>
                                    <th className="text-right py-4 px-4 text-sm font-bold text-[#5B75A9] uppercase tracking-wider">Actions</th>
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
                                                    <div className="w-10 h-10 rounded-full bg-[#192853]/10 flex items-center justify-center text-[#192853] font-bold">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-[#192853]">{user.first_name} {user.last_name}</p>
                                                            {currentUserId === user.id && (
                                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500">@{user.username}</p>
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
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-[#192853] transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-[#192853] p-6 flex items-center justify-between text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {modalMode === 'add' ? <UserPlus size={24} className="text-[#FFE14F]" /> : <Edit size={24} className="text-[#FFE14F]" />}
                                {modalMode === 'add' ? "Add New User" : "Edit User"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Username *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Role *</label>
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none appearance-none"
                                    >
                                        {roles.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                    <ShieldCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Sidebar Permissions */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-[#192853] uppercase flex items-center gap-2">
                                    <Shield size={16} /> Sidebar Access Permissions
                                </h3>
                                <p className="text-xs text-slate-500 mb-2">Override default role-based access for specific sections.</p>

                                <div className="grid grid-cols-1 gap-3">
                                    {permissionSections.map(section => (
                                        <div key={section.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-700">{section.label}</span>
                                            <select
                                                value={getPermissionValue(section.key)}
                                                onChange={(e) => handlePermissionChange(section.key, e.target.value)}
                                                className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#192853]"
                                            >
                                                <option value="default">Inherit (Role Default)</option>
                                                <option value="grant">Grant Access</option>
                                                <option value="revoke">Revoke Access</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Lock size={12} />
                                    {modalMode === 'add' ? 'Password *' : 'Change Password (leave blank to keep)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#192853] outline-none"
                                    placeholder="••••••••"
                                    required={modalMode === 'add'}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-[#192853] text-white rounded-xl font-bold shadow-lg shadow-[#192853]/20 hover:bg-[#203163] transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} className="text-[#FFE14F]" />
                                    Save User
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
