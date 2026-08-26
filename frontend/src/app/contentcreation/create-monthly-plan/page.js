"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    Image as ImageIcon,
    Layers,
    Video,
    Type,
    Plus,
    ChevronDown,
    ChevronUp,
    Loader2,
    CircleHelp,
    X,
} from "lucide-react";
import "../create-monthly-plan.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORIES = [
    { id: "photos", label: "Photos", icon: ImageIcon },
    { id: "carousels", label: "Carousels", icon: Layers },
    { id: "videos", label: "Videos", icon: Video },
    { id: "stories", label: "Stories", icon: Type },
];

const FLOW_STEPS = [
    { id: "mix", number: 1, name: "Mix", meaning: "How many photos, carousels, videos, and stories" },
    { id: "who", number: 2, name: "Who", meaning: "Client and the person who will create the plan" },
    { id: "when", number: 3, name: "When", meaning: "Month and the brief for the team" },
    { id: "create", number: 4, name: "Create", meaning: "Sends the plan to To Do" },
];

const PIPELINE_STAGES = [
    { id: "TO_DO", number: 1, name: "To Do", meaning: "New plans land here", landing: true },
    { id: "IN_PROGRESS", number: 2, name: "In Progress", meaning: "Being created" },
    { id: "QA", number: 3, name: "QA", meaning: "Internal review" },
    { id: "IN_REVISION", number: 4, name: "In Revision", meaning: "Changes requested" },
    { id: "CLIENT_REVIEW", number: 5, name: "Client Review", meaning: "Waiting on client" },
    { id: "APPROVED", number: 6, name: "Approved", meaning: "Ready to schedule" },
    { id: "DONE", number: 7, name: "Done", meaning: "Published" },
];

const DEFAULT_COUNTS = {
    photos: 4,
    carousels: 4,
    videos: 4,
    stories: 4,
};

const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
};

export default function CreateMonthlyPlanPage() {
    const [clients, setClients] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [assignedUser, setAssignedUser] = useState("");
    const [month, setMonth] = useState("");
    const [instructions, setInstructions] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showLearn, setShowLearn] = useState(false);
    const [counts, setCounts] = useState(DEFAULT_COUNTS);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, creatorsRes] = await Promise.all([
                    fetch(`${API_BASE}/api/users/clients/`),
                    fetch(`${API_BASE}/api/users/content-creators/`),
                ]);

                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    setClients(data.map((u) => ({
                        id: String(u.id),
                        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username,
                    })));
                }

                if (creatorsRes.ok) {
                    const data = await creatorsRes.json();
                    setContentCreators(data.map((u) => ({
                        id: String(u.id),
                        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username,
                        role: u.role,
                    })));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!showLearn) return undefined;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setShowLearn(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showLearn]);

    const adjustCount = (category, delta) => {
        setCounts((prev) => ({
            ...prev,
            [category]: Math.max(1, Math.min(20, (prev[category] || 0) + delta)),
        }));
    };

    const setExactCount = (category, value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            setCounts((prev) => ({
                ...prev,
                [category]: Math.max(1, Math.min(20, num)),
            }));
        }
    };

    const totalItems = counts.photos + counts.carousels + counts.videos + counts.stories;
    const hasMix = totalItems > 0;
    const hasWho = Boolean(selectedClient && assignedUser);
    const hasWhen = Boolean(month);
    const canCreate = hasWho && hasWhen;

    let activeStep = "mix";
    if (!hasMix) activeStep = "mix";
    else if (!hasWho) activeStep = "who";
    else if (!hasWhen) activeStep = "when";
    else activeStep = "create";

    const assignedMember = contentCreators.find((u) => u.id === assignedUser);
    const selectedClientName = clients.find((c) => c.id === selectedClient)?.name;

    const handleCreatePlan = async () => {
        setSuccessMessage("");

        if (!selectedClient) {
            setFormError("Please select a client.");
            scrollToSection("mp-feedback");
            return;
        }

        if (!assignedUser) {
            setFormError("Please assign the request to a team member.");
            scrollToSection("mp-feedback");
            return;
        }

        if (!month) {
            setFormError("Please select a month.");
            scrollToSection("mp-feedback");
            return;
        }

        setFormError("");
        setIsSubmitting(true);

        const notes = [
            instructions,
            "",
            "[Monthly Plan]",
            `Photos: ${counts.photos}`,
            `Carousels: ${counts.carousels}`,
            `Videos: ${counts.videos}`,
            `Stories: ${counts.stories}`,
            `Total: ${totalItems} items`,
        ].filter(Boolean).join("\n");

        const payload = {
            client: selectedClient,
            assigned_to: assignedUser,
            request_type: "MONTHLY_CONTENT",
            month: month,
            notes: notes,
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
                setSuccessMessage("This monthly plan is now in To Do. It will also appear in Monthly Contents.");
                setSelectedClient("");
                setAssignedUser("");
                setMonth("");
                setInstructions("");
                setCounts(DEFAULT_COUNTS);
            } else {
                const err = await response.json();
                console.error("Error creating plan:", err);
                setFormError("Failed to create monthly plan. Check the console for details.");
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
            window.setTimeout(() => document.getElementById("mp-submit")?.focus(), 0);
            return;
        }
        window.setTimeout(() => scrollToSection(`mp-${stepId}`), 0);
    };

    return (
        <div className="monthly-plan">
            <header className="mp-header">
                <div className="mp-header__titles">
                    <h1>Monthly plan</h1>
                    <p>Set the mix for a client’s month. Creating it puts a package on the Content Board in To Do.</p>
                </div>
                <div className="mp-header__actions">
                    <span className="mp-chip">
                        <span className="mp-chip__dot" />
                        Goes to To Do
                    </span>
                    <span className="mp-chip">{totalItems} items</span>
                    <button
                        type="button"
                        className={`mp-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="mp-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                </div>
            </header>

            {showLearn && (
                <div className="mp-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        id="mp-learn-panel"
                        className="mp-learn"
                        role="dialog"
                        aria-labelledby="mp-learn-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mp-learn__head">
                            <div>
                                <h2 id="mp-learn-title">How this plan works</h2>
                                <p>Fill Mix, Who, and When. Creating the plan puts it on the board in To Do.</p>
                            </div>
                            <button
                                type="button"
                                className="mp-icon-btn"
                                onClick={() => setShowLearn(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="mp-learn__label">On this page</p>
                        <nav className="mp-flow" aria-label="Plan steps">
                            {FLOW_STEPS.map((step) => {
                                const isDone =
                                    (step.id === "mix" && hasMix) ||
                                    (step.id === "who" && hasWho) ||
                                    (step.id === "when" && hasWhen);
                                const isActive = activeStep === step.id;
                                const isReady = step.id === "create" && canCreate;
                                const className = [
                                    "mp-flow__step",
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
                                        <div className="mp-flow__top">
                                            <span className="mp-flow__num">{step.number}</span>
                                            <span className="mp-flow__name">{step.name}</span>
                                        </div>
                                        <p className="mp-flow__meaning">{step.meaning}</p>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mp-destination">
                            <p className="mp-learn__label">After you create — Content Board pipeline</p>
                            <div className="mp-destination__track">
                                {PIPELINE_STAGES.map((stage) => (
                                    <div
                                        key={stage.id}
                                        data-stage={stage.id}
                                        className={`mp-dest${stage.landing ? " is-landing" : ""}`}
                                    >
                                        <div className="mp-dest__top">
                                            <span className="mp-dest__num">{stage.number}</span>
                                            <span className="mp-dest__name">{stage.name}</span>
                                        </div>
                                        <p className="mp-dest__meaning">{stage.meaning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mp-card">
                {successMessage && (
                    <div id="mp-feedback" className="mp-banner mp-banner--ok" role="status">
                        <div>
                            <h2>Plan created</h2>
                            <p>{successMessage}</p>
                        </div>
                        <div className="mp-banner__links">
                            <Link href="/contentcreation">Open Content Board</Link>
                            <Link href="/contentcreation/monthly-contents">Open Monthly Contents</Link>
                        </div>
                    </div>
                )}

                {formError && (
                    <div id="mp-feedback" className="mp-banner mp-banner--err" role="alert">
                        <div>
                            <h2>Can’t create yet</h2>
                            <p>{formError}</p>
                        </div>
                    </div>
                )}

                <div className="mp-workspace">
                    <div className="mp-col">
                        <section
                            id="mp-mix"
                            className={`mp-section${activeStep === "mix" ? " is-active" : ""}`}
                        >
                            <div className="mp-section__label">
                                <span className="mp-section__num">1</span>
                                <div>
                                    <h3>Mix</h3>
                                    <p>How many of each format this month. Each count stays between 1 and 20.</p>
                                </div>
                            </div>

                            <div className="mp-mix">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <div key={cat.id} className="mp-format" data-format={cat.id}>
                                            <div className="mp-format__id">
                                                <span className="mp-format__icon">
                                                    <Icon size={18} />
                                                </span>
                                                <strong>{cat.label}</strong>
                                            </div>
                                            <div className="mp-stepper">
                                                <button
                                                    type="button"
                                                    onClick={() => adjustCount(cat.id, -1)}
                                                    aria-label={`Decrease ${cat.label}`}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={counts[cat.id]}
                                                    onChange={(e) => setExactCount(cat.id, e.target.value)}
                                                    aria-label={`${cat.label} count`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => adjustCount(cat.id, 1)}
                                                    aria-label={`Increase ${cat.label}`}
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mp-total">
                                <div className="mp-total__top">
                                    <span>Total items</span>
                                    <b>{totalItems}</b>
                                </div>
                                <div className="mp-total__bars" aria-hidden="true">
                                    {CATEGORIES.map((cat) => {
                                        const pct = totalItems > 0
                                            ? Math.round((counts[cat.id] / totalItems) * 100)
                                            : 0;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="mp-total__bar"
                                                data-format={cat.id}
                                                style={{ width: `${pct}%` }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mp-col">
                        <section
                            id="mp-who"
                            className={`mp-section${activeStep === "who" ? " is-active" : ""}`}
                        >
                            <div className="mp-section__label">
                                <span className="mp-section__num">2</span>
                                <div>
                                    <h3>Who</h3>
                                    <p>The client this package is for, and who on the team owns it.</p>
                                </div>
                            </div>

                            <div className="mp-field">
                                <label htmlFor="mp-client">Client</label>
                                <select
                                    id="mp-client"
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                >
                                    <option value="">Select client…</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mp-field">
                                <label htmlFor="mp-assignee">Assign to</label>
                                <div className="mp-assign">
                                    <select
                                        id="mp-assignee"
                                        value={assignedUser}
                                        onChange={(e) => setAssignedUser(e.target.value)}
                                    >
                                        <option value="">Select team member…</option>
                                        {contentCreators.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mp-assignee">
                                        {assignedMember ? (
                                            <>
                                                <span className="mp-avatar">
                                                    {assignedMember.name.charAt(0)}
                                                </span>
                                                <div>
                                                    <p>{assignedMember.name}</p>
                                                    <small>{assignedMember.role}</small>
                                                </div>
                                            </>
                                        ) : selectedClientName ? (
                                            <span>Client: {selectedClientName}. Pick a teammate.</span>
                                        ) : (
                                            <span>No one selected yet</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section
                            id="mp-when"
                            className={`mp-section${activeStep === "when" ? " is-active" : ""}`}
                        >
                            <div className="mp-section__label">
                                <span className="mp-section__num">3</span>
                                <div>
                                    <h3>When</h3>
                                    <p>The month this package covers, plus any brief for the team.</p>
                                </div>
                            </div>

                            <div className="mp-field">
                                <label htmlFor="mp-month">Month</label>
                                <input
                                    id="mp-month"
                                    type="date"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                />
                            </div>

                            <div className="mp-field">
                                <label htmlFor="mp-instructions">Instructions</label>
                                <textarea
                                    id="mp-instructions"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="Describe the overall requirements for this month’s content…"
                                />
                            </div>
                        </section>

                        <section
                            id="mp-create"
                            className={`mp-section${activeStep === "create" ? " is-active" : ""}`}
                        >
                            <div className="mp-section__label">
                                <span className="mp-section__num">4</span>
                                <div>
                                    <h3>Create</h3>
                                    <p>Sends the package to To Do on the Content Board.</p>
                                </div>
                            </div>

                            <button
                                id="mp-submit"
                                type="button"
                                className={`mp-btn mp-btn--primary${canCreate ? " is-ready" : ""}`}
                                onClick={handleCreatePlan}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="mp-spin" />
                                        Creating plan…
                                    </>
                                ) : (
                                    <>
                                        Create monthly plan
                                        <Plus size={16} />
                                    </>
                                )}
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
