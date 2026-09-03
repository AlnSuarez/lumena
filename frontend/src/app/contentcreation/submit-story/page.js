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
    ArrowRight,
    ArrowLeft,
    Users,
    Calendar,
    Sparkles,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Send
} from "lucide-react";
import "../submit-story.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = [
    {
        id: "who",
        number: 1,
        name: "Who",
        meaning: "Client & assigned creator",
        icon: Users,
    },
    {
        id: "what",
        number: 2,
        name: "What",
        meaning: "Format, brief & media",
        icon: FileText,
    },
    {
        id: "when",
        number: 3,
        name: "When & Review",
        meaning: "Due dates & board preview",
        icon: Calendar,
    },
];

const CONTENT_TYPES = [
    { id: "story", label: "Story", icon: Type },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "carousel", label: "Carousel", icon: Layers },
    { id: "video", label: "Video", icon: Video },
    { id: "pdf", label: "PDF", icon: FileText },
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

export default function SubmitStoryPage() {
    const [currentStep, setCurrentStep] = useState(1);
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
    const [stepError, setStepError] = useState("");
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
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        fetchContentCreators();
        fetchClients();
    }, []);

    const hasWho = Boolean(selectedClient && assignedUser);
    const hasWhat = Boolean(instructions.trim());
    const hasWhen = Boolean(dueDate);
    const canCreate = hasWho;

    const assignedMember = teamMembers.find((u) => u.id === assignedUser);
    const selectedClientObj = clients.find((c) => c.id === selectedClient);

    const validateStep = (stepNumber) => {
        setStepError("");
        if (stepNumber === 1) {
            if (!selectedClient) {
                setStepError("Please select a client for this request.");
                return false;
            }
            if (!assignedUser) {
                setStepError("Please assign the request to a team member.");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;
        if (currentStep < STEPS.length) {
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePrev = () => {
        setStepError("");
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleStepClick = (targetStepNumber) => {
        if (targetStepNumber < currentStep) {
            setStepError("");
            setCurrentStep(targetStepNumber);
            return;
        }
        if (targetStepNumber > 1 && !hasWho) {
            setStepError("Select both Client and Creator in Step 1 before advancing.");
            setCurrentStep(1);
            return;
        }
        setStepError("");
        setCurrentStep(targetStepNumber);
    };

    const setQuickDate = (field, daysFromNow) => {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        const str = d.toISOString().split("T")[0];
        if (field === "due") setDueDate(str);
        if (field === "post") setPostDate(str);
    };

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
                const errorData = await response.json().catch(() => ({}));
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
        setFormError("");
        setStepError("");

        if (!selectedClient) {
            setCurrentStep(1);
            setStepError("Please select a client.");
            return;
        }
        if (!assignedUser) {
            setCurrentStep(1);
            setStepError("Please assign the request to a team member.");
            return;
        }

        setIsSubmitting(true);

        const contentItems = [];
        if (searchedImage) {
            contentItems.push({
                media_type: getMediaTypeForContentType(contentType),
                order: 0,
                gallery_image: searchedImage.id,
            });
        }
        let metaNotes = `[Meta]\nContent Type: ${contentType}\nPost Date: ${postDate || "Not set"}`;
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
            notes: instructions ? `${instructions}\n\n${metaNotes}` : metaNotes,
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
                setSuccessMessage("Request successfully sent to To Do on the Content Board!");
                setInstructions("");
                setAssignedUser("");
                setSelectedClient("");
                setDueDate("");
                setPostDate("");
                setSearchedImage(null);
                setFolioSearch("");
                setFolioSearchError(null);
                setContentType("story");
                setCurrentStep(1);
            } else {
                const err = await response.json().catch(() => ({}));
                setFormError(err.detail || err.error || "Failed to create request. Please check the fields.");
            }
        } catch (error) {
            console.error("Network error:", error);
            setFormError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStepDone = (num) => {
        if (num === 1) return hasWho;
        if (num === 2) return hasWhat;
        if (num === 3) return hasWhen;
        return false;
    };

    return (
        <div className="submit-story">
            {/* Header */}
            <header className="ss-header">
                <div className="ss-header__titles">
                    <h1>New Request</h1>
                    <p>Assign content to the team with our focused 3-step assistant.</p>
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
                    >
                        <CircleHelp size={16} />
                        Workflow info
                    </button>
                </div>
            </header>

            {/* Workflow Info Overlay */}
            {showLearn && (
                <div className="ss-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        className="ss-learn"
                        role="dialog"
                        aria-labelledby="ss-learn-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="ss-learn__head">
                            <div>
                                <h2 id="ss-learn-title">How requests work in Lumena</h2>
                                <p>Requests land directly on the Content Board in To Do so creators can immediately pick them up.</p>
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

                        <div className="ss-destination">
                            <p className="ss-destination__label">Lifecycle Stages</p>
                            <div className="ss-destination__track">
                                <div className="ss-dest is-landing" data-stage="TO_DO">
                                    <div className="ss-dest__top">
                                        <span className="ss-dest__num">1</span>
                                        <span className="ss-dest__name">To Do</span>
                                    </div>
                                    <p className="ss-dest__meaning">Your request lands here immediately.</p>
                                </div>
                                <div className="ss-dest" data-stage="IN_PROGRESS">
                                    <div className="ss-dest__top">
                                        <span className="ss-dest__num">2</span>
                                        <span className="ss-dest__name">In Progress</span>
                                    </div>
                                    <p className="ss-dest__meaning">Creator drafts copy and media assets.</p>
                                </div>
                                <div className="ss-dest" data-stage="QA">
                                    <div className="ss-dest__top">
                                        <span className="ss-dest__num">3</span>
                                        <span className="ss-dest__name">QA Review</span>
                                    </div>
                                    <p className="ss-dest__meaning">Internal quality and medical compliance checks.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper Navigation */}
            <nav className="ss-stepper-nav" aria-label="Request steps">
                <div className="ss-flow">
                    {STEPS.map((step) => {
                        const done = isStepDone(step.number);
                        const isActive = currentStep === step.number;

                        return (
                            <button
                                key={step.id}
                                type="button"
                                className={[
                                    "ss-flow__step",
                                    done && !isActive ? "is-done" : "",
                                    isActive ? "is-active" : "",
                                    step.number === 3 && canCreate ? "is-ready" : "",
                                ].filter(Boolean).join(" ")}
                                onClick={() => handleStepClick(step.number)}
                            >
                                <div className="ss-flow__top">
                                    <span className="ss-flow__num">
                                        {done && !isActive ? <Check size={12} strokeWidth={3} /> : step.number}
                                    </span>
                                    <span className="ss-flow__name">{step.name}</span>
                                    {isActive && <span className="ss-flow__active-dot" />}
                                </div>
                                <p className="ss-flow__meaning">{step.meaning}</p>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Feedback Banners */}
            {successMessage && (
                <div className="ss-banner ss-banner--ok" role="status">
                    <div className="ss-banner__content">
                        <CheckCircle2 size={18} className="ss-banner__icon" />
                        <div>
                            <h2>Request created</h2>
                            <p>{successMessage}</p>
                        </div>
                    </div>
                    <Link href="/contentcreation" className="ss-btn ss-btn--primary">
                        Open Content Board
                    </Link>
                </div>
            )}

            {formError && (
                <div className="ss-banner ss-banner--err" role="alert">
                    <div className="ss-banner__content">
                        <ShieldAlert size={18} className="ss-banner__icon" />
                        <div>
                            <h2>Cannot create request</h2>
                            <p>{formError}</p>
                        </div>
                    </div>
                    <button type="button" className="ss-banner__close" onClick={() => setFormError("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {stepError && (
                <div className="ss-banner ss-banner--step-err" role="alert">
                    <div className="ss-banner__content">
                        <ShieldAlert size={16} className="ss-banner__icon" />
                        <p>{stepError}</p>
                    </div>
                    <button type="button" className="ss-banner__close" onClick={() => setStepError("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Wizard Card Container */}
            <div className="ss-wizard-card">
                <div className="ss-step-container">

                    {/* STEP 1: WHO (CLIENT & CREATOR) */}
                    {currentStep === 1 && (
                        <div className="ss-step-view ss-step-view--single">
                            <section className="ss-section ss-section--focus">
                                <div className="ss-section__label">
                                    <span className="ss-section__num">1</span>
                                    <div className="ss-section__titles">
                                        <div className="ss-section__title-row">
                                            <h3>Client & Assignee</h3>
                                            <span className="ss-badge ss-badge--required">Required</span>
                                        </div>
                                        <p>Select who this content is for, and assign the creator responsible for delivering it.</p>
                                    </div>
                                </div>

                                <div className="ss-grid">
                                    <div className="ss-field">
                                        <label htmlFor="ss-client">
                                            Client Practice <span className="ss-required-star">*</span>
                                        </label>
                                        <select
                                            id="ss-client"
                                            value={selectedClient}
                                            onChange={(e) => {
                                                setStepError("");
                                                setSelectedClient(e.target.value);
                                            }}
                                            autoFocus
                                        >
                                            <option value="">Select client practice...</option>
                                            {clients.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="ss-field">
                                        <label htmlFor="ss-assignee">
                                            Assign To <span className="ss-required-star">*</span>
                                        </label>
                                        <select
                                            id="ss-assignee"
                                            value={assignedUser}
                                            onChange={(e) => {
                                                setStepError("");
                                                setAssignedUser(e.target.value);
                                            }}
                                        >
                                            <option value="">Select team creator...</option>
                                            {teamMembers.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Assignee & Client Quick Card */}
                                <div className="ss-selection-preview">
                                    <div className="ss-selection-preview__item">
                                        <span className="ss-selection-preview__label">Client:</span>
                                        <span className="ss-selection-preview__val">
                                            {selectedClientObj ? selectedClientObj.name : "None selected"}
                                        </span>
                                    </div>
                                    <div className="ss-selection-preview__divider" />
                                    <div className="ss-selection-preview__item">
                                        <span className="ss-selection-preview__label">Assigned:</span>
                                        {assignedMember ? (
                                            <div className="ss-assignee-chip">
                                                <span className="ss-avatar">
                                                    {(assignedMember.name || "?").charAt(0).toUpperCase()}
                                                </span>
                                                <span className="ss-assignee-name">{assignedMember.name}</span>
                                                <span className="ss-assignee-role">{assignedMember.role}</span>
                                            </div>
                                        ) : (
                                            <span className="ss-selection-preview__val">None selected</span>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* STEP 2: WHAT (FORMAT & BRIEF) */}
                    {currentStep === 2 && (
                        <div className="ss-step-view ss-step-view--single">
                            <section className="ss-section">
                                <div className="ss-section__label">
                                    <span className="ss-section__num">2</span>
                                    <div className="ss-section__titles">
                                        <div className="ss-section__title-row">
                                            <h3>Format & Creative Brief</h3>
                                            <span className="ss-badge ss-badge--optional">Format: {contentType.toUpperCase()}</span>
                                        </div>
                                        <p>Choose the format and write instructions or copy ideas for the creator.</p>
                                    </div>
                                </div>

                                <div className="ss-field">
                                    <label>Content Format</label>
                                    <div className="ss-type-pills">
                                        {CONTENT_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            const isSelected = contentType === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    className={`ss-type-pill${isSelected ? " is-selected" : ""}`}
                                                    onClick={() => setContentType(type.id)}
                                                >
                                                    <Icon size={16} />
                                                    <span>{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="ss-field">
                                    <label htmlFor="ss-instructions">
                                        Creative Brief & Instructions
                                    </label>
                                    <textarea
                                        id="ss-instructions"
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Outline key topics, hooks, caption guidelines, visual direction, or call to action..."
                                        rows={4}
                                        autoFocus
                                    />
                                </div>

                                {/* Gallery Attachment Box */}
                                <div className="ss-gallery-attachment">
                                    <div className="ss-gallery-attachment__head">
                                        <div>
                                            <h4>Gallery Asset Link (Optional)</h4>
                                            <p>Reference an approved photo or video asset from the client library.</p>
                                        </div>
                                        {!searchedImage ? (
                                            <button
                                                type="button"
                                                className="ss-btn ss-btn--secondary ss-btn--sm"
                                                onClick={() => setShowFolioSearch(true)}
                                            >
                                                <Search size={14} />
                                                Find Folio
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="ss-btn ss-btn--ghost ss-btn--sm"
                                                onClick={handleClearGalleryImage}
                                            >
                                                <X size={14} />
                                                Remove Asset
                                            </button>
                                        )}
                                    </div>

                                    {searchedImage && (
                                        <div className="ss-attached-preview">
                                            <img src={searchedImage.image_url} alt={searchedImage.title} />
                                            <div className="ss-attached-info">
                                                <span className="ss-attached-folio">{searchedImage.folio}</span>
                                                <span className="ss-attached-title">{searchedImage.title}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* STEP 3: WHEN & LIVE BOARD PREVIEW */}
                    {currentStep === 3 && (
                        <div className="ss-step-view ss-step-view--dual">
                            {/* Left Column: Date Selectors & Shortcuts */}
                            <section className="ss-section">
                                <div className="ss-section__label">
                                    <span className="ss-section__num">3A</span>
                                    <div className="ss-section__titles">
                                        <div className="ss-section__title-row">
                                            <h3>Delivery Deadlines</h3>
                                            <span className="ss-badge ss-badge--optional">Dates</span>
                                        </div>
                                        <p>Set internal completion deadlines and target publish dates.</p>
                                    </div>
                                </div>

                                <div className="ss-stack">
                                    <div className="ss-field">
                                        <label htmlFor="ss-due">
                                            Internal Due Date (For Team)
                                        </label>
                                        <input
                                            id="ss-due"
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                        <div className="ss-date-shortcuts">
                                            <button type="button" onClick={() => setQuickDate("due", 0)}>Today</button>
                                            <button type="button" onClick={() => setQuickDate("due", 2)}>+2 Days</button>
                                            <button type="button" onClick={() => setQuickDate("due", 5)}>+5 Days</button>
                                            <button type="button" onClick={() => setQuickDate("due", 7)}>+1 Week</button>
                                        </div>
                                    </div>

                                    <div className="ss-field">
                                        <label htmlFor="ss-post">
                                            Planned Publish Date (Optional)
                                        </label>
                                        <input
                                            id="ss-post"
                                            type="date"
                                            value={postDate}
                                            onChange={(e) => setPostDate(e.target.value)}
                                        />
                                        <div className="ss-date-shortcuts">
                                            <button type="button" onClick={() => setQuickDate("post", 3)}>+3 Days</button>
                                            <button type="button" onClick={() => setQuickDate("post", 7)}>+1 Week</button>
                                            <button type="button" onClick={() => setQuickDate("post", 14)}>+2 Weeks</button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Right Column: Live Board Card Preview */}
                            <section className="ss-section ss-preview-section">
                                <div className="ss-section__label">
                                    <span className="ss-section__num">3B</span>
                                    <div className="ss-section__titles">
                                        <div className="ss-section__title-row">
                                            <h3>Content Board Live Preview</h3>
                                            <span className="ss-badge ss-badge--ready">To Do Card</span>
                                        </div>
                                        <p>Exact look of the task on the Content Board.</p>
                                    </div>
                                </div>

                                <div className="ss-board-preview-card" data-type={getMediaTypeForContentType(contentType)}>
                                    <div className="ss-card-header">
                                        <span className="ss-card-client">
                                            {selectedClientObj ? selectedClientObj.name : "Client Name"}
                                        </span>
                                        <div className="ss-card-badges">
                                            <span className="ss-card-type-badge">{contentType.toUpperCase()}</span>
                                            <span className="ss-card-status-badge">TO DO</span>
                                        </div>
                                    </div>

                                    <p className="ss-card-brief">
                                        {instructions || "No custom brief provided. Creator will draft following client brand guidelines."}
                                    </p>

                                    {searchedImage && (
                                        <div className="ss-card-asset-tag">
                                            <ImageIcon size={13} />
                                            <span>{searchedImage.folio} — {searchedImage.title}</span>
                                        </div>
                                    )}

                                    <div className="ss-card-footer">
                                        <div className="ss-card-assignee">
                                            <span className="ss-card-avatar">
                                                {(assignedMember?.name || "?").charAt(0).toUpperCase()}
                                            </span>
                                            <span className="ss-card-author">{assignedMember?.name || "Unassigned"}</span>
                                        </div>
                                        <div className="ss-card-dates">
                                            <Clock size={12} />
                                            <span>{dueDate || "No due date"}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <footer className="ss-wizard-footer">
                    <div className="ss-wizard-footer__left">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                className="ss-btn ss-btn--secondary"
                                onClick={handlePrev}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}
                        <span className="ss-wizard-footer__counter">
                            Step {currentStep} of {STEPS.length}
                        </span>
                    </div>

                    <div className="ss-wizard-footer__right">
                        {/* Quick create button from step 2 if Who is complete */}
                        {canCreate && currentStep === 2 && (
                            <button
                                type="button"
                                className="ss-btn ss-btn--quick"
                                onClick={handleCreateRequest}
                                disabled={isSubmitting}
                                title="Send request directly to To Do"
                            >
                                <CheckCircle2 size={16} />
                                {isSubmitting ? "Creating..." : "Quick Create"}
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                className="ss-btn ss-btn--primary"
                                onClick={handleNext}
                            >
                                Next Step
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={`ss-btn ss-btn--primary ss-submit-btn${canCreate ? " is-ready" : ""}`}
                                onClick={handleCreateRequest}
                                disabled={isSubmitting}
                            >
                                <Send size={16} />
                                {isSubmitting ? "Submitting..." : "Create Request — Goes to To Do"}
                            </button>
                        )}
                    </div>
                </footer>
            </div>

            {/* Gallery Folio Search Modal */}
            {showFolioSearch && (
                <div className="ss-overlay" onClick={() => setShowFolioSearch(false)}>
                    <div
                        className="ss-folio"
                        role="dialog"
                        aria-labelledby="ss-folio-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="ss-folio__head">
                            <div>
                                <h3 id="ss-folio-title">Link Gallery Image</h3>
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
                                    autoFocus
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
