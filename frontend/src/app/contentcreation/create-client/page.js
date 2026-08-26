"use client";

import React, { useState } from "react";
import {
    Upload,
    CheckCircle2,
    CircleHelp,
    X,
} from "lucide-react";
import "../create-client.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FLOW_STEPS = [
    { id: "account", number: 1, name: "Account", meaning: "Login the client will use" },
    { id: "practice", number: 2, name: "Practice", meaning: "Who they are and who they serve" },
    { id: "brand", number: 3, name: "Brand", meaning: "Logo, voice, and content limits" },
    { id: "create", number: 4, name: "Create", meaning: "Saves the profile and login" },
];

const AFTER_CREATE = [
    { id: "login", number: 1, name: "Login", meaning: "They can sign in to Lumena" },
    { id: "profile", number: 2, name: "Profile", meaning: "Brand rules live on the account" },
    { id: "work", number: 3, name: "Work", meaning: "Requests and plans can use this client", landing: true },
];

const PRACTICE_TYPES = [
    "Private practice",
    "Group practice",
    "Clinic",
    "Concierge / membership-based",
    "Hospital",
    "Other",
];

function Field({ label, htmlFor, className = "", children }) {
    return (
        <div className={`cc-field${className ? ` ${className}` : ""}`}>
            <label htmlFor={htmlFor}>{label}</label>
            {children}
        </div>
    );
}

export default function CreateClientPage() {
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [showLearn, setShowLearn] = useState(false);
    const [activeSection, setActiveSection] = useState("account");

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        profile: {
            practice_name: "",
            primary_contact: "",
            role_title: "",
            primary_email: "",
            phone: "",
            practice_address: "",
            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            medical_specialty: "",
            sub_specialty: "",
            practice_type: "Private practice",
            target_patient_type: "",
            brand_colors: "",
            brand_fonts: "",
            website_url: "",
            social_media_links: "",
            primary_brand_pillars: "",
            overall_voice: "",
            tone_guidelines: "",
            emojis: "Limited",
            humor: "Subtle",
            formality_level: "Medium",
            words_to_use: "",
            words_to_avoid: "",
            doctor_voice_preference: "",
            topics_to_emphasize: "",
            topics_to_avoid: "",
            medical_claims_limitations: "",
            hipaa_considerations: "",
            faces_allowed: "Yes",
            testimonials_allowed: "Yes",
            consent_required: "Yes",
            primary_goal: "",
            secondary_goals: "",
            kpis_to_track: "",
            success_looks_like: "",
            communication_channel: "Email",
            feedback_style: "Written",
        },
    });

    const handleInputChange = (section, field, value) => {
        if (section === "user") {
            setFormData((prev) => ({ ...prev, [field]: value }));
        } else {
            setFormData((prev) => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    [field]: value,
                },
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            const payload = {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                profile: { ...formData.profile, contact_email: formData.profile.primary_email },
            };

            submitData.append("json_data", JSON.stringify(payload));
            if (logoFile) {
                submitData.append("logo", logoFile);
            }

            const response = await fetch(`${API_BASE}/api/users/create-client/`, {
                method: "POST",
                body: submitData,
            });

            if (response.ok) {
                window.location.href = "/contentcreation/monthly-contents";
            } else {
                const errorData = await response.json().catch(() => ({}));
                setFormError(
                    errorData.error || errorData.detail || "Failed to create client. Check the fields and try again."
                );
            }
        } catch (error) {
            console.error("Network error:", error);
            setFormError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasAccount = Boolean(formData.username && formData.password && formData.email);
    const hasPractice = Boolean(formData.profile.practice_name);
    const hasBrand = Boolean(
        logoFile || formData.profile.website_url || formData.profile.overall_voice || formData.profile.primary_brand_pillars
    );
    const canCreate = hasAccount && hasPractice;

    let activeFlowStep = "account";
    if (canCreate) activeFlowStep = "create";
    else if (hasAccount && hasPractice) activeFlowStep = "brand";
    else if (hasAccount) activeFlowStep = "practice";

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        const map = {
            account: "cc-account",
            practice: "cc-practice",
            brand: "cc-assets",
            create: "cc-submit",
        };
        const sectionMap = {
            account: "account",
            practice: "practice",
            brand: "brand",
            create: "create",
        };
        setActiveSection(sectionMap[stepId] || "account");
        window.setTimeout(() => {
            if (stepId === "create") document.getElementById("cc-submit")?.focus();
            else document.getElementById(map[stepId])?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    };

    const mark = (id) => {
        setActiveSection(id);
    };

    return (
        <div className="create-client">
            <header className="cc-header">
                <div className="cc-header__titles">
                    <h1>Create Client</h1>
                    <p>Set up a login and brand profile. Internal use only — the team uses this when creating content.</p>
                </div>
                <div className="cc-header__actions">
                    <span className="cc-chip">
                        <span className="cc-chip__dot" />
                        Internal only
                    </span>
                    <span className="cc-chip">
                        <span className="cc-chip__dot" />
                        Creates a login
                    </span>
                    <button
                        type="button"
                        className={`cc-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="cc-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                </div>
            </header>

            {showLearn && (
                <div className="cc-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        id="cc-learn-panel"
                        className="cc-learn"
                        role="dialog"
                        aria-labelledby="cc-learn-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cc-learn__head">
                            <div>
                                <h2 id="cc-learn-title">How creating a client works</h2>
                                <p>Fill Account and Practice at minimum. Brand details help captions and requests stay on-voice.</p>
                            </div>
                            <button type="button" className="cc-icon-btn" onClick={() => setShowLearn(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="cc-learn__label">On this page</p>
                        <nav className="cc-flow" aria-label="Create client steps">
                            {FLOW_STEPS.map((s) => {
                                const isDone =
                                    (s.id === "account" && hasAccount) ||
                                    (s.id === "practice" && hasPractice) ||
                                    (s.id === "brand" && hasBrand);
                                const isActive = activeFlowStep === s.id;
                                const isReady = s.id === "create" && canCreate;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={[
                                            "cc-flow__step",
                                            isDone && !isActive ? "is-done" : "",
                                            isActive ? "is-active" : "",
                                            isReady ? "is-ready" : "",
                                        ].filter(Boolean).join(" ")}
                                        onClick={() => handleFlowClick(s.id)}
                                    >
                                        <div className="cc-flow__top">
                                            <span className="cc-flow__num">{s.number}</span>
                                            <span className="cc-flow__name">{s.name}</span>
                                        </div>
                                        <p className="cc-flow__meaning">{s.meaning}</p>
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="cc-destination">
                            <p className="cc-destination__label">After you create</p>
                            <div className="cc-destination__track">
                                {AFTER_CREATE.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`cc-dest${item.landing ? " is-landing" : ""}`}
                                        data-stage={item.id}
                                    >
                                        <div className="cc-dest__top">
                                            <span className="cc-dest__num">{item.number}</span>
                                            <span className="cc-dest__name">{item.name}</span>
                                        </div>
                                        <p className="cc-dest__meaning">{item.meaning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form className="cc-card" onSubmit={handleSubmit}>
                {formError && (
                    <div className="cc-banner cc-banner--err" role="alert">
                        <div>
                            <h2>Can’t create yet</h2>
                            <p>{formError}</p>
                        </div>
                    </div>
                )}

                <div className="cc-form">
                    <div className="cc-col">
                        <section
                            id="cc-account"
                            className={`cc-section${activeSection === "account" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">1</span>
                                <div>
                                    <h3>Account</h3>
                                    <p>Login the client will use to sign in.</p>
                                </div>
                            </div>
                            <div className="cc-grid">
                                <Field label="Username" htmlFor="cc-username">
                                    <input
                                        id="cc-username"
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => { mark("account"); handleInputChange("user", "username", e.target.value); }}
                                        placeholder="username"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Password" htmlFor="cc-password">
                                    <input
                                        id="cc-password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => { mark("account"); handleInputChange("user", "password", e.target.value); }}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                </Field>
                                <Field label="Administrative email" htmlFor="cc-email" className="cc-span-2">
                                    <input
                                        id="cc-email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => { mark("account"); handleInputChange("user", "email", e.target.value); }}
                                        placeholder="admin@client.com"
                                    />
                                </Field>
                            </div>
                        </section>

                        <section
                            id="cc-practice"
                            className={`cc-section${activeSection === "practice" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">2</span>
                                <div>
                                    <h3>Practice</h3>
                                    <p>Who they are and how to reach them.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <Field label="Practice / brand name" htmlFor="cc-practice-name">
                                    <input
                                        id="cc-practice-name"
                                        type="text"
                                        value={formData.profile.practice_name}
                                        onChange={(e) => { mark("practice"); handleInputChange("profile", "practice_name", e.target.value); }}
                                        placeholder="e.g. Lumena Health"
                                    />
                                </Field>
                                <div className="cc-grid">
                                    <Field label="Primary contact" htmlFor="cc-contact">
                                        <input
                                            id="cc-contact"
                                            type="text"
                                            value={formData.profile.primary_contact}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "primary_contact", e.target.value); }}
                                        />
                                    </Field>
                                    <Field label="Role / title" htmlFor="cc-role">
                                        <input
                                            id="cc-role"
                                            type="text"
                                            value={formData.profile.role_title}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "role_title", e.target.value); }}
                                        />
                                    </Field>
                                    <Field label="Contact email" htmlFor="cc-contact-email">
                                        <input
                                            id="cc-contact-email"
                                            type="email"
                                            value={formData.profile.primary_email}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "primary_email", e.target.value); }}
                                        />
                                    </Field>
                                    <Field label="Phone" htmlFor="cc-phone">
                                        <input
                                            id="cc-phone"
                                            type="text"
                                            value={formData.profile.phone}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "phone", e.target.value); }}
                                        />
                                    </Field>
                                </div>
                                <Field label="Practice address" htmlFor="cc-address">
                                    <input
                                        id="cc-address"
                                        type="text"
                                        value={formData.profile.practice_address}
                                        onChange={(e) => { mark("practice"); handleInputChange("profile", "practice_address", e.target.value); }}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section
                            id="cc-industry"
                            className={`cc-section${activeSection === "practice" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">3</span>
                                <div>
                                    <h3>Industry</h3>
                                    <p>Specialty and who they treat.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <div className="cc-grid">
                                    <Field label="Medical specialty" htmlFor="cc-specialty">
                                        <input
                                            id="cc-specialty"
                                            type="text"
                                            value={formData.profile.medical_specialty}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "medical_specialty", e.target.value); }}
                                            placeholder="e.g. Dermatology"
                                        />
                                    </Field>
                                    <Field label="Sub-specialty" htmlFor="cc-subspecialty">
                                        <input
                                            id="cc-subspecialty"
                                            type="text"
                                            value={formData.profile.sub_specialty}
                                            onChange={(e) => { mark("practice"); handleInputChange("profile", "sub_specialty", e.target.value); }}
                                        />
                                    </Field>
                                </div>
                                <Field label="Type of practice" htmlFor="cc-practice-type">
                                    <select
                                        id="cc-practice-type"
                                        value={formData.profile.practice_type}
                                        onChange={(e) => { mark("practice"); handleInputChange("profile", "practice_type", e.target.value); }}
                                    >
                                        {PRACTICE_TYPES.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Target patient type" htmlFor="cc-patients">
                                    <textarea
                                        id="cc-patients"
                                        value={formData.profile.target_patient_type}
                                        onChange={(e) => { mark("practice"); handleInputChange("profile", "target_patient_type", e.target.value); }}
                                        placeholder="Age range, gender, insurance vs cash-pay..."
                                    />
                                </Field>
                            </div>
                        </section>

                        <section
                            id="cc-assets"
                            className={`cc-section${activeSection === "brand" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">4</span>
                                <div>
                                    <h3>Brand assets</h3>
                                    <p>Logo, site, and visual identity.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <div className="cc-grid is-logo">
                                    <label className="cc-logo">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo preview" />
                                        ) : (
                                            <Upload size={22} />
                                        )}
                                        <span>{logoPreview ? "Replace logo" : "Upload logo"}</span>
                                        <input type="file" accept="image/*" onChange={(e) => { mark("brand"); handleImageChange(e); }} />
                                    </label>
                                    <div className="cc-stack">
                                        <Field label="Website URL" htmlFor="cc-website">
                                            <input
                                                id="cc-website"
                                                type="text"
                                                value={formData.profile.website_url}
                                                onChange={(e) => { mark("brand"); handleInputChange("profile", "website_url", e.target.value); }}
                                                placeholder="https://..."
                                            />
                                        </Field>
                                        <Field label="Brand colors" htmlFor="cc-colors">
                                            <input
                                                id="cc-colors"
                                                type="text"
                                                value={formData.profile.brand_colors}
                                                onChange={(e) => { mark("brand"); handleInputChange("profile", "brand_colors", e.target.value); }}
                                                placeholder="e.g. #FF5500, Navy Blue"
                                            />
                                        </Field>
                                        <Field label="Brand fonts" htmlFor="cc-fonts">
                                            <input
                                                id="cc-fonts"
                                                type="text"
                                                value={formData.profile.brand_fonts}
                                                onChange={(e) => { mark("brand"); handleInputChange("profile", "brand_fonts", e.target.value); }}
                                            />
                                        </Field>
                                    </div>
                                </div>
                                <Field label="Social media links" htmlFor="cc-social">
                                    <textarea
                                        id="cc-social"
                                        value={formData.profile.social_media_links}
                                        onChange={(e) => { mark("brand"); handleInputChange("profile", "social_media_links", e.target.value); }}
                                        placeholder="Instagram, TikTok, LinkedIn..."
                                    />
                                </Field>
                            </div>
                        </section>
                    </div>

                    <div className="cc-col">
                        <section
                            id="cc-pillars"
                            className={`cc-section${activeSection === "brand" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">5</span>
                                <div>
                                    <h3>Brand pillars</h3>
                                    <p>What this brand stands for.</p>
                                </div>
                            </div>
                            <Field label="Primary brand pillars" htmlFor="cc-pillars-text">
                                <textarea
                                    id="cc-pillars-text"
                                    value={formData.profile.primary_brand_pillars}
                                    onChange={(e) => { mark("brand"); handleInputChange("profile", "primary_brand_pillars", e.target.value); }}
                                    placeholder="e.g. Trust, Education, Results, Innovation..."
                                />
                            </Field>
                        </section>

                        <section
                            id="cc-voice"
                            className={`cc-section${activeSection === "brand" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">6</span>
                                <div>
                                    <h3>Voice & tone</h3>
                                    <p>How copy should sound.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <Field label="Overall voice" htmlFor="cc-voice-text">
                                    <input
                                        id="cc-voice-text"
                                        type="text"
                                        value={formData.profile.overall_voice}
                                        onChange={(e) => { mark("brand"); handleInputChange("profile", "overall_voice", e.target.value); }}
                                        placeholder="Professional, Warm, Educational..."
                                    />
                                </Field>
                                <div className="cc-grid is-3">
                                    <Field label="Emojis" htmlFor="cc-emojis">
                                        <select id="cc-emojis" value={formData.profile.emojis} onChange={(e) => { mark("brand"); handleInputChange("profile", "emojis", e.target.value); }}>
                                            {["Yes", "No", "Limited"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Humor" htmlFor="cc-humor">
                                        <select id="cc-humor" value={formData.profile.humor} onChange={(e) => { mark("brand"); handleInputChange("profile", "humor", e.target.value); }}>
                                            {["Yes", "No", "Subtle"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Formality" htmlFor="cc-formality">
                                        <select id="cc-formality" value={formData.profile.formality_level} onChange={(e) => { mark("brand"); handleInputChange("profile", "formality_level", e.target.value); }}>
                                            {["High", "Medium", "Low"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <div className="cc-grid">
                                    <Field label="Words to use" htmlFor="cc-words-use">
                                        <textarea id="cc-words-use" value={formData.profile.words_to_use} onChange={(e) => { mark("brand"); handleInputChange("profile", "words_to_use", e.target.value); }} />
                                    </Field>
                                    <Field label="Words to avoid" htmlFor="cc-words-avoid">
                                        <textarea id="cc-words-avoid" value={formData.profile.words_to_avoid} onChange={(e) => { mark("brand"); handleInputChange("profile", "words_to_avoid", e.target.value); }} />
                                    </Field>
                                </div>
                                <Field label="How the doctor wants to sound" htmlFor="cc-doctor-voice">
                                    <textarea
                                        id="cc-doctor-voice"
                                        value={formData.profile.doctor_voice_preference}
                                        onChange={(e) => { mark("brand"); handleInputChange("profile", "doctor_voice_preference", e.target.value); }}
                                        placeholder="Expert but human, calm and reassuring..."
                                    />
                                </Field>
                            </div>
                        </section>

                        <section
                            id="cc-bounds"
                            className={`cc-section${activeSection === "brand" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">7</span>
                                <div>
                                    <h3>Boundaries</h3>
                                    <p>What content can and cannot include.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <div className="cc-grid">
                                    <Field label="Topics to emphasize" htmlFor="cc-topics-yes">
                                        <textarea id="cc-topics-yes" value={formData.profile.topics_to_emphasize} onChange={(e) => { mark("brand"); handleInputChange("profile", "topics_to_emphasize", e.target.value); }} />
                                    </Field>
                                    <Field label="Topics to avoid" htmlFor="cc-topics-no">
                                        <textarea id="cc-topics-no" value={formData.profile.topics_to_avoid} onChange={(e) => { mark("brand"); handleInputChange("profile", "topics_to_avoid", e.target.value); }} />
                                    </Field>
                                </div>
                                <Field label="Medical claims limitations" htmlFor="cc-claims">
                                    <input
                                        id="cc-claims"
                                        type="text"
                                        value={formData.profile.medical_claims_limitations}
                                        onChange={(e) => { mark("brand"); handleInputChange("profile", "medical_claims_limitations", e.target.value); }}
                                        placeholder="No guarantees, before/after rules..."
                                    />
                                </Field>
                                <div className="cc-grid is-3">
                                    <Field label="Faces allowed?" htmlFor="cc-faces">
                                        <select id="cc-faces" value={formData.profile.faces_allowed} onChange={(e) => { mark("brand"); handleInputChange("profile", "faces_allowed", e.target.value); }}>
                                            {["Yes", "No"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Testimonials?" htmlFor="cc-testimonials">
                                        <select id="cc-testimonials" value={formData.profile.testimonials_allowed} onChange={(e) => { mark("brand"); handleInputChange("profile", "testimonials_allowed", e.target.value); }}>
                                            {["Yes", "No"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Consent required?" htmlFor="cc-consent">
                                        <select id="cc-consent" value={formData.profile.consent_required} onChange={(e) => { mark("brand"); handleInputChange("profile", "consent_required", e.target.value); }}>
                                            {["Yes", "No"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        </section>

                        <section
                            id="cc-goals"
                            className={`cc-section${activeSection === "create" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">8</span>
                                <div>
                                    <h3>Goals</h3>
                                    <p>What success looks like for this account.</p>
                                </div>
                            </div>
                            <div className="cc-stack">
                                <Field label="Primary goal" htmlFor="cc-goal">
                                    <input
                                        id="cc-goal"
                                        type="text"
                                        value={formData.profile.primary_goal}
                                        onChange={(e) => { mark("create"); handleInputChange("profile", "primary_goal", e.target.value); }}
                                        placeholder="Growth, bookings, authority..."
                                    />
                                </Field>
                                <Field label="KPIs we track" htmlFor="cc-kpis">
                                    <input
                                        id="cc-kpis"
                                        type="text"
                                        value={formData.profile.kpis_to_track}
                                        onChange={(e) => { mark("create"); handleInputChange("profile", "kpis_to_track", e.target.value); }}
                                        placeholder="Engagement, clicks, leads..."
                                    />
                                </Field>
                                <Field label="Success looks like" htmlFor="cc-success">
                                    <textarea
                                        id="cc-success"
                                        value={formData.profile.success_looks_like}
                                        onChange={(e) => { mark("create"); handleInputChange("profile", "success_looks_like", e.target.value); }}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section
                            id="cc-comms"
                            className={`cc-section${activeSection === "create" ? " is-active" : ""}`}
                        >
                            <div className="cc-section__label">
                                <span className="cc-section__num">9</span>
                                <div>
                                    <h3>Communication</h3>
                                    <p>How the team should work with them.</p>
                                </div>
                            </div>
                            <div className="cc-grid">
                                <Field label="Preferred channel" htmlFor="cc-channel">
                                    <select id="cc-channel" value={formData.profile.communication_channel} onChange={(e) => { mark("create"); handleInputChange("profile", "communication_channel", e.target.value); }}>
                                        {["Email", "Slack", "Calls"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </Field>
                                <Field label="Feedback style" htmlFor="cc-feedback">
                                    <select id="cc-feedback" value={formData.profile.feedback_style} onChange={(e) => { mark("create"); handleInputChange("profile", "feedback_style", e.target.value); }}>
                                        {["Written", "Call-based", "Async"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </section>

                        <button
                            id="cc-submit"
                            type="submit"
                            className={`cc-btn cc-btn--primary cc-submit${canCreate ? " is-ready" : ""}`}
                            disabled={isSubmitting}
                        >
                            <CheckCircle2 size={18} />
                            {isSubmitting ? "Creating..." : "Create client profile"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
