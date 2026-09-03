"use client";

import React, { useEffect, useState } from "react";
import {
    Sun,
    Moon,
    CircleHelp,
    X,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import "../customize.css";

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
        isDarkMode,
        requireQAReview,
        updateSettings,
    } = useTheme();

    const [isSuperuser] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("userRole") === "SUPERUSER";
    });
    const [showLearn, setShowLearn] = useState(false);

    const landingStage = requireQAReview ? "QA" : "CLIENT_REVIEW";

    return (
        <div className="site-personalize">
            <header className="sp-header">
                <div className="sp-header__titles">
                    <h1>Appearance & Settings</h1>
                    <p>Switch between Light and Dark mode for your workspace. Theme colors remain cohesive and pastel.</p>
                </div>
                <div className="sp-header__actions">
                    <span className="sp-chip sp-chip--mint">
                        <span className="sp-chip__dot" />
                        Saves automatically
                    </span>
                    {isSuperuser && (
                        <span className={`sp-chip${requireQAReview ? " sp-chip--lavender" : " sp-chip--sky"}`}>
                            <span className={`sp-chip__dot${requireQAReview ? " is-qa" : " is-client"}`} />
                            Monthly content goes to {requireQAReview ? "QA" : "Client Review"}
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
                                <p>Light and dark mode preferences stay saved on this device. Colors and card styling are unified for consistency across the entire app.</p>
                            </div>
                            <button type="button" className="sp-icon-btn" onClick={() => setShowLearn(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
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
                <section id="sp-look" className="sp-section is-active">
                    <div className="sp-section__label">
                        <span className="sp-section__num">1</span>
                        <div>
                            <h3>Theme Mode</h3>
                            <p>Choose between Light Mode (crisp off-white & soft pastels) and Dark Mode (deep matte dark & vibrant pastels).</p>
                        </div>
                    </div>
                    <div className="sp-look-grid" style={{ gridTemplateColumns: "1fr", maxWidth: "24rem" }}>
                        <div className="sp-field">
                            <label>Appearance</label>
                            <div className="sp-segment">
                                <button
                                    type="button"
                                    className={!isDarkMode ? "is-on" : ""}
                                    onClick={() => updateSettings({ isDarkMode: false })}
                                >
                                    <Sun size={16} />
                                    Light
                                </button>
                                <button
                                    type="button"
                                    className={isDarkMode ? "is-on" : ""}
                                    onClick={() => updateSettings({ isDarkMode: true })}
                                >
                                    <Moon size={16} />
                                    Dark
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {isSuperuser && (
                    <section id="sp-review" className={`sp-section${requireQAReview ? " is-qa-on" : ""}`}>
                        <div className="sp-review">
                            <div className="sp-section__label">
                                <span className="sp-section__num">2</span>
                                <div>
                                    <h3>QA Review</h3>
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
                                onClick={() => updateSettings({ requireQAReview: !requireQAReview })}
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
