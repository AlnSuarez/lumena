"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, User, Video, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./calendar.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;
const REQUESTS_API = `${API_BASE}/contents/monthly-requests/`;
const USERS_API = `${API_BASE}/users/manage/`;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_MEANING = {
    TO_DO: "Ready to start",
    IN_PROGRESS: "Being created",
    QA: "Internal review",
    IN_REVISION: "Changes requested",
    CLIENT_REVIEW: "Waiting on client",
    APPROVED: "Ready to schedule",
    DONE: "Completed",
};

function todayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function todayMonth() {
    return todayIso().slice(0, 7);
}

function normalizeShootDate(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
    const normalized = normalizeShootDate(value);
    if (!normalized) return "No date";
    return new Date(`${normalized}T00:00:00`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatMonthLabel(month) {
    const date = new Date(`${month}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) return month;
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function monthKey(value) {
    const normalized = normalizeShootDate(value);
    return normalized ? normalized.slice(0, 7) : "";
}

function buildCalendarDays(month) {
    const [year, mon] = month.split("-").map(Number);
    if (!year || !mon) return [];

    const first = new Date(year, mon - 1, 1);
    const last = new Date(year, mon, 0);
    const startDay = first.getDay();
    const totalDays = last.getDate();
    const days = [];

    for (let i = 0; i < startDay; i += 1) {
        days.push({ key: `empty-${i}`, isEmpty: true });
    }

    for (let day = 1; day <= totalDays; day += 1) {
        const iso = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        days.push({ key: iso, isEmpty: false, day, iso });
    }

    return days;
}

function shiftMonth(month, delta) {
    const [year, mon] = month.split("-").map(Number);
    const date = new Date(year, (mon || 1) - 1, 1);
    date.setMonth(date.getMonth() + delta);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getClientName(shoot) {
    return shoot?.client_details?.client_profile?.practice_name
        || shoot?.client_details?.username
        || (shoot?.client ? `Client #${shoot.client}` : "Untitled client");
}

function getPersonName(user) {
    if (!user) return "Unassigned";
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.username || "Unassigned";
}

function statusLabel(status) {
    return String(status || "TO_DO").replaceAll("_", " ");
}

export default function VideoShootsCalendarPage() {
    const [role, setRole] = useState("GUEST");
    const [userId, setUserId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [requests, setRequests] = useState([]);
    const [clients, setClients] = useState([]);
    const [videographers, setVideographers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [form, setForm] = useState({
        clientId: "",
        shootDate: "",
        videographerId: "",
        description: "",
    });

    const isAdmin = role === "SUPERUSER";
    const today = todayIso();

    const loadData = async (currentRole, currentUserId) => {
        setIsLoading(true);
        setError("");

        try {
            const url = new URL(REQUESTS_API);
            url.searchParams.append("role", currentRole);
            if (currentUserId) url.searchParams.append("user_id", currentUserId);

            const requestsResponse = await fetch(url.toString());
            if (!requestsResponse.ok) {
                throw new Error("Could not load video shoots.");
            }

            const requestsData = await requestsResponse.json();
            setRequests(requestsData.filter((item) => item.request_type === "VIDEO_SHOOT"));

            if (currentRole === "SUPERUSER") {
                const usersResponse = await fetch(USERS_API);
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    setClients(usersData.filter((u) => u.role === "CLIENT"));
                    setVideographers(usersData.filter((u) => u.role === "EDITOR" || u.role === "CONTENT_CREATOR"));
                }
            }
        } catch (loadError) {
            console.error(loadError);
            setError(loadError.message || "Could not load data.");
            toast.error(loadError.message || "Could not load the calendar.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedRole = localStorage.getItem("userRole") || "GUEST";
        const storedUserId = localStorage.getItem("userId") || "";

        if (!storedUserId || !storedRole) {
            window.location.href = "/login";
            return;
        }

        setRole(storedRole);
        setUserId(storedUserId);
        setSelectedMonth(todayMonth());
        loadData(storedRole, storedUserId);
    }, []);

    const shootsByDate = useMemo(() => {
        return requests.reduce((acc, item) => {
            const key = normalizeShootDate(item.month);
            if (!key) return acc;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }, [requests]);

    const days = useMemo(() => buildCalendarDays(selectedMonth), [selectedMonth]);

    const shootsInMonth = useMemo(() => {
        return requests
            .filter((item) => monthKey(item.month) === selectedMonth)
            .sort((a, b) => String(a.month).localeCompare(String(b.month)));
    }, [requests, selectedMonth]);

    const selectedDayShoots = selectedDate ? (shootsByDate[selectedDate] || []) : [];
    const visibleShoots = selectedDate ? selectedDayShoots : shootsInMonth;
    const daysWithShoots = Object.keys(shootsByDate).filter((key) => monthKey(key) === selectedMonth).length;
    const unassignedCount = shootsInMonth.filter((item) => !item.assigned_to_details).length;

    const goToMonth = (month) => {
        setSelectedMonth(month);
        setSelectedDate("");
    };

    const resetForm = () => {
        setForm({
            clientId: "",
            shootDate: selectedDate || "",
            videographerId: "",
            description: "",
        });
    };

    const openCreate = () => {
        setForm({
            clientId: "",
            shootDate: selectedDate || today,
            videographerId: "",
            description: "",
        });
        setShowCreate(true);
    };

    const handleCreateShoot = async (event) => {
        event.preventDefault();
        if (!form.clientId || !form.shootDate || !form.videographerId) {
            toast.error("Client, date, and videographer are required.");
            return;
        }

        setIsCreating(true);
        try {
            const createUrl = new URL(REQUESTS_API);
            createUrl.searchParams.append("user_id", userId);

            const createResponse = await fetch(createUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client: form.clientId,
                    request_type: "VIDEO_SHOOT",
                    month: form.shootDate,
                    status: "TO_DO",
                    notes: form.description || "",
                }),
            });

            if (!createResponse.ok) {
                throw new Error("Could not create video shoot.");
            }

            const created = await createResponse.json();
            const assignUrl = new URL(`${REQUESTS_API}${created.id}/reassign/`);
            assignUrl.searchParams.append("user_id", userId);

            const assignResponse = await fetch(assignUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creator_id: form.videographerId }),
            });

            if (!assignResponse.ok) {
                throw new Error("Shoot was created, but videographer assignment failed.");
            }

            resetForm();
            setShowCreate(false);
            setSelectedMonth(form.shootDate.slice(0, 7));
            setSelectedDate(form.shootDate);
            toast.success("Video shoot added to the calendar.");
            await loadData(role, userId);
        } catch (createError) {
            console.error(createError);
            toast.error(createError.message || "Could not create video shoot.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="content-board video-calendar">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Calendar</h1>
                    <p>Video shoots by day. Click a date to see who is filming.</p>
                </div>
                <div className="cb-header__actions">
                    <div className="cal-nav">
                        <button
                            type="button"
                            className="cb-icon-btn"
                            onClick={() => goToMonth(shiftMonth(selectedMonth, -1))}
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <label className="cal-month">
                            <strong>{formatMonthLabel(selectedMonth)}</strong>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => goToMonth(e.target.value)}
                                aria-label="Choose month"
                            />
                        </label>
                        <button
                            type="button"
                            className="cb-icon-btn"
                            onClick={() => goToMonth(shiftMonth(selectedMonth, 1))}
                            aria-label="Next month"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button type="button" className="cb-btn cb-btn--ghost" onClick={() => goToMonth(todayMonth())}>
                            Today
                        </button>
                    </div>
                    {isAdmin && (
                        <button type="button" className="cb-btn cb-btn--primary" onClick={openCreate}>
                            <Plus size={16} />
                            New shoot
                        </button>
                    )}
                </div>
            </div>

            <div className="cb-summary">
                <button type="button" className={`cb-chip${!selectedDate ? " is-active" : ""}`} onClick={() => setSelectedDate("")}>
                    <span>This month<small>All shoots in view</small></span>
                    <strong>{shootsInMonth.length}</strong>
                </button>
                <div className="cb-chip">
                    <span>Days booked<small>Days with at least one shoot</small></span>
                    <strong>{daysWithShoots}</strong>
                </div>
                <button
                    type="button"
                    className={`cb-chip${selectedDate ? " is-active" : ""}`}
                    onClick={() => selectedDate && setSelectedDate(selectedDate)}
                    disabled={!selectedDate}
                >
                    <span>Selected day<small>{selectedDate ? formatDateLabel(selectedDate) : "Pick a date"}</small></span>
                    <strong>{selectedDate ? selectedDayShoots.length : "—"}</strong>
                </button>
                <div className="cb-chip">
                    <span>Unassigned<small>No videographer yet</small></span>
                    <strong>{unassignedCount}</strong>
                </div>
            </div>

            {isLoading || !selectedMonth ? (
                <div className="cal-body">
                    <div className="cal-grid">
                        <div className="cb-skel cb-skel--card cal-skel" />
                    </div>
                    <div className="cal-side">
                        <div className="cb-skel cb-skel--card cal-skel--side" />
                    </div>
                </div>
            ) : (
                <div className="cal-body">
                    <section className="cal-grid" aria-label="Month calendar">
                        <div className="cal-weekdays">
                            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
                        </div>
                        <div className="cal-days">
                            {days.map((day) => {
                                if (day.isEmpty) {
                                    return <div key={day.key} className="cal-day is-empty" aria-hidden="true" />;
                                }

                                const dayShoots = shootsByDate[day.iso] || [];
                                const names = dayShoots.slice(0, 2).map(getClientName).join(", ");
                                const extra = dayShoots.length > 2 ? ` +${dayShoots.length - 2}` : "";

                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        className={`cal-day${selectedDate === day.iso ? " is-selected" : ""}${day.iso === today ? " is-today" : ""}`}
                                        onClick={() => setSelectedDate((prev) => (prev === day.iso ? "" : day.iso))}
                                    >
                                        <div className="cal-day__top">
                                            <span className="cal-day__num">{day.day}</span>
                                            {dayShoots.length > 0 && <span className="cal-count">{dayShoots.length}</span>}
                                        </div>
                                        {dayShoots.length > 0 && (
                                            <p className="cal-day__names">{names}{extra}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="cal-side" aria-label="Shoot details">
                        <div className="cal-side__head">
                            <div>
                                <h2>{selectedDate ? formatDateLabel(selectedDate) : formatMonthLabel(selectedMonth)}</h2>
                                <p>{selectedDate ? "Shoots on this day." : "All shoots this month."}</p>
                            </div>
                            {selectedDate && (
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setSelectedDate("")}>
                                    Month
                                </button>
                            )}
                        </div>
                        <div className="cal-side__list">
                            {visibleShoots.length === 0 ? (
                                <div className="cb-empty">
                                    <div className="cb-empty__icon"><Video size={18} /></div>
                                    <strong>No shoots here</strong>
                                    <p>{selectedDate ? "Nothing is booked on this day." : "No video shoots in this month."}</p>
                                </div>
                            ) : (
                                visibleShoots.map((shoot) => (
                                    <article key={shoot.id} className="cal-card">
                                        <div className="cal-card__top">
                                            <h3>{getClientName(shoot)}</h3>
                                            <span className="cal-badge" data-status={shoot.status} title={STATUS_MEANING[shoot.status] || ""}>
                                                {statusLabel(shoot.status)}
                                            </span>
                                        </div>
                                        <div className="cal-card__meta">
                                            <p><CalendarIcon size={13} /> {formatDateLabel(shoot.month)}</p>
                                            <p><User size={13} /> {getPersonName(shoot.assigned_to_details)}</p>
                                            <p><Video size={13} /> {STATUS_MEANING[shoot.status] || "Video shoot"}</p>
                                        </div>
                                        <p className="cal-card__notes">{shoot.notes?.trim() || "No description yet."}</p>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {showCreate && (
                <div className="cb-overlay">
                    <div className="cal-create">
                        <div className="cal-create__head">
                            <div>
                                <h2>New video shoot</h2>
                                <p>Pick the client, day, and who will film.</p>
                            </div>
                            <button
                                type="button"
                                className="cb-icon-btn"
                                onClick={() => { setShowCreate(false); resetForm(); }}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateShoot}>
                            <div className="cb-field">
                                <label htmlFor="cal-client">Client</label>
                                <select
                                    id="cal-client"
                                    value={form.clientId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.client_profile?.practice_name || client.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="cb-field">
                                <label htmlFor="cal-date">Shoot date</label>
                                <input
                                    id="cal-date"
                                    type="date"
                                    value={form.shootDate}
                                    onChange={(e) => setForm((prev) => ({ ...prev, shootDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="cb-field">
                                <label htmlFor="cal-videographer">Videographer</label>
                                <select
                                    id="cal-videographer"
                                    value={form.videographerId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, videographerId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select videographer</option>
                                    {videographers.map((videographer) => (
                                        <option key={videographer.id} value={videographer.id}>
                                            {getPersonName(videographer)} ({videographer.role.replaceAll("_", " ")})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="cb-field">
                                <label htmlFor="cal-notes">Description</label>
                                <textarea
                                    id="cal-notes"
                                    value={form.description}
                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional notes for the videographer"
                                />
                            </div>
                            <div className="cal-create__actions">
                                <button
                                    type="button"
                                    className="cb-btn cb-btn--ghost"
                                    onClick={() => { setShowCreate(false); resetForm(); }}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="cb-btn cb-btn--primary" disabled={isCreating}>
                                    {isCreating ? "Creating..." : "Create shoot"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
