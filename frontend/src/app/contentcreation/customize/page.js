"use client";

import React, { useEffect, useState } from "react";
import {
    Sun,
    Moon,
    Check,
    CircleHelp,
    X,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import "../customize.css";

const THEMES = [
    { name: "Ocean Blue", color: "#3B82F6" },
    { name: "Royal Purple", color: "#8B5CF6" },
    { name: "Emerald Green", color: "#10B981" },
    { name: "Sunset Orange", color: "#F97316" },
    { name: "Crimson Red", color: "#EF4444" },
    { name: "Slate Grey", color: "#64748B" },
];

const FONT_SIZES = ["small", "medium", "large"];

const DENSITY = [
    { id: "comfortable", label: "Comfortable", meaning: "Default spacing", bars: 2, barClass: "" },
    { id: "compact", label: "Compact", meaning: "Tighter rows and cards", bars: 3, barClass: " is-compact" },
    { id: "relaxed", label: "Relaxed", meaning: "More room between items", bars: 2, barClass: " is-relaxed" },
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

export default function CustomizePage() {
    const {
        primaryColor,
        isDarkMode,
        fontSize,
        density,
        requireQAReview,
        updateSettings,
    } = useTheme();

    const [isSuperuser, setIsSuperuser] = useState(false);
    const [showLearn, setShowLearn] = useState(false);
    const [activeSection, setActiveSection] = useState("color");

    useEffect(() => {
        setIsSuperuser(localStorage.getItem("userRole") === "SUPERUSER");
    }, []);

    const flowSteps = [
        { id: "color", number: 1, name: "Color", meaning: "Accent used on buttons and highlights" },
        { id: "look", number: 2, name: "Look", meaning: "Light or dark, and how large text is" },
        { id: "space", number: 3, name: "Space", meaning: "Comfortable, compact, or relaxed" },
        ...(isSuperuser
            ? [{ id: "review", number: 4, name: "Review", meaning: "Whether monthly content goes through QA" }]
            : []),
    ];

    const landingStage = requireQAReview ? "QA" : "CLIENT_REVIEW";
    const fontIndex = FONT_SIZES.indexOf(fontSize) + 1 || 2;

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        setActiveSection(stepId);
        window.setTimeout(() => {
            document.getElementById(`sp-${stepId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
    };

    return (
        <div className="site-personalize">
            <header className="sp-header">
                <div className="sp-header__titles">
                    <h1>Site Personalization</h1>
                    <p>Tune how the workspace looks on this browser. The QA toggle saves for the whole team.</p>
                </div>
                <div className="sp-header__actions">
                    <span className="sp-chip">
                        <span className="sp-chip__dot" />
                        Saves here
                    </span>
                    {isSuperuser && (
                        <span className="sp-chip">
                            <span className={`sp-chip__dot${requireQAReview ? " is-qa" : " is-client"}`} />
                            Monthly content goes to {requireQAReview ? "QA" : "Client Review"} for everyone
                        </span>
                    )}
                    <button
                        type="button"
                        className={`sp-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="sp-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                </div>
            </header>

            {showLearn && (
                <div className="sp-learn-overlay" onClick={() => setShowLearn(false)}>
                    <div
                        id="sp-learn-panel"
                        className="sp-learn"
                        role="dialog"
                        aria-labelledby="sp-learn-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sp-learn__head">
                            <div>
                                <h2 id="sp-learn-title">How personalization works</h2>
                                <p>These choices stay on this device. The QA setting changes where monthly content goes next on the Content Board.</p>
                            </div>
                            <button type="button" className="sp-icon-btn" onClick={() => setShowLearn(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="sp-learn__label">On this page</p>
                        <nav className={`sp-flow${isSuperuser ? "" : " is-three"}`} aria-label="Personalization steps">
                            {flowSteps.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`sp-flow__step${activeSection === s.id ? " is-active" : ""}`}
                                    onClick={() => handleFlowClick(s.id)}
                                >
                                    <div className="sp-flow__top">
                                        <span className="sp-flow__num">{s.number}</span>
                                        <span className="sp-flow__name">{s.name}</span>
                                    </div>
                                    <p className="sp-flow__meaning">{s.meaning}</p>
                                </button>
                            ))}
                        </nav>
                        {isSuperuser && (
                            <div className="sp-destination">
                                <p className="sp-destination__label">Monthly content pipeline</p>
                                <div className="sp-destination__track">
                                    {PIPELINE_STAGES.map((stage) => {
                                        const isLanding = stage.id === landingStage;
                                        return (
                                            <div
                                                key={stage.id}
                                                className={`sp-dest${isLanding ? " is-landing" : ""}`}
                                                data-stage={stage.id}
                                            >
                                                <div className="sp-dest__top">
                                                    <span className="sp-dest__num">{stage.number}</span>
                                                    <span className="sp-dest__name">{stage.name}</span>
                                                </div>
                                                <p className="sp-dest__meaning">
                                                    {isLanding
                                                        ? (requireQAReview ? "Lands here when QA is on" : "Lands here when QA is off")
                                                        : stage.meaning}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="sp-card">
                <section
                    id="sp-color"
                    className={`sp-section${activeSection === "color" ? " is-active" : ""}`}
                >
                    <div className="sp-section__label">
                        <span className="sp-section__num">1</span>
                        <div>
                            <h3>Color</h3>
                            <p>Primary accent for buttons, chips, and selected states.</p>
                        </div>
                    </div>
                    <div className="sp-swatches">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.color}
                                type="button"
                                className={`sp-swatch${primaryColor === theme.color ? " is-on" : ""}`}
                                onClick={() => {
                                    setActiveSection("color");
                                    updateSettings({ primaryColor: theme.color });
                                }}
                            >
                                <span className="sp-swatch__dot" style={{ background: theme.color }}>
                                    {primaryColor === theme.color && <Check size={16} />}
                                </span>
                                <span>{theme.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className="sp-preview">
                        <p className="sp-preview__label">Live preview</p>
                        <div className="sp-preview__row">
                            <button type="button" className="sp-btn sp-btn--primary">Primary button</button>
                            <button type="button" className="sp-btn sp-btn--ghost">Secondary button</button>
                            <span className="sp-chip">
                                <span className="sp-chip__dot" />
                                Accent chip
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    id="sp-look"
                    className={`sp-section${activeSection === "look" ? " is-active" : ""}`}
                >
                    <div className="sp-section__label">
                        <span className="sp-section__num">2</span>
                        <div>
                            <h3>Look</h3>
                            <p>Light or dark, plus how large the text is.</p>
                        </div>
                    </div>
                    <div className="sp-look-grid">
                        <div className="sp-field">
                            <label>Appearance</label>
                            <div className="sp-segment">
                                <button
                                    type="button"
                                    className={!isDarkMode ? "is-on" : ""}
                                    onClick={() => {
                                        setActiveSection("look");
                                        updateSettings({ isDarkMode: false });
                                    }}
                                >
                                    <Sun size={16} />
                                    Light
                                </button>
                                <button
                                    type="button"
                                    className={isDarkMode ? "is-on" : ""}
                                    onClick={() => {
                                        setActiveSection("look");
                                        updateSettings({ isDarkMode: true });
                                    }}
                                >
                                    <Moon size={16} />
                                    Dark
                                </button>
                            </div>
                        </div>
                        <div className="sp-field">
                            <label htmlFor="sp-font-size">Font size</label>
                            <input
                                id="sp-font-size"
                                className="sp-range"
                                type="range"
                                min="1"
                                max="3"
                                step="1"
                                value={fontIndex}
                                onChange={(e) => {
                                    setActiveSection("look");
                                    updateSettings({ fontSize: FONT_SIZES[parseInt(e.target.value, 10) - 1] });
                                }}
                            />
                            <div className="sp-range-labels">
                                {FONT_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={fontSize === size ? "is-on" : ""}
                                        onClick={() => {
                                            setActiveSection("look");
                                            updateSettings({ fontSize: size });
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="sp-space"
                    className={`sp-section${activeSection === "space" ? " is-active" : ""}`}
                >
                    <div className="sp-section__label">
                        <span className="sp-section__num">3</span>
                        <div>
                            <h3>Space</h3>
                            <p>How tight or open the interface feels.</p>
                        </div>
                    </div>
                    <div className="sp-density">
                        {DENSITY.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className={`sp-density__opt${density === opt.id ? " is-on" : ""}`}
                                onClick={() => {
                                    setActiveSection("space");
                                    updateSettings({ density: opt.id });
                                }}
                            >
                                <div className={`sp-density__bars${opt.barClass}`}>
                                    {Array.from({ length: opt.bars }).map((_, i) => (
                                        <span key={i} className="sp-density__bar" />
                                    ))}
                                </div>
                                <strong>{opt.label}</strong>
                                <span>{opt.meaning}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {isSuperuser && (
                    <section
                        id="sp-review"
                        className={`sp-section${activeSection === "review" ? " is-active" : ""}`}
                    >
                        <div className="sp-review">
                            <div className="sp-section__label">
                                <span className="sp-section__num">4</span>
                                <div>
                                    <h3>Review</h3>
                                    <p>
                                        {requireQAReview
                                            ? "Monthly content must pass QA before Client Review."
                                            : "Monthly content goes straight to Client Review when it is finished."}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className={`sp-switch${requireQAReview ? " is-on" : ""}`}
                                onClick={() => {
                                    setActiveSection("review");
                                    updateSettings({ requireQAReview: !requireQAReview });
                                }}
                                aria-pressed={requireQAReview}
                                aria-label="Require QA review for monthly content"
                            >
                                <span className="sp-switch__knob" />
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
