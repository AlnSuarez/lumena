"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Instagram,
    Linkedin,
    Music,
    RefreshCw,
    Settings,
    Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./client-settings.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLATFORMS = [
    { id: "ALL", label: "All", meaning: "Every linked account" },
    { id: "linkedin", label: "LinkedIn", meaning: "Professional feed" },
    { id: "instagram", label: "Instagram", meaning: "Photos and reels" },
    { id: "tiktok", label: "TikTok", meaning: "Short video" },
];

const CONNECT = [
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "tiktok", label: "TikTok", icon: Music },
];

function platformKey(account) {
    return String(account?.platform || "").toLowerCase();
}

export default function ClientSettingsPage() {
    const [userId, setUserId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [platformFilter, setPlatformFilter] = useState("ALL");
    const [isConnecting, setIsConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadAccounts = async (cid, { silent = false } = {}) => {
        if (!cid) {
            setLoading(false);
            return;
        }
        if (silent) setRefreshing(true);
        else setLoading(true);
        setLoadError(false);

        try {
            const response = await fetch(
                `${API_BASE}/api/scheduler/social-accounts/?client_id=${cid}`
            );
            if (!response.ok) {
                toast.error("Could not load social networks.");
                setAccounts([]);
                setLoadError(true);
                return;
            }
            setAccounts(await response.json());
        } catch (error) {
            console.error("Error fetching social accounts:", error);
            toast.error("Network error while loading accounts.");
            setAccounts([]);
            setLoadError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const uid = localStorage.getItem("userId");
        if (uid) {
            const parsed = parseInt(uid, 10);
            setUserId(parsed);
            loadAccounts(parsed);
        } else {
            setLoading(false);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("connect_success") === "true") {
            toast.success("Social network connected.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleConnect = async (platform) => {
        if (!userId) {
            toast.error("Session is missing a user id.");
            return;
        }
        setIsConnecting(true);
        try {
            const response = await fetch(`${API_BASE}/api/scheduler/social-accounts/connect/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: userId,
                    platform,
                    next: "/contentcreation/client-settings",
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.url) window.location.href = data.url;
                else toast.error("Could not get the connection URL.");
            } else {
                const err = await response.json().catch(() => ({}));
                toast.error(err.error || "Could not start the connection.");
            }
        } catch (error) {
            console.error("Error connecting network:", error);
            toast.error("Network error while connecting.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!disconnecting) return;
        setIsDeleting(true);
        try {
            const response = await fetch(
                `${API_BASE}/api/scheduler/social-accounts/${disconnecting.id}/`,
                { method: "DELETE" }
            );
            if (response.ok || response.status === 204) {
                setAccounts((prev) => prev.filter((acc) => acc.id !== disconnecting.id));
                setDisconnecting(null);
                toast.success("Social network disconnected.");
            } else {
                toast.error("Could not disconnect this network.");
            }
        } catch (error) {
            console.error("Error deleting social account:", error);
            toast.error("Network error while disconnecting.");
        } finally {
            setIsDeleting(false);
        }
    };

    const counts = useMemo(() => ({
        ALL: accounts.length,
        linkedin: accounts.filter((acc) => platformKey(acc) === "linkedin").length,
        instagram: accounts.filter((acc) => platformKey(acc) === "instagram").length,
        tiktok: accounts.filter((acc) => platformKey(acc) === "tiktok").length,
    }), [accounts]);

    const filtered = platformFilter === "ALL"
        ? accounts
        : accounts.filter((acc) => platformKey(acc) === platformFilter);

    return (
        <div className="content-board client-settings">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Social networks</h1>
                    <p>Connect the accounts used to schedule and publish your content.</p>
                </div>
                <div className="cb-header__actions">
                    <button
                        type="button"
                        className="cb-btn cb-btn--ghost"
                        onClick={() => loadAccounts(userId, { silent: true })}
                        disabled={loading || refreshing || !userId}
                    >
                        <RefreshCw size={15} />
                        {refreshing || loading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="cb-summary">
                {PLATFORMS.map((platform) => (
                    <button
                        key={platform.id}
                        type="button"
                        className={`cb-chip${platformFilter === platform.id ? " is-active" : ""}`}
                        onClick={() => setPlatformFilter(platform.id)}
                    >
                        <span>{platform.label}<small>{platform.meaning}</small></span>
                        <strong>{counts[platform.id]}</strong>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="cb-empty"><strong>Loading accounts…</strong></div>
            ) : (
                <div className="cs-panel">
                    <section className="cs-section">
                        <h2>Linked accounts</h2>
                        {loadError ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Settings size={18} /></div>
                                <strong>Could not load accounts</strong>
                                <p>Try again in a moment. Your session stays signed in.</p>
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => loadAccounts(userId)}>
                                    Retry
                                </button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Settings size={18} /></div>
                                <strong>{accounts.length === 0 ? "No networks connected" : "Nothing in this filter"}</strong>
                                <p>
                                    {accounts.length === 0
                                        ? "Connect LinkedIn, Instagram, or TikTok below."
                                        : "Try another network."}
                                </p>
                            </div>
                        ) : (
                            <div className="cs-list">
                                {filtered.map((account) => (
                                    <article key={account.id} className="cs-account">
                                        <div className="cs-account__who">
                                            {account.avatar_url ? (
                                                <img src={account.avatar_url} alt="" />
                                            ) : (
                                                <span className="cs-mark">
                                                    {(account.platform || "?").charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div>
                                                <strong>{account.name || "Untitled account"}</strong>
                                                <span>{account.platform || "Unknown"}</span>
                                            </div>
                                        </div>
                                        <div className="cs-account__side">
                                            <span className="cs-status">{account.status || "active"}</span>
                                            <button
                                                type="button"
                                                className="cb-icon-btn"
                                                title="Disconnect"
                                                aria-label={`Disconnect ${account.name || account.platform}`}
                                                onClick={() => setDisconnecting(account)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="cs-section">
                        <h2>Connect a network</h2>
                        <div className="cs-connect">
                            {CONNECT.map((network) => {
                                const Icon = network.icon;
                                return (
                                    <button
                                        key={network.id}
                                        type="button"
                                        className={`cs-connect--${network.id}`}
                                        disabled={isConnecting}
                                        onClick={() => handleConnect(network.id)}
                                    >
                                        <Icon size={16} />
                                        {network.label}
                                    </button>
                                );
                            })}
                        </div>
                        {isConnecting && <p className="cs-note">Redirecting to authorization…</p>}
                    </section>
                </div>
            )}

            {disconnecting && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon"><Trash2 size={20} /></div>
                                <div>
                                    <h3>Disconnect network</h3>
                                    <p>Scheduled posts for this account will stop publishing.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Disconnect <strong>{disconnecting.name || disconnecting.platform}</strong>?
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button
                                type="button"
                                className="cb-btn cb-btn--ghost"
                                onClick={() => setDisconnecting(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="cb-btn cb-btn--danger"
                                onClick={handleDisconnect}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Disconnecting…" : "Disconnect"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
