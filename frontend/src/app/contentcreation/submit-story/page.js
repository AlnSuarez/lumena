"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Plus, Calendar, Type, Image as ImageIcon, Layers, Video, Users, Search, X, Check } from 'lucide-react';

export default function SubmitStoryPage() {
    const [contentType, setContentType] = useState('story');
    const [assignedUser, setAssignedUser] = useState('');
    const [instructions, setInstructions] = useState('');

    const [teamMembers, setTeamMembers] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [postDate, setPostDate] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);

    // Gallery image search states
    const [showFolioSearch, setShowFolioSearch] = useState(false);
    const [folioSearch, setFolioSearch] = useState('');
    const [searchedImage, setSearchedImage] = useState(null);
    const [folioSearchLoading, setFolioSearchLoading] = useState(false);
    const [folioSearchError, setFolioSearchError] = useState(null);

    useEffect(() => {
        const fetchContentCreators = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/users/content-creators/');
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
                const response = await fetch('http://localhost:8000/api/users/clients/');
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
        { id: 'story', label: 'Story', icon: Type, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'carousel', label: 'Carousel', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'video', label: 'Video', icon: Video, color: 'text-pink-500', bg: 'bg-pink-50' },
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentPreview(URL.createObjectURL(file));
            // Clear gallery image if file is uploaded
            setSearchedImage(null);
        }
    };

    const handleSearchByFolio = async () => {
        if (!folioSearch.trim()) {
            setFolioSearchError('Please enter a folio number');
            return;
        }

        setFolioSearchLoading(true);
        setFolioSearchError(null);
        setSearchedImage(null);

        try {
            const response = await fetch(`http://localhost:8000/api/gallery/images/search/?folio=${folioSearch.trim()}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setSearchedImage(data);
                setFolioSearchError(null);
                // Clear file upload if gallery image is selected
                setAttachment(null);
                setAttachmentPreview(null);
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

    const handleCreateRequest = async () => {
        if (!assignedUser) {
            alert("Please assign the request to a team member.");
            return;
        }

        if (!selectedClient) {
            alert("Please select a client.");
            return;
        }

        const payload = {
            client: selectedClient,
            assigned_to: assignedUser,
            request_type: 'CONTENT_REQUEST', // or map contentType if needed, but 'CONTENT_REQUEST' covers adhoc
            month: dueDate || new Date().toISOString().split('T')[0], // Fallback to today if no due date
            notes: `${instructions}\n\n[Meta]\nContent Type: ${contentType}\nPost Date: ${postDate}${searchedImage ? `\nGallery Image: ${searchedImage.folio} - ${searchedImage.title}\nImage URL: ${searchedImage.image_url}` : ''}`,
            status: 'TO_DO'
        };

        try {
            const response = await fetch('http://localhost:8000/api/contents/monthly-requests/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Request created successfully! It has been assigned.");
                // Reset form
                setInstructions('');
                setAssignedUser('');
                setSelectedClient('');
                setDueDate('');
                setPostDate('');
                setAttachment(null);
                setAttachmentPreview(null);
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
        <div className="flex flex-col h-[calc(100vh-160px)] min-h-[600px] w-full max-w-7xl mx-auto animate-in fade-in zoom-in duration-500">
            {/* Header - Compact */}
            <div className="flex items-end justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-[#192853] tracking-tight">New Request</h1>
                    <p className="text-[#5B75A9] font-medium">Create a task for the content team</p>
                </div>
                <div className="hidden md:block">
                    <span className="px-4 py-1.5 rounded-full bg-[#192853]/5 text-[#192853] text-sm font-bold border border-[#192853]/10">
                        Draft Mode
                    </span>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-8 shadow-2xl shadow-slate-200/50 border border-white/50 relative overflow-hidden flex flex-col lg:flex-row gap-8">

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-orange-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Left Column: Selection */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <div className="space-y-4 flex-1">
                        <label className="text-sm font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Content Type</label>
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
                                                ? 'border-[#192853] bg-[#192853] text-white shadow-xl shadow-[#192853]/20 scale-[1.02]'
                                                : 'border-slate-100 bg-white hover:border-[#192853]/20 hover:bg-slate-50 text-slate-400 hover:text-[#192853]'}
                                        `}
                                    >
                                        <div className={`
                                            p-3 rounded-2xl transition-all duration-300
                                            ${isSelected ? 'bg-white/10 text-white' : type.bg + ' ' + type.color}
                                        `}>
                                            <Icon size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="font-bold text-sm tracking-wide">{type.label}</span>
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-2 h-2 bg-[#FF6B4A] rounded-full animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowFolioSearch(true)}
                            className="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#FF6B4A]/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#192853] flex items-center justify-center text-white shadow-lg shadow-[#192853]/20 group-hover:scale-110 transition-transform">
                                    {searchedImage ? <Check size={20} /> : <Plus size={20} />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-[#192853] group-hover:text-[#FF6B4A] transition-colors">
                                        {searchedImage ? `Linked: ${searchedImage.folio}` : 'Link Photo ID'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {searchedImage ? searchedImage.title : 'Search from gallery'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden lg:block w-px bg-slate-100 my-2"></div>

                {/* Right Column: Form */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

                    {/* Instructions */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Instructions</label>
                        <div className="relative group">
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#192853] rounded-2xl text-[#192853] placeholder-slate-400 resize-none outline-none transition-all font-medium shadow-inner"
                                placeholder="Describe the requirements for this content piece..."
                            ></textarea>
                            <div className="absolute bottom-3 right-4">
                                <span className="text-[10px] font-bold text-[#192853]/20 bg-slate-100 px-2 py-1 rounded-md">MD</span>
                            </div>
                        </div>
                    </div>

                    {/* Client Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Client</label>
                        <div className="relative">
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-5 py-4 pl-12 bg-white border border-slate-200 rounded-2xl text-[#192853] font-bold outline-none focus:border-[#192853] appearance-none"
                            >
                                <option value="">Select Client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <Users size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#192853] pointer-events-none">
                                <Plus size={16} className="rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Assigned To - New Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Assign To</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                                <select
                                    value={assignedUser}
                                    onChange={(e) => setAssignedUser(e.target.value)}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[#192853] font-bold outline-none focus:border-[#192853] appearance-none"
                                >
                                    <option value="">Select Team Member...</option>
                                    {teamMembers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#192853] pointer-events-none">
                                    <Plus size={16} className="rotate-45" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                {assignedUser ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-[#FF6B4A] flex items-center justify-center text-white font-bold">
                                            {teamMembers.find(u => u.id === assignedUser)?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#192853]">{teamMembers.find(u => u.id === assignedUser)?.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{teamMembers.find(u => u.id === assignedUser)?.role}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 font-medium px-2">No user selected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[#192853] outline-none focus:border-[#192853] focus:ring-1 focus:ring-[#192853]/10 font-bold text-sm transition-all"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1 flex items-center justify-between">
                                <span>Post Date</span>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Optional</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={postDate}
                                    onChange={(e) => setPostDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[#192853] outline-none focus:border-[#192853] focus:ring-1 focus:ring-[#192853]/10 font-bold text-sm transition-all"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-3 flex-1">
                        <label className="text-sm font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Attachments</label>
                        <div className="relative h-full min-h-[140px] group">
                            <input
                                type="file"
                                id="attachment-upload"
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <label
                                htmlFor="attachment-upload"
                                className={`
                                    w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-2 relative overflow-hidden
                                    ${attachmentPreview
                                        ? 'border-[#FF6B4A] bg-white'
                                        : 'border-slate-200 hover:border-[#FF6B4A]/50 bg-slate-50/50 hover:bg-[#FF6B4A]/5'
                                    }
                                `}
                            >
                                {attachmentPreview ? (
                                    <>
                                        <img src={attachmentPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-[#FF6B4A] shadow-lg flex items-center justify-center text-white mb-2">
                                                <Upload size={20} />
                                            </div>
                                            <p className="text-sm font-bold text-[#192853]">{attachment.name}</p>
                                            <p className="text-xs text-[#FF6B4A] font-bold">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all">
                                            <Upload size={20} className="text-[#5B75A9] group-hover:text-[#FF6B4A]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-[#192853] group-hover:text-[#FF6B4A] transition-colors">Click to upload image</p>
                                            <p className="text-xs text-slate-400">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleCreateRequest}
                            className="w-full py-4 bg-[#192853] hover:bg-[#223670] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#192853]/30 hover:shadow-[#192853]/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Create Request</span>
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        </button>
                    </div>

                </div>
            </div>

            {/* Folio Search Modal */}
            {showFolioSearch && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-[#192853]">Link Gallery Image</h3>
                                <p className="text-sm text-slate-500 mt-1">Search by folio number (e.g., C5F12-001)</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowFolioSearch(false);
                                    setFolioSearchError(null);
                                }}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="mb-6">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        value={folioSearch}
                                        onChange={(e) => setFolioSearch(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearchByFolio()}
                                        placeholder="Enter folio number..."
                                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-[#192853] font-bold outline-none focus:border-[#192853] transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSearchByFolio}
                                    disabled={folioSearchLoading}
                                    className="px-6 py-4 bg-[#192853] hover:bg-[#223670] text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {folioSearchLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {folioSearchError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm text-red-600 font-medium">{folioSearchError}</p>
                                </div>
                            )}
                        </div>

                        {/* Search Result */}
                        {searchedImage && (
                            <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={searchedImage.image_url}
                                        alt={searchedImage.title}
                                        className="w-32 h-32 object-cover rounded-xl border-2 border-white shadow-lg"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-xs font-mono text-green-600 mb-1">{searchedImage.folio}</p>
                                                <h4 className="text-lg font-bold text-[#192853] mb-1">{searchedImage.title}</h4>
                                                <p className="text-sm text-slate-500">
                                                    Uploaded {new Date(searchedImage.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleClearGalleryImage}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => setShowFolioSearch(false)}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
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
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                                <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-400 font-medium">Enter a folio number to search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
