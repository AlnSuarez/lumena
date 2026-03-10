"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Plus, User, Video } from "lucide-react";

const API_BASE = "http://localhost:8000/api";
const REQUESTS_API = `${API_BASE}/contents/monthly-requests/`;
const USERS_API = `${API_BASE}/users/manage/`;

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
    const date = new Date(`${normalized}T00:00:00`);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
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

export default function VideoShootsCalendarPage() {
    const [role, setRole] = useState("GUEST");
    const [userId, setUserId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");
    const [showCreatePopover, setShowCreatePopover] = useState(false);
    const [requests, setRequests] = useState([]);
    const [clients, setClients] = useState([]);
    const [videographers, setVideographers] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedDate, setSelectedDate] = useState("");

    const [form, setForm] = useState({
        clientId: "",
        shootDate: "",
        videographerId: "",
        description: ""
    });

    const isAdmin = role === "SUPERUSER";

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
            const videoShoots = requestsData.filter((item) => item.request_type === "VIDEO_SHOOT");
            setRequests(videoShoots);

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

    const selectedDayShoots = useMemo(() => {
        if (!selectedDate) return [];
        return shootsByDate[selectedDate] || [];
    }, [selectedDate, shootsByDate]);

    const resetForm = () => {
        setForm({
            clientId: "",
            shootDate: "",
            videographerId: "",
            description: ""
        });
    };

    const handleCreateShoot = async (event) => {
        event.preventDefault();
        if (!form.clientId || !form.shootDate || !form.videographerId) {
            alert("Client, date, and videographer are required.");
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
                    notes: form.description || ""
                })
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
                body: JSON.stringify({ creator_id: form.videographerId })
            });

            if (!assignResponse.ok) {
                throw new Error("Shoot was created, but videographer assignment failed.");
            }

            resetForm();
            setShowCreatePopover(false);
            setSelectedMonth(form.shootDate.slice(0, 7));
            setSelectedDate(form.shootDate);
            await loadData(role, userId);
        } catch (createError) {
            console.error(createError);
            alert(createError.message || "Could not create video shoot.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="pl-1 border-l-4 border-primary">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Calendar</h1>
                        <p className="mt-2 text-muted-foreground text-lg">View all video shoots by date.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMonth((prev) => shiftMonth(prev, -1));
                                setSelectedDate("");
                            }}
                            className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-1.5"
                        >
                            <ChevronLeft size={15} />
                            Previous
                        </button>

                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setSelectedDate("");
                            }}
                            className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                        />

                        <button
                            type="button"
                            onClick={() => {
                                const todayMonth = new Date().toISOString().slice(0, 7);
                                setSelectedMonth(todayMonth);
                                setSelectedDate("");
                            }}
                            className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMonth((prev) => shiftMonth(prev, 1));
                                setSelectedDate("");
                            }}
                            className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-1.5"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>

                        {isAdmin && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCreatePopover((prev) => !prev)}
                                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    New Video Shoot
                                </button>

                                {showCreatePopover && (
                                    <div className="absolute right-0 mt-2 w-[360px] z-30 bg-card border border-border rounded-2xl shadow-2xl p-4">
                                        <h3 className="font-black text-foreground text-lg mb-3">Create Video Shoot</h3>
                                        <form onSubmit={handleCreateShoot} className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Client</label>
                                                <select
                                                    value={form.clientId}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                                    required
                                                >
                                                    <option value="">Select client</option>
                                                    {clients.map((client) => (
                                                        <option key={`calendar-client-${client.id}`} value={client.id}>
                                                            {client.client_profile?.practice_name || client.username}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label>
                                                <input
                                                    type="date"
                                                    value={form.shootDate}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, shootDate: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Assigned Videographer</label>
                                                <select
                                                    value={form.videographerId}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, videographerId: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                                    required
                                                >
                                                    <option value="">Select videographer</option>
                                                    {videographers.map((videographer) => (
                                                        <option key={`calendar-videographer-${videographer.id}`} value={videographer.id}>
                                                            {videographer.username} ({videographer.role})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description (optional)</label>
                                                <textarea
                                                    rows={3}
                                                    value={form.description}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-input/50 text-sm outline-none resize-none"
                                                    placeholder="Add details for the videographer"
                                                />
                                            </div>

                                            <div className="pt-1 flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCreatePopover(false);
                                                        resetForm();
                                                    }}
                                                    className="px-3 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isCreating}
                                                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                                >
                                                    {isCreating && <Loader2 size={14} className="animate-spin" />}
                                                    {isCreating ? "Creating..." : "Create"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="bg-card border border-border rounded-2xl p-10 flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="font-semibold">Loading calendar...</span>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
                        {error}
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-5">
                        <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
                            <div className="grid grid-cols-7 gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                                <span>Sun</span>
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {days.map((day) => {
                                    if (day.isEmpty) {
                                        return <div key={day.key} className="h-24 rounded-xl border border-transparent" />;
                                    }

                                    const dayShoots = shootsByDate[day.iso] || [];
                                    const isSelected = selectedDate === day.iso;

                                    return (
                                        <button
                                            key={day.key}
                                            type="button"
                                            onClick={() => setSelectedDate(day.iso)}
                                            className={`h-24 rounded-xl border p-2 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">{day.day}</span>
                                                {dayShoots.length > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                                        {dayShoots.length}
                                                    </span>
                                                )}
                                            </div>

                                            {dayShoots.length > 0 && (
                                                <p className="text-[11px] text-muted-foreground mt-2 truncate">
                                                    {dayShoots[0].client_details?.client_profile?.practice_name || dayShoots[0].client_details?.username || "Client"}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
                            <div className="mb-3">
                                <h2 className="text-xl font-black text-foreground tracking-tight inline-flex items-center gap-2">
                                    <CalendarIcon size={18} className="text-primary" />
                                    {selectedDate ? `Shoots on ${formatDateLabel(selectedDate)}` : "Shoots This Month"}
                                </h2>
                            </div>

                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                {(selectedDate ? selectedDayShoots : shootsInMonth).length === 0 ? (
                                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                                        No video shoots found for this selection.
                                    </div>
                                ) : (
                                    (selectedDate ? selectedDayShoots : shootsInMonth).map((shoot) => (
                                        <article key={`shoot-${shoot.id}`} className="border border-border rounded-xl p-3.5 bg-secondary/20">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-foreground text-sm truncate">
                                                    {shoot.client_details?.client_profile?.practice_name || shoot.client_details?.username || `Client #${shoot.client}`}
                                                </p>
                                                <span className="text-[11px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                                                    {shoot.status?.replaceAll("_", " ") || "TO DO"}
                                                </span>
                                            </div>

                                            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                                <p className="inline-flex items-center gap-1.5">
                                                    <CalendarIcon size={13} />
                                                    {formatDateLabel(shoot.month)}
                                                </p>
                                                <p className="inline-flex items-center gap-1.5">
                                                    <User size={13} />
                                                    {shoot.assigned_to_details?.username || "Unassigned videographer"}
                                                </p>
                                                <p className="inline-flex items-center gap-1.5">
                                                    <Video size={13} />
                                                    Request #{shoot.id}
                                                </p>
                                            </div>

                                            <p className="mt-2 text-sm text-foreground/90">
                                                {shoot.notes?.trim() || "No description provided."}
                                            </p>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
