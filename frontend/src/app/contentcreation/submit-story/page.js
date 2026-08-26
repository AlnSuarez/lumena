"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus,
    Type,
    Image as ImageIcon,
    Layers,
    Video,
    Search,
    X,
    Check,
    CircleHelp,
    FileText,
} from "lucide-react";
import "../submit-story.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CONTENT_TYPES = [
    { id: "story", label: "Story", icon: Type },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "carousel", label: "Carousel", icon: Layers },
    { id: "video", label: "Video", icon: Video },
    { id: "pdf", label: "PDF", icon: FileText },
];

const FLOW_STEPS = [
    { id: "what", number: 1, name: "What", meaning: "Choose format and write the brief" },
    { id: "who", number: 2, name: "Who", meaning: "Client and the person who will create it" },
    { id: "when", number: 3, name: "When", meaning: "Internal due date and planned publish date" },
    { id: "create", number: 4, name: "Create", meaning: "Sends the task to the board" },
];

const PIPELINE_STAGES = [
    { id: "TO_DO", number: 1, name: "To Do", meaning: "New requests land here", landing: true },
    { id: "IN_PROGRESS", number: 2, name: "In Progress", meaning: "Being created" },
    { id: "QA", number: 3, name: "QA", meaning: "Internal review" },
    { id: "IN_REVISION", number: 4, name: "In Revision", meaning: "Changes requested" },
    { id: "CLIENT_REVIEW", number: 5, name: "Client Review", meaning: "Waiting on client" },
    { id: "APPROVED", number: 6, name: "Approved", meaning: "Ready to schedule" },
    { id: "DONE", number: 7, name: "Done", meaning: "Published" },
];

const getMediaTypeForContentType = (ct) => {
    const map = {
        story: "STORY",
        image: "IMAGE",
        carousel: "CAROUSEL_IMAGE",
        video: "VIDEO",
        pdf: "PDF",
    };
    return map[ct] || "IMAGE";
};

const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
};

export default function SubmitStoryPage() {
    const [contentType, setContentType] = useState("story");
    const [assignedUser, setAssignedUser] = useState("");
    const [instructions, setInstructions] = useState("");

    const [teamMembers, setTeamMembers] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [postDate, setPostDate] = useState("");

    const [showFolioSearch, setShowFolioSearch] = useState(false);
    const [folioSearch, setFolioSearch] = useState("");
    const [searchedImage, setSearchedImage] = useState(null);
    const [folioSearchLoading, setFolioSearchLoading] = useState(false);
    const [folioSearchError, setFolioSearchError] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showLearn, setShowLearn] = useState(false);

    useEffect(() => {
        const fetchContentCreators = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/users/content-creators/`);
                if (response.ok) {
                    const data = await response.json();
                    const formattedMembers = data.map((user) => ({
                        id: String(user.id),
                        name: user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username,
                        role: user.role,
                    }));
                    setTeamMembers(formattedMembers);
                } else {
                    console.error("Failed to fetch content creators");
                }
            } catch (error) {
                console.error("Error fetching content creators:", error);
            }
        };

        const fetchClients = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/users/clients/`);
                if (response.ok) {
                    const data = await response.json();
                    const formattedClients = data.map((user) => ({
                        id: String(user.id),
                        name: user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username,
                    }));
                    setClients(formattedClients);
                } else {
                    console.error("Failed to fetch clients");
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        fetchContentCreators();
        fetchClients();
    }, []);

    useEffect(() => {
        if (!showLearn) return undefined;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setShowLearn(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showLearn]);

    const hasWhat = instructions.trim().length > 0;
    const hasWho = Boolean(selectedClient && assignedUser);
    const hasWhen = Boolean(dueDate);
    const canCreate = hasWho;

    let activeStep = "what";
    if (!hasWhat) activeStep = "what";
    else if (!hasWho) activeStep = "who";
    else if (!hasWhen) activeStep = "when";
    else activeStep = "create";

    const assignedMember = teamMembers.find((u) => u.id === assignedUser);

    const handleSearchByFolio = async () => {
        if (!folioSearch.trim()) {
            setFolioSearchError("Please enter a folio number");
            return;
        }

        setFolioSearchLoading(true);
        setFolioSearchError(null);
        setSearchedImage(null);

        try {
            const response = await fetch(
                `${API_BASE}/api/gallery/images/search/?folio=${folioSearch.trim()}`,
                { credentials: "include" }
            );

            if (response.ok) {
                const data = await response.json();
                setSearchedImage(data);
                setFolioSearchError(null);
            } else {
                const errorData = await response.json();
                setFolioSearchError(errorData.error || "Image not found");
                setSearchedImage(null);
            }
        } catch (error) {
            console.error("Error searching image:", error);
            setFolioSearchError("Failed to search image");
            setSearchedImage(null);
        } finally {
            setFolioSearchLoading(false);
        }
    };

    const handleClearGalleryImage = () => {
        setSearchedImage(null);
        setFolioSearch("");
        setFolioSearchError(null);
    };

    const handleCreateRequest = async () => {
        setSuccessMessage("");

        if (!assignedUser) {
            setFormError("Please assign the request to a team member.");
            scrollToSection("ss-feedback");
            return;
        }

        if (!selectedClient) {
            setFormError("Please select a client.");
            scrollToSection("ss-feedback");
            return;
        }

        setFormError("");
        setIsSubmitting(true);

        const contentItems = [];
        if (searchedImage) {
            contentItems.push({
                media_type: getMediaTypeForContentType(contentType),
                order: 0,
                gallery_image: searchedImage.id,
            });
        }
        let metaNotes = `[Meta]\nContent Type: ${contentType}\nPost Date: ${postDate}`;
        if (searchedImage) {
            metaNotes += `\nGallery Image: ${searchedImage.folio} - ${searchedImage.title}`;
        }

        const payload = {
            client: selectedClient,
            assigned_to: assignedUser,
            request_type: "CONTENT_REQUEST",
            month: dueDate || new Date().toISOString().split("T")[0],
            linked_image: searchedImage ? searchedImage.id : null,
            content_items: contentItems.length > 0 ? contentItems : undefined,
            notes: `${instructions}\n\n${metaNotes}`,
            status: "TO_DO",
        };

        try {
            const userId = localStorage.getItem("userId");
            const createUrl = new URL(`${API_BASE}/api/contents/monthly-requests/`);
            if (userId) createUrl.searchParams.append("user_id", userId);

            const response = await fetch(createUrl.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("This request is now in To Do on the Content Board.");
                setInstructions("");
                setAssignedUser("");
                setSelectedClient("");
                setDueDate("");
                setPostDate("");
                setSearchedImage(null);
                setFolioSearch("");
                setFolioSearchError(null);
                setContentType("story");
            } else {
                const err = await response.json();
                console.error("Error creating request:", err);
                setFormError("Failed to create request. Check the console for details.");
            }
        } catch (error) {
            console.error("Network error:", error);
            setFormError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        if (stepId === "create") {
            window.setTimeout(() => document.getElementById("ss-submit")?.focus(), 0);
            return;
        }
        window.setTimeout(() => scrollToSection(`ss-${stepId}`), 0);
    };

    return (
        <div className="submit-story">
            <header className="ss-header">
                <div className="ss-header__titles">
                    <h1>New Request</h1>
                    <p>Create a task for the content team. It starts on the Content Board in To Do.</p>
                </div>
                <div className="ss-header__actions">
                    <span className="ss-chip">
                        <span className="ss-chip__dot" />
                        Goes to To Do
                    </span>
                    <button
                        type="button"
                        className={`ss-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="ss-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                </div>
            </header>

            {showLearn && (
                <div
                    className="ss-learn-overlay"
                    onClick={() => setShowLearn(false)}
                >
                    <div
                        id="ss-learn-panel"
                        className="ss-learn"
                        role="dialog"
                        aria-labelledby="ss-learn-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="ss-learn__head">
                            <div>
                                <h2 id="ss-learn-title">How this request works</h2>
                                <p>Fill What, Who, and When. Creating the request puts it on the board in To Do.</p>
                            </div>
                            <button
                                type="button"
                                className="ss-icon-btn"
                                onClick={() => setShowLearn(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="ss-learn__label">On this page</p>
                        <nav className="ss-flow" aria-label="Request steps">
                            {FLOW_STEPS.map((step) => {
                                const isDone =
                                    (step.id === "what" && hasWhat) ||
                                    (step.id === "who" && hasWho) ||
                                    (step.id === "when" && hasWhen);
                                const isActive = activeStep === step.id;
                                const isReady = step.id === "create" && canCreate;
                                const className = [
                                    "ss-flow__step",
                                    isDone && !isActive ? "is-done" : "",
                                    isActive ? "is-active" : "",
                                    isReady ? "is-ready" : "",
                                ].filter(Boolean).join(" ");

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        className={className}
                                        onClick={() => handleFlowClick(step.id)}
                                    >
                                        <div className="ss-flow__top">
                                            <span className="ss-flow__num">{step.number}</span>
                                            <span className="ss-flow__name">{step.name}</span>
                                        </div>
                                        <p className="ss-flow__meaning">{step.meaning}</p>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="ss-destination">
                            <p className="ss-destination__label">After you create — Content Board pipeline</p>
                            <div className="ss-destination__track">
                                {PIPELINE_STAGES.map((stage) => (
                                    <div
                                        key={stage.id}
                                        className={`ss-dest${stage.landing ? " is-landing" : ""}`}
                                        data-stage={stage.id}
                                    >
                                        <div className="ss-dest__top">
                                            <span className="ss-dest__num">{stage.number}</span>
                                            <span className="ss-dest__name">{stage.name}</span>
                                        </div>
                                        <p className="ss-dest__meaning">{stage.meaning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="ss-card">
                {successMessage && (
                    <div id="ss-feedback" className="ss-banner ss-banner--ok" role="status">
                        <div>
                            <h2>Request created</h2>
                            <p>{successMessage}</p>
                        </div>
                        <Link href="/contentcreation">Open Content Board</Link>
                    </div>
                )}

                {formError && (
                    <div id="ss-feedback" className="ss-banner ss-banner--err" role="alert">
                        <div>
                            <h2>Can’t create yet</h2>
                            <p>{formError}</p>
                        </div>
                    </div>
                )}

                <section
                    id="ss-what"
                    className={`ss-section${activeStep === "what" ? " is-active" : ""}`}
                >
                    <div className="ss-section__label">
                        <span className="ss-section__num">1</span>
                        <div>
                            <h3>What</h3>
                            <p>Choose the format and describe the brief.</p>
                        </div>
                    </div>
                    <div className="ss-field">
                        <label>Content type</label>
                        <div className="ss-types">
                            {CONTENT_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        data-format={type.id}
                                        className={`ss-type${contentType === type.id ? " is-selected" : ""}`}
                                        onClick={() => setContentType(type.id)}
                                    >
                                        <span className="ss-type__icon"><Icon size={18} /></span>
                                        <span>{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="ss-field">
                        <label htmlFor="ss-instructions">Instructions</label>
                        <textarea
                            id="ss-instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe the requirements for this content piece..."
                        />
                    </div>
                    <button
                        type="button"
                        className="ss-link-asset"
                        onClick={() => setShowFolioSearch(true)}
                    >
                        <span className="ss-link-asset__mark">
                            {searchedImage ? <Check size={16} /> : <Plus size={16} />}
                        </span>
                        <span>
                            <strong>
                                {searchedImage ? `Linked: ${searchedImage.folio}` : "Link photo ID"}
                            </strong>
                            <span>
                                {searchedImage
                                    ? searchedImage.title
                                    : "Optional — search from gallery"}
                            </span>
                        </span>
                    </button>
                </section>

                <div className="ss-who-when">
                    <section
                        id="ss-who"
                        className={`ss-section${activeStep === "who" ? " is-active" : ""}`}
                    >
                        <div className="ss-section__label">
                            <span className="ss-section__num">2</span>
                            <div>
                                <h3>Who</h3>
                                <p>Client and the person who will create it.</p>
                            </div>
                        </div>
                        <div className="ss-field">
                            <label htmlFor="ss-client">Client</label>
                            <select
                                id="ss-client"
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                            >
                                <option value="">Select client...</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ss-field">
                            <label htmlFor="ss-assignee">Assign to</label>
                            <select
                                id="ss-assignee"
                                value={assignedUser}
                                onChange={(e) => setAssignedUser(e.target.value)}
                            >
                                <option value="">Select team member...</option>
                                {teamMembers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                            <div className="ss-assignee-preview">
                                {assignedMember ? (
                                    <>
                                        <span className="ss-avatar">
                                            {(assignedMember.name || "?").charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <p>{assignedMember.name}</p>
                                            <small>{assignedMember.role}</small>
                                        </div>
                                    </>
                                ) : (
                                    <p>No one selected yet</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        id="ss-when"
                        className={`ss-section${activeStep === "when" ? " is-active" : ""}`}
                    >
                        <div className="ss-section__label">
                            <span className="ss-section__num">3</span>
                            <div>
                                <h3>When</h3>
                                <p>Internal due date and planned publish date.</p>
                            </div>
                        </div>
                        <div className="ss-dates">
                            <div className="ss-field">
                                <label htmlFor="ss-due">Due date</label>
                                <input
                                    id="ss-due"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="ss-field">
                                <label htmlFor="ss-post">
                                    <span>Post date</span>
                                    <span className="ss-optional">Optional</span>
                                </label>
                                <input
                                    id="ss-post"
                                    type="date"
                                    value={postDate}
                                    onChange={(e) => setPostDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <button
                    id="ss-submit"
                    type="button"
                    className={`ss-btn ss-btn--primary ss-submit${canCreate ? " is-ready" : ""}`}
                    onClick={handleCreateRequest}
                    disabled={isSubmitting}
                >
                    <Plus size={16} />
                    {isSubmitting ? "Creating..." : "Create request — goes to To Do"}
                </button>
            </div>

            {showFolioSearch && (
                <div className="ss-overlay">
                    <div className="ss-folio" role="dialog" aria-labelledby="ss-folio-title">
                        <div className="ss-folio__head">
                            <div>
                                <h3 id="ss-folio-title">Link gallery image</h3>
                                <p>Search by folio number (e.g., C5F12-001)</p>
                            </div>
                            <button
                                type="button"
                                className="ss-icon-btn"
                                onClick={() => {
                                    setShowFolioSearch(false);
                                    setFolioSearchError(null);
                                }}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="ss-search">
                            <div className="ss-search__field">
                                <Search size={16} />
                                <input
                                    type="text"
                                    value={folioSearch}
                                    onChange={(e) => setFolioSearch(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchByFolio()}
                                    placeholder="Enter folio number..."
                                />
                            </div>
                            <button
                                type="button"
                                className="ss-btn ss-btn--primary"
                                onClick={handleSearchByFolio}
                                disabled={folioSearchLoading}
                            >
                                {folioSearchLoading ? "Searching..." : "Search"}
                            </button>
                        </div>
                        {folioSearchError && <div className="ss-error">{folioSearchError}</div>}
                        {searchedImage && (
                            <div className="ss-folio-result">
                                <img src={searchedImage.image_url} alt={searchedImage.title} />
                                <div>
                                    <code>{searchedImage.folio}</code>
                                    <h4>{searchedImage.title}</h4>
                                    {searchedImage.uploaded_at && (
                                        <p>
                                            Uploaded {new Date(searchedImage.uploaded_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    <div className="ss-folio-result__actions">
                                        <button
                                            type="button"
                                            className="ss-btn ss-btn--ghost"
                                            onClick={handleClearGalleryImage}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="ss-btn ss-btn--primary"
                                            onClick={() => setShowFolioSearch(false)}
                                        >
                                            <Check size={14} />
                                            Confirm and attach
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!searchedImage && !folioSearchError && (
                            <div className="ss-folio-empty">
                                <ImageIcon size={36} />
                                Enter a folio number to search
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
