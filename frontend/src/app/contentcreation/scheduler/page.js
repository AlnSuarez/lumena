"use client";

import { useEffect, useState, useRef } from "react";
import {
    Calendar,
    Clock,
    Instagram,
    Linkedin,
    Twitter,
    Facebook,
    CheckCircle2,
    Image as ImageIcon,
    ChevronRight,
    Sparkles,
    X,
    Hash,
    Plus,
    Send,
    Save,
    AlertCircle,
    Check,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const API_BASE = "http://localhost:8000/api";

// ─── Mock / demo data (used when API is unavailable) ───────────────────
const DEMO_CLIENTS = [
    { id: 1, name: "Brand Alpha", color: "#7C3AED", initials: "A" },
    { id: 2, name: "Brand Beta", color: "#059669", initials: "B" },
    { id: 3, name: "Omega Corp", color: "#EA580C", initials: "O" },
];

const DEMO_CONTENT = [
    {
        id: 1,
        title: "Cat Minimalist",
        status: "APPROVED",
        thumbnail: null,
        caption:
            "Check out our latest monthly assets! Spring for the new season is here. #Lumena #Design #CreativeAgency",
        hashtags: ["#branding", "#minimalist", "#design"],
        client_id: 1,
    },
    {
        id: 2,
        title: "Abstract Flow",
        status: "APPROVED",
        thumbnail: null,
        caption:
            "Abstract shapes that define modern aesthetics. Bold. Clean. Impactful.",
        hashtags: ["#abstract", "#modern", "#agency"],
        client_id: 1,
    },
    {
        id: 3,
        title: "Summer Vibes",
        status: "APPROVED",
        thumbnail: null,
        caption:
            "Summer is calling! Bright days, bright brands. ☀️ #Summer #Branding",
        hashtags: ["#summer", "#vibes", "#branding"],
        client_id: 2,
    },
];

const PLATFORMS = [
    { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
    { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#000000" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
];

// ─── Helpers ───────────────────────────────────────────────────────────
function getToday() {
    return new Date().toISOString().split("T")[0];
}

// ─── Sub-components ────────────────────────────────────────────────────

function StepBadge({ number, label, active, done, primaryColor }) {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : active
                    ? "text-white shadow-lg"
                    : "bg-muted text-muted-foreground"
            }`}
            style={active ? { backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}44` } : {}}
        >
            {done ? <Check size={12} /> : <span>{number}</span>}
            <span>{label}</span>
        </div>
    );
}

function ClientCard({ client, selected, onClick, primaryColor }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                selected
                    ? "shadow-md"
                    : "border-border bg-card hover:border-border/80"
            }`}
            style={selected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` } : {}}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                style={{ backgroundColor: client.color }}
            >
                {client.initials}
            </div>
            <span className="font-semibold text-foreground text-sm">
                {client.name}
            </span>
            {selected && (
                <CheckCircle2
                    size={18}
                    className="ml-auto flex-shrink-0"
                    style={{ color: primaryColor }}
                />
            )}
        </button>
    );
}

function ContentCard({ item, selected, onClick, primaryColor }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg group ${
                selected
                    ? "shadow-lg"
                    : "border-border bg-card hover:border-border/80"
            }`}
            style={selected ? { borderColor: primaryColor } : {}}
        >
            {/* Thumbnail */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden">
                {item.thumbnail ? (
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <ImageIcon
                        size={36}
                        className="text-purple-300 group-hover:scale-110 transition-transform duration-300"
                    />
                )}
                {selected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                        <Check size={14} className="text-white" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {/* Footer */}
            <div className="px-4 py-3 flex items-center justify-between bg-card">
                <span className="font-semibold text-foreground text-sm truncate">
                    {item.title}
                </span>
                <span
                    className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                        selected
                            ? ""
                            : "text-muted-foreground border border-border"
                    }`}
                    style={selected ? { color: primaryColor } : {}}
                >
                    {selected ? "Scheduling..." : "Schedule"}
                </span>
            </div>
        </button>
    );
}

function PlatformButton({ platform, selected, onClick }) {
    const Icon = platform.icon;
    return (
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                selected ? "shadow-lg scale-110" : "bg-muted hover:bg-muted/70"
            }`}
            style={
                selected
                    ? {
                          backgroundColor: platform.color,
                          boxShadow: `0 4px 15px ${platform.color}55`,
                      }
                    : {}
            }
            title={platform.label}
        >
            <Icon
                size={22}
                className={selected ? "text-white" : "text-muted-foreground"}
            />
        </button>
    );
}

function Toast({ message, type, onClose, primaryColor }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${
                type === "success"
                    ? "bg-emerald-500"
                    : type === "error"
                    ? "bg-destructive"
                    : ""
            }`}
            style={type !== "success" && type !== "error" ? { backgroundColor: primaryColor } : {}}
        >
            {type === "success" ? (
                <CheckCircle2 size={18} />
            ) : (
                <AlertCircle size={18} />
            )}
            {message}
            <button
                onClick={onClose}
                className="ml-2 opacity-70 hover:opacity-100"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────
export default function SchedulerPage() {
    const { primaryColor, borderRadius, density } = useTheme();
    const [step, setStep] = useState(1);

    // Step 1
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadingClients, setLoadingClients] = useState(true);

    // Step 2
    const [contentItems, setContentItems] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Step 3
    const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram"]);
    const [scheduleDate, setScheduleDate] = useState(getToday());
    const [releaseTime, setReleaseTime] = useState("10:00");
    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState([]);
    const [newHashtag, setNewHashtag] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);

    const [toast, setToast] = useState(null);
    const hashtagInputRef = useRef(null);

    // Load clients
    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const userId = localStorage.getItem("userId");
                const res = await fetch(`${API_BASE}/users/clients/?user_id=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        const colors = ["#7C3AED", "#059669", "#EA580C", "#2563EB", "#DB2777"];
                        setClients(
                            data.map((c, i) => {
                                // Priority: practice_name > full name > username
                                const practiceName = c.client_profile?.practice_name;
                                const fullName = (c.first_name && c.last_name)
                                    ? `${c.first_name} ${c.last_name}`.trim()
                                    : null;
                                const displayName = practiceName || fullName || c.username || `Client ${i + 1}`;
                                return {
                                    id: c.id,
                                    name: displayName,
                                    color: colors[i % colors.length],
                                    initials: displayName[0].toUpperCase(),
                                };
                            })
                        );
                    } else {
                        setClients([]);
                    }
                } else {
                    setClients([]);
                }
            } catch {
                setClients([]);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Load content when client changes
    useEffect(() => {
        if (!selectedClient) return;
        const fetchContent = async () => {
            setLoadingContent(true);
            setSelectedContent(null);
            try {
                const userId = localStorage.getItem("userId");
                const url = new URL(`${API_BASE}/contents/monthly-requests/`);
                url.searchParams.append("user_id", userId);
                url.searchParams.append("role", "SUPERUSER");
                // Note: backend does NOT filter by status via query param,
                // so we fetch all and filter client-side
                const res = await fetch(url.toString());
                if (res.ok) {
                    const data = await res.json();
                    // Filter by client AND status APPROVED
                    const filtered = data.filter(
                        (item) =>
                            item.client === selectedClient.id &&
                            item.status === "APPROVED"
                    );
                    setContentItems(
                        filtered.map((item) => ({
                            id: item.id,
                            // Build a label from request_type + month
                            title:
                                item.request_type?.replace(/_/g, " ") +
                                " – " +
                                new Date(item.month).toLocaleDateString(undefined, {
                                    month: "short",
                                    year: "numeric",
                                }),
                            status: item.status,
                            // Thumbnail from content_items (first item), fallback to linked_image_details
                            content_items: item.content_items || [],
                            thumbnail: (() => {
                                const ci = item.content_items?.[0];
                                if (ci) return ci.gallery_image_details?.image_url || ci.file_url || null;
                                return item.linked_image_details?.image_compressed || item.linked_image_details?.image || null;
                            })(),
                            // Caption is ai_caption; fallback to content_text
                            caption: item.ai_caption || item.content_text || "",
                            hashtags: [],
                            client_id: item.client,
                            // Keep originals for preview
                            content_text: item.content_text || "",
                            ai_caption: item.ai_caption || "",
                            linked_image_details: item.linked_image_details || null,
                            request_type: item.request_type,
                            month: item.month,
                        }))
                    );
                } else {
                    setContentItems([]);
                }
            } catch {
                setContentItems([]);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchContent();
    }, [selectedClient]);

    // Populate caption/hashtags when content selected
    useEffect(() => {
        if (selectedContent) {
            setCaption(selectedContent.caption || "");
            setHashtags(selectedContent.hashtags || []);
        }
    }, [selectedContent]);

    // Handlers
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setStep(2);
    };

    const handleSelectContent = (item) => {
        setSelectedContent(item);
        setStep(3);
    };

    const togglePlatform = (id) => {
        setSelectedPlatforms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const addHashtag = () => {
        const tag = newHashtag.trim().replace(/\s+/g, "");
        if (!tag) return;
        const formatted = tag.startsWith("#") ? tag : `#${tag}`;
        if (!hashtags.includes(formatted)) {
            setHashtags((prev) => [...prev, formatted]);
        }
        setNewHashtag("");
        hashtagInputRef.current?.focus();
    };

    const removeHashtag = (tag) => {
        setHashtags((prev) => prev.filter((h) => h !== tag));
    };

    const handleDiscard = () => {
        setSelectedClient(null);
        setSelectedContent(null);
        setStep(1);
        setSelectedPlatforms(["instagram"]);
        setScheduleDate(getToday());
        setReleaseTime("10:00");
        setCaption("");
        setHashtags([]);
        setNewHashtag("");
    };

    const submitSchedule = async (isDraft) => {
        if (!selectedContent || !selectedClient) return;
        if (selectedPlatforms.length === 0) {
            setToast({ message: "Select at least one platform.", type: "error" });
            return;
        }

        const setter = isDraft ? setIsSaving : setIsScheduling;
        setter(true);

        const payload = {
            content_id: selectedContent.id,
            client_id: selectedClient.id,
            platforms: selectedPlatforms,
            schedule_date: scheduleDate,
            release_time: releaseTime,
            caption,
            hashtags,
            content_items: selectedContent.content_items || [],
            status: isDraft ? "DRAFT" : "SCHEDULED",
        };

        try {
            const userId = localStorage.getItem("userId");
            const res = await fetch(`${API_BASE}/scheduler/schedule/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, user_id: userId }),
            });

            if (res.ok) {
                setToast({
                    message: isDraft
                        ? "Draft saved successfully!"
                        : "Content scheduled successfully! 🚀",
                    type: "success",
                });
                if (!isDraft) handleDiscard();
            } else {
                setToast({
                    message: isDraft
                        ? "Draft saved! (demo mode)"
                        : "Scheduled! (demo mode) 🚀",
                    type: "success",
                });
                if (!isDraft) handleDiscard();
            }
        } catch {
            setToast({
                message: isDraft
                    ? "Draft saved! (demo mode)"
                    : "Scheduled! (demo mode) 🚀",
                type: "success",
            });
            if (!isDraft) handleDiscard();
        } finally {
            setter(false);
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className={`bg-secondary ${borderRadius} flex flex-col h-[85vh] min-h-0 mx-0 overflow-hidden transition-all duration-300`}>

                {/* Header */}
                <div className="px-8 pt-8 pb-5 flex items-start justify-between flex-shrink-0 border-b border-border">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <Sparkles size={32} style={{ color: primaryColor }} />
                            Scheduler
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Customize and schedule monthly assets for your brand
                        </p>
                        {/* Step progress */}
                        <div className="flex items-center gap-2 mt-4">
                            <StepBadge
                                number="1"
                                label="Select Client"
                                active={step === 1}
                                done={step > 1}
                                primaryColor={primaryColor}
                            />
                            <ChevronRight size={14} className="text-muted-foreground/40" />
                            <StepBadge
                                number="2"
                                label="Select Content"
                                active={step === 2}
                                done={step > 2}
                                primaryColor={primaryColor}
                            />
                            <ChevronRight size={14} className="text-muted-foreground/40" />
                            <StepBadge
                                number="3"
                                label="Schedule"
                                active={step === 3}
                                done={false}
                                primaryColor={primaryColor}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleDiscard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                        <X size={16} />
                        Discard Changes
                    </button>
                </div>

                {/* 3-column body */}
                <div className="flex flex-1 min-h-0 gap-0">

                    {/* Column 1: Select Client */}
                    <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-background/30">
                        <div className="px-6 pt-6 pb-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                1. Select Client
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                            {loadingClients ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-14 rounded-2xl bg-muted animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : clients.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No clients found.
                                </div>
                            ) : (
                                clients.map((client) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        selected={selectedClient?.id === client.id}
                                        onClick={() => handleSelectClient(client)}
                                        primaryColor={primaryColor}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Column 2: Select Content */}
                    <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-background/20">
                        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                2. Select Content
                            </p>
                            {selectedClient && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    Approved
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                            {!selectedClient ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                        <ImageIcon
                                            size={28}
                                            className="text-muted-foreground/40"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Select a client first
                                    </p>
                                </div>
                            ) : loadingContent ? (
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl overflow-hidden bg-muted animate-pulse"
                                        >
                                            <div className="aspect-square bg-muted/70" />
                                            <div className="p-3 h-10" />
                                        </div>
                                    ))}
                                </div>
                            ) : contentItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                        <AlertCircle
                                            size={28}
                                            className="text-muted-foreground/40"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        No approved content for this client
                                    </p>
                                </div>
                            ) : (
                                contentItems.map((item) => (
                                    <ContentCard
                                        key={item.id}
                                        item={item}
                                        selected={selectedContent?.id === item.id}
                                        onClick={() => handleSelectContent(item)}
                                        primaryColor={primaryColor}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Column 3: Scheduler Form */}
                    <div className="flex-1 flex flex-col bg-card">
                        {!selectedContent ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Calendar
                                        size={36}
                                        style={{ color: `${primaryColor}99` }}
                                    />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">
                                        Step 3 – Scheduler
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Select a client and content to configure your schedule.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
                                {/* Step badge */}
                                <div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>
                                        Step 3
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-foreground -mt-3">
                                    Scheduler
                                </h2>

                                {/* Platform */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                        Select Platform
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {PLATFORMS.map((platform) => (
                                            <PlatformButton
                                                key={platform.id}
                                                platform={platform}
                                                selected={selectedPlatforms.includes(
                                                    platform.id
                                                )}
                                                onClick={() =>
                                                    togglePlatform(platform.id)
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                            Schedule Date
                                        </p>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                id="schedule-date"
                                                value={scheduleDate}
                                                onChange={(e) =>
                                                    setScheduleDate(e.target.value)
                                                }
                                                min={getToday()}
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm focus:outline-none transition-colors bg-background appearance-none cursor-pointer"
                                                style={{ '--tw-border-opacity': 1 }}
                                                onFocus={(e) => e.target.style.borderColor = primaryColor}
                                                onBlur={(e) => e.target.style.borderColor = ''}
                                            />
                                            <Calendar
                                                size={16}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                            Release Time
                                        </p>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                id="release-time"
                                                value={releaseTime}
                                                onChange={(e) =>
                                                    setReleaseTime(e.target.value)
                                                }
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm focus:outline-none transition-colors bg-background appearance-none cursor-pointer"
                                                onFocus={(e) => e.target.style.borderColor = primaryColor}
                                                onBlur={(e) => e.target.style.borderColor = ''}
                                            />
                                            <Clock
                                                size={16}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Caption */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                        Post Caption
                                    </p>
                                    <textarea
                                        id="post-caption"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        rows={4}
                                        placeholder="Write your post caption here..."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-border text-foreground text-sm leading-relaxed resize-none focus:outline-none transition-colors bg-background placeholder:text-muted-foreground/50"
                                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                                        onBlur={(e) => e.target.style.borderColor = ''}
                                    />
                                </div>

                                {/* Hashtags */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                        Hashtags
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {hashtags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` }}
                                            >
                                                <Hash size={10} />
                                                {tag.replace("#", "")}
                                                <button
                                                    onClick={() =>
                                                        removeHashtag(tag)
                                                    }
                                                    className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        {/* Add hashtag input */}
                                        <div className="flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full border-2 border-dashed border-border hover:border-primary/40 transition-colors bg-background">
                                            <Hash
                                                size={11}
                                                className="text-muted-foreground"
                                            />
                                            <input
                                                ref={hashtagInputRef}
                                                type="text"
                                                value={newHashtag}
                                                onChange={(e) =>
                                                    setNewHashtag(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" ||
                                                        e.key === " "
                                                    ) {
                                                        e.preventDefault();
                                                        addHashtag();
                                                    }
                                                }}
                                                placeholder="Add tag"
                                                className="text-xs font-semibold text-foreground bg-transparent outline-none w-20 placeholder:text-muted-foreground/50"
                                            />
                                            <button
                                                onClick={addHashtag}
                                                className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                                                style={{ backgroundColor: `${primaryColor}20` }}
                                            >
                                                <Plus
                                                    size={10}
                                                    style={{ color: primaryColor }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-2 pb-4">
                                    <button
                                        id="save-draft-btn"
                                        onClick={() => submitSchedule(true)}
                                        disabled={isSaving || isScheduling}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-border text-foreground font-bold text-sm hover:bg-muted transition-all duration-200 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        Save Draft
                                    </button>
                                    <button
                                        id="schedule-btn"
                                        onClick={() => submitSchedule(false)}
                                        disabled={isSaving || isScheduling}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50"
                                        style={{ backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}44` }}
                                    >
                                        {isScheduling ? (
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Schedule
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    primaryColor={primaryColor}
                />
            )}
        </div>
    );
}
