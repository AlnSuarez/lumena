"use client";

import React, { useState, useEffect } from "react";
import { Link2, Trash2, Settings, ShieldCheck } from "lucide-react";

export default function ClientSettingsPage() {
    const [userRole, setUserRole] = useState('GUEST');
    const [userId, setUserId] = useState(null);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [isConnectingSocial, setIsConnectingSocial] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole') || 'GUEST';
        const uid = localStorage.getItem('userId');
        setUserRole(role);
        if (uid) {
            setUserId(parseInt(uid));
            fetchSocialAccounts(parseInt(uid));
        }

        // Check connect success redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('connect_success') === 'true') {
            alert("Red social vinculada exitosamente a través de Postproxy!");
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, []);

    const fetchSocialAccounts = async (cid) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scheduler/social-accounts/?client_id=${cid}`);
            if (response.ok) {
                const data = await response.json();
                setSocialAccounts(data);
            }
        } catch (error) {
            console.error("Error fetching social accounts:", error);
        }
    };

    const handleConnectNetwork = async (platform) => {
        if (!userId) {
            alert("Error: userId no encontrado en la sesión.");
            return;
        }
        setIsConnectingSocial(true);
        try {
            const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scheduler/social-accounts/connect/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: userId,
                    platform: platform,
                    next: '/contentcreation/client-settings'
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

    const handleDeleteAccount = async (id) => {
        if (!confirm("¿Estás seguro de que deseas desconectar esta red social?")) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scheduler/social-accounts/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSocialAccounts(socialAccounts.filter(acc => acc.id !== id));
                alert("Red social desconectada exitosamente.");
            } else {
                alert("No se pudo desconectar la red social.");
            }
        } catch (error) {
            console.error("Error deleting social account:", error);
            alert("Error al comunicarse con el servidor.");
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full animate-in fade-in duration-300">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0 relative overflow-hidden">
                {/* Header */}
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Settings className="text-primary animate-spin-slow" size={32} />
                        Client Settings
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage your account settings, connected integrations, and social media networks.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-8 pb-10">
                    {/* Social Media Connections Card */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <Link2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">My Social Networks</h2>
                                <p className="text-xs text-muted-foreground">Manage your connected social accounts to schedule posts.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-foreground uppercase mb-3 text-muted-foreground tracking-wider">Linked Accounts</h3>
                            {socialAccounts.length === 0 ? (
                                <div className="text-center py-8 bg-muted/40 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                                    No social networks connected yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {socialAccounts.map(account => (
                                        <div key={account.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border hover:bg-muted/70 transition-all">
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
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-center flex items-center">
                                                    {account.status}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-red-500 transition-colors"
                                                    title="Disconnect social network"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-bold text-foreground uppercase mb-3 text-muted-foreground tracking-wider">Connect New Network</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                <p className="text-xs text-muted-foreground text-center mt-4 animate-pulse">Redirecting to authorization portal...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
