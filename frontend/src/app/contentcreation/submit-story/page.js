"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Type, Image as ImageIcon, Layers, Video, Users, Search, X, Check } from 'lucide-react';

export default function SubmitStoryPage() {
    const [contentType, setContentType] = useState('story');
    const [assignedUser, setAssignedUser] = useState('');
    const [instructions, setInstructions] = useState('');

    const [teamMembers, setTeamMembers] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [postDate, setPostDate] = useState('');

    // Gallery image search states
    const [showFolioSearch, setShowFolioSearch] = useState(false);
    const [folioSearch, setFolioSearch] = useState('');
    const [searchedImage, setSearchedImage] = useState(null);
    const [folioSearchLoading, setFolioSearchLoading] = useState(false);
    const [folioSearchError, setFolioSearchError] = useState(null);

    useEffect(() => {
        const fetchContentCreators = async () => {
            try {
                const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/users/content-creators/');
                if (response.ok) {
                    const data = await response.json();
                    const formattedMembers = data.map(user => ({
                        id: String(user.id),
                        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username,
                        role: user.role
                    }));
                    setTeamMembers(formattedMembers);
                } else {
                    console.error('Failed to fetch content creators');
                }
            } catch (error) {
                console.error('Error fetching content creators:', error);
            }
        };

        const fetchClients = async () => {
            try {
                const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/users/clients/');
                if (response.ok) {
                    const data = await response.json();
                    const formattedClients = data.map(user => ({
                        id: String(user.id),
                        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username,
                    }));
                    setClients(formattedClients);
                } else {
                    console.error('Failed to fetch clients');
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };

        fetchContentCreators();
        fetchClients();
    }, []);

    const contentTypes = [
        { id: 'story', label: 'Story', icon: Type, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'carousel', label: 'Carousel', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { id: 'video', label: 'Video', icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    ];

    const handleSearchByFolio = async () => {
        if (!folioSearch.trim()) {
            setFolioSearchError('Please enter a folio number');
            return;
        }

        setFolioSearchLoading(true);
        setFolioSearchError(null);
        setSearchedImage(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/gallery/images/search/?folio=${folioSearch.trim()}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setSearchedImage(data);
                setFolioSearchError(null);
            } else {
                const errorData = await response.json();
                setFolioSearchError(errorData.error || 'Image not found');
                setSearchedImage(null);
            }
        } catch (error) {
            console.error('Error searching image:', error);
            setFolioSearchError('Failed to search image');
            setSearchedImage(null);
        } finally {
            setFolioSearchLoading(false);
        }
    };

    const handleClearGalleryImage = () => {
        setSearchedImage(null);
        setFolioSearch('');
        setFolioSearchError(null);
    };

    const getMediaTypeForContentType = (ct) => {
        const map = {
            story: 'STORY',
            image: 'IMAGE',
            carousel: 'CAROUSEL_IMAGE',
            video: 'VIDEO',
        };
        return map[ct] || 'IMAGE';
    };

    const handleCreateRequest = async () => {
        if (!assignedUser) {
            alert("Please assign the request to a team member.");
            return;
        }

        if (!selectedClient) {
            alert("Please select a client.");
            return;
        }

        const contentItems = [];
        if (searchedImage) {
            contentItems.push({
                media_type: getMediaTypeForContentType(contentType),
                order: 0,
                gallery_image: searchedImage.id,
            });
        }
        let metaNotes = `[Meta]\nContent Type: ${contentType}\nPost Date: ${postDate}`;
        if (searchedImage) {
            metaNotes += `\nGallery Image: ${searchedImage.folio} - ${searchedImage.title}`;
        }

        const payload = {
            client: selectedClient,
            assigned_to: assignedUser,
            request_type: 'CONTENT_REQUEST',
            month: dueDate || new Date().toISOString().split('T')[0],
            linked_image: searchedImage ? searchedImage.id : null,
            content_items: contentItems.length > 0 ? contentItems : undefined,
            notes: `${instructions}\n\n${metaNotes}`,
            status: 'TO_DO'
        };

        try {
            const userId = localStorage.getItem('userId');
            const createUrl = new URL((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/contents/monthly-requests/');
            if (userId) createUrl.searchParams.append('user_id', userId);

            const response = await fetch(createUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Request created successfully! It has been assigned.");
                setInstructions('');
                setAssignedUser('');
                setSelectedClient('');
                setDueDate('');
                setPostDate('');
                setSearchedImage(null);
                setFolioSearch('');
                setFolioSearchError(null);
            } else {
                const err = await response.json();
                console.error("Error creating request:", err);
                alert("Failed to create request. Check console.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error.");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] min-h-[600px] w-full max-w-[1800px] mx-auto animate-in fade-in zoom-in duration-500 p-6 lg:p-8">
            {/* Header - Compact */}
            <div className="flex items-end justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">New Request</h1>
                    <p className="text-muted-foreground font-medium">Create a task for the content team</p>
                </div>
                <div className="hidden md:block">
                    <span className="px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold border border-primary/10">
                        Draft Mode
                    </span>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-8 shadow-2xl shadow-black/5 border border-white/20 dark:border-border relative overflow-hidden flex flex-col lg:flex-row gap-8">

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Left Column: Selection */}
                <div className="lg:w-[30%] xl:w-[28%] flex flex-col gap-6">
                    <div className="space-y-4 flex-1">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Content Type</label>
                        <div className="grid grid-cols-2 gap-3 h-full max-h-[400px]">
                            {contentTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = contentType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setContentType(type.id)}
                                        className={`
                                            relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 group
                                            ${isSelected
                                                ? 'border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]'
                                                : 'border-border bg-card hover:border-primary/20 hover:bg-muted/50 text-muted-foreground hover:text-primary'}
                                        `}
                                    >
                                        <div className={`
                                            p-3 rounded-2xl transition-all duration-300
                                            ${isSelected ? 'bg-white/20 text-white' : type.bg + ' ' + type.color}
                                        `}>
                                            <Icon size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="font-bold text-sm tracking-wide">{type.label}</span>
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setShowFolioSearch(true)}
                            className="w-full group flex items-center justify-between p-4 bg-muted/30 hover:bg-card border border-border hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    {searchedImage ? <Check size={20} /> : <Plus size={20} />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-foreground group-hover:text-primary transition-colors">
                                        {searchedImage ? `Linked: ${searchedImage.folio}` : 'Link Photo ID'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {searchedImage ? searchedImage.title : 'Search from gallery'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden lg:block w-px bg-border my-2"></div>

                {/* Right Column: Form */}
                <div className="lg:w-[70%] xl:w-[72%] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

                    {/* Instructions */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Instructions</label>
                        <div className="relative group">
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full h-24 px-5 py-4 bg-input/50 border border-input focus:bg-card focus:border-primary rounded-2xl text-foreground placeholder-muted-foreground/50 resize-none outline-none transition-all font-medium shadow-sm"
                                placeholder="Describe the requirements for this content piece..."
                            ></textarea>
                            <div className="absolute bottom-3 right-4">
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">MD</span>
                            </div>
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
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Plus size={16} className="rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Assigned To - New Section */}
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
                                    {teamMembers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                    <Plus size={16} className="rotate-45" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border rounded-2xl">
                                {assignedUser ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                            {teamMembers.find(u => u.id === assignedUser)?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{teamMembers.find(u => u.id === assignedUser)?.name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{teamMembers.find(u => u.id === assignedUser)?.role}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground font-medium px-2">No user selected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-input/50 border border-input rounded-xl text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 font-bold text-sm transition-all"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 flex items-center justify-between">
                                <span>Post Date</span>
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Optional</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={postDate}
                                    onChange={(e) => setPostDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-input/50 border border-input rounded-xl text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 font-bold text-sm transition-all"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleCreateRequest}
                            className="w-full py-4 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-lg shadow-lg shadow-black/10 hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Create Request</span>
                            <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        </button>
                    </div>

                </div>
            </div>

            {/* Folio Search Modal */}
            {showFolioSearch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-2xl w-full animate-in zoom-in duration-300 border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">Link Gallery Image</h3>
                                <p className="text-sm text-muted-foreground mt-1">Search by folio number (e.g., C5F12-001)</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowFolioSearch(false);
                                    setFolioSearchError(null);
                                }}
                                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="mb-6">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input
                                        type="text"
                                        value={folioSearch}
                                        onChange={(e) => setFolioSearch(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearchByFolio()}
                                        placeholder="Enter folio number..."
                                        className="w-full pl-12 pr-4 py-4 border-2 border-border bg-input/50 rounded-2xl text-foreground font-bold outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSearchByFolio}
                                    disabled={folioSearchLoading}
                                    className="px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {folioSearchLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {folioSearchError && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm text-red-500 font-medium">{folioSearchError}</p>
                                </div>
                            )}
                        </div>

                        {/* Search Result */}
                        {searchedImage && (
                            <div className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={searchedImage.image_url}
                                        alt={searchedImage.title}
                                        className="w-32 h-32 object-cover rounded-xl border-2 border-background shadow-lg"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">{searchedImage.folio}</p>
                                                <h4 className="text-lg font-bold text-foreground mb-1">{searchedImage.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Uploaded {new Date(searchedImage.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleClearGalleryImage}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => setShowFolioSearch(false)}
                                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} />
                                                Confirm & Attach
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!searchedImage && !folioSearchError && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                                <ImageIcon size={48} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                                <p className="text-muted-foreground font-medium">Enter a folio number to search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
