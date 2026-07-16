"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Default State
    const [settings, setSettings] = useState({
        primaryColor: "#3B82F6",
        isDarkMode: false,
        fontSize: "medium",
        density: "comfortable",
        borderRadius: "rounded-3xl",
        requireQAReview: false,
    });

    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("lumena_customization");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse customization settings", e);
            }
        }
        setMounted(true);
    }, []);

    // Apply changes to the document
    useEffect(() => {
        if (!mounted) return;

        // Save to localStorage
        localStorage.setItem("lumena_customization", JSON.stringify(settings));

        const root = document.documentElement;

        // 1. Dark Mode
        if (settings.isDarkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // 2. Primary Color
        // We update the CSS variable --primary. 
        // Note: globals.css uses oklch, but we can try setting hex. 
        // Ideally we would convert to oklch if that's what the system strictly expects, 
        // but often plain colors work if the variable is just consumed as a color.
        // However, tailwind config in globals.css maps --color-primary: var(--primary).
        // Let's try setting it. Hex works in most browsers for var() usage.
        root.style.setProperty("--primary", settings.primaryColor);

        // 3. Font Size
        // We can set a base font-size on the root 
        // small -> 14px, medium -> 16px, large -> 18px (User preference)
        // Or use Tailwind classes if we can dynamically remove old ones.
        // Simpler: set style fontSize.
        // But 'rem' calculations depend on root font size. 
        // Standard is 16px (100%).
        let fontSizeVal = "100%"; // medium
        if (settings.fontSize === "small") fontSizeVal = "87.5%"; // 14px
        if (settings.fontSize === "large") fontSizeVal = "112.5%"; // 18px
        root.style.fontSize = fontSizeVal;

        // 4. Border Radius
        // Mapped from 'rounded-3xl' etc to pixels if we want global effect
        // 'rounded-3xl' is 1.5rem (24px).
        // The CustomizePage uses classes like 'rounded-3xl'.
        // globals.css uses --radius variable (default 0.625rem ~ 10px).
        // Let's map the chosen class to a radius value.
        const radiusMap = {
            "rounded-none": "0px",
            "rounded-sm": "0.125rem",
            "rounded": "0.25rem",
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

        // 5. Density
        // This is harder to apply globally without specific CSS support.
        // We can add a data attribute.
        root.setAttribute("data-density", settings.density);

    }, [settings, mounted]);

    const updateSettings = (newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
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
