"use client";

import React, { useEffect, useRef, useState } from "react";
import { LogOut, ChevronDown, Bell, X, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import ChatPanel from "./ChatPanel";
import "./navbar.css";

export function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({ name: "", role: "" });
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);
    const rootRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const storedName = localStorage.getItem("username");
        const storedRole = localStorage.getItem("userRole");
        if (storedName || storedRole) {
            setUserInfo({
                name: storedName || "User",
                role: storedRole || "Guest",
            });
        }
    }, []);

    useEffect(() => {
        if (!["SUPERUSER", "ADMIN"].includes(userInfo.role)) return;
        fetchNotifications();
        fetchCreators();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userInfo.role]);

    useEffect(() => {
        if (!isDropdownOpen && !showNotifications) return;
        const onPointer = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setShowNotifications(false);
            }
        };
        const onKey = (event) => {
            if (event.key === "Escape") {
                setIsDropdownOpen(false);
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [isDropdownOpen, showNotifications]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/?role=SUPERUSER`);
            if (response.ok) {
                const data = await response.json();
                const pending = data.filter((req) => {
                    const isActive = req.status === "TO_DO" || req.status === "IN_PROGRESS";
                    const isUnassigned = !req.assigned_to;
                    const hasSuggestion = req.notes && req.notes.includes("Suggested assignment");
                    return isActive && (isUnassigned || hasSuggestion);
                });
                setNotifications(pending);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const fetchCreators = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/content-creators/`);
            if (response.ok) setContentCreators(await response.json());
        } catch (error) {
            console.error("Error fetching creators:", error);
        }
    };

    const handleConfirmAssignment = async (requestId) => {
        try {
            const userId = localStorage.getItem("userId");
            const confirmUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${requestId}/confirm-assignment/`);
            if (userId) confirmUrl.searchParams.append("user_id", userId);
            const response = await fetch(confirmUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) setNotifications((prev) => prev.filter((n) => n.id !== requestId));
        } catch (error) {
            console.error("Error confirming assignment:", error);
        }
    };

    const handleReassign = async (requestId, creatorId) => {
        try {
            const userId = localStorage.getItem("userId");
            const reassignUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${requestId}/reassign/`);
            if (userId) reassignUrl.searchParams.append("user_id", userId);
            const response = await fetch(reassignUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creator_id: creatorId }),
            });
            if (response.ok) setNotifications((prev) => prev.filter((n) => n.id !== requestId));
        } catch (error) {
            console.error("Error reassigning:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const displayRole = userInfo.role
        ? userInfo.role.replaceAll("_", " ").toLowerCase()
        : "…";
    const isAdmin = ["SUPERUSER", "ADMIN"].includes(userInfo.role);
    const initial = (userInfo.name || "U").charAt(0).toUpperCase();

    return (
        <nav className="app-navbar" ref={rootRef}>
            <div className="nb-actions">
                <div onClick={() => { setShowNotifications(false); setIsDropdownOpen(false); }}>
                    <ChatPanel />
                </div>

                {isAdmin && (
                    <div className="nb-slot">
                        <button
                            type="button"
                            className={`nb-icon-btn${showNotifications ? " is-open" : ""}`}
                            onClick={() => {
                                setShowNotifications((open) => !open);
                                setIsDropdownOpen(false);
                            }}
                            aria-label="Pending assignments"
                            aria-expanded={showNotifications}
                        >
                            <Bell size={16} />
                            {notifications.length > 0 && (
                                <span className="nb-badge">{notifications.length > 9 ? "9+" : notifications.length}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="nb-panel">
                                <div className="nb-panel__head">
                                    <div>
                                        <h3>Pending assignments</h3>
                                        <p>{notifications.length} {notifications.length === 1 ? "request needs" : "requests need"} attention</p>
                                    </div>
                                    <button type="button" className="nb-icon-btn" onClick={() => setShowNotifications(false)} aria-label="Close">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="nb-panel__body">
                                    {notifications.length === 0 ? (
                                        <div className="nb-empty">
                                            <div className="nb-empty__icon nb-empty__icon--ok"><CheckCircle2 size={18} /></div>
                                            <strong>All caught up</strong>
                                            <p>Every request has an owner.</p>
                                        </div>
                                    ) : (
                                        notifications.map((req) => {
                                            const suggested = req.notes?.includes("Suggested");
                                            return (
                                                <div key={req.id} className="nb-note">
                                                    <span className={`nb-note__stripe${suggested ? " is-suggested" : ""}`} />
                                                    <div className="nb-note__top">
                                                        <span className="nb-chip">{req.month}</span>
                                                        {suggested && (
                                                            <span className="nb-chip nb-chip--primary"><Sparkles size={10} /> Suggested</span>
                                                        )}
                                                    </div>
                                                    <h4>{req.client_details?.username}</h4>
                                                    <p>{req.content_text || "No content details yet."}</p>
                                                    {req.assigned_to_details ? (
                                                        <div className="nb-assign">
                                                            <div className="nb-assign__who">
                                                                <span className="nb-mini-avatar">{req.assigned_to_details.username[0].toUpperCase()}</span>
                                                                <span>{req.assigned_to_details.username}</span>
                                                            </div>
                                                            <button type="button" className="nb-btn" onClick={() => handleConfirmAssignment(req.id)}>
                                                                Confirm
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="nb-warn"><AlertCircle size={13} /> Unassigned</div>
                                                            <select
                                                                className="nb-select"
                                                                defaultValue=""
                                                                onChange={(e) => {
                                                                    if (e.target.value) handleReassign(req.id, e.target.value);
                                                                }}
                                                            >
                                                                <option value="" disabled>Assign a creator…</option>
                                                                {contentCreators.map((cc) => (
                                                                    <option key={cc.id} value={cc.id}>{cc.username}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="nb-slot">
                    <button
                        type="button"
                        className={`nb-user${isDropdownOpen ? " is-open" : ""}`}
                        onClick={() => {
                            setIsDropdownOpen((open) => !open);
                            setShowNotifications(false);
                        }}
                        aria-expanded={isDropdownOpen}
                        aria-label="Account menu"
                    >
                        <span className="nb-avatar">{initial}</span>
                        <span className="nb-user__meta">
                            <strong>{userInfo.name || "Loading…"}</strong>
                            <span>{displayRole}</span>
                        </span>
                        <ChevronDown size={14} />
                    </button>
                    {isDropdownOpen && (
                        <div className="nb-menu">
                            <button type="button" onClick={handleLogout}>
                                <LogOut size={15} />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
