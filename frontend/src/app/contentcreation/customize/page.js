"use client";

import React, { useState, useEffect } from "react";
import { Palette, Sun, Moon, Type, Layout, Check, Shield } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

export default function CustomizePage() {
    const {
        primaryColor,
        isDarkMode,
        fontSize,
        density,
        borderRadius,
        requireQAReview,
        updateSettings
    } = useTheme();

    const [userRole, setUserRole] = useState('GUEST');

    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || 'GUEST');
    }, []);

    const themes = [
        { name: "Ocean Blue", color: "#3B82F6", class: "bg-blue-500" },
        { name: "Royal Purple", color: "#8B5CF6", class: "bg-purple-500" },
        { name: "Emerald Green", color: "#10B981", class: "bg-emerald-500" },
        { name: "Sunset Orange", color: "#F97316", class: "bg-orange-500" },
        { name: "Crimson Red", color: "#EF4444", class: "bg-red-500" },
        { name: "Slate Grey", color: "#64748B", class: "bg-slate-500" },
    ];

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className={`bg-secondary ${borderRadius} p-8 flex flex-col h-[85vh] min-h-0 mx-0 relative overflow-hidden transition-all duration-300`}>

                {/* Header */}
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Palette className="text-primary" size={32} />
                        Site Personalization
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Customize the visual appearance of your workspace. Changes are saved automatically to your browser.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-8 pb-10">

                    {/* Theme Color Section */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Palette size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Theme Color</h2>
                                <p className="text-xs text-muted-foreground">Select your primary accent color</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {themes.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => updateSettings({ primaryColor: theme.color })}
                                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${primaryColor === theme.color ? 'border-foreground bg-muted' : 'border-transparent hover:bg-muted'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full shadow-md ${theme.class} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        {primaryColor === theme.color && <Check className="text-white" size={24} />}
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground">{theme.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Preview Block */}
                        <div className="mt-6 p-4 rounded-xl bg-muted border border-border">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Live Preview</span>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 rounded-lg text-primary-foreground font-medium shadow-lg transition-colors" style={{ backgroundColor: primaryColor }}>
                                    Primary Button
                                </button>
                                <button className="px-4 py-2 rounded-lg bg-card border border-border font-medium shadow-sm" style={{ color: primaryColor }}>
                                    Secondary Button
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Mode Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Sun size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Appearance</h2>
                                    <p className="text-xs text-muted-foreground">Light or Dark mode</p>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-muted p-1.5 rounded-xl">
                                <button
                                    onClick={() => updateSettings({ isDarkMode: false })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${!isDarkMode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Sun size={16} />
                                    Light
                                </button>
                                <button
                                    onClick={() => updateSettings({ isDarkMode: true })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${isDarkMode ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Moon size={16} />
                                    Dark
                                </button>
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400">
                                    <Type size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Font Size</h2>
                                    <p className="text-xs text-muted-foreground">Adjust text readability</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="1"
                                    value={fontSize === 'small' ? 1 : fontSize === 'medium' ? 2 : 3}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        updateSettings({ fontSize: val === 1 ? 'small' : val === 2 ? 'medium' : 'large' });
                                    }}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                    <span>Small</span>
                                    <span>Medium</span>
                                    <span>Large</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layout Density Section */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Layout size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Interface Density</h2>
                                <p className="text-xs text-muted-foreground">Adjust spacing and layout compactness</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => updateSettings({ density: 'comfortable' })}
                                className={`flex flex-col items-center p-4 border rounded-xl transition-all ${density === 'comfortable' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="space-y-2 w-full mb-3 opacity-60">
                                    <div className="h-2 w-3/4 bg-muted-foreground/30 rounded-full"></div>
                                    <div className="h-2 w-1/2 bg-muted-foreground/30 rounded-full"></div>
                                </div>
                                <span className="text-sm font-bold text-foreground">Comfortable</span>
                            </button>

                            <button
                                onClick={() => updateSettings({ density: 'compact' })}
                                className={`flex flex-col items-center p-4 border rounded-xl transition-all ${density === 'compact' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="space-y-1 w-full mb-3 opacity-60">
                                    <div className="h-2 w-3/4 bg-muted-foreground/30 rounded-full"></div>
                                    <div className="h-2 w-1/2 bg-muted-foreground/30 rounded-full"></div>
                                    <div className="h-2 w-3/4 bg-muted-foreground/30 rounded-full"></div>
                                </div>
                                <span className="text-sm font-bold text-foreground">Compact</span>
                            </button>

                            <button
                                onClick={() => updateSettings({ density: 'relaxed' })}
                                className={`flex flex-col items-center p-4 border rounded-xl transition-all ${density === 'relaxed' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                            >
                                <div className="space-y-4 w-full mb-3 opacity-60">
                                    <div className="h-2 w-3/4 bg-muted-foreground/30 rounded-full"></div>
                                    <div className="h-2 w-1/2 bg-muted-foreground/30 rounded-full"></div>
                                </div>
                                <span className="text-sm font-bold text-foreground">Relaxed</span>
                            </button>
                        </div>
                    </div>

                    {/* QA Review Toggle - Only visible to SUPERUSER */}
                    {userRole === 'SUPERUSER' && (
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Monthly Content QA Review</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {requireQAReview
                                                ? 'Content must pass through QA before Client Review'
                                                : 'Content goes directly to Client Review after completion'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateSettings({ requireQAReview: !requireQAReview })}
                                    className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                                        requireQAReview ? 'bg-primary' : 'bg-muted-foreground/30'
                                    }`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                                        requireQAReview ? 'left-9' : 'left-1'
                                    }`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
