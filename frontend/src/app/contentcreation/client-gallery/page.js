"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    FolderPlus,
    Upload,
    Trash2,
    Folder,
    ArrowLeft,
    X,
    AlertCircle,
    Download,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";
const CREATED_FOLDER_NAME = "Created";

export default function ClientGalleryPage() {
    const router = useRouter();
    // State Management
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [imageSearchTerm, setImageSearchTerm] = useState("");
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Loading and Error States
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Modal States
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderNameError, setFolderNameError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // CSRF Token
    const [csrfToken, setCsrfToken] = useState("");

    // Get CSRF token from cookies
    const getCsrfToken = () => {
        const name = "csrftoken";
        let cookieValue = "";
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    // Check authentication and fetch clients on mount
    useEffect(() => {
        // Check if user is logged in
        const userId = localStorage.getItem('userId');
        if (!userId) {
            router.push('/login');
            return;
        }

        setCsrfToken(getCsrfToken());
        fetchClients();
    }, [router]);

    // Fetch folders when client is selected
    useEffect(() => {
        if (selectedClient) {
            fetchFolders(selectedClient.id);
        }
    }, [selectedClient]);

    // Fetch images when folder is selected
    useEffect(() => {
        if (selectedFolder) {
            fetchImages(selectedFolder.id);
            setImageSearchTerm(""); // Clear search when changing folders
        }
    }, [selectedFolder]);

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            setError(null);
            const response = await fetch(`${API_BASE}/users/clients/`, {
                credentials: 'include',
            });

            if (!response.ok) {
                // Check if authentication failed
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userPermissions');
                    localStorage.removeItem('username');
                    router.push('/login');
                    return;
                }

                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || errorData.error || `Failed to fetch clients (${response.status})`;
                throw new Error(errorMessage);
            }
            const data = await response.json();
            setClients(data);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching clients:", err);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchFolders = async (clientId) => {
        try {
            setLoadingFolders(true);
            setError(null);
            const response = await fetch(`${API_BASE}/gallery/clients/${clientId}/folders/`, {
                credentials: 'include',
            });

            if (!response.ok) {
                // Check if authentication failed
                if (response.status === 401 || response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    // Only redirect to login if it's an authentication issue
                    if (errorData.detail && errorData.detail.includes('Authentication')) {
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('userPermissions');
                        localStorage.removeItem('username');
                        router.push('/login');
                        return;
                    }
                }

                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || errorData.error || `Failed to fetch folders (${response.status})`;
                throw new Error(errorMessage);
            }
            const data = await response.json();
            let nextFolders = data;

            // Ensure the default "Created" folder exists and is visible in Client Gallery.
            const hasCreated = data.some(
                (folder) => folder.folder_name?.trim().toLowerCase() === CREATED_FOLDER_NAME.toLowerCase()
            );

            if (!hasCreated) {
                const createResponse = await fetch(
                    `${API_BASE}/gallery/clients/${clientId}/folders/create/`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrfToken || getCsrfToken(),
                        },
                        body: JSON.stringify({ folder_name: CREATED_FOLDER_NAME }),
                    }
                );

                if (createResponse.ok) {
                    const createdFolder = await createResponse.json();
                    nextFolders = [createdFolder, ...data];
                } else {
                    // If concurrent request created it, refetch once.
                    const retryResponse = await fetch(`${API_BASE}/gallery/clients/${clientId}/folders/`, {
                        credentials: "include",
                    });
                    if (retryResponse.ok) {
                        nextFolders = await retryResponse.json();
                    }
                }
            }

            setFolders(nextFolders);
            setSelectedFolder(null);
            setImages([]);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching folders:", err);
        } finally {
            setLoadingFolders(false);
        }
    };

    const fetchImages = async (folderId) => {
        try {
            setLoadingImages(true);
            setError(null);
            const response = await fetch(`${API_BASE}/gallery/folders/${folderId}/images/`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error("Failed to fetch images");
            const data = await response.json();
            setImages(data);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching images:", err);
        } finally {
            setLoadingImages(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        setFolderNameError(null);

        if (!newFolderName.trim()) {
            setFolderNameError("Folder name is required");
            return;
        }

        // Check if folder already exists
        if (folders.some(f => f.folder_name === newFolderName)) {
            setFolderNameError("Folder with this name already exists");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/gallery/clients/${selectedClient.id}/folders/create/`,
                {
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken,
                    },
                    body: JSON.stringify({ folder_name: newFolderName }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                setFolderNameError(data.error || "Failed to create folder");
                return;
            }

            const newFolder = await response.json();
            setFolders([newFolder, ...folders]);
            setShowCreateFolderModal(false);
            setNewFolderName("");
            setSuccessMessage("Folder created successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setFolderNameError(err.message);
            console.error("Error creating folder:", err);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const handleUploadImages = async () => {
        if (selectedFiles.length === 0) {
            setError("Please select at least one image");
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append("images", file);
            });

            const response = await fetch(
                `${API_BASE}/gallery/folders/${selectedFolder.id}/images/upload/`,
                {
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                    body: formData,
                }
            );

            const responseData = await response.json().catch(() => null);
            if (!response.ok) {
                let errorMessage =
                    responseData?.error ||
                    responseData?.message ||
                    `Failed to upload images (HTTP ${response.status})`;

                const details = responseData?.details || responseData?.errors;
                if (Array.isArray(details) && details.length > 0) {
                    const first = details[0];
                    if (first?.filename && first?.error) {
                        errorMessage += ` First failure: ${first.filename} - ${first.error}`;
                    } else if (first?.error) {
                        errorMessage += ` First failure: ${first.error}`;
                    }
                }

                throw new Error(errorMessage);
            }

            const uploadedImages = responseData.images || responseData;

            setImages([...uploadedImages, ...images]);
            setSelectedFiles([]);

            // Show success message with any warnings about failed uploads
            let message = `${uploadedImages.length} image(s) uploaded successfully!`;
            if (responseData.errors && responseData.errors.length > 0) {
                message += ` (${responseData.errors.length} failed)`;
            }
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(null), 3000);

            // Reset file input
            const fileInput = document.getElementById("imageInput");
            if (fileInput) fileInput.value = "";
        } catch (err) {
            setError(err.message);
            console.error("Error uploading images:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        try {
            const response = await fetch(`${API_BASE}/gallery/images/${imageId}/`, {
                method: "DELETE",
                credentials: 'include',
                headers: {
                    "X-CSRFToken": csrfToken,
                },
            });

            if (!response.ok) throw new Error("Failed to delete image");

            setImages(images.filter(img => img.id !== imageId));
            setDeleteConfirm(null);
            setSuccessMessage("Image deleted successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.message);
            console.error("Error deleting image:", err);
        }
    };

    const filteredClients = clients.filter(client =>
        (client.client_profile?.practice_name || client.username)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const filteredImages = images.filter(image => {
        if (!imageSearchTerm) return true;
        const searchLower = imageSearchTerm.toLowerCase();
        return (
            image.title?.toLowerCase().includes(searchLower) ||
            image.folio?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-secondary/30 p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 pl-1 border-l-4 border-primary">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Client Gallery</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage and organize client images and assets.</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="text-destructive mt-0.5 flex-shrink-0" size={20} />
                        <div className="flex-1">
                            <p className="text-destructive font-bold">Error</p>
                            <p className="text-destructive/80 text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                        <div className="text-green-600 dark:text-green-400 font-bold">{successMessage}</div>
                        <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 dark:text-green-400 hover:opacity-75 transition-opacity">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Client Selector Section */}
                {!selectedClient ? (
                    <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <Folder className="text-primary" size={28} />
                            Select a Client
                        </h2>

                        {/* Search Input */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 text-muted-foreground" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>

                        {/* Clients Grid */}
                        {loadingClients ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                                <p className="text-muted-foreground text-lg">No clients found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className="p-5 text-left border border-border bg-card hover:bg-muted/50 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {(client.client_profile?.practice_name || client.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {client.client_profile?.practice_name || client.username}
                                                </p>
                                                <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">@{client.username}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Folder and Image Management */
                    <div>
                        {/* Breadcrumb and Back Button */}
                        <div className="mb-6 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setSelectedClient(null);
                                    setSelectedFolder(null);
                                    setSearchTerm("");
                                }}
                                className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Back to Clients
                            </button>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-muted-foreground font-medium">
                                {selectedClient.client_profile?.practice_name || selectedClient.username}
                            </span>
                        </div>

                        {/* Folder List View */}
                        {!selectedFolder ? (
                            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-xl animate-in slide-in-from-bottom-5">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-foreground">Folders</h2>
                                    <button
                                        onClick={() => setShowCreateFolderModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <FolderPlus size={18} />
                                        Create Folder
                                    </button>
                                </div>

                                {/* Folders Grid */}
                                {loadingFolders ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                    </div>
                                ) : folders.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border/50">
                                        <Folder className="mx-auto text-muted-foreground/50 mb-4" size={56} />
                                        <p className="text-muted-foreground text-lg font-medium">No folders yet</p>
                                        <p className="text-muted-foreground/60 text-sm mt-1">Create a folder to start organizing images</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {folders.map(folder => (
                                            <button
                                                key={folder.id}
                                                onClick={() => setSelectedFolder(folder)}
                                                className="p-6 text-left bg-card border border-border rounded-2xl hover:border-primary hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                <Folder size={24} />
                                                            </div>
                                                            <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{folder.folder_name}</p>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground pl-11">
                                                            {folder.image_count} image{folder.image_count !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Image Gallery View */
                            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300">
                                <div className="mb-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <button
                                            onClick={() => setSelectedFolder(null)}
                                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                                        >
                                            <ArrowLeft size={24} />
                                        </button>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-black text-foreground tracking-tight">{selectedFolder.folder_name}</h2>
                                            <p className="text-sm text-muted-foreground mt-1">{filteredImages.length} of {images.length} image(s)</p>
                                        </div>
                                    </div>

                                    {/* Search Images */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 text-muted-foreground" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search by title or folio..."
                                            value={imageSearchTerm}
                                            onChange={(e) => setImageSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                        />
                                    </div>
                                </div>

                                {/* Upload Area */}
                                <div className="mb-8 p-8 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors group">
                                    <input
                                        id="imageInput"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <label htmlFor="imageInput" className="cursor-pointer block">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="text-primary" size={32} />
                                            </div>
                                            <p className="font-bold text-foreground text-lg">Click to select images</p>
                                            <p className="text-sm text-muted-foreground mt-1">or drag and drop JPG, PNG, GIF, WebP</p>
                                        </div>
                                    </label>

                                    {/* Selected Files Preview */}
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-primary/10">
                                            <p className="text-sm font-bold text-foreground mb-3">Selected Files ({selectedFiles.length}):</p>
                                            <div className="max-h-32 overflow-y-auto space-y-1 mb-4 pr-2 scrollbar-thin scrollbar-thumb-border">
                                                {selectedFiles.map((file, idx) => (
                                                    <div key={idx} className="text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-md flex justify-between">
                                                        <span className="truncate">{file.name}</span>
                                                        <span className="opacity-70">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleUploadImages}
                                                disabled={uploading}
                                                className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
                                            >
                                                {uploading ? "Uploading..." : "Upload Images"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Images Grid */}
                                {loadingImages ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                    </div>
                                ) : images.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border/50">
                                        <p className="text-muted-foreground text-lg">No images in this folder</p>
                                        <p className="text-muted-foreground/60 text-sm">Upload images to get started</p>
                                    </div>
                                ) : filteredImages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No images match your search</p>
                                        <p className="text-muted-foreground/60 text-sm">Try a different search term</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {filteredImages.map(image => (
                                            <div key={image.id} className="relative group rounded-xl overflow-hidden shadow-md bg-card border border-border aspect-square">
                                                <img
                                                    src={image.image_url}
                                                    alt={image.title || "Gallery image"}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                {/* Image info overlay */}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-14 pb-3 px-3 text-white opacity-100">
                                                    <p className="text-[10px] font-mono font-bold tracking-wide text-white/90 mb-1 drop-shadow-sm">
                                                        {image.folio}
                                                    </p>
                                                    <p className="text-xs font-black truncate text-white drop-shadow-sm" title={image.title}>
                                                        {image.title}
                                                    </p>
                                                </div>
                                                {/* Hover actions */}
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    {image.image_url_original && (
                                                        <a
                                                            href={image.image_url_original}
                                                            download
                                                            className="p-2 bg-black/50 text-white rounded-full hover:bg-primary hover:text-primary-foreground backdrop-blur-sm transition-all"
                                                            title="Download original"
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteConfirm(image.id)}
                                                        className="p-2 bg-black/50 text-white rounded-full hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm transition-all"
                                                        title="Delete image"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Folder Modal */}
                {showCreateFolderModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <FolderPlus size={24} className="text-primary" />
                                    Create New Folder
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateFolderModal(false);
                                        setNewFolderName("");
                                        setFolderNameError(null);
                                    }}
                                    className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateFolder}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase text-xs">Folder Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Marketing Assets 2024"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                                        autoFocus
                                    />
                                </div>

                                {folderNameError && (
                                    <p className="text-destructive text-sm mb-4 font-medium flex items-center gap-1">
                                        <AlertCircle size={14} /> {folderNameError}
                                    </p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateFolderModal(false);
                                            setNewFolderName("");
                                            setFolderNameError(null);
                                        }}
                                        className="flex-1 px-4 py-3 border border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        Create Folder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Delete Image?</h3>
                                <p className="text-muted-foreground">This action cannot be undone. Are you sure you want to permanently delete this image?</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-3 border border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteImage(deleteConfirm)}
                                    className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
