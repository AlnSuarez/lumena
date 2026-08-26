"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Layout, CheckCircle2, Clock, FileText, Video,
    MessageSquare, Filter, User as UserIcon, X, Sparkles, Activity,
    Plus, Calendar, Type, Image as ImageIcon, Layers, Search, Check,
    ChevronLeft, ChevronRight, Play, Pause, Trash2, GripVertical,
    CircleDot, PenLine, ShieldCheck, Eye, BadgeCheck, UserPlus
} from "lucide-react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, closestCorners } from "@dnd-kit/core";
import { toast, Toaster } from "sonner";
import "./content-board.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const normalizeMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
};

const getCardThumbnail = (req) => {
    const items = req.content_items || [];
    if (items.length > 0) {
        const firstItem = items[0];
        return firstItem.gallery_image_details?.image_url
            || normalizeMediaUrl(firstItem.gallery_image_details?.image_compressed)
            || normalizeMediaUrl(firstItem.gallery_image_details?.image)
            || normalizeMediaUrl(firstItem.file_url);
    }
    if (req.linked_image_details) {
        return req.linked_image_details.image_url
            || normalizeMediaUrl(req.linked_image_details.image_compressed)
            || normalizeMediaUrl(req.linked_image_details.image);
    }
    return null;
};

const parseNotes = (notes) => {
    if (!notes) return { instructions: "", contentType: null, postDate: null };
    const metaIdx = notes.indexOf("[Meta]");
    const instructions = metaIdx > -1 ? notes.slice(0, metaIdx).trim() : notes.trim();
    const metaSection = metaIdx > -1 ? notes.slice(metaIdx) : "";
    const contentTypeMatch = metaSection.match(/Content Type: (\S+)/);
    const postDateMatch = metaSection.match(/Post Date: (\S+)/);
    return {
        instructions,
        contentType: contentTypeMatch ? contentTypeMatch[1] : null,
        postDate: postDateMatch ? postDateMatch[1] : null,
    };
};

const formatDisplayDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getClientName = (req) => (
    req?.client_details?.client_profile?.practice_name
    || req?.client_details?.username
    || "Untitled client"
);

const getPersonName = (user) => {
    if (!user) return null;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.username || null;
};

const FORMAT_DETAILS = {
    story: { label: "Story", icon: Type },
    image: { label: "Image", icon: ImageIcon },
    carousel: { label: "Carousel", icon: Layers },
    video: { label: "Video", icon: Video },
};

const REQUEST_TYPES = {
    MONTHLY_CONTENT: { label: "Monthly", icon: Layout },
    VIDEO_SHOOT: { label: "Video shoot", icon: Video },
    CONTENT_REQUEST: { label: "Request", icon: FileText },
};

const BOARD_COLUMNS = [
    { id: "TO_DO", title: "To Do", number: 1, group: "Production", meaning: "Ready to start", emptyHint: "New tasks land here.", icon: CircleDot },
    { id: "IN_PROGRESS", title: "In Progress", number: 2, group: "Production", meaning: "Being created", emptyHint: "Work in progress appears here.", icon: PenLine },
    { id: "QA", title: "QA", number: 3, group: "Review", meaning: "Internal review", emptyHint: "Pieces ready for internal review.", icon: ShieldCheck },
    { id: "IN_REVISION", title: "In Revision", number: 4, group: "Review", meaning: "Changes requested", emptyHint: "Items sent back for changes.", icon: MessageSquare },
    { id: "CLIENT_REVIEW", title: "Client Review", number: 5, group: "Review", meaning: "Waiting on client", emptyHint: "Waiting for client feedback.", icon: Eye },
    { id: "APPROVED", title: "Approved", number: 6, group: "Complete", meaning: "Ready to schedule", emptyHint: "Approved and ready to schedule.", icon: BadgeCheck },
    { id: "DONE", title: "Done", number: 7, group: "Complete", meaning: "Published", emptyHint: "Published pieces live here.", icon: CheckCircle2 },
];

const PIPELINE_GROUPS = [
    { id: "production", label: "Production", stageIds: ["TO_DO", "IN_PROGRESS"] },
    { id: "review", label: "Review", stageIds: ["QA", "IN_REVISION", "CLIENT_REVIEW"] },
    { id: "complete", label: "Complete", stageIds: ["APPROVED", "DONE"] },
];

const CONTENT_TYPES = [
    { id: "story", label: "Story", icon: Type },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "carousel", label: "Carousel", icon: Layers },
    { id: "video", label: "Video", icon: Video },
];

const getRequestTypeDetails = (type) => REQUEST_TYPES[type] || { label: "Task", icon: FileText };

const isPendingSuggestion = (req) => Boolean(req?.notes && req.notes.includes("Suggested assignment"));

const scrollToColumn = (columnId) => {
    document.getElementById(`board-col-${columnId}`)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
    });
};

function PreviewVideoPlayer({ src }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const handleToggle = (e) => {
        e.stopPropagation();
        const video = e.currentTarget.closest(".cb-video")?.querySelector("video");
        if (!video) return;
        if (video.paused) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };
    return (
        <div className={`cb-video${isPlaying ? " is-playing" : ""}`}>
            <video
                src={src}
                loop
                playsInline
                onClick={handleToggle}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <button type="button" onClick={handleToggle} className="cb-video__play" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
            </button>
        </div>
    );
}

function DraggableCard({ req, children }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `request-${req.id}`,
        data: { request: req },
    });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : "auto" }
        : undefined;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cb-drag">
            {children}
        </div>
    );
}

function DroppableColumn({ columnId, children }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${columnId}`,
        data: { columnId },
    });

    return (
        <div ref={setNodeRef} className={`cb-dropzone${isOver ? " is-over" : ""}`}>
            {children}
        </div>
    );
}

function BoardSkeleton() {
    return (
        <div className="cb-board-wrap">
            <div className="cb-board">
                {BOARD_COLUMNS.map((col) => (
                    <div key={col.id} className="cb-column" data-stage={col.id}>
                        <div className="cb-column__head">
                            <div>
                                <div className="cb-skel cb-skel--title" />
                                <div className="cb-skel cb-skel--line" />
                            </div>
                        </div>
                        <div className="cb-dropzone">
                            <div className="cb-skel cb-skel--card" />
                            <div className="cb-skel cb-skel--card" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ContentBoardPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [previewCarouselIdx, setPreviewCarouselIdx] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);

    const [filterType, setFilterType] = useState("ALL");
    const [filterUser, setFilterUser] = useState("ALL");
    const [currentUserRole, setCurrentUserRole] = useState("GUEST");
    const [currentUserId, setCurrentUserId] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createContentType, setCreateContentType] = useState("story");
    const [createAssignedUser, setCreateAssignedUser] = useState("");
    const [createInstructions, setCreateInstructions] = useState("");
    const [createSelectedClient, setCreateSelectedClient] = useState("");
    const [createDueDate, setCreateDueDate] = useState("");
    const [createPostDate, setCreatePostDate] = useState("");

    const [showCreateFolioSearch, setShowCreateFolioSearch] = useState(false);
    const [createFolioSearch, setCreateFolioSearch] = useState("");
    const [createSearchedImage, setCreateSearchedImage] = useState(null);
    const [createFolioSearchLoading, setCreateFolioSearchLoading] = useState(false);
    const [createFolioSearchError, setCreateFolioSearchError] = useState(null);

    const fetchData = async (role = currentUserRole, userId = currentUserId) => {
        setIsLoading(true);
        try {
            const reqUrl = new URL(`${API_BASE}/api/contents/monthly-requests/`);
            if (role) reqUrl.searchParams.append("role", role);
            if (userId) reqUrl.searchParams.append("user_id", userId);

            const [reqResponse, userResponse, creatorsResponse, clientsResponse] = await Promise.all([
                fetch(reqUrl.toString()),
                fetch(`${API_BASE}/api/users/manage/`),
                fetch(`${API_BASE}/api/users/content-creators/`),
                fetch(`${API_BASE}/api/users/clients/`),
            ]);

            if (reqResponse.ok) setRequests(await reqResponse.json());
            if (userResponse.ok) setUsers(await userResponse.json());
            if (creatorsResponse.ok) setContentCreators(await creatorsResponse.json());
            if (clientsResponse.ok) setClients(await clientsResponse.json());
        } catch (error) {
            console.error("Error fetching board data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem("userRole") || "GUEST";
        const id = localStorage.getItem("userId") || "";
        setCurrentUserRole(role);
        setCurrentUserId(id);
        fetchData(role, id);
    }, []);

    const handleCreateRequest = async () => {
        if (!createAssignedUser) {
            toast.error("Please assign this task to a team member.");
            return;
        }
        if (!createSelectedClient) {
            toast.error("Please select a client.");
            return;
        }

        const payload = {
            client: createSelectedClient,
            assigned_to: createAssignedUser,
            request_type: "CONTENT_REQUEST",
            month: createDueDate || new Date().toISOString().split("T")[0],
            linked_image: createSearchedImage ? createSearchedImage.id : null,
            notes: `${createInstructions}\n\n[Meta]\nContent Type: ${createContentType}\nPost Date: ${createPostDate}${createSearchedImage ? `\nGallery Image: ${createSearchedImage.folio} - ${createSearchedImage.title}\nImage URL: ${createSearchedImage.image_url}` : ""}`,
            status: "TO_DO",
        };

        try {
            const userId = localStorage.getItem("userId");
            const createUrl = new URL(`${API_BASE}/api/contents/monthly-requests/`);
            if (userId) createUrl.searchParams.append("user_id", userId);

            const response = await fetch(createUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success("Task created and assigned.");
                setShowCreateModal(false);
                setCreateInstructions("");
                setCreateAssignedUser("");
                setCreateSelectedClient("");
                setCreateDueDate("");
                setCreatePostDate("");
                setCreateSearchedImage(null);
                setCreateFolioSearch("");
                setCreateFolioSearchError(null);
                fetchData();
            } else {
                const err = await response.json().catch(() => ({}));
                console.error("Error creating request:", err);
                toast.error("Could not create this task. Please try again.");
            }
        } catch (error) {
            console.error("Network error:", error);
            toast.error("Network error. Please try again.");
        }
    };

    const handleSearchByFolio = async () => {
        if (!createFolioSearch.trim()) {
            setCreateFolioSearchError("Please enter a folio number");
            return;
        }

        setCreateFolioSearchLoading(true);
        setCreateFolioSearchError(null);
        setCreateSearchedImage(null);

        try {
            const response = await fetch(`${API_BASE}/api/gallery/images/search/?folio=${createFolioSearch.trim()}`, {
                credentials: "include",
            });

            if (response.ok) {
                setCreateSearchedImage(await response.json());
                setCreateFolioSearchError(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setCreateFolioSearchError(errorData.error || "Image not found");
                setCreateSearchedImage(null);
            }
        } catch (error) {
            console.error("Error searching image:", error);
            setCreateFolioSearchError("Failed to search image");
            setCreateSearchedImage(null);
        } finally {
            setCreateFolioSearchLoading(false);
        }
    };

    const handleClearGalleryImage = () => {
        setCreateSearchedImage(null);
        setCreateFolioSearch("");
        setCreateFolioSearchError(null);
    };

    const filteredRequests = requests.filter((req) => {
        const matchesType = filterType === "ALL" || req.request_type === filterType;
        const matchesUser = filterUser === "ALL"
            || (req.client_details?.id && String(req.client_details.id) === filterUser)
            || (req.assigned_to_details?.id && String(req.assigned_to_details.id) === filterUser)
            || (req.qa_assigned_to_details?.id && String(req.qa_assigned_to_details.id) === filterUser);
        return matchesType && matchesUser;
    });

    const getColumnRequests = (status) => filteredRequests.filter((req) => req.status === status);

    const countsByStatus = BOARD_COLUMNS.reduce((acc, col) => {
        acc[col.id] = getColumnRequests(col.id).length;
        return acc;
    }, {});

    const summary = {
        total: filteredRequests.length,
        production: (countsByStatus.TO_DO || 0) + (countsByStatus.IN_PROGRESS || 0),
        review: (countsByStatus.QA || 0) + (countsByStatus.IN_REVISION || 0) + (countsByStatus.CLIENT_REVIEW || 0),
        ready: countsByStatus.APPROVED || 0,
    };

    const handleMoveWorkflow = async (direction) => {
        if (!selectedRequest) return;
        const currentIdx = BOARD_COLUMNS.findIndex((c) => c.id === selectedRequest.status);
        if (currentIdx === -1) return;
        const newIdx = currentIdx + direction;
        if (newIdx < 0 || newIdx >= BOARD_COLUMNS.length) return;
        const newStatus = BOARD_COLUMNS[newIdx].id;

        try {
            const userId = localStorage.getItem("userId");
            const url = new URL(`${API_BASE}/api/contents/monthly-requests/${selectedRequest.id}/`);
            if (userId) url.searchParams.append("user_id", userId);

            const response = await fetch(url.toString(), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                const updated = await response.json();
                setSelectedRequest((prev) => ({ ...prev, status: updated.status, history: updated.history }));
                fetchData();
                toast.success(`Moved to ${BOARD_COLUMNS[newIdx].title}`, {
                    description: `${BOARD_COLUMNS[currentIdx].title} → ${BOARD_COLUMNS[newIdx].title}`,
                });
            }
        } catch (error) {
            console.error("Error moving workflow step:", error);
            toast.error("Could not move this task.");
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (!over) return;

        const requestId = parseInt(active.id.toString().replace("request-", ""), 10);
        const targetColumnId = over.id.toString().replace("column-", "");
        if (!requestId || !targetColumnId) return;

        const request = requests.find((r) => r.id === requestId);
        if (!request || request.status === targetColumnId) return;

        try {
            const userId = localStorage.getItem("userId");
            const url = new URL(`${API_BASE}/api/contents/monthly-requests/${requestId}/`);
            if (userId) url.searchParams.append("user_id", userId);

            const response = await fetch(url.toString(), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: targetColumnId }),
            });

            if (response.ok) {
                const updated = await response.json();
                if (selectedRequest && selectedRequest.id === requestId) {
                    setSelectedRequest((prev) => ({ ...prev, status: updated.status, history: updated.history }));
                }
                fetchData();
                const fromCol = BOARD_COLUMNS.find((c) => c.id === request.status);
                const toCol = BOARD_COLUMNS.find((c) => c.id === targetColumnId);
                toast.success(`Moved to ${toCol?.title || targetColumnId}`, {
                    description: `${fromCol?.title || request.status} → ${toCol?.title || targetColumnId}`,
                });
            }
        } catch (error) {
            console.error("Error moving card:", error);
            toast.error("Could not move this task.");
        }
    }, [requests, selectedRequest]);

    const handleDeleteRequest = async () => {
        if (!selectedRequest) return;
        setIsDeleting(true);
        try {
            const userId = localStorage.getItem("userId");
            const deleteUrl = new URL(`${API_BASE}/api/contents/monthly-requests/${selectedRequest.id}/`);
            if (userId) deleteUrl.searchParams.append("user_id", userId);

            const response = await fetch(deleteUrl.toString(), { method: "DELETE" });

            if (response.ok || response.status === 204) {
                setShowDeleteConfirm(false);
                setSelectedRequest(null);
                toast.success("Post deleted.");
                fetchData();
            } else {
                toast.error("Could not delete this post. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting request:", error);
            toast.error("Network error while deleting. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const selectedIdx = selectedRequest
        ? BOARD_COLUMNS.findIndex((c) => c.id === selectedRequest.status)
        : -1;
    const selectedNotes = selectedRequest ? parseNotes(selectedRequest.notes) : null;
    const assignedCreator = contentCreators.find((u) => String(u.id) === String(createAssignedUser));

    return (
        <div className="content-board">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Content Board</h1>
                    <p>Follow each piece from brief to published.</p>
                </div>
                <div className="cb-header__actions">
                    <div className="cb-select-wrap">
                        <Filter size={16} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="cb-select"
                            aria-label="Filter by content type"
                        >
                            <option value="ALL">All types</option>
                            <option value="MONTHLY_CONTENT">Monthly</option>
                            <option value="VIDEO_SHOOT">Video shoot</option>
                            <option value="CONTENT_REQUEST">Request</option>
                        </select>
                    </div>
                    <div className="cb-select-wrap">
                        <UserIcon size={16} />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="cb-select"
                            aria-label="Filter by person"
                        >
                            <option value="ALL">All people</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <button type="button" onClick={() => setShowCreateModal(true)} className="cb-btn cb-btn--primary">
                        <Plus size={16} />
                        New task
                    </button>
                </div>
            </div>

            <div className="cb-summary">
                <div className="cb-chip"><span>On the board</span><strong>{summary.total}</strong></div>
                <div className="cb-chip"><span>In production</span><strong>{summary.production}</strong></div>
                <div className="cb-chip"><span>Waiting on review</span><strong>{summary.review}</strong></div>
                <div className="cb-chip"><span>Ready to schedule</span><strong>{summary.ready}</strong></div>
            </div>

            <div className="cb-pipeline">
                {PIPELINE_GROUPS.map((group) => (
                    <div key={group.id} className="cb-pipeline__group">
                        <p className="cb-pipeline__group-label">{group.label}</p>
                        <div className="cb-pipeline__steps">
                            {group.stageIds.map((stageId) => {
                                const col = BOARD_COLUMNS.find((c) => c.id === stageId);
                                return (
                                    <button
                                        key={stageId}
                                        type="button"
                                        className="cb-step"
                                        data-stage={stageId}
                                        onClick={() => scrollToColumn(stageId)}
                                    >
                                        <div className="cb-step__top">
                                            <span className="cb-step__num">{col.number}</span>
                                            <span className="cb-step__name">{col.title}</span>
                                            <span className="cb-step__count">{countsByStatus[stageId] || 0}</span>
                                        </div>
                                        <p className="cb-step__meaning">{col.meaning}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <BoardSkeleton />
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={(e) => setActiveDragId(e.active.id)}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveDragId(null)}
                >
                    <div className="cb-board-wrap">
                        <div className="cb-board">
                            {BOARD_COLUMNS.map((col) => {
                                const colRequests = getColumnRequests(col.id);
                                const Icon = col.icon;
                                return (
                                    <div key={col.id} id={`board-col-${col.id}`} className="cb-column" data-stage={col.id}>
                                        <div className="cb-column__head">
                                            <div>
                                                <div className="cb-column__title-row">
                                                    <span className="cb-column__icon"><Icon size={15} /></span>
                                                    <h2 className="cb-column__title">{col.number} · {col.title}</h2>
                                                </div>
                                                <p className="cb-column__meaning">{col.meaning}</p>
                                            </div>
                                            <span className="cb-count">{colRequests.length}</span>
                                        </div>
                                        <DroppableColumn columnId={col.id}>
                                            {colRequests.length === 0 ? (
                                                <div className="cb-empty">
                                                    <div className="cb-empty__icon"><Icon size={18} /></div>
                                                    <strong>Nothing here yet</strong>
                                                    <p>{col.emptyHint}</p>
                                                </div>
                                            ) : colRequests.map((req) => {
                                                const typeDetails = getRequestTypeDetails(req.request_type);
                                                const TypeIcon = typeDetails.icon;
                                                const notes = parseNotes(req.notes);
                                                const format = notes.contentType ? FORMAT_DETAILS[notes.contentType] : null;
                                                const FormatIcon = format?.icon;
                                                const thumbSrc = getCardThumbnail(req);
                                                const assignee = getPersonName(req.assigned_to_details);
                                                const dueDate = formatDisplayDate(req.month);
                                                const postDate = formatDisplayDate(notes.postDate);
                                                const brief = notes.instructions || req.ai_caption || "No brief yet";
                                                const pending = isPendingSuggestion(req);

                                                return (
                                                    <DraggableCard key={req.id} req={req}>
                                                        <div
                                                            className="cb-card"
                                                            data-type={req.request_type || "TASK"}
                                                            onClick={() => { setSelectedRequest(req); setPreviewCarouselIdx(0); }}
                                                        >
                                                            <span className="cb-card__stripe" />
                                                            <span className="cb-card__grip"><GripVertical size={14} /></span>
                                                            <h3 className="cb-card__client">{getClientName(req)}</h3>
                                                            <div className="cb-card__badges">
                                                                <span className="cb-badge" data-kind="type" data-value={req.request_type || "TASK"}>
                                                                    <TypeIcon size={10} />
                                                                    {typeDetails.label}
                                                                </span>
                                                                {format && (
                                                                    <span className="cb-badge" data-kind="format" data-value={notes.contentType}>
                                                                        {FormatIcon ? <FormatIcon size={10} /> : null}
                                                                        {format.label}
                                                                    </span>
                                                                )}
                                                                {pending && (
                                                                    <span className="cb-pending">
                                                                        <UserPlus size={10} />
                                                                        Needs assignment
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {thumbSrc ? (
                                                                <div className="cb-thumb">
                                                                    <img src={thumbSrc} alt="" />
                                                                </div>
                                                            ) : (
                                                                <div className="cb-thumb cb-thumb--placeholder">
                                                                    {FormatIcon ? <FormatIcon size={14} /> : <FileText size={14} />}
                                                                </div>
                                                            )}
                                                            <p className="cb-card__brief">{brief}</p>
                                                            <div className="cb-card__meta">
                                                                <div className="cb-card__dates">
                                                                    {dueDate && (
                                                                        <span><Clock size={11} /> Due {dueDate}</span>
                                                                    )}
                                                                    {postDate && (
                                                                        <span><Calendar size={11} /> Post {postDate}</span>
                                                                    )}
                                                                </div>
                                                                {assignee && (
                                                                    <span className="cb-assignee">
                                                                        <span className="cb-avatar">{assignee.charAt(0).toUpperCase()}</span>
                                                                        <em>{assignee}</em>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </DraggableCard>
                                                );
                                            })}
                                        </DroppableColumn>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <DragOverlay dropAnimation={null}>
                        {activeDragId ? (
                            <div className="cb-overlay-card">
                                {(() => {
                                    const reqId = parseInt(activeDragId.toString().replace("request-", ""), 10);
                                    const req = requests.find((r) => r.id === reqId);
                                    if (!req) return <p>...</p>;
                                    return (
                                        <>
                                            <strong>{getClientName(req)}</strong>
                                            <p>{parseNotes(req.notes).instructions || "No brief yet"}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {selectedRequest && (
                <div className="cb-overlay">
                    <div className="cb-detail">
                        <div className="cb-detail__toolbar">
                            <div className="cb-mini-steps">
                                {BOARD_COLUMNS.map((col, idx) => (
                                    <div
                                        key={col.id}
                                        className={`cb-mini-step${idx === selectedIdx ? " is-current" : ""}`}
                                    >
                                        <span>{col.number}. {col.title}</span>
                                        <small>{col.meaning}</small>
                                    </div>
                                ))}
                            </div>
                            <div className="cb-detail__moves">
                                {selectedIdx > 0 && (
                                    <button
                                        type="button"
                                        className="cb-btn cb-btn--ghost"
                                        onClick={() => handleMoveWorkflow(-1)}
                                    >
                                        Move back to {BOARD_COLUMNS[selectedIdx - 1].title}
                                    </button>
                                )}
                                {selectedIdx >= 0 && selectedIdx < BOARD_COLUMNS.length - 1 && (
                                    <button
                                        type="button"
                                        className="cb-btn cb-btn--primary"
                                        onClick={() => handleMoveWorkflow(1)}
                                    >
                                        Advance to {BOARD_COLUMNS[selectedIdx + 1].title}
                                    </button>
                                )}
                            </div>
                            <button type="button" className="cb-icon-btn" onClick={() => setSelectedRequest(null)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="cb-detail__body">
                            <div className="cb-detail__preview">
                                <div className="cb-preview-card">
                                    <h2>{getClientName(selectedRequest)}</h2>
                                    <p>Preview for this piece of content.</p>

                                    {(() => {
                                        const items = [...(selectedRequest.content_items || [])];
                                        if (selectedRequest.linked_image_details && items.length === 0) {
                                            items.push({ media_type: "IMAGE", gallery_image_details: selectedRequest.linked_image_details });
                                        }
                                        const totalItems = items.length;
                                        const safeIdx = Math.min(previewCarouselIdx, Math.max(0, totalItems - 1));
                                        const { contentType } = selectedNotes || {};
                                        const MediaIcon = contentType === "video" ? Video : contentType === "carousel" ? Layers : contentType === "image" ? ImageIcon : FileText;

                                        if (totalItems > 0) {
                                            const ci = items[safeIdx];
                                            const src = ci.gallery_image_details?.image_url
                                                || normalizeMediaUrl(ci.gallery_image_details?.image_compressed)
                                                || normalizeMediaUrl(ci.gallery_image_details?.image)
                                                || normalizeMediaUrl(ci.file_url);
                                            const isVideo = ci.media_type === "VIDEO" || (
                                                typeof src === "string" && (
                                                    src.toLowerCase().split("?")[0].endsWith(".mp4")
                                                    || src.toLowerCase().split("?")[0].endsWith(".mov")
                                                    || src.toLowerCase().split("?")[0].endsWith(".webm")
                                                    || src.toLowerCase().includes("/videos/")
                                                )
                                            );
                                            return (
                                                <div className="cb-media">
                                                    {src ? (
                                                        isVideo ? <PreviewVideoPlayer src={src} /> : <img src={src} alt={ci.gallery_image_details?.title || "Media"} />
                                                    ) : (
                                                        <div className="cb-media__pending">
                                                            <ImageIcon size={28} />
                                                            <span>Asset pending upload</span>
                                                        </div>
                                                    )}
                                                    {totalItems > 1 && safeIdx > 0 && (
                                                        <button type="button" className="cb-media__nav cb-media__nav--left" onClick={() => setPreviewCarouselIdx((i) => Math.max(0, i - 1))}>
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                    )}
                                                    {totalItems > 1 && safeIdx < totalItems - 1 && (
                                                        <button type="button" className="cb-media__nav cb-media__nav--right" onClick={() => setPreviewCarouselIdx((i) => Math.min(totalItems - 1, i + 1))}>
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    )}
                                                    {totalItems > 1 && (
                                                        <div className="cb-media__dots">
                                                            {items.map((_, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    className={idx === safeIdx ? "is-active" : ""}
                                                                    onClick={() => setPreviewCarouselIdx(idx)}
                                                                    aria-label={`Show item ${idx + 1}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {totalItems > 1 && (
                                                        <div className="cb-media__count">{safeIdx + 1} / {totalItems}</div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="cb-media cb-media--empty">
                                                <MediaIcon size={28} />
                                                <strong>{contentType || "Content"} preview</strong>
                                                <span>Media pending upload</span>
                                            </div>
                                        );
                                    })()}

                                    <div className="cb-card__badges">
                                        {selectedNotes?.contentType && (
                                            <span className="cb-badge" data-kind="format" data-value={selectedNotes.contentType}>
                                                {selectedNotes.contentType}
                                            </span>
                                        )}
                                        {selectedNotes?.postDate && (
                                            <span className="cb-badge">
                                                Post {formatDisplayDate(selectedNotes.postDate)}
                                            </span>
                                        )}
                                    </div>

                                    {selectedNotes?.instructions && (
                                        <div className="cb-info-block">
                                            <h3><FileText size={12} /> Instructions</h3>
                                            <p>{selectedNotes.instructions}</p>
                                        </div>
                                    )}
                                    {selectedRequest.ai_caption && (
                                        <div className="cb-info-block">
                                            <h3><Sparkles size={12} /> Caption</h3>
                                            <p>{selectedRequest.ai_caption}</p>
                                        </div>
                                    )}
                                    {selectedRequest.content_text && (
                                        <div className="cb-info-block">
                                            <h3><FileText size={12} /> Content strategy</h3>
                                            <p>{selectedRequest.content_text}</p>
                                        </div>
                                    )}
                                    {!selectedNotes?.instructions && !selectedRequest.ai_caption && !selectedRequest.content_text && (
                                        <p className="cb-muted-note">No instructions or caption yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="cb-detail__activity">
                                <div className="cb-detail__activity-head">
                                    <h3><Activity size={16} /> Activity</h3>
                                    <span className="cb-count cb-count--plain">{selectedRequest.history ? selectedRequest.history.length : 0}</span>
                                </div>
                                <div className="cb-timeline">
                                    {selectedRequest.history && selectedRequest.history.length > 0 ? (
                                        selectedRequest.history.map((hist, idx) => {
                                            const actorUsername = hist.changed_by_details?.username || (hist.changed_by ? `user-${hist.changed_by}` : null);
                                            const actorLabel = actorUsername ? `@${actorUsername}` : "System";
                                            const actorInitial = actorUsername ? actorUsername[0].toUpperCase() : "S";
                                            const statusCol = BOARD_COLUMNS.find((c) => c.id === hist.new_status);
                                            return (
                                                <div key={hist.id || idx} className="cb-event">
                                                    <span className="cb-event__dot" />
                                                    <time>
                                                        {new Date(hist.timestamp).toLocaleDateString()} · {new Date(hist.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </time>
                                                    <p>Status changed to <strong>{statusCol?.title || String(hist.new_status || "").replaceAll("_", " ")}</strong></p>
                                                    <div className="cb-event__actor">
                                                        <span className="cb-avatar">{actorInitial}</span>
                                                        {actorLabel}
                                                    </div>
                                                    {hist.notes && <div className="cb-event__note">&quot;{hist.notes}&quot;</div>}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="cb-empty">
                                            <div className="cb-empty__icon"><Activity size={20} /></div>
                                            <strong>No activity yet</strong>
                                            <p>Moves through the pipeline will show up here.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="cb-detail__footer">
                                    <button type="button" className="cb-btn cb-btn--danger-soft" onClick={() => setShowDeleteConfirm(true)}>
                                        <Trash2 size={15} />
                                        Delete post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && selectedRequest && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon"><Trash2 size={20} /></div>
                                <div>
                                    <h3>Delete post</h3>
                                    <p>This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Are you sure you want to delete this post for <strong>{getClientName(selectedRequest)}</strong>?
                                {selectedRequest.notes && (
                                    <small>{parseNotes(selectedRequest.notes).instructions || selectedRequest.notes}</small>
                                )}
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button type="button" className="cb-btn cb-btn--danger" onClick={handleDeleteRequest} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="cb-overlay">
                    <div className="cb-create">
                        <div className="cb-create__head">
                            <div>
                                <h2>New task</h2>
                                <p>Create a piece of content and send it to the board.</p>
                            </div>
                            <button type="button" className="cb-icon-btn" onClick={() => setShowCreateModal(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="cb-create__body">
                            <section className="cb-section">
                                <div className="cb-section__label">
                                    <span className="cb-section__num">1</span>
                                    <div>
                                        <h3>What</h3>
                                        <p>Choose the format and describe the brief.</p>
                                    </div>
                                </div>
                                <div className="cb-field">
                                    <label>Content type</label>
                                    <div className="cb-types">
                                        {CONTENT_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    data-format={type.id}
                                                    className={`cb-type${createContentType === type.id ? " is-selected" : ""}`}
                                                    onClick={() => setCreateContentType(type.id)}
                                                >
                                                    <span className="cb-type__icon"><Icon size={18} /></span>
                                                    <span>{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="cb-instructions">Instructions</label>
                                    <textarea
                                        id="cb-instructions"
                                        value={createInstructions}
                                        onChange={(e) => setCreateInstructions(e.target.value)}
                                        placeholder="Describe the requirements for this content piece..."
                                    />
                                </div>
                                <button type="button" className="cb-link-asset" onClick={() => setShowCreateFolioSearch(true)}>
                                    <span className="cb-link-asset__mark">
                                        {createSearchedImage ? <Check size={16} /> : <Plus size={16} />}
                                    </span>
                                    <span>
                                        <strong>{createSearchedImage ? `Linked: ${createSearchedImage.folio}` : "Link photo ID"}</strong>
                                        <span>{createSearchedImage ? createSearchedImage.title : "Search from gallery"}</span>
                                    </span>
                                </button>
                            </section>

                            <div className="cb-who-when">
                                <section className="cb-section">
                                    <div className="cb-section__label">
                                        <span className="cb-section__num">2</span>
                                        <div>
                                            <h3>Who</h3>
                                            <p>Client and the person who will create it.</p>
                                        </div>
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="cb-client">Client</label>
                                        <select
                                            id="cb-client"
                                            value={createSelectedClient}
                                            onChange={(e) => setCreateSelectedClient(e.target.value)}
                                        >
                                            <option value="">Select client...</option>
                                            {clients.map((client) => {
                                                const name = client.first_name && client.last_name
                                                    ? `${client.first_name} ${client.last_name}`
                                                    : client.username;
                                                return <option key={client.id} value={client.id}>{name}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="cb-field">
                                        <label htmlFor="cb-assignee">Assign to</label>
                                        <select
                                            id="cb-assignee"
                                            value={createAssignedUser}
                                            onChange={(e) => setCreateAssignedUser(e.target.value)}
                                        >
                                            <option value="">Select team member...</option>
                                            {contentCreators.map((user) => {
                                                const name = user.first_name && user.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : user.username;
                                                return <option key={user.id} value={user.id}>{name} ({user.role})</option>;
                                            })}
                                        </select>
                                        <div className="cb-assignee-preview">
                                            {assignedCreator ? (
                                                <>
                                                    <span className="cb-avatar">{(assignedCreator.username || "?").charAt(0).toUpperCase()}</span>
                                                    <div>
                                                        <p>{getPersonName(assignedCreator)}</p>
                                                        <small>{assignedCreator.role}</small>
                                                    </div>
                                                </>
                                            ) : (
                                                <p>No one selected yet</p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="cb-section">
                                    <div className="cb-section__label">
                                        <span className="cb-section__num">3</span>
                                        <div>
                                            <h3>When</h3>
                                            <p>Internal due date and planned publish date.</p>
                                        </div>
                                    </div>
                                    <div className="cb-dates">
                                        <div className="cb-field">
                                            <label htmlFor="cb-due">Due date</label>
                                            <input
                                                id="cb-due"
                                                type="date"
                                                value={createDueDate}
                                                onChange={(e) => setCreateDueDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="cb-field">
                                            <label htmlFor="cb-post">Post date</label>
                                            <input
                                                id="cb-post"
                                                type="date"
                                                value={createPostDate}
                                                onChange={(e) => setCreatePostDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <button type="button" className="cb-btn cb-btn--primary" onClick={handleCreateRequest}>
                                <Plus size={16} />
                                Create task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateFolioSearch && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-folio">
                        <div className="cb-folio__head">
                            <div>
                                <h3>Link gallery image</h3>
                                <p>Search by folio number (e.g., C5F12-001)</p>
                            </div>
                            <button
                                type="button"
                                className="cb-icon-btn"
                                onClick={() => {
                                    setShowCreateFolioSearch(false);
                                    setCreateFolioSearchError(null);
                                }}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="cb-search">
                            <div className="cb-search__field">
                                <Search size={16} />
                                <input
                                    type="text"
                                    value={createFolioSearch}
                                    onChange={(e) => setCreateFolioSearch(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchByFolio()}
                                    placeholder="Enter folio number..."
                                />
                            </div>
                            <button type="button" className="cb-btn cb-btn--primary" onClick={handleSearchByFolio} disabled={createFolioSearchLoading}>
                                {createFolioSearchLoading ? "Searching..." : "Search"}
                            </button>
                        </div>
                        {createFolioSearchError && <div className="cb-error">{createFolioSearchError}</div>}
                        {createSearchedImage && (
                            <div className="cb-folio-result">
                                <img src={createSearchedImage.image_url} alt={createSearchedImage.title} />
                                <div>
                                    <code>{createSearchedImage.folio}</code>
                                    <h4>{createSearchedImage.title}</h4>
                                    <div className="cb-folio-result__actions">
                                        <button type="button" className="cb-btn cb-btn--ghost" onClick={handleClearGalleryImage}>
                                            Clear
                                        </button>
                                        <button type="button" className="cb-btn cb-btn--primary" onClick={() => setShowCreateFolioSearch(false)}>
                                            <Check size={14} />
                                            Confirm and attach
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!createSearchedImage && !createFolioSearchError && (
                            <div className="cb-folio-empty">
                                <ImageIcon size={28} />
                                <p>Enter a folio number to search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
