"use client";

import React, { useState } from "react";
import {
    Upload,
    CheckCircle2,
    CircleHelp,
    X,
    ArrowRight,
    ArrowLeft,
    Check,
    Building2,
    User,
    Palette,
    Target,
    ShieldAlert,
    Sparkles,
    Eye,
    MessageSquare
} from "lucide-react";
import "../create-client.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = [
    {
        id: "account",
        number: 1,
        name: "Account",
        meaning: "Login & credentials",
        icon: User,
    },
    {
        id: "practice",
        number: 2,
        name: "Practice",
        meaning: "Clinic info & specialty",
        icon: Building2,
    },
    {
        id: "brand",
        number: 3,
        name: "Brand & Voice",
        meaning: "Logo, tone & guidelines",
        icon: Palette,
    },
    {
        id: "review",
        number: 4,
        name: "Goals & Review",
        meaning: "Targets & final summary",
        icon: Target,
    },
];

const PRACTICE_TYPES = [
    "Private practice",
    "Group practice",
    "Clinic",
    "Concierge / membership-based",
    "Hospital",
    "Other",
];

function Field({ label, htmlFor, required = false, hint, className = "", children }) {
    return (
        <div className={`cc-field${className ? ` ${className}` : ""}`}>
            <label htmlFor={htmlFor}>
                {label}
                {required && <span className="cc-required-star" title="Required field">*</span>}
                {hint && <span className="cc-field-hint">({hint})</span>}
            </label>
            {children}
        </div>
    );
}

export default function CreateClientPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [stepError, setStepError] = useState("");
    const [showLearn, setShowLearn] = useState(false);

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
        setStepError("");
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

    // Validation helpers
    const hasAccount = Boolean(
        formData.username.trim() &&
        formData.password.trim() &&
        formData.email.trim()
    );
    const hasPractice = Boolean(formData.profile.practice_name.trim());
    const hasBrand = Boolean(
        logoFile ||
        formData.profile.website_url ||
        formData.profile.overall_voice ||
        formData.profile.primary_brand_pillars
    );
    const canCreate = hasAccount && hasPractice;

    const validateStep = (stepNumber) => {
        setStepError("");
        if (stepNumber === 1) {
            if (!formData.username.trim()) {
                setStepError("Please enter a username for the client account.");
                return false;
            }
            if (!formData.password.trim()) {
                setStepError("Please enter a password for the client account.");
                return false;
            }
            if (!formData.email.trim()) {
                setStepError("Please enter an administrative email address.");
                return false;
            }
        } else if (stepNumber === 2) {
            if (!formData.profile.practice_name.trim()) {
                setStepError("Please enter the practice or brand name.");
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
        // Can always go back
        if (targetStepNumber < currentStep) {
            setStepError("");
            setCurrentStep(targetStepNumber);
            return;
        }
        // If jumping forward, validate prerequisite
        if (targetStepNumber > 1 && !hasAccount) {
            setStepError("Complete the Account credentials before jumping ahead.");
            setCurrentStep(1);
            return;
        }
        if (targetStepNumber > 2 && !hasPractice) {
            setStepError("Enter the Practice Name in Step 2 before jumping ahead.");
            setCurrentStep(2);
            return;
        }
        setStepError("");
        setCurrentStep(targetStepNumber);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setFormError("");
        setStepError("");

        if (!hasAccount) {
            setCurrentStep(1);
            setStepError("Username, password, and email are required to create the client account.");
            return;
        }
        if (!hasPractice) {
            setCurrentStep(2);
            setStepError("Practice name is required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            const payload = {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                profile: {
                    ...formData.profile,
                    contact_email: formData.profile.primary_email || formData.email,
                },
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
                const msg =
                    errorData.error ||
                    errorData.detail ||
                    (errorData.username && `Username: ${errorData.username.join(", ")}`) ||
                    (errorData.email && `Email: ${errorData.email.join(", ")}`) ||
                    "Failed to create client. Please review the fields and try again.";
                setFormError(msg);
            }
        } catch (error) {
            console.error("Network error:", error);
            setFormError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStepDone = (num) => {
        if (num === 1) return hasAccount;
        if (num === 2) return hasPractice;
        if (num === 3) return hasBrand;
        if (num === 4) return canCreate;
        return false;
    };

    return (
        <div className="create-client">
            {/* Header */}
            <header className="cc-header">
                <div className="cc-header__titles">
                    <h1>Create Client</h1>
                    <p>Set up a login and brand profile with our step-by-step guided assistant.</p>
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
                    >
                        <CircleHelp size={16} />
                        Workflow info
                    </button>
                </div>
            </header>

            {/* Workflow Info Overlay */}
            {showLearn && (
                <div className="cc-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        className="cc-learn"
                        role="dialog"
                        aria-labelledby="cc-learn-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cc-learn__head">
                            <div>
                                <h2 id="cc-learn-title">How creating a client works</h2>
                                <p>Fill Account and Practice at minimum. Brand and Voice details help content creators generate accurate posts.</p>
                            </div>
                            <button
                                type="button"
                                className="cc-icon-btn"
                                onClick={() => setShowLearn(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="cc-learn__label">What happens next</p>
                        <div className="cc-destination">
                            <div className="cc-destination__track">
                                <div className="cc-dest" data-stage="login">
                                    <div className="cc-dest__top">
                                        <span className="cc-dest__num">1</span>
                                        <span className="cc-dest__name">Login</span>
                                    </div>
                                    <p className="cc-dest__meaning">The client signs into Lumena with these credentials.</p>
                                </div>
                                <div className="cc-dest" data-stage="profile">
                                    <div className="cc-dest__top">
                                        <span className="cc-dest__num">2</span>
                                        <span className="cc-dest__name">Profile</span>
                                    </div>
                                    <p className="cc-dest__meaning">Brand rules and guidelines are saved on their account.</p>
                                </div>
                                <div className="cc-dest is-landing" data-stage="work">
                                    <div className="cc-dest__top">
                                        <span className="cc-dest__num">3</span>
                                        <span className="cc-dest__name">Content Board</span>
                                    </div>
                                    <p className="cc-dest__meaning">Monthly plans and content requests are created immediately.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Interactive Stepper */}
            <nav className="cc-stepper-nav" aria-label="Creation steps">
                <div className="cc-flow">
                    {STEPS.map((s) => {
                        const done = isStepDone(s.number);
                        const isActive = currentStep === s.number;

                        return (
                            <button
                                key={s.id}
                                type="button"
                                className={[
                                    "cc-flow__step",
                                    done && !isActive ? "is-done" : "",
                                    isActive ? "is-active" : "",
                                    s.number === 4 && canCreate ? "is-ready" : "",
                                ].filter(Boolean).join(" ")}
                                onClick={() => handleStepClick(s.number)}
                            >
                                <div className="cc-flow__top">
                                    <span className="cc-flow__num">
                                        {done && !isActive ? <Check size={12} strokeWidth={3} /> : s.number}
                                    </span>
                                    <span className="cc-flow__name">{s.name}</span>
                                    {isActive && <span className="cc-flow__active-dot" />}
                                </div>
                                <p className="cc-flow__meaning">{s.meaning}</p>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Error banners */}
            {formError && (
                <div className="cc-banner cc-banner--err" role="alert">
                    <div className="cc-banner__content">
                        <ShieldAlert size={18} className="cc-banner__icon" />
                        <div>
                            <h2>Cannot create client</h2>
                            <p>{formError}</p>
                        </div>
                    </div>
                    <button type="button" className="cc-banner__close" onClick={() => setFormError("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {stepError && (
                <div className="cc-banner cc-banner--step-err" role="alert">
                    <div className="cc-banner__content">
                        <ShieldAlert size={16} className="cc-banner__icon" />
                        <p>{stepError}</p>
                    </div>
                    <button type="button" className="cc-banner__close" onClick={() => setStepError("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Wizard Form Container */}
            <form className="cc-wizard-card" onSubmit={handleSubmit}>
                <div className="cc-step-container">

                    {/* STEP 1: ACCOUNT & ACCESS */}
                    {currentStep === 1 && (
                        <div className="cc-step-view cc-step-view--single">
                            <section className="cc-section cc-section--focus">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">1</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Account Credentials</h3>
                                            <span className="cc-badge cc-badge--required">Required</span>
                                        </div>
                                        <p>Set up the username and password the client will use to log in to Lumena.</p>
                                    </div>
                                </div>

                                <div className="cc-grid">
                                    <Field label="Username" htmlFor="cc-username" required>
                                        <input
                                            id="cc-username"
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange("user", "username", e.target.value)}
                                            placeholder="e.g. dr_martinez"
                                            autoComplete="off"
                                            autoFocus
                                        />
                                    </Field>

                                    <Field label="Password" htmlFor="cc-password" required>
                                        <input
                                            id="cc-password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange("user", "password", e.target.value)}
                                            placeholder="••••••••••••"
                                            autoComplete="new-password"
                                        />
                                    </Field>

                                    <Field label="Administrative email" htmlFor="cc-email" required className="cc-span-2">
                                        <input
                                            id="cc-email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("user", "email", e.target.value)}
                                            placeholder="admin@clientpractice.com"
                                        />
                                    </Field>
                                </div>

                                <div className="cc-callout">
                                    <Sparkles size={16} className="cc-callout__icon" />
                                    <p>
                                        These credentials grant access to the Client Portal where they can review proposals, approve creative content, and see monthly plans.
                                    </p>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* STEP 2: PRACTICE & SPECIALTY */}
                    {currentStep === 2 && (
                        <div className="cc-step-view cc-step-view--grid">
                            {/* Card 1: Practice Info */}
                            <section className="cc-section cc-section--focus">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">2A</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Practice Information</h3>
                                            <span className="cc-badge cc-badge--required">Name required</span>
                                        </div>
                                        <p>Who they are and how to reach the practice team.</p>
                                    </div>
                                </div>

                                <div className="cc-stack">
                                    <Field label="Practice / Brand name" htmlFor="cc-practice-name" required>
                                        <input
                                            id="cc-practice-name"
                                            type="text"
                                            value={formData.profile.practice_name}
                                            onChange={(e) => handleInputChange("profile", "practice_name", e.target.value)}
                                            placeholder="e.g. Lumena Health Clinic"
                                            autoFocus
                                        />
                                    </Field>

                                    <div className="cc-grid">
                                        <Field label="Primary contact person" htmlFor="cc-contact">
                                            <input
                                                id="cc-contact"
                                                type="text"
                                                value={formData.profile.primary_contact}
                                                onChange={(e) => handleInputChange("profile", "primary_contact", e.target.value)}
                                                placeholder="Dr. Sofia Rodriguez"
                                            />
                                        </Field>

                                        <Field label="Role / Title" htmlFor="cc-role">
                                            <input
                                                id="cc-role"
                                                type="text"
                                                value={formData.profile.role_title}
                                                onChange={(e) => handleInputChange("profile", "role_title", e.target.value)}
                                                placeholder="Lead Dermatologist / Owner"
                                            />
                                        </Field>

                                        <Field label="Contact email" htmlFor="cc-contact-email">
                                            <input
                                                id="cc-contact-email"
                                                type="email"
                                                value={formData.profile.primary_email}
                                                onChange={(e) => handleInputChange("profile", "primary_email", e.target.value)}
                                                placeholder="contact@practice.com"
                                            />
                                        </Field>

                                        <Field label="Phone number" htmlFor="cc-phone">
                                            <input
                                                id="cc-phone"
                                                type="text"
                                                value={formData.profile.phone}
                                                onChange={(e) => handleInputChange("profile", "phone", e.target.value)}
                                                placeholder="+1 (555) 234-5678"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Practice address" htmlFor="cc-address">
                                        <input
                                            id="cc-address"
                                            type="text"
                                            value={formData.profile.practice_address}
                                            onChange={(e) => handleInputChange("profile", "practice_address", e.target.value)}
                                            placeholder="Suite 400, 123 Health Blvd, Miami, FL"
                                        />
                                    </Field>
                                </div>
                            </section>

                            {/* Card 2: Industry & Patients */}
                            <section className="cc-section">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">2B</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Specialty & Target Patients</h3>
                                            <span className="cc-badge cc-badge--optional">Optional</span>
                                        </div>
                                        <p>Helps content creators craft medically accurate captions.</p>
                                    </div>
                                </div>

                                <div className="cc-stack">
                                    <div className="cc-grid">
                                        <Field label="Medical specialty" htmlFor="cc-specialty">
                                            <input
                                                id="cc-specialty"
                                                type="text"
                                                value={formData.profile.medical_specialty}
                                                onChange={(e) => handleInputChange("profile", "medical_specialty", e.target.value)}
                                                placeholder="e.g. Dermatology"
                                            />
                                        </Field>

                                        <Field label="Sub-specialty" htmlFor="cc-subspecialty">
                                            <input
                                                id="cc-subspecialty"
                                                type="text"
                                                value={formData.profile.sub_specialty}
                                                onChange={(e) => handleInputChange("profile", "sub_specialty", e.target.value)}
                                                placeholder="e.g. Cosmetic & Laser Surgery"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Practice format / type" htmlFor="cc-practice-type">
                                        <select
                                            id="cc-practice-type"
                                            value={formData.profile.practice_type}
                                            onChange={(e) => handleInputChange("profile", "practice_type", e.target.value)}
                                        >
                                            {PRACTICE_TYPES.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Target patient profile" htmlFor="cc-patients">
                                        <textarea
                                            id="cc-patients"
                                            value={formData.profile.target_patient_type}
                                            onChange={(e) => handleInputChange("profile", "target_patient_type", e.target.value)}
                                            placeholder="Age range, lifestyle, primary health concerns, cash-pay vs insurance..."
                                            rows={3}
                                        />
                                    </Field>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* STEP 3: BRAND IDENTITY & VOICE */}
                    {currentStep === 3 && (
                        <div className="cc-step-view cc-step-view--stacked">
                            {/* Card 1: Visual Assets */}
                            <section className="cc-section">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">3A</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Visual Assets & Links</h3>
                                            <span className="cc-badge cc-badge--optional">Optional</span>
                                        </div>
                                        <p>Logo, website and social profiles used for branding content.</p>
                                    </div>
                                </div>

                                <div className="cc-stack">
                                    <div className="cc-grid is-logo">
                                        <label className="cc-logo" htmlFor="cc-logo-input">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo preview" />
                                            ) : (
                                                <Upload size={24} />
                                            )}
                                            <span>{logoPreview ? "Replace logo" : "Upload logo"}</span>
                                            <input
                                                id="cc-logo-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>

                                        <div className="cc-stack">
                                            <Field label="Website URL" htmlFor="cc-website">
                                                <input
                                                    id="cc-website"
                                                    type="url"
                                                    value={formData.profile.website_url}
                                                    onChange={(e) => handleInputChange("profile", "website_url", e.target.value)}
                                                    placeholder="https://practice.com"
                                                />
                                            </Field>
                                            <div className="cc-grid">
                                                <Field label="Brand colors" htmlFor="cc-colors">
                                                    <input
                                                        id="cc-colors"
                                                        type="text"
                                                        value={formData.profile.brand_colors}
                                                        onChange={(e) => handleInputChange("profile", "brand_colors", e.target.value)}
                                                        placeholder="#0F172A, #2563EB"
                                                    />
                                                </Field>
                                                <Field label="Brand typography / fonts" htmlFor="cc-fonts">
                                                    <input
                                                        id="cc-fonts"
                                                        type="text"
                                                        value={formData.profile.brand_fonts}
                                                        onChange={(e) => handleInputChange("profile", "brand_fonts", e.target.value)}
                                                        placeholder="Inter, Playfair"
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    </div>

                                    <Field label="Social media handles / URLs" htmlFor="cc-social">
                                        <input
                                            id="cc-social"
                                            type="text"
                                            value={formData.profile.social_media_links}
                                            onChange={(e) => handleInputChange("profile", "social_media_links", e.target.value)}
                                            placeholder="Instagram: @lumenahealth, TikTok: @drlumena"
                                        />
                                    </Field>
                                </div>
                            </section>

                            {/* Card 2: Voice & Tone + Limits */}
                            <div className="cc-step-view--grid">
                                <section className="cc-section">
                                    <div className="cc-section__label">
                                        <span className="cc-section__num">3B</span>
                                        <div className="cc-section__titles">
                                            <div className="cc-section__title-row">
                                                <h3>Voice & Tone Guidelines</h3>
                                                <span className="cc-badge cc-badge--optional">Optional</span>
                                            </div>
                                            <p>Guides copywriters on style and vocabulary.</p>
                                        </div>
                                    </div>

                                    <div className="cc-stack">
                                        <Field label="Overall brand voice" htmlFor="cc-voice-text">
                                            <input
                                                id="cc-voice-text"
                                                type="text"
                                                value={formData.profile.overall_voice}
                                                onChange={(e) => handleInputChange("profile", "overall_voice", e.target.value)}
                                                placeholder="e.g. Authoritative yet approachable, empathetic"
                                            />
                                        </Field>

                                        <div className="cc-grid is-3">
                                            <Field label="Emojis" htmlFor="cc-emojis">
                                                <select
                                                    id="cc-emojis"
                                                    value={formData.profile.emojis}
                                                    onChange={(e) => handleInputChange("profile", "emojis", e.target.value)}
                                                >
                                                    {["Yes", "No", "Limited"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Humor" htmlFor="cc-humor">
                                                <select
                                                    id="cc-humor"
                                                    value={formData.profile.humor}
                                                    onChange={(e) => handleInputChange("profile", "humor", e.target.value)}
                                                >
                                                    {["Yes", "No", "Subtle"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Formality" htmlFor="cc-formality">
                                                <select
                                                    id="cc-formality"
                                                    value={formData.profile.formality_level}
                                                    onChange={(e) => handleInputChange("profile", "formality_level", e.target.value)}
                                                >
                                                    {["High", "Medium", "Low"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                        </div>

                                        <div className="cc-grid">
                                            <Field label="Key words to use" htmlFor="cc-words-use">
                                                <textarea
                                                    id="cc-words-use"
                                                    value={formData.profile.words_to_use}
                                                    onChange={(e) => handleInputChange("profile", "words_to_use", e.target.value)}
                                                    placeholder="Holistic, evidence-based, care..."
                                                    rows={2}
                                                />
                                            </Field>
                                            <Field label="Words / phrases to avoid" htmlFor="cc-words-avoid">
                                                <textarea
                                                    id="cc-words-avoid"
                                                    value={formData.profile.words_to_avoid}
                                                    onChange={(e) => handleInputChange("profile", "words_to_avoid", e.target.value)}
                                                    placeholder="Miracle cure, guaranteed, cheap..."
                                                    rows={2}
                                                />
                                            </Field>
                                        </div>

                                        <Field label="Brand pillars" htmlFor="cc-pillars-text">
                                            <input
                                                id="cc-pillars-text"
                                                type="text"
                                                value={formData.profile.primary_brand_pillars}
                                                onChange={(e) => handleInputChange("profile", "primary_brand_pillars", e.target.value)}
                                                placeholder="Scientific rigor, patient dignity, preventive wellness"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                {/* Card 3: Compliance & Boundaries */}
                                <section className="cc-section">
                                    <div className="cc-section__label">
                                        <span className="cc-section__num">3C</span>
                                        <div className="cc-section__titles">
                                            <div className="cc-section__title-row">
                                                <h3>Compliance & Limits</h3>
                                                <span className="cc-badge cc-badge--optional">Optional</span>
                                            </div>
                                            <p>Guardrails for HIPAA and clinical content.</p>
                                        </div>
                                    </div>

                                    <div className="cc-stack">
                                        <div className="cc-grid is-3">
                                            <Field label="Faces allowed?" htmlFor="cc-faces">
                                                <select
                                                    id="cc-faces"
                                                    value={formData.profile.faces_allowed}
                                                    onChange={(e) => handleInputChange("profile", "faces_allowed", e.target.value)}
                                                >
                                                    {["Yes", "No"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Testimonials?" htmlFor="cc-testimonials">
                                                <select
                                                    id="cc-testimonials"
                                                    value={formData.profile.testimonials_allowed}
                                                    onChange={(e) => handleInputChange("profile", "testimonials_allowed", e.target.value)}
                                                >
                                                    {["Yes", "No"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Consent form?" htmlFor="cc-consent">
                                                <select
                                                    id="cc-consent"
                                                    value={formData.profile.consent_required}
                                                    onChange={(e) => handleInputChange("profile", "consent_required", e.target.value)}
                                                >
                                                    {["Yes", "No"].map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                        </div>

                                        <Field label="Medical claims / limitations" htmlFor="cc-claims">
                                            <input
                                                id="cc-claims"
                                                type="text"
                                                value={formData.profile.medical_claims_limitations}
                                                onChange={(e) => handleInputChange("profile", "medical_claims_limitations", e.target.value)}
                                                placeholder="e.g. Always include disclaimer, no before/after promises"
                                            />
                                        </Field>

                                        <Field label="Topics to emphasize" htmlFor="cc-topics-yes">
                                            <textarea
                                                id="cc-topics-yes"
                                                value={formData.profile.topics_to_emphasize}
                                                onChange={(e) => handleInputChange("profile", "topics_to_emphasize", e.target.value)}
                                                placeholder="Preventive screening, sun protection, modern therapies..."
                                                rows={2}
                                            />
                                        </Field>

                                        <Field label="Topics to avoid" htmlFor="cc-topics-no">
                                            <textarea
                                                id="cc-topics-no"
                                                value={formData.profile.topics_to_avoid}
                                                onChange={(e) => handleInputChange("profile", "topics_to_avoid", e.target.value)}
                                                placeholder="Specific pricing, invasive surgery details..."
                                                rows={2}
                                            />
                                        </Field>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: GOALS, CHANNELS & REVIEW SUMMARY */}
                    {currentStep === 4 && (
                        <div className="cc-step-view cc-step-view--grid">
                            {/* Card 1: Goals & Communication */}
                            <section className="cc-section">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">4A</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Goals & Communication</h3>
                                            <span className="cc-badge cc-badge--optional">Optional</span>
                                        </div>
                                        <p>Establish success criteria and preferred communication channels.</p>
                                    </div>
                                </div>

                                <div className="cc-stack">
                                    <Field label="Primary growth goal" htmlFor="cc-goal">
                                        <input
                                            id="cc-goal"
                                            type="text"
                                            value={formData.profile.primary_goal}
                                            onChange={(e) => handleInputChange("profile", "primary_goal", e.target.value)}
                                            placeholder="e.g. Increase new patient consult bookings"
                                        />
                                    </Field>

                                    <Field label="Key KPIs to track" htmlFor="cc-kpis">
                                        <input
                                            id="cc-kpis"
                                            type="text"
                                            value={formData.profile.kpis_to_track}
                                            onChange={(e) => handleInputChange("profile", "kpis_to_track", e.target.value)}
                                            placeholder="Engagement rate, website clicks, DM inquiries"
                                        />
                                    </Field>

                                    <Field label="What success looks like" htmlFor="cc-success">
                                        <textarea
                                            id="cc-success"
                                            value={formData.profile.success_looks_like}
                                            onChange={(e) => handleInputChange("profile", "success_looks_like", e.target.value)}
                                            placeholder="Consistently booked Fridays, recognizable regional presence..."
                                            rows={2}
                                        />
                                    </Field>

                                    <div className="cc-grid">
                                        <Field label="Preferred channel" htmlFor="cc-channel">
                                            <select
                                                id="cc-channel"
                                                value={formData.profile.communication_channel}
                                                onChange={(e) => handleInputChange("profile", "communication_channel", e.target.value)}
                                            >
                                                {["Email", "Slack", "Calls"].map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field label="Feedback style" htmlFor="cc-feedback">
                                            <select
                                                id="cc-feedback"
                                                value={formData.profile.feedback_style}
                                                onChange={(e) => handleInputChange("profile", "feedback_style", e.target.value)}
                                            >
                                                {["Written", "Call-based", "Async"].map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            {/* Card 2: Interactive Review Summary */}
                            <section className="cc-section cc-preview-section">
                                <div className="cc-section__label">
                                    <span className="cc-section__num">4B</span>
                                    <div className="cc-section__titles">
                                        <div className="cc-section__title-row">
                                            <h3>Client Summary Preview</h3>
                                            <span className={`cc-badge ${canCreate ? "cc-badge--ready" : "cc-badge--incomplete"}`}>
                                                {canCreate ? "Ready to create" : "Incomplete requirements"}
                                            </span>
                                        </div>
                                        <p>Review the profile before generating client account access.</p>
                                    </div>
                                </div>

                                <div className="cc-preview-card">
                                    <div className="cc-preview-card__header">
                                        <div className="cc-preview-avatar">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Clinic logo preview" />
                                            ) : (
                                                <span>
                                                    {(formData.profile.practice_name || formData.username || "C")
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="cc-preview-titles">
                                            <h4>{formData.profile.practice_name || "Practice Name Not Set"}</h4>
                                            <p>{formData.profile.medical_specialty || "Medical Specialty"} • {formData.profile.practice_type}</p>
                                        </div>
                                    </div>

                                    <div className="cc-preview-details">
                                        <div className="cc-preview-row">
                                            <span className="cc-preview-label">Login Username:</span>
                                            <span className="cc-preview-val font-mono">{formData.username || "—"}</span>
                                        </div>
                                        <div className="cc-preview-row">
                                            <span className="cc-preview-label">Admin Email:</span>
                                            <span className="cc-preview-val">{formData.email || "—"}</span>
                                        </div>
                                        <div className="cc-preview-row">
                                            <span className="cc-preview-label">Primary Contact:</span>
                                            <span className="cc-preview-val">
                                                {formData.profile.primary_contact
                                                    ? `${formData.profile.primary_contact} (${formData.profile.role_title || "Contact"})`
                                                    : "—"}
                                            </span>
                                        </div>
                                        <div className="cc-preview-row">
                                            <span className="cc-preview-label">Tone & Style:</span>
                                            <span className="cc-preview-val">
                                                {formData.profile.overall_voice || "Standard"} (Formality: {formData.profile.formality_level})
                                            </span>
                                        </div>
                                        <div className="cc-preview-row">
                                            <span className="cc-preview-label">Comms Channel:</span>
                                            <span className="cc-preview-val">{formData.profile.communication_channel} ({formData.profile.feedback_style})</span>
                                        </div>
                                    </div>

                                    <div className="cc-preview-notice">
                                        <CheckCircle2 size={16} className="cc-preview-notice__icon" />
                                        <span>Clicking &quot;Confirm &amp; Create Client Profile&quot; will save the account and enable content creation for this client.</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                </div>

                {/* Wizard Footer Controls */}
                <footer className="cc-wizard-footer">
                    <div className="cc-wizard-footer__left">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                className="cc-btn cc-btn--secondary"
                                onClick={handlePrev}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}
                        <span className="cc-wizard-footer__counter">
                            Step {currentStep} of {STEPS.length}
                        </span>
                    </div>

                    <div className="cc-wizard-footer__right">
                        {/* Quick create button when requirements are met earlier */}
                        {canCreate && currentStep < 4 && (
                            <button
                                type="button"
                                className="cc-btn cc-btn--quick"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                title="Create client immediately with current data"
                            >
                                <CheckCircle2 size={16} />
                                {isSubmitting ? "Creating..." : "Quick Create"}
                            </button>
                        )}

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                className="cc-btn cc-btn--primary"
                                onClick={handleNext}
                            >
                                Next Step
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className={`cc-btn cc-btn--primary cc-submit-btn${canCreate ? " is-ready" : ""}`}
                                disabled={isSubmitting}
                            >
                                <CheckCircle2 size={18} />
                                {isSubmitting ? "Creating Client..." : "Confirm & Create Client Profile"}
                            </button>
                        )}
                    </div>
                </footer>
            </form>
        </div>
    );
}
