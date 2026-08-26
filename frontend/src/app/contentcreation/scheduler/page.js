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
} from "lucide-react";
import { API_BASE, API_ORIGIN } from "../../../apiSession";
import ContentMediaPreview, { isPdfMedia, isVideoMedia } from "../../../components/ContentMediaPreview";
import "../scheduler.css";

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
            ? normalizeUrl(ci.gallery_image_details?.image_url)
                || normalizeUrl(ci.gallery_image_details?.image_compressed)
                || normalizeUrl(ci.file_url)
                || null
            : normalizeUrl(item.linked_image_details?.image_compressed)
                || normalizeUrl(item.linked_image_details?.image)
                || null,
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

function getToday() {
    return new Date().toISOString().split("T")[0];
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
    const images = contentItems.length > 0
        ? contentItems
        : [{ media_type: "IMAGE", file_url: item.thumbnail, gallery_image_details: null }];
    const current = images[currentIndex] || images[0];

    const getImageUrl = (ci) => {
        if (!ci) return normalizeUrl(item.thumbnail);
        return normalizeUrl(ci.gallery_image_details?.image_url)
            || normalizeUrl(ci.gallery_image_details?.image_compressed)
            || normalizeUrl(ci.file_url)
            || normalizeUrl(item.thumbnail);
    };

    const currentUrl = getImageUrl(current);
    const currentRotation = current?.rotation || 0;
    const videoUrl = isVideo ? normalizeUrl(current.file_url) : null;
    const typeLabel = TYPE_LABELS[primaryType] || "Photo";

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

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div className="sch-preview" role="dialog" aria-labelledby="sch-preview-title" onClick={(e) => e.stopPropagation()}>
                <div className="sch-preview__head">
                    <div>
                        <h3 id="sch-preview-title">{isPdf ? "LinkedIn document" : "Preview"}</h3>
                        <p>{item.title} · {typeLabel}</p>
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
                                <div className="sch-story__bar"><span /></div>
                                {currentUrl ? (
                                    <img src={currentUrl} alt="" style={{ transform: `rotate(${currentRotation}deg)` }} />
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
                                                    <img src={currentUrl} alt="" style={{ transform: `rotate(${currentRotation}deg)` }} />
                                                ) : (
                                                    <Video size={40} />
                                                )}
                                                <div className="sch-ig-play">
                                                    <button type="button" onClick={() => setIsPlaying(true)} aria-label="Play">
                                                        <Play size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        )
                                    ) : (
                                        currentUrl ? (
                                            <img src={currentUrl} alt="" style={{ transform: `rotate(${currentRotation}deg)` }} />
                                        ) : (
                                            <ImageIcon size={40} />
                                        )
                                    )}
                                    {isCarousel && images.length > 1 && (
                                        <>
                                            {currentIndex > 0 && (
                                                <button type="button" className="sch-ig-nav is-prev" onClick={prevSlide}>
                                                    <ChevronLeft size={14} />
                                                </button>
                                            )}
                                            {currentIndex < images.length - 1 && (
                                                <button type="button" className="sch-ig-nav is-next" onClick={nextSlide}>
                                                    <ChevronRight size={14} />
                                                </button>
                                            )}
                                            <div className="sch-ig-count">{currentIndex + 1}/{images.length}</div>
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
                                    <p><strong>lumena</strong> {item.caption || "No caption"}</p>
                                    {item.hashtags?.length > 0 && (
                                        <p>{item.hashtags.join(" ")}</p>
                                    )}
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

export default function SchedulerPage() {
    const [step, setStep] = useState(1);
    const [showLearn, setShowLearn] = useState(false);

    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loadingClients, setLoadingClients] = useState(true);

    const [contentItems, setContentItems] = useState([]);
    const [approvedPieces, setApprovedPieces] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);

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

    const [activeTab, setActiveTab] = useState("editor");
    const [logPosts, setLogPosts] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [filterLogClient, setFilterLogClient] = useState("ALL");
    const [filterLogStatus, setFilterLogStatus] = useState("ALL");
    const [logMetrics, setLogMetrics] = useState({});

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

    useEffect(() => {
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
        fetchApprovedPieces();
    }, []);

    const readyCountByClient = useMemo(() => {
        const counts = {};
        approvedPieces.forEach((item) => {
            const key = String(item.client_id);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [approvedPieces]);

    const visibleClients = useMemo(() => {
        return [...clients].sort((a, b) => {
            const readyA = readyCountByClient[String(a.id)] || 0;
            const readyB = readyCountByClient[String(b.id)] || 0;
            if (readyA !== readyB) return readyB - readyA;
            return a.name.localeCompare(b.name);
        });
    }, [clients, readyCountByClient]);

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

    useEffect(() => {
        if (!selectedClient) return;

        const fetchSocial = async () => {
            try {
                const res = await fetch(`${API_BASE}/scheduler/social-accounts/?client_id=${selectedClient.id}`);
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
        if (activeTab === "log") fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, filterLogClient, filterLogStatus]);

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

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSelectedContent(null);
        setStep(2);
    };

    const handleOpenPreview = (item) => setPreviewItem(item);

    const handleSelectContent = () => {
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
        if (isPdfContent(selectedContent) && selectedPlatforms.some((p) => p !== "linkedin")) {
            setToast({ message: "PDF documents can only be published to LinkedIn.", type: "error" });
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
            status: isDraft ? "DRAFT" : (isPublish ? "PUBLISHING" : "SCHEDULED"),
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
                        ? "Draft saved."
                        : (isPublish ? "Published." : "Scheduled. It will move to Done when it goes live."),
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

    const hasClient = Boolean(selectedClient);
    const hasPiece = Boolean(selectedContent);
    const hasWhen = Boolean(scheduleDate && releaseTime && selectedPlatforms.length > 0);
    const canSend = hasClient && hasPiece && hasWhen;
    let activeFlowStep = "client";
    if (hasClient && !hasPiece) activeFlowStep = "piece";
    else if (hasClient && hasPiece && !hasWhen) activeFlowStep = "when";
    else if (hasClient && hasPiece) activeFlowStep = "send";

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        const map = { client: "sch-client", piece: "sch-piece", when: "sch-when", send: "sch-send" };
        window.setTimeout(() => {
            if (stepId === "send") document.getElementById("sch-send")?.focus();
            else document.getElementById(map[stepId])?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
    };

    return (
        <div className="scheduler">
            <header className="sch-header">
                <div className="sch-header__titles">
                    <h1>Scheduler</h1>
                    <p>Pick approved content, set when it goes out, then schedule or publish.</p>
                </div>
                <div className="sch-header__actions">
                    <span className="sch-chip">
                        <span className="sch-chip__dot" />
                        From Approved
                    </span>
                    <span className="sch-chip">
                        <span className="sch-chip__dot is-done" />
                        Goes to Done
                    </span>
                    <button
                        type="button"
                        className={`sch-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="sch-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                    <button type="button" className="sch-learn-btn" onClick={handleDiscard}>
                        <X size={16} />
                        Start over
                    </button>
                </div>
            </header>

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
                                <p>Only Approved pieces appear here. Scheduling or publishing sends them to Done on the Content Board.</p>
                            </div>
                            <button type="button" className="sch-icon-btn" onClick={() => setShowLearn(false)} aria-label="Close">
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
                                        ].filter(Boolean).join(" ")}
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
                                            className={`sch-dest${isHere ? " is-here" : ""}${isLanding ? " is-landing" : ""}`}
                                            data-stage={stage.id}
                                        >
                                            <div className="sch-dest__top">
                                                <span className="sch-dest__num">{stage.number}</span>
                                                <span className="sch-dest__name">{stage.name}</span>
                                            </div>
                                            <p className="sch-dest__meaning">
                                                {isHere ? "You pick from here" : isLanding ? "Lands here when it goes live" : stage.meaning}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="sch-workspace">
                <section className={`sch-col${step === 1 ? " is-current" : ""}`} id="sch-client">
                    <div className="sch-col__head">
                        <h2>1. Client</h2>
                    </div>
                    <div className="sch-col__body">
                        {loadingClients ? (
                            [1, 2, 3].map((i) => <div key={i} className="sch-skeleton" />)
                        ) : clients.length === 0 ? (
                            <div className="sch-empty">
                                <div className="sch-empty__icon"><Users size={20} /></div>
                                No clients found.
                            </div>
                        ) : (
                            visibleClients.map((client) => {
                                const readyCount = readyCountByClient[String(client.id)] || 0;
                                const isOn = sameId(selectedClient?.id, client.id);
                                return (
                                <button
                                    key={client.id}
                                    type="button"
                                    className={`sch-client${isOn ? " is-on" : ""}`}
                                    onClick={() => handleSelectClient(client)}
                                >
                                    <span className="sch-avatar" style={{ background: client.color }}>{client.initials}</span>
                                    <strong>{client.name}</strong>
                                    {readyCount > 0 && (
                                        <span className="sch-client__ready">
                                            {readyCount} ready
                                        </span>
                                    )}
                                    {isOn && <Check size={16} />}
                                </button>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className={`sch-col${step === 2 ? " is-current" : ""}`} id="sch-piece">
                    <div className="sch-col__head">
                        <h2>2. Piece</h2>
                        {selectedClient && <span className="sch-col__badge">Approved</span>}
                    </div>
                    <div className="sch-col__body">
                        {!selectedClient ? (
                            <div className="sch-empty">
                                <div className="sch-empty__icon"><ImageIcon size={20} /></div>
                                Pick a client first.
                            </div>
                        ) : loadingContent ? (
                            [1, 2].map((i) => <div key={i} className="sch-skeleton is-card" />)
                        ) : contentItems.length === 0 ? (
                            <div className="sch-empty">
                                <div className="sch-empty__icon"><AlertCircle size={20} /></div>
                                No approved content for this client. Choose a client marked Ready.
                            </div>
                        ) : (
                            contentItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`sch-piece${selectedContent?.id === item.id ? " is-on" : ""}`}
                                    onClick={() => handleOpenPreview(item)}
                                >
                                    <div className="sch-piece__thumb">
                                        {isPdfThumb(item) ? (
                                            <ContentMediaPreview src={item.thumbnail} item={item.content_items?.[0]} variant="thumb" alt="PDF" />
                                        ) : item.thumbnail ? (
                                            isVideoThumb(item) ? (
                                                <video src={item.thumbnail} muted playsInline />
                                            ) : (
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    style={{ transform: `rotate(${item.content_items?.[0]?.rotation || 0}deg)` }}
                                                />
                                            )
                                        ) : (
                                            <ImageIcon size={28} />
                                        )}
                                        <span className="sch-piece__type">{getTypeLabel(item)}</span>
                                    </div>
                                    <div className="sch-piece__foot">
                                        <strong>{item.title}</strong>
                                        <span>Preview</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <section className={`sch-col${step === 3 ? " is-current" : ""}`} id="sch-when">
                    {!selectedContent ? (
                        <div className="sch-empty is-wide">
                            <div className="sch-empty__icon"><Calendar size={22} /></div>
                            <strong>When</strong>
                            <p>Select a client and an approved piece to set the schedule.</p>
                        </div>
                    ) : (
                        <div className="sch-form">
                            <div className="sch-section-label">
                                <span className="sch-section-label__num">3</span>
                                <div>
                                    <h3>When</h3>
                                    <p>For {selectedClient?.name}. Choose platforms, time, and caption.</p>
                                </div>
                            </div>

                            <div className="sch-field">
                                <label>Platform</label>
                                <div className="sch-platforms">
                                    {availablePlatforms.map((platformId) => {
                                        const p = PLATFORMS.find((x) => x.id === platformId);
                                        if (!p) return null;
                                        const Icon = p.icon;
                                        const pdfLocked = isPdfContent(selectedContent) && p.id !== "linkedin";
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                disabled={pdfLocked}
                                                className={`sch-platform${selectedPlatforms.includes(p.id) ? " is-on" : ""}`}
                                                onClick={() => togglePlatform(p.id)}
                                                title={pdfLocked ? "PDF documents can only be published to LinkedIn" : undefined}
                                            >
                                                <Icon size={14} />
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isPdfContent(selectedContent) && (
                                    <p className="sch-hint">PDF documents publish only to LinkedIn.</p>
                                )}
                                {isPdfContent(selectedContent) && !availablePlatforms.includes("linkedin") && (
                                    <p className="sch-hint">Connect a LinkedIn account for this client before scheduling a PDF.</p>
                                )}
                                {availablePlatforms.length === 0 && (
                                    <p className="sch-hint">No connected social accounts for this client.</p>
                                )}
                            </div>

                            <div className="sch-dates">
                                <div className="sch-field">
                                    <label htmlFor="schedule-date">Date</label>
                                    <input
                                        type="date"
                                        id="schedule-date"
                                        value={scheduleDate}
                                        min={getToday()}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                </div>
                                <div className="sch-field">
                                    <label htmlFor="release-time">Time</label>
                                    <input
                                        type="time"
                                        id="release-time"
                                        value={releaseTime}
                                        onChange={(e) => setReleaseTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sch-field">
                                <label htmlFor="post-caption">Caption</label>
                                <textarea
                                    id="post-caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write the caption for this post..."
                                />
                            </div>

                            <div className="sch-field">
                                <label>Hashtags</label>
                                <div className="sch-tags">
                                    {hashtags.map((tag) => (
                                        <span key={tag} className="sch-tag">
                                            <Hash size={10} />
                                            {tag.replace("#", "")}
                                            <button type="button" onClick={() => removeHashtag(tag)} aria-label={`Remove ${tag}`}>
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
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    addHashtag();
                                                }
                                            }}
                                            placeholder="Add tag"
                                        />
                                        <button type="button" onClick={addHashtag} aria-label="Add hashtag">
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="sch-actions">
                                <button
                                    type="button"
                                    className="sch-btn sch-btn--ghost"
                                    onClick={() => submitSchedule("draft")}
                                    disabled={!canSend || isSaving || isScheduling || isPublishing}
                                >
                                    {isSaving ? <span className="sch-spin" /> : <Save size={16} />}
                                    Save draft
                                </button>
                                <button
                                    id="sch-send"
                                    type="button"
                                    className="sch-btn sch-btn--ghost"
                                    onClick={() => submitSchedule("schedule")}
                                    disabled={!canSend || isSaving || isScheduling || isPublishing}
                                >
                                    {isScheduling ? <span className="sch-spin" /> : <Calendar size={16} />}
                                    Schedule
                                </button>
                                <button
                                    type="button"
                                    className="sch-btn sch-btn--primary"
                                    onClick={() => setShowPublishConfirm(true)}
                                    disabled={!canSend || isSaving || isScheduling || isPublishing}
                                >
                                    {isPublishing ? <span className="sch-spin" /> : <Send size={16} />}
                                    Publish now
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {previewItem && (
                <InstagramPreview
                    item={previewItem}
                    onClose={() => setPreviewItem(null)}
                    onSelect={handleSelectContent}
                />
            )}

            {showPublishConfirm && selectedContent && (
                <div className="sch-overlay" onClick={() => setShowPublishConfirm(false)}>
                    <div className="sch-dialog" role="dialog" aria-labelledby="sch-publish-title" onClick={(e) => e.stopPropagation()}>
                        <h2 id="sch-publish-title">Publish now</h2>
                        <p>
                            This post for <strong>{selectedClient?.name || "this client"}</strong> goes live immediately.
                        </p>
                        {caption && <p className="sch-dialog__quote">{caption}</p>}
                        <div className="sch-dialog__actions">
                            <button type="button" className="sch-btn sch-btn--ghost" onClick={() => setShowPublishConfirm(false)}>
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
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
