"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Image as ImageIcon, Layers, Video, Type, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function CreateMonthlyPlanPage() {
    const [clients, setClients] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [assignedUser, setAssignedUser] = useState('');
    const [month, setMonth] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [counts, setCounts] = useState({
        photos: 4,
        carousels: 4,
        videos: 4,
        stories: 4
    });

    const categories = [
        { id: 'photos', label: 'Photos', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'carousels', label: 'Carousels', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { id: 'videos', label: 'Videos', icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
        { id: 'stories', label: 'Stories', icon: Type, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, creatorsRes] = await Promise.all([
                    fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/clients/'),
                    fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/content-creators/')
                ]);

                if (clientsRes.ok) {
                    const data = await clientsRes.json();
                    setClients(data.map(u => ({
                        id: String(u.id),
                        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username,
                    })));
                }

                if (creatorsRes.ok) {
                    const data = await creatorsRes.json();
                    setContentCreators(data.map(u => ({
                        id: String(u.id),
                        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username,
                        role: u.role
                    })));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const adjustCount = (category, delta) => {
        setCounts(prev => ({
            ...prev,
            [category]: Math.max(1, Math.min(20, (prev[category] || 0) + delta))
        }));
    };

    const setExactCount = (category, value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            setCounts(prev => ({
                ...prev,
                [category]: Math.max(1, Math.min(20, num))
            }));
        }
    };

    const totalItems = counts.photos + counts.carousels + counts.videos + counts.stories;

    const handleCreatePlan = async () => {
        if (!selectedClient) {
            alert("Please select a client.");
            return;
        }

        if (!assignedUser) {
            alert("Please assign the request to a team member.");
            return;
        }

        if (!month) {
            alert("Please select a month.");
            return;
        }

        setIsSubmitting(true);

        const notes = [
            instructions,
            '',
            '[Monthly Plan]',
            `Photos: ${counts.photos}`,
            `Carousels: ${counts.carousels}`,
            `Videos: ${counts.videos}`,
            `Stories: ${counts.stories}`,
            `Total: ${totalItems} items`,
        ].filter(Boolean).join('\n');

        const payload = {
            client: selectedClient,
            assigned_to: assignedUser,
            request_type: 'MONTHLY_CONTENT',
            month: month,
            notes: notes,
            status: 'TO_DO'
        };

        try {
            const userId = localStorage.getItem('userId');
            const createUrl = new URL('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/');
            if (userId) createUrl.searchParams.append('user_id', userId);

            const response = await fetch(createUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Monthly plan created successfully! It will appear in Monthly Contents.");
                setSelectedClient('');
                setAssignedUser('');
                setMonth('');
                setInstructions('');
                setCounts({ photos: 4, carousels: 4, videos: 4, stories: 4 });
            } else {
                const err = await response.json();
                console.error("Error creating plan:", err);
                alert("Failed to create monthly plan. Check console.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] min-h-[600px] w-full max-w-[1800px] mx-auto animate-in fade-in zoom-in duration-500 p-6 lg:p-8">
            <div className="flex items-end justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Create Monthly Plan</h1>
                    <p className="text-muted-foreground font-medium">Configure a new monthly content package for a client</p>
                </div>
                <div className="hidden md:block">
                    <span className="px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold border border-primary/10">
                        {totalItems} items
                    </span>
                </div>
            </div>

            <div className="flex-1 bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-8 shadow-2xl shadow-black/5 border border-white/20 dark:border-border relative overflow-hidden flex flex-col lg:flex-row gap-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Left: Category Counters */}
                <div className="lg:w-[35%] xl:w-[32%] flex flex-col gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Content Breakdown</label>
                        <div className="space-y-3">
                            {categories.map(cat => {
                                const Icon = cat.icon;
                                const count = counts[cat.id];
                                return (
                                    <div
                                        key={cat.id}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card hover:border-primary/20 transition-all`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color}`}>
                                                <Icon size={20} />
                                            </div>
                                            <span className="font-bold text-foreground">{cat.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => adjustCount(cat.id, -1)}
                                                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all font-bold"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={count}
                                                onChange={(e) => setExactCount(cat.id, e.target.value)}
                                                className="w-14 text-center bg-input/50 border border-input rounded-lg text-foreground font-bold text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 py-1.5"
                                            />
                                            <button
                                                onClick={() => adjustCount(cat.id, 1)}
                                                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all font-bold"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-auto">
                        <div className="bg-secondary/30 rounded-2xl p-5 border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Items</span>
                                <span className="text-2xl font-black text-foreground">{totalItems}</span>
                            </div>
                            <div className="flex gap-1 mt-3">
                                {categories.map(cat => {
                                    const pct = totalItems > 0 ? Math.round((counts[cat.id] / totalItems) * 100) : 0;
                                    const barColors = {
                                        photos: 'bg-blue-500',
                                        carousels: 'bg-purple-500',
                                        videos: 'bg-pink-500',
                                        stories: 'bg-orange-500',
                                    };
                                    return (
                                        <div
                                            key={cat.id}
                                            className={`h-2 rounded-full ${barColors[cat.id]}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px bg-border my-2"></div>

                {/* Right: Form Fields */}
                <div className="lg:w-[65%] xl:w-[68%] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

                    {/* Instructions */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Instructions</label>
                        <div className="relative group">
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full h-24 px-5 py-4 bg-input/50 border border-input focus:bg-card focus:border-primary rounded-2xl text-foreground placeholder-muted-foreground/50 resize-none outline-none transition-all font-medium shadow-sm"
                                placeholder="Describe the overall requirements for this month's content..."
                            />
                        </div>
                    </div>

                    {/* Client Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Client</label>
                        <div className="relative">
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-5 py-4 pl-12 bg-input/50 border border-input rounded-2xl text-foreground font-bold outline-none focus:border-primary focus:bg-card appearance-none transition-all"
                            >
                                <option value="">Select Client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <Users size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Assign To */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Assign To</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                                <select
                                    value={assignedUser}
                                    onChange={(e) => setAssignedUser(e.target.value)}
                                    className="w-full px-5 py-4 bg-input/50 border border-input rounded-2xl text-foreground font-bold outline-none focus:border-primary focus:bg-card appearance-none transition-all"
                                >
                                    <option value="">Select Team Member...</option>
                                    {contentCreators.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border rounded-2xl">
                                {assignedUser ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                            {contentCreators.find(u => u.id === assignedUser)?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{contentCreators.find(u => u.id === assignedUser)?.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{contentCreators.find(u => u.id === assignedUser)?.role}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground font-medium px-2">No user selected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Date</label>
                        <div className="relative max-w-xs">
                            <input
                                type="date"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-input/50 border border-input rounded-2xl text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 font-bold transition-all"
                            />
                            <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 mt-auto">
                        <button
                            onClick={handleCreatePlan}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-lg shadow-lg shadow-black/10 hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Creating Plan...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Monthly Plan</span>
                                    <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <Plus size={14} strokeWidth={3} />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
