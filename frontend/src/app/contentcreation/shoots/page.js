"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Camera,
    Calendar,
    AlertCircle,
    Loader2,
    Video,
    User,
    Save,
    ChevronDown,
    ChevronUp,
    Link2,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Unlink
} from "lucide-react";

const API_URL = "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/";
const USERS_API = "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/manage/";
const REASSIGN_SEGMENT = "reassign/";
const METADATA_START = "<!--VIDEO_SHOOT_ADMIN_DATA_START-->";
const METADATA_END = "<!--VIDEO_SHOOT_ADMIN_DATA_END-->";

const statusStyles = {
    TO_DO: "bg-slate-100 text-slate-700 border-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
    QA: "bg-indigo-100 text-indigo-700 border-indigo-200",
    IN_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
    DONE: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

function getStatusLabel(status) {
    if (!status) return "Unknown";
    return status.replaceAll("_", " ");
}

function parseShootNotes(notes) {
    const safeNotes = typeof notes === "string" ? notes : "";
    const startIndex = safeNotes.indexOf(METADATA_START);
    const endIndex = safeNotes.indexOf(METADATA_END);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        return {
            plainNotes: safeNotes.trim(),
            shootingList: "",
            footage: "",
            editingNotesHtml: ""
        };
    }

    const plainNotes = `${safeNotes.slice(0, startIndex)}${safeNotes.slice(endIndex + METADATA_END.length)}`.trim();
    const metadataRaw = safeNotes.slice(startIndex + METADATA_START.length, endIndex).trim();

    try {
        const metadata = JSON.parse(metadataRaw);
        return {
            plainNotes,
            shootingList: metadata?.shootingList || "",
            footage: metadata?.footage || "",
            editingNotesHtml: metadata?.editingNotesHtml || ""
        };
    } catch (error) {
        return {
            plainNotes: safeNotes.trim(),
            shootingList: "",
            footage: "",
            editingNotesHtml: ""
        };
    }
}

function buildShootNotes({ plainNotes, shootingList, footage, editingNotesHtml }) {
    const metadata = {
        shootingList: shootingList || "",
        footage: footage || "",
        editingNotesHtml: editingNotesHtml || ""
    };

    const trimmedPlain = (plainNotes || "").trim();
    const metadataBlock = `${METADATA_START}\n${JSON.stringify(metadata)}\n${METADATA_END}`;
    return trimmedPlain ? `${trimmedPlain}\n\n${metadataBlock}` : metadataBlock;
}

function splitLinks(value) {
    if (!value) return [];
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

export default function VideoShootsPage() {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState("GUEST");
    const [currentUserId, setCurrentUserId] = useState("");
    const [editors, setEditors] = useState([]);
    const [clients, setClients] = useState([]);
    const [adminDrafts, setAdminDrafts] = useState({});
    const [expandedCards, setExpandedCards] = useState({});
    const [savingState, setSavingState] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatingShoot, setIsCreatingShoot] = useState(false);
    const [createForm, setCreateForm] = useState({
        clientId: "",
        shootDate: "",
        generalNotes: "",
        assignedEditorId: "",
        shootingList: "",
        footage: "",
        editingNotesHtml: ""
    });
    const editorRefs = useRef({});
    const createEditorRef = useRef(null);

    const isAdmin = currentUserRole === "SUPERUSER";

    const fetchShoots = async (userId, userRole) => {
        setIsLoading(true);
        setError("");

        try {
            const reqUrl = new URL(API_URL);
            reqUrl.searchParams.append("user_id", userId);
            reqUrl.searchParams.append("role", userRole);

            const requestsResponse = await fetch(reqUrl.toString());
            if (!requestsResponse.ok) {
                throw new Error("Failed to fetch video shoots");
            }

            const requestsData = await requestsResponse.json();
            const onlyVideoShoots = requestsData.filter((item) => item.request_type === "VIDEO_SHOOT");
            setRequests(onlyVideoShoots);

            if (userRole === "SUPERUSER") {
                const usersResponse = await fetch(USERS_API);
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    const videoEditors = usersData.filter((user) => user.role === "EDITOR" || user.role === "CONTENT_CREATOR");
                    const onlyClients = usersData.filter((user) => user.role === "CLIENT");
                    setEditors(videoEditors);
                    setClients(onlyClients);
                }
            }
        } catch (err) {
            console.error("Error loading video shoots:", err);
            setError("Video shoots could not be loaded.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");

        if (!userId || !userRole) {
            window.location.href = "/login";
            return;
        }

        setCurrentUserId(userId);
        setCurrentUserRole(userRole);
        fetchShoots(userId, userRole);
    }, []);

    useEffect(() => {
        if (!isCreateModalOpen) return;
        if (!createEditorRef.current) return;
        createEditorRef.current.innerHTML = "";
    }, [isCreateModalOpen]);

    useEffect(() => {
        setAdminDrafts((prev) => {
            const next = { ...prev };
            requests.forEach((request) => {
                if (next[request.id]) return;
                const parsed = parseShootNotes(request.notes);
                next[request.id] = {
                    assignedEditorId: request.assigned_to_details?.id ? String(request.assigned_to_details.id) : "",
                    shootingList: parsed.shootingList,
                    footage: parsed.footage,
                    editingNotesHtml: parsed.editingNotesHtml
                };
            });
            return next;
        });
    }, [requests]);

    const orderedRequests = useMemo(() => {
        return [...requests].sort((a, b) => {
            const aDate = a.updated_at || a.created_at || "";
            const bDate = b.updated_at || b.created_at || "";
            return String(bDate).localeCompare(String(aDate));
        });
    }, [requests]);

    const updateDraft = (requestId, field, value) => {
        setAdminDrafts((prev) => ({
            ...prev,
            [requestId]: {
                ...(prev[requestId] || {
                    assignedEditorId: "",
                    shootingList: "",
                    footage: "",
                    editingNotesHtml: ""
                }),
                [field]: value
            }
        }));
    };

    const toggleCard = (requestId) => {
        setExpandedCards((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
    };

    const applyEditorCommand = (requestId, command, value = null) => {
        const editor = editorRefs.current[requestId];
        if (!editor) return;
        editor.focus();
        document.execCommand(command, false, value);
        updateDraft(requestId, "editingNotesHtml", editor.innerHTML);
    };

    const handleAddLink = (requestId) => {
        const link = window.prompt("Paste the link URL:");
        if (!link) return;
        applyEditorCommand(requestId, "createLink", link);
    };

    const handleSaveAdminChanges = async (requestId) => {
        const request = requests.find((item) => item.id === requestId);
        const draft = adminDrafts[requestId];
        if (!request || !draft) return;

        setSavingState((prev) => ({ ...prev, [requestId]: true }));

        try {
            const currentAssigned = request.assigned_to_details?.id ? String(request.assigned_to_details.id) : "";
            if (draft.assignedEditorId && draft.assignedEditorId !== currentAssigned) {
                const reassignUrl = new URL(`${API_URL}${requestId}/${REASSIGN_SEGMENT}`);
                if (currentUserId) reassignUrl.searchParams.append("user_id", currentUserId);

                const reassignResponse = await fetch(reassignUrl.toString(), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ creator_id: draft.assignedEditorId })
                });

                if (!reassignResponse.ok) {
                    throw new Error("Could not assign the video editor.");
                }
            }

            const parsed = parseShootNotes(request.notes);
            const notesWithMetadata = buildShootNotes({
                plainNotes: parsed.plainNotes,
                shootingList: draft.shootingList,
                footage: draft.footage,
                editingNotesHtml: draft.editingNotesHtml
            });

            const updateUrl = new URL(`${API_URL}${requestId}/`);
            if (currentUserId) updateUrl.searchParams.append("user_id", currentUserId);

            const updateResponse = await fetch(updateUrl.toString(), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: notesWithMetadata })
            });

            if (!updateResponse.ok) {
                throw new Error("Could not save shoot information.");
            }

            await fetchShoots(currentUserId, currentUserRole);
        } catch (saveError) {
            console.error("Error saving admin shoot data:", saveError);
            alert(saveError.message || "Changes could not be saved.");
        } finally {
            setSavingState((prev) => ({ ...prev, [requestId]: false }));
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            clientId: "",
            shootDate: "",
            generalNotes: "",
            assignedEditorId: "",
            shootingList: "",
            footage: "",
            editingNotesHtml: ""
        });
    };

    const applyCreateEditorCommand = (command, value = null) => {
        const editor = createEditorRef.current;
        if (!editor) return;
        editor.focus();
        document.execCommand(command, false, value);
        setCreateForm((prev) => ({ ...prev, editingNotesHtml: editor.innerHTML }));
    };

    const handleAddCreateLink = () => {
        const link = window.prompt("Paste the link URL:");
        if (!link) return;
        applyCreateEditorCommand("createLink", link);
    };

    const handleCreateShoot = async (event) => {
        event.preventDefault();
        if (!createForm.clientId || !createForm.shootDate) {
            alert("Select a client and shoot date to create the shoot.");
            return;
        }

        setIsCreatingShoot(true);
        try {
            const createUrl = new URL(API_URL);
            if (currentUserId) createUrl.searchParams.append("user_id", currentUserId);

            const payload = {
                client: createForm.clientId,
                request_type: "VIDEO_SHOOT",
                month: createForm.shootDate,
                status: "TO_DO",
                notes: buildShootNotes({
                    plainNotes: createForm.generalNotes,
                    shootingList: createForm.shootingList,
                    footage: createForm.footage,
                    editingNotesHtml: createForm.editingNotesHtml
                })
            };

            const response = await fetch(createUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Could not create the video shoot.");
            }

            let createdShoot = null;
            try {
                createdShoot = await response.json();
            } catch {
                createdShoot = null;
            }

            if (createForm.assignedEditorId && createdShoot?.id) {
                const reassignUrl = new URL(`${API_URL}${createdShoot.id}/${REASSIGN_SEGMENT}`);
                if (currentUserId) reassignUrl.searchParams.append("user_id", currentUserId);

                const reassignResponse = await fetch(reassignUrl.toString(), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ creator_id: createForm.assignedEditorId })
                });

                if (!reassignResponse.ok) {
                    throw new Error("The shoot was created, but the editor could not be assigned.");
                }
            }

            setIsCreateModalOpen(false);
            resetCreateForm();
            await fetchShoots(currentUserId, currentUserRole);
        } catch (createError) {
            console.error("Error creating video shoot:", createError);
            alert(createError.message || "Could not create the video shoot.");
        } finally {
            setIsCreatingShoot(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="pl-1 border-l-4 border-primary">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Video Shoots</h1>
                        <p className="mt-2 text-muted-foreground text-lg">
                            Manage and review shoot requests in one place.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                resetCreateForm();
                                setIsCreateModalOpen(true);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                        >
                            + New Shoot
                        </button>
                    )}
                </div>

                {isLoading && (
                    <div className="bg-card border border-border rounded-3xl p-12 flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="font-semibold">Loading video shoots...</span>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {!isLoading && !error && orderedRequests.length === 0 && (
                    <div className="bg-card border border-border rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <Camera size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">No pending shoots</h2>
                        <p className="text-muted-foreground font-medium">There are no video shoots to show right now.</p>
                    </div>
                )}

                {!isLoading && !error && orderedRequests.length > 0 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {orderedRequests.map((request) => {
                            const statusClass = statusStyles[request.status] || "bg-slate-100 text-slate-700 border-slate-200";
                            const clientName =
                                request.client_details?.client_profile?.practice_name ||
                                request.client_details?.username ||
                                `Client #${request.client}`;
                            const parsed = parseShootNotes(request.notes);
                            const draft = adminDrafts[request.id] || {
                                assignedEditorId: request.assigned_to_details?.id ? String(request.assigned_to_details.id) : "",
                                shootingList: "",
                                footage: "",
                                editingNotesHtml: ""
                            };
                            const shootingLinks = splitLinks(parsed.shootingList);
                            const footageLinks = splitLinks(parsed.footage);
                            const isExpanded = Boolean(expandedCards[request.id]);
                            const isSaving = Boolean(savingState[request.id]);

                            return (
                                <article
                                    key={request.id}
                                    className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Video size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-bold text-foreground text-sm truncate">{clientName}</h2>
                                                <p className="text-xs text-muted-foreground">Request #{request.id}</p>
                                            </div>
                                        </div>

                                        <span className={`text-[11px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
                                            {getStatusLabel(request.status)}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1.5 rounded-lg">
                                            <Calendar size={13} />
                                            <span className="font-semibold">{request.month || "No month"}</span>
                                        </div>

                                        {parsed.plainNotes ? (
                                            <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 min-h-[5rem]">
                                                {parsed.plainNotes}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground leading-relaxed min-h-[5rem]">No general notes for this video shoot.</p>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border/70">
                                        <button
                                            type="button"
                                            onClick={() => toggleCard(request.id)}
                                            className="w-full flex items-center justify-between text-sm font-bold text-foreground"
                                        >
                                            <span className="flex items-center gap-2">
                                                <User size={15} className="text-primary" />
                                                {isAdmin ? "Admin Tools" : "Shooting Information"}
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-4 space-y-4">
                                                {isAdmin ? (
                                                    <>
                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Video Editor</label>
                                                            <select
                                                                value={draft.assignedEditorId}
                                                                onChange={(e) => updateDraft(request.id, "assignedEditorId", e.target.value)}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                                            >
                                                                <option value="">Select editor</option>
                                                                {editors.map((editor) => (
                                                                    <option key={`editor-${editor.id}`} value={editor.id}>
                                                                        {editor.username} ({editor.role})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Shooting List (Word document links)</label>
                                                            <textarea
                                                                rows={3}
                                                                value={draft.shootingList}
                                                                onChange={(e) => updateDraft(request.id, "shootingList", e.target.value)}
                                                                className="w-full bg-input/50 border border-input rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                                                                placeholder="One link per line"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Footage (raw content links)</label>
                                                            <textarea
                                                                rows={3}
                                                                value={draft.footage}
                                                                onChange={(e) => updateDraft(request.id, "footage", e.target.value)}
                                                                className="w-full bg-input/50 border border-input rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                                                                placeholder="One link per line"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Editing Notes</label>
                                                            <div className="border border-input rounded-xl overflow-hidden bg-background">
                                                                <div className="px-2 py-2 border-b border-input bg-secondary/30 flex flex-wrap items-center gap-1.5">
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "bold")} className="p-1.5 rounded-md hover:bg-secondary" title="Bold">
                                                                        <Bold size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "italic")} className="p-1.5 rounded-md hover:bg-secondary" title="Italic">
                                                                        <Italic size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "underline")} className="p-1.5 rounded-md hover:bg-secondary" title="Underline">
                                                                        <Underline size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "insertUnorderedList")} className="p-1.5 rounded-md hover:bg-secondary" title="Bulleted list">
                                                                        <List size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "insertOrderedList")} className="p-1.5 rounded-md hover:bg-secondary" title="Numbered list">
                                                                        <ListOrdered size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => handleAddLink(request.id)} className="p-1.5 rounded-md hover:bg-secondary" title="Insert link">
                                                                        <Link2 size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => applyEditorCommand(request.id, "unlink")} className="p-1.5 rounded-md hover:bg-secondary" title="Remove link">
                                                                        <Unlink size={14} />
                                                                    </button>
                                                                </div>
                                                                <div
                                                                    ref={(element) => {
                                                                        editorRefs.current[request.id] = element;
                                                                    }}
                                                                    contentEditable
                                                                    suppressContentEditableWarning
                                                                    onInput={(e) => updateDraft(request.id, "editingNotesHtml", e.currentTarget.innerHTML)}
                                                                    className="min-h-[140px] px-3 py-2.5 text-sm text-foreground outline-none"
                                                                    dangerouslySetInnerHTML={{ __html: draft.editingNotesHtml || "" }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveAdminChanges(request.id)}
                                                            disabled={isSaving}
                                                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                            {isSaving ? "Saving..." : "Save shoot configuration"}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Assigned Editor</p>
                                                            <p className="text-sm font-semibold text-foreground">{request.assigned_to_details?.username || "Unassigned"}</p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Shooting List</p>
                                                            {shootingLinks.length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {shootingLinks.map((link) => (
                                                                        <a
                                                                            key={`${request.id}-shooting-${link}`}
                                                                            href={link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="block text-sm text-primary hover:underline break-all"
                                                                        >
                                                                            {link}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No links added yet.</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Footage</p>
                                                            {footageLinks.length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {footageLinks.map((link) => (
                                                                        <a
                                                                            key={`${request.id}-footage-${link}`}
                                                                            href={link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="block text-sm text-primary hover:underline break-all"
                                                                        >
                                                                            {link}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No links added yet.</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Editing Notes</p>
                                                            {parsed.editingNotesHtml ? (
                                                                <div
                                                                    className="prose prose-sm max-w-none text-foreground"
                                                                    dangerouslySetInnerHTML={{ __html: parsed.editingNotesHtml }}
                                                                />
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No editing instructions yet.</p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {isAdmin && isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-card border border-border rounded-2xl shadow-2xl flex flex-col">
                        <div className="px-5 py-4 border-b border-border">
                            <h3 className="text-xl font-black text-foreground">Create New Shoot</h3>
                            <p className="text-sm text-muted-foreground mt-1">Create a new video shoot request.</p>
                        </div>

                        <form onSubmit={handleCreateShoot} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Client</label>
                                <select
                                    value={createForm.clientId}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                    required
                                >
                                    <option value="">Select client</option>
                                    {clients.map((client) => (
                                        <option key={`create-client-${client.id}`} value={client.id}>
                                            {client.client_profile?.practice_name || client.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Shoot Date</label>
                                <input
                                    type="date"
                                    value={createForm.shootDate}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, shootDate: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">General Notes</label>
                                <textarea
                                    rows={3}
                                    value={createForm.generalNotes}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, generalNotes: e.target.value }))}
                                    className="w-full bg-input/50 border border-input rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                                    placeholder="Initial shoot notes (optional)"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Video Editor</label>
                                <select
                                    value={createForm.assignedEditorId}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, assignedEditorId: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none"
                                >
                                    <option value="">Select editor</option>
                                    {editors.map((editor) => (
                                        <option key={`create-editor-${editor.id}`} value={editor.id}>
                                            {editor.username} ({editor.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Shooting List (Word document links)</label>
                                <textarea
                                    rows={3}
                                    value={createForm.shootingList}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, shootingList: e.target.value }))}
                                    className="w-full bg-input/50 border border-input rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                                    placeholder="One link per line"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Footage (raw content links)</label>
                                <textarea
                                    rows={3}
                                    value={createForm.footage}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, footage: e.target.value }))}
                                    className="w-full bg-input/50 border border-input rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:bg-card focus:border-primary resize-none"
                                    placeholder="One link per line"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Editing Notes</label>
                                <div className="border border-input rounded-xl overflow-hidden bg-background">
                                    <div className="px-2 py-2 border-b border-input bg-secondary/30 flex flex-wrap items-center gap-1.5">
                                        <button type="button" onClick={() => applyCreateEditorCommand("bold")} className="p-1.5 rounded-md hover:bg-secondary" title="Bold">
                                            <Bold size={14} />
                                        </button>
                                        <button type="button" onClick={() => applyCreateEditorCommand("italic")} className="p-1.5 rounded-md hover:bg-secondary" title="Italic">
                                            <Italic size={14} />
                                        </button>
                                        <button type="button" onClick={() => applyCreateEditorCommand("underline")} className="p-1.5 rounded-md hover:bg-secondary" title="Underline">
                                            <Underline size={14} />
                                        </button>
                                        <button type="button" onClick={() => applyCreateEditorCommand("insertUnorderedList")} className="p-1.5 rounded-md hover:bg-secondary" title="Bulleted list">
                                            <List size={14} />
                                        </button>
                                        <button type="button" onClick={() => applyCreateEditorCommand("insertOrderedList")} className="p-1.5 rounded-md hover:bg-secondary" title="Numbered list">
                                            <ListOrdered size={14} />
                                        </button>
                                        <button type="button" onClick={handleAddCreateLink} className="p-1.5 rounded-md hover:bg-secondary" title="Insert link">
                                            <Link2 size={14} />
                                        </button>
                                        <button type="button" onClick={() => applyCreateEditorCommand("unlink")} className="p-1.5 rounded-md hover:bg-secondary" title="Remove link">
                                            <Unlink size={14} />
                                        </button>
                                    </div>
                                    <div
                                        ref={createEditorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => {
                                            const html = e.currentTarget.innerHTML;
                                            setCreateForm((prev) => ({ ...prev, editingNotesHtml: html }));
                                        }}
                                        className="min-h-[120px] px-3 py-2.5 text-sm text-foreground outline-none"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        resetCreateForm();
                                    }}
                                    className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingShoot}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isCreatingShoot && <Loader2 size={14} className="animate-spin" />}
                                    {isCreatingShoot ? "Creating..." : "Create Shoot"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
