"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE, installApiSession } from "../apiSession";

const ThemeContext = createContext();

const DEFAULT_SETTINGS = {
    primaryColor: "#3B82F6",
    isDarkMode: false,
    fontSize: "medium",
    density: "comfortable",
    borderRadius: "rounded-3xl",
    requireQAReview: false,
};

function browserSettingsOnly(settings) {
    const { requireQAReview, ...rest } = settings;
    return rest;
}

export function ThemeProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        installApiSession();
        const saved = localStorage.getItem("lumena_customization");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const { requireQAReview, ...browserSaved } = parsed;
                setSettings((prev) => ({ ...prev, ...browserSaved }));
            } catch (e) {
                console.error("Failed to parse customization settings", e);
            }
        }

        fetch(`${API_BASE}/contents/pipeline-settings/`)
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (data && typeof data.require_qa_review === "boolean") {
                    setSettings((prev) => ({
                        ...prev,
                        requireQAReview: data.require_qa_review,
                    }));
                }
            })
            .catch((error) => {
                console.error("Failed to load pipeline settings", error);
            })
            .finally(() => setMounted(true));
    }, []);

    useEffect(() => {
        if (!mounted) return;

        localStorage.setItem("lumena_customization", JSON.stringify(browserSettingsOnly(settings)));

        const root = document.documentElement;

        if (settings.isDarkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        root.style.setProperty("--primary", settings.primaryColor);

        let fontSizeVal = "100%";
        if (settings.fontSize === "small") fontSizeVal = "87.5%";
        if (settings.fontSize === "large") fontSizeVal = "112.5%";
        root.style.fontSize = fontSizeVal;

        const radiusMap = {
            "rounded-none": "0px",
            "rounded-sm": "0.125rem",
            rounded: "0.25rem",
            "rounded-md": "0.375rem",
            "rounded-lg": "0.5rem",
            "rounded-xl": "0.75rem",
            "rounded-2xl": "1rem",
            "rounded-3xl": "1.5rem",
            "rounded-full": "9999px",
        };
        if (radiusMap[settings.borderRadius]) {
            root.style.setProperty("--radius", radiusMap[settings.borderRadius]);
        }

        root.setAttribute("data-density", settings.density);
    }, [settings, mounted]);

    const persistPipelineSettings = async (requireQAReview) => {
        try {
            const response = await fetch(`${API_BASE}/contents/pipeline-settings/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ require_qa_review: requireQAReview }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Could not save pipeline settings.");
            }
            const data = await response.json();
            setSettings((prev) => ({
                ...prev,
                requireQAReview: Boolean(data.require_qa_review),
            }));
        } catch (error) {
            console.error("Failed to save pipeline settings", error);
            fetch(`${API_BASE}/contents/pipeline-settings/`)
                .then((response) => (response.ok ? response.json() : null))
                .then((data) => {
                    if (data && typeof data.require_qa_review === "boolean") {
                        setSettings((prev) => ({
                            ...prev,
                            requireQAReview: data.require_qa_review,
                        }));
                    }
                })
                .catch(() => {});
        }
    };

    const updateSettings = (newSettings) => {
        const shouldPersistQA = (
            Object.prototype.hasOwnProperty.call(newSettings, "requireQAReview")
            && newSettings.requireQAReview !== settings.requireQAReview
        );
        setSettings((prev) => ({ ...prev, ...newSettings }));
        if (shouldPersistQA) {
            persistPipelineSettings(Boolean(newSettings.requireQAReview));
        }
    };

    return (
        <ThemeContext.Provider value={{ ...settings, updateSettings }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
