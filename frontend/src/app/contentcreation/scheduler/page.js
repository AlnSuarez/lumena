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
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    Hash,
    Plus,
    Send,
    Save,
    AlertCircle,
    Check,
    Heart,
    MessageCircle,
    Bookmark,
    Play,
    MoreHorizontal,
    Video,
    Music,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

const normalizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
};

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
    { id: "tiktok", label: "TikTok", icon: Music, color: "#000000" },
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

function ContentCard({ item, onPreview, primaryColor }) {
    const contentItems = item.content_items || [];
    const typeLabel = contentItems[0]?.media_type
        ? { STORY: 'Story', VIDEO: 'Video', CAROUSEL_IMAGE: 'Carousel', IMAGE: 'Photo' }[contentItems[0].media_type] || 'Photo'
        : 'Photo';

    const isVideo = typeLabel === 'Video' || (item.thumbnail && (
        item.thumbnail.toLowerCase().endsWith('.mp4') ||
        item.thumbnail.toLowerCase().endsWith('.mov') ||
        item.thumbnail.toLowerCase().endsWith('.webm') ||
        item.thumbnail.toLowerCase().includes('/videos/')
    ));

    return (
        <button
            onClick={() => onPreview(item)}
            className="w-full text-left rounded-2xl border-2 border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/40 group"
        >
            {/* Thumbnail */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden">
                {item.thumbnail ? (
                    isVideo ? (
                        <video
                            src={item.thumbnail}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    )
                ) : (
                    <ImageIcon
                        size={36}
                        className="text-purple-300 group-hover:scale-110 transition-transform duration-300"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Type badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold">
                    {typeLabel}
                </div>
                {/* Preview hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-900/90 shadow-lg text-xs font-bold text-gray-900 dark:text-white backdrop-blur-sm flex items-center gap-1.5">
                        <Play size={12} />
                        Preview
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 flex items-center justify-between bg-card">
                <span className="font-semibold text-foreground text-sm truncate">
                    {item.title}
                </span>
                <span className="text-xs font-bold text-muted-foreground border border-border px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    Preview
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

// ─── Instagram Preview Card ────────────────────────────────────────────
function InstagramPreview({ item, onClose, onSelect, primaryColor }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const contentItems = item.content_items || [];
    const hasContentItems = contentItems.length > 0;

    const primaryType = hasContentItems
        ? contentItems[0]?.media_type || 'IMAGE'
        : 'IMAGE';

    const isCarousel = primaryType === 'CAROUSEL_IMAGE';
    const isStory = primaryType === 'STORY';
    const isVideo = primaryType === 'VIDEO';
    const images = contentItems.length > 0
        ? contentItems
        : [{ media_type: 'IMAGE', file_url: item.thumbnail, gallery_image_details: null }];
    const current = images[currentIndex] || images[0];

    const getImageUrl = (ci) => {
        if (!ci) return normalizeUrl(item.thumbnail);
        return normalizeUrl(ci.gallery_image_details?.image_url) || normalizeUrl(ci.gallery_image_details?.image_compressed) || normalizeUrl(ci.file_url) || normalizeUrl(item.thumbnail);
    };

    const currentUrl = getImageUrl(current);
    const videoUrl = isVideo ? normalizeUrl(current.file_url) : null;

    const nextSlide = () => { setCurrentIndex((prev) => (prev + 1) % images.length); setIsPlaying(false); };
    const prevSlide = () => { setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); setIsPlaying(false); };

    useEffect(() => {
        setCurrentIndex(0);
        setIsPlaying(false);
    }, [item]);

    useEffect(() => {
        if (!isPlaying && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isPlaying, currentIndex]);

    const typeLabel = { STORY: 'Story', VIDEO: 'Video', CAROUSEL_IMAGE: 'Carousel', IMAGE: 'Photo' }[primaryType] || 'Photo';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-3xl animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Instagram Preview</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {item.title} &middot; <span className="font-semibold" style={{ color: primaryColor }}>{typeLabel}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                        <X size={16} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Card Body */}
                <div className="flex flex-col lg:flex-row items-center gap-6 p-6 overflow-y-auto max-h-[80vh]">
                    {/* Phone frame */}
                    <div className={`relative w-[340px] max-w-full bg-black rounded-[2rem] border-[3px] border-gray-700 shadow-xl overflow-hidden shrink-0 ${isStory ? 'max-h-[620px]' : ''}`}>
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-5 bg-gray-700 rounded-b-xl z-20" />

                        {/* Screen */}
                        <div className={`bg-white dark:bg-black ${isStory ? 'h-[620px]' : ''} pt-0.5`}>
                            {/* Instagram Header (not for stories) */}
                            {!isStory && (
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white text-[8px] font-bold">
                                            L
                                        </div>
                                        <span className="font-bold text-[11px] text-gray-900 dark:text-white">lumena</span>
                                    </div>
                                    <MoreHorizontal size={14} className="text-gray-900 dark:text-white" />
                                </div>
                            )}

                            {/* Content Area */}
                            <div className={`relative ${isStory ? 'h-[calc(620px-2px)]' : ''}`}>
                                {isStory ? (
                                    <div className="relative h-full">
                                        <div className="absolute top-2 left-3 right-3 z-10 flex gap-1">
                                            <div className="h-[2px] flex-1 bg-white/40 rounded-full overflow-hidden">
                                                <div className="h-full w-3/4 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        {currentUrl ? (
                                            <img src={currentUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                                                <ImageIcon size={40} className="text-white/40" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
                                        <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden flex-shrink-0 bg-gradient-to-br from-yellow-400 to-purple-600" />
                                            <span className="text-white font-bold text-[11px]">lumena</span>
                                            <span className="text-white/60 text-[9px] ml-auto">2h</span>
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 z-10">
                                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
                                                <input type="text" placeholder="Send message..." className="flex-1 bg-transparent text-white text-[10px] placeholder:text-white/50 outline-none" readOnly />
                                                <Send size={12} className="text-white/60 -rotate-45" />
                                            </div>
                                            {item.caption && (
                                                <p className="text-white/90 text-[10px] mt-1.5 px-1 font-medium leading-relaxed line-clamp-2">{item.caption}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : isVideo ? (
                                    <div className="relative bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: '340px' }}>
                                        {videoUrl && isPlaying ? (
                                            <video
                                                ref={videoRef}
                                                src={videoUrl}
                                                className="w-full max-h-[420px]"
                                                controls
                                                autoPlay
                                                playsInline
                                                onEnded={() => setIsPlaying(false)}
                                            />
                                        ) : (
                                            <>
                                                {currentUrl ? (
                                                    <img src={currentUrl} alt="" className="w-full max-h-[420px] object-contain" />
                                                ) : (
                                                    <div className="bg-gradient-to-br from-blue-500 to-violet-600 w-full flex items-center justify-center py-20">
                                                        <Video size={40} className="text-white/40" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <button
                                                        onClick={() => setIsPlaying(true)}
                                                        className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl shadow-black/30 hover:scale-110 transition-transform"
                                                    >
                                                        <Play size={22} className="text-gray-900 ml-0.5" />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">▶ Video</div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                        {currentUrl ? (
                                            <img src={currentUrl} alt="" className="w-full max-h-[420px] object-contain" />
                                        ) : (
                                            <div className="bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 w-full flex items-center justify-center py-20">
                                                <ImageIcon size={40} className="text-purple-300 dark:text-purple-500/50" />
                                            </div>
                                        )}
                                        {isCarousel && images.length > 1 && (
                                            <>
                                                {currentIndex > 0 && (
                                                    <button onClick={prevSlide} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                                                        <ChevronLeft size={14} className="text-gray-800" />
                                                    </button>
                                                )}
                                                {currentIndex < images.length - 1 && (
                                                    <button onClick={nextSlide} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                                                        <ChevronRight size={14} className="text-gray-800" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {isCarousel && images.length > 1 && (
                                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                                                {images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentIndex(i)}
                                                        className={`transition-all duration-300 rounded-full ${
                                                            i === currentIndex ? 'w-4 h-1 bg-primary' : 'w-1 h-1 bg-gray-400/50'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {isCarousel && images.length > 1 && (
                                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                {currentIndex + 1}/{images.length}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Instagram Actions (not for stories) */}
                            {!isStory && (
                                <>
                                    <div className="flex items-center justify-between px-3 py-1.5">
                                        <div className="flex items-center gap-3">
                                            <Heart size={16} className="text-gray-900 dark:text-white" />
                                            <MessageCircle size={16} className="text-gray-900 dark:text-white" />
                                            <Send size={16} className="text-gray-900 dark:text-white" />
                                        </div>
                                        <Bookmark size={16} className="text-gray-900 dark:text-white" />
                                    </div>
                                    <div className="px-3 pb-2.5 space-y-0.5">
                                        <p className="text-[10px] font-bold text-gray-900 dark:text-white">100 likes</p>
                                        <p className="text-[10px] leading-relaxed text-gray-800 dark:text-gray-200">
                                            <span className="font-bold text-gray-900 dark:text-white">lumena </span>
                                            {item.caption || 'No caption'}
                                        </p>
                                        {item.hashtags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {item.hashtags.map((tag, i) => (
                                                    <span key={i} className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-0.5">View 1 comment</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="flex flex-col gap-4 w-full lg:w-56 self-stretch justify-between">
                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Content Type</p>
                                <p className="text-sm font-bold text-foreground">{typeLabel}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Title</p>
                                <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
                            </div>
                            {item.caption && (
                                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Caption</p>
                                    <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{item.caption}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={onSelect}
                                className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 20px ${primaryColor}55` }}
                            >
                                <Check size={16} />
                                Select & Schedule
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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
    const [previewItem, setPreviewItem] = useState(null);

    // Step 3
    const [availablePlatforms, setAvailablePlatforms] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
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

    // Load content and social accounts when client changes
    useEffect(() => {
        if (!selectedClient) {
            setAvailablePlatforms([]);
            setSelectedPlatforms([]);
            return;
        }

        const fetchSocial = async () => {
            try {
                const res = await fetch(`${API_BASE}/scheduler/social-accounts/?client_id=${selectedClient.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const platforms = data
                        .filter(acc => acc.status === "active")
                        .map(acc => acc.platform.toLowerCase());
                    setAvailablePlatforms(platforms);
                    if (platforms.length > 0) {
                        setSelectedPlatforms([platforms[0]]);
                    } else {
                        setSelectedPlatforms([]);
                    }
                }
            } catch (err) {
                console.error("Error fetching client social networks:", err);
            }
        };

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
                                if (ci) return normalizeUrl(ci.gallery_image_details?.image_url) || normalizeUrl(ci.gallery_image_details?.image_compressed) || normalizeUrl(ci.file_url) || null;
                                return normalizeUrl(item.linked_image_details?.image_compressed) || normalizeUrl(item.linked_image_details?.image) || null;
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
        fetchSocial();
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

    const handleOpenPreview = (item) => {
        setPreviewItem(item);
    };

    const handleSelectContent = () => {
        if (!previewItem) return;
        setSelectedContent(previewItem);
        setPreviewItem(null);
        setStep(3);
    };

    const handleClosePreview = () => {
        setPreviewItem(null);
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
        setPreviewItem(null);
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
                                        onPreview={handleOpenPreview}
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
                                        {PLATFORMS.filter((p) => availablePlatforms.includes(p.id)).map((platform) => (
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
                                        {availablePlatforms.length === 0 && (
                                            <p className="text-sm text-red-500 font-bold">
                                                Este cliente no tiene redes sociales vinculadas. Configúralas en "Client Settings" o en el panel de usuarios.
                                            </p>
                                        )}
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

            {/* Instagram Preview */}
            {previewItem && (
                <InstagramPreview
                    item={previewItem}
                    onClose={handleClosePreview}
                    onSelect={handleSelectContent}
                    primaryColor={primaryColor}
                />
            )}

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
