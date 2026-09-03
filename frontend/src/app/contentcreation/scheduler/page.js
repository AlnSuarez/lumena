"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
    Calendar,
    Instagram,
    Linkedin,
    Twitter,
    Facebook,
    CheckCircle2,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
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
    CircleHelp,
    Users,
    ArrowRight,
    Search,
    Clock,
    Sparkles,
    Eye,
    BarChart3,
    Layers,
    CalendarCheck2,
    CalendarDays,
} from "lucide-react";
import { API_BASE, API_ORIGIN } from "../../../apiSession";
import ContentMediaPreview, { isPdfMedia, isVideoMedia } from "../../../components/ContentMediaPreview";
import "../scheduler.css";

/* ──────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */
const WIZARD_STEPS = [
    { id: 1, name: "Client" },
    { id: 2, name: "Piece" },
    { id: 3, name: "When & How" },
    { id: 4, name: "Publish" },
];

const FLOW_STEPS = [
    { id: "client", number: 1, name: "Client", meaning: "Whose approved content you are publishing" },
    { id: "piece", number: 2, name: "Piece", meaning: "Pick an approved photo, carousel, video, story, or PDF" },
    { id: "when", number: 3, name: "When", meaning: "Platform, date, time, and caption" },
    { id: "send", number: 4, name: "Send", meaning: "Schedule it, save a draft, or publish now" },
];

const PIPELINE_STAGES = [
    { id: "TO_DO", number: 1, name: "To Do", meaning: "Waiting to start" },
    { id: "IN_PROGRESS", number: 2, name: "In Progress", meaning: "Being created" },
    { id: "QA", number: 3, name: "QA", meaning: "Internal review" },
    { id: "IN_REVISION", number: 4, name: "In Revision", meaning: "Changes requested" },
    { id: "CLIENT_REVIEW", number: 5, name: "Client Review", meaning: "Waiting on client" },
    { id: "APPROVED", number: 6, name: "Approved", meaning: "Ready to schedule" },
    { id: "DONE", number: 7, name: "Done", meaning: "Published" },
];

const TYPE_LABELS = {
    STORY: "Story",
    VIDEO: "Video",
    CAROUSEL_IMAGE: "Carousel",
    IMAGE: "Photo",
    PDF: "PDF",
};

const PLATFORMS = [
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "twitter", label: "X / Twitter", icon: Twitter },
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "tiktok", label: "TikTok", icon: Music },
];

const BEST_TIMES = [
    { label: "Morning", time: "09:00", desc: "Best for commuters" },
    { label: "Lunch", time: "13:00", desc: "Midday break" },
    { label: "Evening", time: "18:30", desc: "Peak leisure" },
    { label: "Night", time: "21:00", desc: "Late browsing" },
];

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
const normalizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_ORIGIN}${url}`;
};

function sameId(a, b) {
    if (a == null || b == null) return false;
    return String(a) === String(b);
}

function asList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function clientIdOf(item) {
    return item?.client ?? item?.client_details?.id ?? null;
}

function mapApprovedPiece(item) {
    const ci = item.content_items?.[0];
    return {
        id: item.id,
        title:
            (item.request_type?.replace(/_/g, " ") || "Content") +
            " – " +
            (item.month
                ? new Date(item.month).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                  })
                : ""),
        status: item.status,
        content_items: item.content_items || [],
        thumbnail: ci
            ? normalizeUrl(ci.gallery_image_details?.image_url) ||
              normalizeUrl(ci.gallery_image_details?.image_compressed) ||
              normalizeUrl(ci.file_url) ||
              null
            : normalizeUrl(item.linked_image_details?.image_compressed) ||
              normalizeUrl(item.linked_image_details?.image) ||
              null,
        caption: item.ai_caption || item.content_text || "",
        hashtags: [],
        client_id: clientIdOf(item),
        content_text: item.content_text || "",
        ai_caption: item.ai_caption || "",
        linked_image_details: item.linked_image_details || null,
        request_type: item.request_type,
        month: item.month,
    };
}

function toLocalISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getToday() {
    return toLocalISO(new Date());
}

function addDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toLocalISO(d);
}

function getTypeLabel(item) {
    const mediaType = item?.content_items?.[0]?.media_type;
    return TYPE_LABELS[mediaType] || "Photo";
}

function isPdfContent(item) {
    const mediaType = item?.content_items?.[0]?.media_type;
    return mediaType === "PDF" || isPdfMedia(item?.content_items?.[0], item?.thumbnail);
}

function isPdfThumb(item) {
    return isPdfContent(item);
}

function isVideoThumb(item) {
    const label = getTypeLabel(item);
    return label === "Video" || isVideoMedia(item?.content_items?.[0], item?.thumbnail);
}

/* ──────────────────────────────────────────────────────────
   Toast
────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`sch-toast${type === "success" ? " is-ok" : type === "error" ? " is-err" : ""}`}>
            {type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message}
            <button type="button" onClick={onClose} aria-label="Dismiss">
                <X size={14} />
            </button>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   InstagramPreview — piece preview modal
────────────────────────────────────────────────────────── */
function InstagramPreview({ item, onClose, onSelect }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const contentItems = item.content_items || [];
    const primaryType = contentItems[0]?.media_type || "IMAGE";
    const isCarousel = primaryType === "CAROUSEL_IMAGE";
    const isStory = primaryType === "STORY";
    const isVideo = primaryType === "VIDEO";
    const isPdf = primaryType === "PDF";
    const images =
        contentItems.length > 0
            ? contentItems
            : [{ media_type: "IMAGE", file_url: item.thumbnail, gallery_image_details: null }];
    const current = images[currentIndex] || images[0];

    const getImageUrl = (ci) => {
        if (!ci) return normalizeUrl(item.thumbnail);
        return (
            normalizeUrl(ci.gallery_image_details?.image_url) ||
            normalizeUrl(ci.gallery_image_details?.image_compressed) ||
            normalizeUrl(ci.file_url) ||
            normalizeUrl(item.thumbnail)
        );
    };

    const currentUrl = getImageUrl(current);
    const currentRotation = current?.rotation || 0;
    const videoUrl = isVideo ? normalizeUrl(current.file_url) : null;
    const typeLabel = TYPE_LABELS[primaryType] || "Photo";

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsPlaying(false);
    };
    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setIsPlaying(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentIndex(0);
        setIsPlaying(false);
    }, [item]);

    useEffect(() => {
        if (!isPlaying && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isPlaying, currentIndex]);

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div
                className="sch-preview"
                role="dialog"
                aria-labelledby="sch-preview-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sch-preview__head">
                    <div>
                        <h3 id="sch-preview-title">{isPdf ? "LinkedIn document" : "Preview"}</h3>
                        <p>
                            {item.title} · {typeLabel}
                        </p>
                    </div>
                    <button type="button" className="sch-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
                <div className="sch-preview__body">
                    {isPdf ? (
                        <div className="sch-phone" style={{ overflow: "hidden" }}>
                            <ContentMediaPreview
                                src={currentUrl}
                                item={current}
                                alt={current?.file_name || item.title || "PDF"}
                            />
                        </div>
                    ) : (
                        <div className="sch-phone">
                            <div className="sch-phone__notch" />
                            {isStory ? (
                                <div className="sch-story">
                                    <div className="sch-story__bar">
                                        <span />
                                    </div>
                                    {currentUrl ? (
                                        <img
                                            src={currentUrl}
                                            alt=""
                                            style={{ transform: `rotate(${currentRotation}deg)` }}
                                        />
                                    ) : (
                                        <ImageIcon size={40} />
                                    )}
                                    <div className="sch-story__user">lumena · 2h</div>
                                    {item.caption && <p className="sch-story__cap">{item.caption}</p>}
                                </div>
                            ) : (
                                <>
                                    <div className="sch-ig-head">
                                        <span>lumena</span>
                                        <MoreHorizontal size={14} />
                                    </div>
                                    <div className="sch-ig-media">
                                        {isVideo ? (
                                            videoUrl && isPlaying ? (
                                                <video
                                                    ref={videoRef}
                                                    src={videoUrl}
                                                    controls
                                                    autoPlay
                                                    playsInline
                                                    onEnded={() => setIsPlaying(false)}
                                                />
                                            ) : (
                                                <>
                                                    {currentUrl ? (
                                                        <img
                                                            src={currentUrl}
                                                            alt=""
                                                            style={{ transform: `rotate(${currentRotation}deg)` }}
                                                        />
                                                    ) : (
                                                        <Video size={40} />
                                                    )}
                                                    <div className="sch-ig-play">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsPlaying(true)}
                                                            aria-label="Play"
                                                        >
                                                            <Play size={18} />
                                                        </button>
                                                    </div>
                                                </>
                                            )
                                        ) : currentUrl ? (
                                            <img
                                                src={currentUrl}
                                                alt=""
                                                style={{ transform: `rotate(${currentRotation}deg)` }}
                                            />
                                        ) : (
                                            <ImageIcon size={40} />
                                        )}
                                        {isCarousel && images.length > 1 && (
                                            <>
                                                {currentIndex > 0 && (
                                                    <button
                                                        type="button"
                                                        className="sch-ig-nav is-prev"
                                                        onClick={prevSlide}
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                )}
                                                {currentIndex < images.length - 1 && (
                                                    <button
                                                        type="button"
                                                        className="sch-ig-nav is-next"
                                                        onClick={nextSlide}
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                                <div className="sch-ig-count">
                                                    {currentIndex + 1}/{images.length}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="sch-ig-actions">
                                        <div>
                                            <Heart size={16} />
                                            <MessageCircle size={16} />
                                            <Send size={16} />
                                        </div>
                                        <Bookmark size={16} />
                                    </div>
                                    <div className="sch-ig-copy">
                                        <p>
                                            <strong>lumena</strong> {item.caption || "No caption"}
                                        </p>
                                        {item.hashtags?.length > 0 && <p>{item.hashtags.join(" ")}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <div className="sch-side">
                        <div className="sch-meta">
                            <label>Type</label>
                            <p>{typeLabel}</p>
                        </div>
                        <div className="sch-meta">
                            <label>Title</label>
                            <p>{item.title}</p>
                        </div>
                        {item.caption && (
                            <div className="sch-meta">
                                <label>Caption</label>
                                <p>{item.caption}</p>
                            </div>
                        )}
                        <button type="button" className="sch-btn sch-btn--primary" onClick={onSelect}>
                            <Check size={16} />
                            Use this piece
                        </button>
                        <button type="button" className="sch-btn sch-btn--ghost" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   VisualCalendar — pure React monthly calendar with post markers & quick dates
────────────────────────────────────────────────────────── */
function VisualCalendar({ value, onChange, scheduledDates = {} }) {
    const todayStr = getToday();
    const today = new Date(todayStr + "T00:00:00");

    const initDate = value ? new Date(value + "T00:00:00") : new Date();
    const [viewYear, setViewYear] = useState(initDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initDate.getMonth());

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0 = Sunday

    const monthLabel = firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    // Quick date selectors
    const quickDates = [
        { label: "Today", val: todayStr },
        { label: "Tomorrow", val: addDays(1) },
        { label: "In 3 days", val: addDays(3) },
        { label: "In 1 week", val: addDays(7) },
    ];

    // Build grid cells
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

    const selectedDate = value ? new Date(value + "T00:00:00") : null;

    const isSelected = (day) => {
        if (!selectedDate || !day) return false;
        return (
            selectedDate.getFullYear() === viewYear &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getDate() === day
        );
    };
    const isToday = (day) => {
        if (!day) return false;
        return (
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
        );
    };
    const isPast = (day) => {
        if (!day) return false;
        return new Date(viewYear, viewMonth, day) < today;
    };

    const hasPost = (day) => {
        if (!day) return false;
        const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return Boolean(scheduledDates[iso]);
    };

    const handleDay = (day) => {
        if (!day || isPast(day)) return;
        const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        onChange(iso);
    };

    const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
        <div className="sch-cal">
            {/* Quick date shortcuts */}
            <div className="sch-cal__quick">
                {quickDates.map((q) => (
                    <button
                        key={q.label}
                        type="button"
                        className={`sch-cal__quick-btn${value === q.val ? " is-active" : ""}`}
                        onClick={() => {
                            onChange(q.val);
                            const target = new Date(q.val + "T00:00:00");
                            setViewYear(target.getFullYear());
                            setViewMonth(target.getMonth());
                        }}
                    >
                        {q.label}
                    </button>
                ))}
            </div>

            <div className="sch-cal__header">
                <button
                    type="button"
                    className="sch-cal__nav"
                    onClick={prevMonth}
                    aria-label="Previous month"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="sch-cal__month">{monthLabel}</span>
                <button
                    type="button"
                    className="sch-cal__nav"
                    onClick={nextMonth}
                    aria-label="Next month"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="sch-cal__dow">
                {DOW.map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="sch-cal__grid">
                {cells.map((day, i) => {
                    const postDot = day && hasPost(day);
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!day || isPast(day)}
                            onClick={() => handleDay(day)}
                            aria-pressed={day && isSelected(day) ? true : undefined}
                            className={[
                                "sch-cal__day",
                                !day ? "is-empty" : "",
                                day && isToday(day) ? "is-today" : "",
                                day && isSelected(day) ? "is-selected" : "",
                                day && isPast(day) ? "is-past" : "",
                                postDot ? "has-post" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <span>{day || ""}</span>
                            {postDot && <span className="sch-cal__dot" title="Already has scheduled content" />}
                        </button>
                    );
                })}
            </div>
            {value && (
                <div className="sch-cal__footnote">
                    <CalendarCheck2 size={13} />
                    <span>
                        Selected:{" "}
                        <strong>
                            {new Date(value + "T00:00:00").toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </strong>
                    </span>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   ScheduleSidebar — sticky right panel showing progress & step jumps
────────────────────────────────────────────────────────── */
function ScheduleSidebar({ client, content, platforms, date, time, caption, onJumpStep, currentStep }) {
    const platformData = PLATFORMS.filter((p) => platforms.includes(p.id));
    const formatted = date
        ? new Date(date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
          })
        : null;

    return (
        <aside className="sch-sidebar">
            <div className="sch-sidebar__top">
                <p className="sch-sidebar__title">Live Summary</p>
                <span className="sch-sidebar__step-tag">Step {currentStep} of 4</span>
            </div>

            {/* Client */}
            <div
                className={`sch-sidebar__field${!client ? " is-empty" : " is-clickable"}`}
                onClick={() => onJumpStep(1)}
                title="Click to jump to Client selection"
            >
                <div className="sch-sidebar__field-head">
                    <span className="sch-sidebar__label">1. Client</span>
                    {client && <span className="sch-sidebar__edit-btn">Change</span>}
                </div>
                {client ? (
                    <div className="sch-sidebar__client">
                        <span className="sch-avatar" style={{ background: client.color }}>
                            {client.initials}
                        </span>
                        <strong>{client.name}</strong>
                    </div>
                ) : (
                    <p className="sch-sidebar__placeholder">Not selected yet</p>
                )}
            </div>

            {/* Piece */}
            <div
                className={`sch-sidebar__field${!content ? " is-empty" : " is-clickable"}`}
                onClick={() => client && onJumpStep(2)}
                title={client ? "Click to jump to Piece selection" : undefined}
            >
                <div className="sch-sidebar__field-head">
                    <span className="sch-sidebar__label">2. Piece</span>
                    {content && <span className="sch-sidebar__edit-btn">Change</span>}
                </div>
                {content ? (
                    <div className="sch-sidebar__piece">
                        {content.thumbnail && (
                            <div className="sch-sidebar__thumb">
                                <img src={content.thumbnail} alt={content.title} />
                            </div>
                        )}
                        <span>{content.title}</span>
                    </div>
                ) : (
                    <p className="sch-sidebar__placeholder">Not selected yet</p>
                )}
            </div>

            {/* Platforms */}
            <div
                className={`sch-sidebar__field${platformData.length === 0 ? " is-empty" : " is-clickable"}`}
                onClick={() => content && onJumpStep(3)}
                title={content ? "Click to jump to Platforms" : undefined}
            >
                <div className="sch-sidebar__field-head">
                    <span className="sch-sidebar__label">3. Platforms</span>
                    {platformData.length > 0 && <span className="sch-sidebar__edit-btn">Edit</span>}
                </div>
                {platformData.length > 0 ? (
                    <div className="sch-sidebar__platforms">
                        {platformData.map((p) => {
                            const Icon = p.icon;
                            return (
                                <span key={p.id} className="sch-sidebar__platform">
                                    <Icon size={13} />
                                    {p.label}
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <p className="sch-sidebar__placeholder">Not set yet</p>
                )}
            </div>

            {/* Date & Time */}
            <div
                className={`sch-sidebar__field${!date ? " is-empty" : " is-clickable"}`}
                onClick={() => content && onJumpStep(3)}
                title={content ? "Click to jump to Schedule Date/Time" : undefined}
            >
                <div className="sch-sidebar__field-head">
                    <span className="sch-sidebar__label">Schedule</span>
                    {date && <span className="sch-sidebar__edit-btn">Edit</span>}
                </div>
                {date ? (
                    <p className="sch-sidebar__value">
                        <Clock size={13} />
                        {formatted}
                        {time ? ` · ${time}` : ""}
                    </p>
                ) : (
                    <p className="sch-sidebar__placeholder">Not set yet</p>
                )}
            </div>

            {/* Caption */}
            <div
                className={`sch-sidebar__field${!caption ? " is-empty" : " is-clickable"}`}
                onClick={() => content && onJumpStep(3)}
                title={content ? "Click to edit Caption" : undefined}
            >
                <div className="sch-sidebar__field-head">
                    <span className="sch-sidebar__label">Caption</span>
                    {caption && <span className="sch-sidebar__edit-btn">Edit</span>}
                </div>
                {caption ? (
                    <p className="sch-sidebar__caption">
                        {caption.length > 110 ? caption.slice(0, 110) + "…" : caption}
                    </p>
                ) : (
                    <p className="sch-sidebar__placeholder">Not written yet</p>
                )}
            </div>
        </aside>
    );
}

/* ──────────────────────────────────────────────────────────
   SchedulerPage — main export
────────────────────────────────────────────────────────── */
export default function SchedulerPage() {
    const [viewMode, setViewMode] = useState("wizard"); // "wizard" | "logs"
    const [step, setStep] = useState(1);
    const [showLearn, setShowLearn] = useState(false);

    // Client state & filters
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const [clientFilterReadyOnly, setClientFilterReadyOnly] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadingClients, setLoadingClients] = useState(true);

    // Piece state & filters
    const [contentItems, setContentItems] = useState([]);
    const [pieceTypeFilter, setPieceTypeFilter] = useState("ALL");
    const [approvedPieces, setApprovedPieces] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);

    // Form state
    const [availablePlatforms, setAvailablePlatforms] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [scheduleDate, setScheduleDate] = useState(getToday());
    const [releaseTime, setReleaseTime] = useState("10:00");
    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState([]);
    const [newHashtag, setNewHashtag] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    const [toast, setToast] = useState(null);
    const hashtagInputRef = useRef(null);
    const wizardMainRef = useRef(null);

    // Log / Scheduled posts state
    const [logPosts, setLogPosts] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [filterLogClient, setFilterLogClient] = useState("ALL");
    const [filterLogStatus, setFilterLogStatus] = useState("ALL");
    const [logMetrics, setLogMetrics] = useState({});

    /* ── Data fetching ── */
    const fetchApprovedPieces = async () => {
        setLoadingContent(true);
        try {
            const userId = localStorage.getItem("userId");
            const role = localStorage.getItem("userRole") || "SUPERUSER";
            const url = new URL(`${API_BASE}/contents/monthly-requests/`);
            if (userId) url.searchParams.append("user_id", userId);
            url.searchParams.append("role", role);
            const res = await fetch(url.toString());
            if (res.ok) {
                const pieces = asList(await res.json())
                    .filter((item) => String(item.status || "").toUpperCase() === "APPROVED")
                    .map(mapApprovedPiece);
                setApprovedPieces(pieces);
            } else {
                setApprovedPieces([]);
            }
        } catch {
            setApprovedPieces([]);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const userId = localStorage.getItem("userId");
            const res = await fetch(`${API_BASE}/users/clients/?user_id=${userId}`);
            if (res.ok) {
                const data = asList(await res.json());
                if (data.length > 0) {
                    const colors = ["#7C3AED", "#059669", "#EA580C", "#2563EB", "#DB2777"];
                    setClients(
                        data.map((c, i) => {
                            const practiceName = c.client_profile?.practice_name;
                            const fullName =
                                c.first_name && c.last_name
                                    ? `${c.first_name} ${c.last_name}`.trim()
                                    : null;
                            const displayName =
                                practiceName || fullName || c.username || `Client ${i + 1}`;
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

    const fetchPostMetrics = async (postId) => {
        if (logMetrics[postId]) return;
        try {
            const res = await fetch(`${API_BASE}/scheduler/schedules/${postId}/metrics/`);
            if (res.ok) {
                const data = await res.json();
                setLogMetrics((prev) => ({ ...prev, [postId]: data.metrics }));
            }
        } catch (err) {
            console.error("Error fetching post metrics:", err);
        }
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const url = new URL(`${API_BASE}/scheduler/schedules/`);
            if (filterLogClient !== "ALL") url.searchParams.append("client_id", filterLogClient);
            if (filterLogStatus !== "ALL") url.searchParams.append("status", filterLogStatus);
            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setLogPosts(data);
                data.forEach((post) => {
                    if (post.status === "PUBLISHED") fetchPostMetrics(post.id);
                });
            }
        } catch (err) {
            console.error("Error fetching scheduled logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchApprovedPieces();
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (viewMode === "logs") fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, filterLogClient, filterLogStatus]);

    useEffect(() => {
        wizardMainRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    }, [step, viewMode]);

    // Map scheduled dates from logs for calendar dots
    const scheduledDatesMap = useMemo(() => {
        const map = {};
        logPosts.forEach((p) => {
            if (p.schedule_date) {
                map[p.schedule_date] = (map[p.schedule_date] || 0) + 1;
            }
        });
        return map;
    }, [logPosts]);

    const readyCountByClient = useMemo(() => {
        const counts = {};
        approvedPieces.forEach((item) => {
            const key = String(item.client_id);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [approvedPieces]);

    const visibleClients = useMemo(() => {
        return [...clients]
            .filter((c) => {
                if (clientFilterReadyOnly && (readyCountByClient[String(c.id)] || 0) === 0) {
                    return false;
                }
                if (clientSearch.trim()) {
                    return c.name.toLowerCase().includes(clientSearch.toLowerCase().trim());
                }
                return true;
            })
            .sort((a, b) => {
                const readyA = readyCountByClient[String(a.id)] || 0;
                const readyB = readyCountByClient[String(b.id)] || 0;
                if (readyA !== readyB) return readyB - readyA;
                return a.name.localeCompare(b.name);
            });
    }, [clients, readyCountByClient, clientSearch, clientFilterReadyOnly]);

    useEffect(() => {
        if (!selectedClient) {
            setAvailablePlatforms([]);
            setSelectedPlatforms([]);
            setContentItems([]);
            return;
        }
        setContentItems(
            approvedPieces.filter((item) => sameId(item.client_id, selectedClient.id))
        );
    }, [selectedClient, approvedPieces]);

    const visiblePieces = useMemo(() => {
        if (pieceTypeFilter === "ALL") return contentItems;
        return contentItems.filter((item) => {
            const mediaType = item?.content_items?.[0]?.media_type;
            return mediaType === pieceTypeFilter;
        });
    }, [contentItems, pieceTypeFilter]);

    useEffect(() => {
        if (!selectedClient) return;
        const fetchSocial = async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/scheduler/social-accounts/?client_id=${selectedClient.id}`
                );
                if (res.ok) {
                    const data = asList(await res.json());
                    const platforms = data
                        .filter((acc) => acc.status === "active")
                        .map((acc) => acc.platform.toLowerCase());
                    setAvailablePlatforms(platforms);
                    setSelectedPlatforms(platforms.length > 0 ? [platforms[0]] : []);
                }
            } catch (err) {
                console.error("Error fetching client social networks:", err);
            }
        };
        fetchSocial();
    }, [selectedClient]);

    useEffect(() => {
        if (selectedContent) {
            setCaption(selectedContent.caption || "");
            setHashtags(selectedContent.hashtags || []);
        }
    }, [selectedContent]);

    useEffect(() => {
        if (!isPdfContent(selectedContent)) return;
        if (availablePlatforms.includes("linkedin")) {
            setSelectedPlatforms(["linkedin"]);
        } else {
            setSelectedPlatforms([]);
        }
    }, [selectedContent, availablePlatforms]);

    /* ── Handlers ── */
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSelectedContent(null);
        setStep(2);
    };

    const handleOpenPreview = (item, e) => {
        if (e) e.stopPropagation();
        setPreviewItem(item);
    };

    const handleSelectPieceDirectly = (item) => {
        setSelectedContent(item);
    };

    const handleSelectContentFromModal = () => {
        if (!previewItem) return;
        setSelectedContent(previewItem);
        setPreviewItem(null);
        setStep(3);
    };

    const togglePlatform = (id) => {
        if (isPdfContent(selectedContent) && id !== "linkedin") return;
        setSelectedPlatforms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const addHashtag = () => {
        const tag = newHashtag.trim().replace(/\s+/g, "");
        if (!tag) return;
        const formatted = tag.startsWith("#") ? tag : `#${tag}`;
        if (!hashtags.includes(formatted)) setHashtags((prev) => [...prev, formatted]);
        setNewHashtag("");
        hashtagInputRef.current?.focus();
    };

    const removeHashtag = (tag) => setHashtags((prev) => prev.filter((h) => h !== tag));

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

    const submitSchedule = async (mode) => {
        if (!selectedContent || !selectedClient) return;
        if (selectedPlatforms.length === 0) {
            setToast({ message: "Select at least one platform.", type: "error" });
            return;
        }
        if (
            isPdfContent(selectedContent) &&
            selectedPlatforms.some((p) => p !== "linkedin")
        ) {
            setToast({
                message: "PDF documents can only be published to LinkedIn.",
                type: "error",
            });
            return;
        }

        const isDraft = mode === "draft";
        const isPublish = mode === "publish";
        let setter = setIsScheduling;
        if (isDraft) setter = setIsSaving;
        else if (isPublish) setter = setIsPublishing;
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
            status: isDraft ? "DRAFT" : isPublish ? "PUBLISHING" : "SCHEDULED",
            publish_now: isPublish,
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
                        ? "Draft saved successfully."
                        : isPublish
                        ? "Published immediately."
                        : "Scheduled! It will move to Done when it goes live.",
                    type: "success",
                });
                if (!isDraft) handleDiscard();
                fetchLogs();
                fetchApprovedPieces();
            } else {
                const errData = await res.json().catch(() => ({}));
                setToast({
                    message: errData.error || `Failed to save schedule (Status ${res.status})`,
                    type: "error",
                });
            }
        } catch (err) {
            console.error("Network or execution error in submitSchedule:", err);
            setToast({
                message: "Connection failed. Please ensure the backend server is running.",
                type: "error",
            });
        } finally {
            setter(false);
        }
    };

    /* ── Derived state ── */
    const hasClient = Boolean(selectedClient);
    const hasPiece = Boolean(selectedContent);
    const hasWhen = Boolean(scheduleDate && releaseTime && selectedPlatforms.length > 0);
    const canSend = hasClient && hasPiece && hasWhen;

    const activeFlowStep = !hasClient
        ? "client"
        : !hasPiece
        ? "piece"
        : !hasWhen
        ? "when"
        : "send";

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        const stepMap = { client: 1, piece: 2, when: 3, send: 4 };
        const target = stepMap[stepId];
        if (target) {
            setViewMode("wizard");
            setStep(target);
        }
    };

    /* ──────────────────────────────────────────────
       Render
    ────────────────────────────────────────────── */
    return (
        <div className="scheduler">
            {/* ── Header ── */}
            <header className="sch-header">
                <div className="sch-header__titles">
                    <h1>Scheduler</h1>
                    <p>Pick approved content, set when it goes out, then schedule or publish.</p>
                </div>
                <div className="sch-header__actions">
                    {/* View mode switcher */}
                    <div className="sch-view-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === "wizard"}
                            className={`sch-view-tab${viewMode === "wizard" ? " is-active" : ""}`}
                            onClick={() => setViewMode("wizard")}
                        >
                            <CalendarDays size={14} />
                            Schedule Post
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === "logs"}
                            className={`sch-view-tab${viewMode === "logs" ? " is-active" : ""}`}
                            onClick={() => setViewMode("logs")}
                        >
                            <Layers size={14} />
                            Scheduled & Logs
                            {logPosts.length > 0 && (
                                <span className="sch-view-tab__badge">{logPosts.length}</span>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        className={`sch-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="sch-learn-panel"
                    >
                        <CircleHelp size={15} />
                        How this works
                    </button>
                    {viewMode === "wizard" && (
                        <button type="button" className="sch-learn-btn" onClick={handleDiscard}>
                            <X size={15} />
                            Start over
                        </button>
                    )}
                </div>
            </header>

            {/* ── How it works modal ── */}
            {showLearn && (
                <div className="sch-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        id="sch-learn-panel"
                        className="sch-learn"
                        role="dialog"
                        aria-labelledby="sch-learn-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sch-learn__head">
                            <div>
                                <h2 id="sch-learn-title">How scheduling works</h2>
                                <p>
                                    Only Approved pieces appear here. Scheduling or publishing sends
                                    them to Done on the Content Board.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="sch-icon-btn"
                                onClick={() => setShowLearn(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="sch-learn__label">On this page</p>
                        <nav className="sch-flow" aria-label="Scheduling steps">
                            {FLOW_STEPS.map((s) => {
                                const isDone =
                                    (s.id === "client" && hasClient) ||
                                    (s.id === "piece" && hasPiece) ||
                                    (s.id === "when" && hasWhen);
                                const isActive = activeFlowStep === s.id;
                                const isReady = s.id === "send" && canSend;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={[
                                            "sch-flow__step",
                                            isDone && !isActive ? "is-done" : "",
                                            isActive ? "is-active" : "",
                                            isReady ? "is-ready" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() => handleFlowClick(s.id)}
                                    >
                                        <div className="sch-flow__top">
                                            <span className="sch-flow__num">{s.number}</span>
                                            <span className="sch-flow__name">{s.name}</span>
                                        </div>
                                        <p className="sch-flow__meaning">{s.meaning}</p>
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="sch-destination">
                            <p className="sch-destination__label">Content Board pipeline</p>
                            <div className="sch-destination__track">
                                {PIPELINE_STAGES.map((stage) => {
                                    const isHere = stage.id === "APPROVED";
                                    const isLanding = stage.id === "DONE";
                                    return (
                                        <div
                                            key={stage.id}
                                            className={`sch-dest${isHere ? " is-here" : ""}${
                                                isLanding ? " is-landing" : ""
                                            }`}
                                            data-stage={stage.id}
                                        >
                                            <div className="sch-dest__top">
                                                <span className="sch-dest__num">{stage.number}</span>
                                                <span className="sch-dest__name">{stage.name}</span>
                                            </div>
                                            <p className="sch-dest__meaning">
                                                {isHere
                                                    ? "You pick from here"
                                                    : isLanding
                                                    ? "Lands here when it goes live"
                                                    : stage.meaning}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
               VIEW 1: WIZARD
            ══════════════════════════════════════════ */}
            {viewMode === "wizard" ? (
                <>
                    {/* ── Stepper ── */}
                    <nav className="sch-stepper" aria-label="Scheduling steps">
                        {WIZARD_STEPS.map((s, i) => {
                            const isDone = step > s.id;
                            const isActive = step === s.id;
                            const canClick = isDone || (s.id === 2 && hasClient) || (s.id === 3 && hasClient && hasPiece) || (s.id === 4 && canSend);
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    disabled={!canClick && !isActive}
                                    onClick={() => canClick && setStep(s.id)}
                                    className={`sch-step${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}${canClick ? " is-navigable" : ""}`}
                                >
                                    <span className="sch-step__num">
                                        {isDone ? <Check size={13} /> : s.id}
                                    </span>
                                    <span className="sch-step__name">{s.name}</span>
                                    {i < WIZARD_STEPS.length - 1 && <span className="sch-step__line" />}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="sch-wizard">
                        <div className="sch-wizard__main" ref={wizardMainRef}>

                            {/* ── Step 1: Client ── */}
                            {step === 1 && (
                                <section className="sch-wizard__step" aria-labelledby="sch-step1-title">
                                    <div className="sch-step-head">
                                        <div className="sch-step-head__row">
                                            <div>
                                                <h2 id="sch-step1-title">Choose a client</h2>
                                                <p>Select the client whose approved content you want to publish.</p>
                                            </div>
                                        </div>

                                        {/* Client Search & Filter Controls */}
                                        <div className="sch-client-filters">
                                            <div className="sch-search-bar">
                                                <Search size={15} />
                                                <input
                                                    type="text"
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    placeholder="Search client by name..."
                                                />
                                                {clientSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setClientSearch("")}
                                                        aria-label="Clear search"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className={`sch-filter-chip${clientFilterReadyOnly ? " is-on" : ""}`}
                                                onClick={() => setClientFilterReadyOnly((prev) => !prev)}
                                            >
                                                <Sparkles size={13} />
                                                Ready Content Only
                                            </button>
                                        </div>
                                    </div>

                                    <div className="sch-client-grid">
                                        {loadingClients ? (
                                            [1, 2, 3, 4].map((i) => <div key={i} className="sch-skeleton" />)
                                        ) : visibleClients.length === 0 ? (
                                            <div className="sch-empty">
                                                <div className="sch-empty__icon">
                                                    <Users size={20} />
                                                </div>
                                                <p>No clients matched your filter.</p>
                                                {(clientSearch || clientFilterReadyOnly) && (
                                                    <button
                                                        type="button"
                                                        className="sch-btn sch-btn--ghost"
                                                        onClick={() => {
                                                            setClientSearch("");
                                                            setClientFilterReadyOnly(false);
                                                        }}
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            visibleClients.map((client) => {
                                                const readyCount =
                                                    readyCountByClient[String(client.id)] || 0;
                                                const isOn = sameId(selectedClient?.id, client.id);
                                                return (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        className={`sch-client-card${isOn ? " is-on" : ""}`}
                                                        onClick={() => handleSelectClient(client)}
                                                    >
                                                        <span
                                                            className="sch-avatar is-lg"
                                                            style={{ background: client.color }}
                                                        >
                                                            {client.initials}
                                                        </span>
                                                        <strong>{client.name}</strong>
                                                        {readyCount > 0 ? (
                                                            <span className="sch-client__ready">
                                                                {readyCount} ready
                                                            </span>
                                                        ) : (
                                                            <span className="sch-client__empty">
                                                                0 approved
                                                            </span>
                                                        )}
                                                        {isOn && (
                                                            <span className="sch-client-card__check">
                                                                <Check size={14} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="sch-wizard__nav">
                                        <span />
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--primary"
                                            disabled={!selectedClient}
                                            onClick={() => setStep(2)}
                                        >
                                            Next: Pick Piece
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </section>
                            )}

                            {/* ── Step 2: Piece ── */}
                            {step === 2 && (
                                <section className="sch-wizard__step" aria-labelledby="sch-step2-title">
                                    <div className="sch-step-head">
                                        <div className="sch-step-head__row">
                                            <div>
                                                <h2 id="sch-step2-title">Pick a piece</h2>
                                                <p>
                                                    Approved pieces for{" "}
                                                    <strong>{selectedClient?.name}</strong>. Click a card to select, or use preview to inspect.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Media Type Filters */}
                                        <div className="sch-piece-filters">
                                            {[
                                                { id: "ALL", label: "All Formats" },
                                                { id: "IMAGE", label: "Photos" },
                                                { id: "CAROUSEL_IMAGE", label: "Carousels" },
                                                { id: "VIDEO", label: "Videos" },
                                                { id: "STORY", label: "Stories" },
                                                { id: "PDF", label: "PDF Documents" },
                                            ].map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    className={`sch-piece-tab${pieceTypeFilter === f.id ? " is-on" : ""}`}
                                                    onClick={() => setPieceTypeFilter(f.id)}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sch-piece-grid">
                                        {loadingContent ? (
                                            [1, 2, 3, 4].map((i) => (
                                                <div key={i} className="sch-skeleton is-card" />
                                            ))
                                        ) : visiblePieces.length === 0 ? (
                                            <div className="sch-empty">
                                                <div className="sch-empty__icon">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <p>
                                                    {pieceTypeFilter === "ALL"
                                                        ? `No approved content for ${selectedClient?.name || "this client"} yet. It needs to reach "Approved" on the Content Board before it can be scheduled.`
                                                        : `No approved ${pieceTypeFilter.toLowerCase()} content found.`}
                                                </p>
                                                {pieceTypeFilter === "ALL" ? (
                                                    <button
                                                        type="button"
                                                        className="sch-btn sch-btn--ghost"
                                                        onClick={() => setStep(1)}
                                                    >
                                                        ← Pick another client
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="sch-btn sch-btn--ghost"
                                                        onClick={() => setPieceTypeFilter("ALL")}
                                                    >
                                                        Show all formats
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            visiblePieces.map((item) => {
                                                const isSelected = selectedContent?.id === item.id;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`sch-piece${isSelected ? " is-on" : ""}`}
                                                        onClick={() => handleSelectPieceDirectly(item)}
                                                    >
                                                        <div className="sch-piece__thumb">
                                                            {isPdfThumb(item) ? (
                                                                <ContentMediaPreview
                                                                    src={item.thumbnail}
                                                                    item={item.content_items?.[0]}
                                                                    variant="thumb"
                                                                    alt="PDF"
                                                                />
                                                            ) : item.thumbnail ? (
                                                                isVideoThumb(item) ? (
                                                                    <video
                                                                        src={item.thumbnail}
                                                                        muted
                                                                        playsInline
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={item.thumbnail}
                                                                        alt={item.title}
                                                                        style={{
                                                                            transform: `rotate(${
                                                                                item.content_items?.[0]
                                                                                    ?.rotation || 0
                                                                            }deg)`,
                                                                        }}
                                                                    />
                                                                )
                                                            ) : (
                                                                <ImageIcon size={28} />
                                                            )}
                                                            <span className="sch-piece__type">
                                                                {getTypeLabel(item)}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="sch-piece__sel">
                                                                    <Check size={14} />
                                                                </span>
                                                            )}

                                                            <button
                                                                type="button"
                                                                className="sch-piece__preview-trigger"
                                                                onClick={(e) => handleOpenPreview(item, e)}
                                                                title="Full screen interactive preview"
                                                                aria-label="Preview"
                                                            >
                                                                <Eye size={13} />
                                                                Preview
                                                            </button>
                                                        </div>
                                                        <div className="sch-piece__foot">
                                                            <strong>{item.title}</strong>
                                                            <span>{isSelected ? "Selected ✓" : "Click to select"}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="sch-wizard__nav">
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--ghost"
                                            onClick={() => setStep(1)}
                                        >
                                            ← Back to Client
                                        </button>
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--primary"
                                            disabled={!selectedContent}
                                            onClick={() => setStep(3)}
                                        >
                                            Next: Schedule & Platforms
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </section>
                            )}

                            {/* ── Step 3: When & How ── */}
                            {step === 3 && (
                                <section className="sch-wizard__step" aria-labelledby="sch-step3-title">
                                    <div className="sch-step-head">
                                        <h2 id="sch-step3-title">When & How</h2>
                                        <p>
                                            Choose destination channels, set release date & optimal time,
                                            and refine your caption.
                                        </p>
                                    </div>

                                    {/* Platforms */}
                                    <div className="sch-field">
                                        <label>Channels & Platforms</label>
                                        <div className="sch-platforms">
                                            {availablePlatforms.map((platformId) => {
                                                const p = PLATFORMS.find((x) => x.id === platformId);
                                                if (!p) return null;
                                                const Icon = p.icon;
                                                const pdfLocked =
                                                    isPdfContent(selectedContent) && p.id !== "linkedin";
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        disabled={pdfLocked}
                                                        className={`sch-platform${
                                                            selectedPlatforms.includes(p.id) ? " is-on" : ""
                                                        }`}
                                                        onClick={() => togglePlatform(p.id)}
                                                        title={
                                                            pdfLocked
                                                                ? "PDF documents can only be published to LinkedIn"
                                                                : undefined
                                                        }
                                                    >
                                                        <Icon size={15} />
                                                        {p.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {isPdfContent(selectedContent) && (
                                            <p className="sch-hint">PDF documents publish only to LinkedIn.</p>
                                        )}
                                        {isPdfContent(selectedContent) &&
                                            !availablePlatforms.includes("linkedin") && (
                                                <p className="sch-hint">
                                                    Connect a LinkedIn account for this client before
                                                    scheduling a PDF.
                                                </p>
                                            )}
                                        {availablePlatforms.length === 0 && (
                                            <p className="sch-hint">
                                                No connected social accounts for this client. You can still save a draft.
                                            </p>
                                        )}
                                    </div>

                                    {/* Visual Calendar */}
                                    <div className="sch-field">
                                        <label>Publish Date</label>
                                        <VisualCalendar
                                            value={scheduleDate}
                                            onChange={setScheduleDate}
                                            scheduledDates={scheduledDatesMap}
                                        />
                                    </div>

                                    {/* Time with Quick Peak-Hour Recommendations */}
                                    <div className="sch-field">
                                        <div className="sch-field__label-row">
                                            <label htmlFor="release-time">Release Time</label>
                                            <span className="sch-field__sublabel">Recommended Peak Hours</span>
                                        </div>

                                        <div className="sch-time-container">
                                            <input
                                                type="time"
                                                id="release-time"
                                                value={releaseTime}
                                                onChange={(e) => setReleaseTime(e.target.value)}
                                            />

                                            <div className="sch-time-presets">
                                                {BEST_TIMES.map((bt) => (
                                                    <button
                                                        key={bt.label}
                                                        type="button"
                                                        className={`sch-time-pill${releaseTime === bt.time ? " is-on" : ""}`}
                                                        onClick={() => setReleaseTime(bt.time)}
                                                        title={bt.desc}
                                                    >
                                                        <Clock size={12} />
                                                        <span>{bt.label}</span>
                                                        <small>{bt.time}</small>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Caption with character counts */}
                                    <div className="sch-field">
                                        <div className="sch-field__label-row">
                                            <label htmlFor="post-caption">Post Caption</label>
                                            <span className="sch-field__counter">
                                                {caption.length} / 2,200 chars
                                            </span>
                                        </div>
                                        <textarea
                                            id="post-caption"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="Write an engaging caption, hook your audience, or insert CTAs..."
                                        />
                                    </div>

                                    {/* Hashtags */}
                                    <div className="sch-field">
                                        <div className="sch-field__label-row">
                                            <label>Hashtags</label>
                                            <span className="sch-field__counter">
                                                {hashtags.length} / 30 tags
                                            </span>
                                        </div>
                                        <div className="sch-tags">
                                            {hashtags.map((tag) => (
                                                <span key={tag} className="sch-tag">
                                                    <Hash size={10} />
                                                    {tag.replace("#", "")}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeHashtag(tag)}
                                                        aria-label={`Remove ${tag}`}
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                            <div className="sch-tag-add">
                                                <Hash size={11} />
                                                <input
                                                    ref={hashtagInputRef}
                                                    type="text"
                                                    value={newHashtag}
                                                    onChange={(e) => setNewHashtag(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " " || e.key === ",") {
                                                            e.preventDefault();
                                                            addHashtag();
                                                        }
                                                    }}
                                                    placeholder="Type tag & Enter"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addHashtag}
                                                    aria-label="Add hashtag"
                                                >
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sch-wizard__nav">
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--ghost"
                                            onClick={() => setStep(2)}
                                        >
                                            ← Back to Piece
                                        </button>
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--primary"
                                            disabled={!hasWhen}
                                            onClick={() => setStep(4)}
                                        >
                                            Next: Review & Publish
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </section>
                            )}

                            {/* ── Step 4: Confirm & Publish ── */}
                            {step === 4 && (
                                <section className="sch-wizard__step" aria-labelledby="sch-step4-title">
                                    <div className="sch-step-head">
                                        <h2 id="sch-step4-title">Confirm & Publish</h2>
                                        <p>Inspect every detail below before publishing or saving as draft.</p>
                                    </div>

                                    <div className="sch-confirm">
                                        <div className="sch-confirm__row">
                                            <span className="sch-confirm__label">Client</span>
                                            <div className="sch-confirm__val">
                                                <span
                                                    className="sch-avatar"
                                                    style={{ background: selectedClient?.color }}
                                                >
                                                    {selectedClient?.initials}
                                                </span>
                                                <strong>{selectedClient?.name}</strong>
                                            </div>
                                        </div>

                                        <div className="sch-confirm__row">
                                            <span className="sch-confirm__label">Piece</span>
                                            <div className="sch-confirm__val">
                                                {selectedContent?.thumbnail && (
                                                    <div className="sch-confirm__thumb">
                                                        <img
                                                            src={selectedContent.thumbnail}
                                                            alt={selectedContent.title}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <strong>{selectedContent?.title}</strong>
                                                    <p className="sch-confirm__sub">{getTypeLabel(selectedContent)} format</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sch-confirm__row">
                                            <span className="sch-confirm__label">Channels</span>
                                            <div className="sch-confirm__val">
                                                {PLATFORMS.filter((p) =>
                                                    selectedPlatforms.includes(p.id)
                                                ).map((p) => {
                                                    const Icon = p.icon;
                                                    return (
                                                        <span key={p.id} className="sch-sidebar__platform">
                                                            <Icon size={13} />
                                                            {p.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="sch-confirm__row">
                                            <span className="sch-confirm__label">Publishing At</span>
                                            <div className="sch-confirm__val">
                                                <span className="sch-confirm__date-badge">
                                                    <CalendarCheck2 size={14} />
                                                    {scheduleDate &&
                                                        new Date(
                                                            scheduleDate + "T00:00:00"
                                                        ).toLocaleDateString(undefined, {
                                                            weekday: "long",
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    {releaseTime && ` at ${releaseTime}`}
                                                </span>
                                            </div>
                                        </div>

                                        {caption && (
                                            <div className="sch-confirm__row is-caption">
                                                <span className="sch-confirm__label">Caption</span>
                                                <p className="sch-confirm__caption">{caption}</p>
                                            </div>
                                        )}

                                        {hashtags.length > 0 && (
                                            <div className="sch-confirm__row">
                                                <span className="sch-confirm__label">Hashtags</span>
                                                <div className="sch-confirm__val sch-confirm__tags">
                                                    {hashtags.map((tag) => (
                                                        <span key={tag} className="sch-tag">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sch-confirm__actions">
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--ghost"
                                            onClick={() => setStep(3)}
                                        >
                                            ← Back to When & How
                                        </button>
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--ghost"
                                            onClick={() => submitSchedule("draft")}
                                            disabled={!canSend || isSaving || isScheduling || isPublishing}
                                        >
                                            {isSaving ? <span className="sch-spin" /> : <Save size={16} />}
                                            Save as draft
                                        </button>
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--ghost"
                                            onClick={() => submitSchedule("schedule")}
                                            disabled={!canSend || isSaving || isScheduling || isPublishing}
                                        >
                                            {isScheduling ? (
                                                <span className="sch-spin" />
                                            ) : (
                                                <Calendar size={16} />
                                            )}
                                            Schedule post
                                        </button>
                                        <button
                                            type="button"
                                            className="sch-btn sch-btn--primary"
                                            onClick={() => setShowPublishConfirm(true)}
                                            disabled={!canSend || isSaving || isScheduling || isPublishing}
                                        >
                                            {isPublishing ? (
                                                <span className="sch-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                            Publish now
                                        </button>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ── Sidebar summary with quick jump ── */}
                        <ScheduleSidebar
                            client={selectedClient}
                            content={selectedContent}
                            platforms={selectedPlatforms}
                            date={scheduleDate}
                            time={releaseTime}
                            caption={caption}
                            onJumpStep={setStep}
                            currentStep={step}
                        />
                    </div>
                </>
            ) : (
                /* ══════════════════════════════════════════
                   VIEW 2: SCHEDULED POSTS & LOGS
                ══════════════════════════════════════════ */
                <section className="sch-logs-view">
                    <div className="sch-logs-head">
                        <div className="sch-logs-head__titles">
                            <h2>Scheduled & Published Posts</h2>
                            <p>Track all upcoming releases, drafts, and historical publication metrics.</p>
                        </div>

                        <div className="sch-logs-controls">
                            {/* Filter Client */}
                            <select
                                value={filterLogClient}
                                onChange={(e) => setFilterLogClient(e.target.value)}
                                className="sch-select-pill"
                                aria-label="Filter by client"
                            >
                                <option value="ALL">All Clients</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            {/* Filter Status */}
                            <select
                                value={filterLogStatus}
                                onChange={(e) => setFilterLogStatus(e.target.value)}
                                className="sch-select-pill"
                                aria-label="Filter by status"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="DRAFT">Draft</option>
                                <option value="FAILED">Failed</option>
                            </select>

                            <button
                                type="button"
                                className="sch-btn sch-btn--primary"
                                onClick={() => {
                                    setViewMode("wizard");
                                    setStep(1);
                                }}
                            >
                                <Plus size={15} />
                                New Schedule
                            </button>
                        </div>
                    </div>

                    {/* Posts Cards Grid */}
                    <div className="sch-logs-grid">
                        {loadingLogs ? (
                            [1, 2, 3, 4].map((i) => <div key={i} className="sch-skeleton is-card" />)
                        ) : logPosts.length === 0 ? (
                            <div className="sch-empty is-wide">
                                <div className="sch-empty__icon">
                                    <CalendarDays size={24} />
                                </div>
                                <strong>No scheduled posts found</strong>
                                <p>You haven&apos;t scheduled any posts for the current filter.</p>
                                <button
                                    type="button"
                                    className="sch-btn sch-btn--primary"
                                    onClick={() => {
                                        setViewMode("wizard");
                                        setStep(1);
                                    }}
                                >
                                    Create First Schedule
                                </button>
                            </div>
                        ) : (
                            logPosts.map((post) => {
                                const client = clients.find((c) => sameId(c.id, post.client_id || post.client));
                                const metrics = logMetrics[post.id];
                                const status = String(post.status || "SCHEDULED").toUpperCase();

                                return (
                                    <div key={post.id} className="sch-log-card">
                                        <div className="sch-log-card__head">
                                            <div className="sch-log-card__client">
                                                {client && (
                                                    <span
                                                        className="sch-avatar is-sm"
                                                        style={{ background: client.color }}
                                                    >
                                                        {client.initials}
                                                    </span>
                                                )}
                                                <strong>{client?.name || "Client"}</strong>
                                            </div>

                                            <span
                                                className={`sch-status-badge is-${status.toLowerCase()}`}
                                            >
                                                {status}
                                            </span>
                                        </div>

                                        <div className="sch-log-card__body">
                                            <div className="sch-log-card__meta">
                                                <span className="sch-log-card__date">
                                                    <Clock size={13} />
                                                    {post.schedule_date} · {post.release_time || "10:00"}
                                                </span>

                                                <div className="sch-log-card__platforms">
                                                    {(post.platforms || []).map((pid) => {
                                                        const p = PLATFORMS.find((x) => x.id === pid.toLowerCase());
                                                        if (!p) return null;
                                                        const Icon = p.icon;
                                                        return (
                                                            <span key={pid} className="sch-log-card__plat-icon">
                                                                <Icon size={12} />
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {post.caption && (
                                                <p className="sch-log-card__caption">
                                                    {post.caption}
                                                </p>
                                            )}

                                            {metrics && (
                                                <div className="sch-log-card__metrics">
                                                    <BarChart3 size={13} />
                                                    <span>{metrics.likes || 0} likes</span>
                                                    <span>·</span>
                                                    <span>{metrics.reach || 0} reach</span>
                                                    <span>·</span>
                                                    <span>{metrics.comments || 0} comments</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            )}

            {/* ── Piece preview modal ── */}
            {previewItem && (
                <InstagramPreview
                    item={previewItem}
                    onClose={() => setPreviewItem(null)}
                    onSelect={handleSelectContentFromModal}
                />
            )}

            {/* ── Publish confirm dialog ── */}
            {showPublishConfirm && selectedContent && (
                <div className="sch-overlay" onClick={() => setShowPublishConfirm(false)}>
                    <div
                        className="sch-dialog"
                        role="dialog"
                        aria-labelledby="sch-publish-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="sch-publish-title">Publish immediately</h2>
                        <p>
                            This post for <strong>{selectedClient?.name || "this client"}</strong> will be sent to the connected social accounts right now.
                        </p>
                        {caption && <p className="sch-dialog__quote">{caption}</p>}
                        <div className="sch-dialog__actions">
                            <button
                                type="button"
                                className="sch-btn sch-btn--ghost"
                                onClick={() => setShowPublishConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="sch-btn sch-btn--primary"
                                onClick={() => {
                                    setShowPublishConfirm(false);
                                    submitSchedule("publish");
                                }}
                            >
                                <Send size={15} />
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
