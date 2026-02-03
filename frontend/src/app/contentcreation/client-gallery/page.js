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
            setFolders(data);
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

            if (!response.ok) throw new Error("Failed to upload images");

            const responseData = await response.json();
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Client Gallery</h1>
                    <p className="text-gray-600 mt-2">Manage and organize client images</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">Error</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <div className="text-green-800 font-medium">{successMessage}</div>
                        <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-800">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Client Selector Section */}
                {!selectedClient ? (
                    <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/50 p-8 shadow-lg">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select a Client</h2>

                        {/* Search Input */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Clients Grid */}
                        {loadingClients ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No clients found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                    >
                                        <p className="font-semibold text-gray-900">
                                            {client.client_profile?.practice_name || client.username}
                                        </p>
                                        <p className="text-sm text-gray-600">{client.username}</p>
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
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <ArrowLeft size={18} />
                                Back to Clients
                            </button>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-700 font-medium">
                                {selectedClient.client_profile?.practice_name || selectedClient.username}
                            </span>
                        </div>

                        {/* Folder List View */}
                        {!selectedFolder ? (
                            <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/50 p-8 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-900">Folders</h2>
                                    <button
                                        onClick={() => setShowCreateFolderModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FolderPlus size={18} />
                                        Create Folder
                                    </button>
                                </div>

                                {/* Folders Grid */}
                                {loadingFolders ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : folders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Folder className="mx-auto text-gray-400 mb-3" size={48} />
                                        <p className="text-gray-500 text-lg">No folders yet</p>
                                        <p className="text-gray-400 text-sm">Create a folder to get started</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {folders.map(folder => (
                                            <button
                                                key={folder.id}
                                                onClick={() => setSelectedFolder(folder)}
                                                className="p-6 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Folder className="text-blue-600" size={20} />
                                                            <p className="font-semibold text-gray-900">{folder.folder_name}</p>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
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
                            <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/50 p-8 shadow-lg">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <button
                                            onClick={() => setSelectedFolder(null)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <ArrowLeft size={24} />
                                        </button>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-semibold text-gray-900">{selectedFolder.folder_name}</h2>
                                            <p className="text-sm text-gray-600">{filteredImages.length} of {images.length} image(s)</p>
                                        </div>
                                    </div>

                                    {/* Search Images */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search by title or folio (e.g., C5F12-001)..."
                                            value={imageSearchTerm}
                                            onChange={(e) => setImageSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Upload Area */}
                                <div className="mb-8 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
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
                                            <Upload className="mx-auto text-blue-600 mb-3" size={32} />
                                            <p className="font-medium text-gray-900">Click to select images or drag and drop</p>
                                            <p className="text-sm text-gray-600 mt-1">Supported formats: JPG, PNG, GIF, WebP</p>
                                        </div>
                                    </label>

                                    {/* Selected Files Preview */}
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                                            <div className="space-y-2">
                                                {selectedFiles.map((file, idx) => (
                                                    <p key={idx} className="text-sm text-gray-600">
                                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleUploadImages}
                                                disabled={uploading}
                                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                {uploading ? "Uploading..." : "Upload Images"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Images Grid */}
                                {loadingImages ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : images.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">No images in this folder</p>
                                        <p className="text-gray-400 text-sm">Upload images to get started</p>
                                    </div>
                                ) : filteredImages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">No images match your search</p>
                                        <p className="text-gray-400 text-sm">Try a different search term</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredImages.map(image => (
                                            <div key={image.id} className="relative group rounded-lg overflow-hidden shadow-md bg-white">
                                                <img
                                                    src={image.image_url}
                                                    alt={image.title || "Gallery image"}
                                                    className="w-full h-48 object-cover"
                                                />
                                                {/* Image info overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                                                    <p className="text-xs font-mono text-blue-300 mb-0.5">{image.folio}</p>
                                                    <p className="text-sm font-medium truncate" title={image.title}>{image.title}</p>
                                                </div>
                                                {/* Hover actions */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                    {image.image_url_original && (
                                                        <a
                                                            href={image.image_url_original}
                                                            download
                                                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                                            title="Download original"
                                                        >
                                                            <Download size={18} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteConfirm(image.id)}
                                                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                        title="Delete image"
                                                    >
                                                        <Trash2 size={18} />
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Create Folder</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateFolderModal(false);
                                        setNewFolderName("");
                                        setFolderNameError(null);
                                    }}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateFolder}>
                                <input
                                    type="text"
                                    placeholder="Folder name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                />

                                {folderNameError && (
                                    <p className="text-red-600 text-sm mb-3">{folderNameError}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateFolderModal(false);
                                            setNewFolderName("");
                                            setFolderNameError(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Image?</h3>
                            <p className="text-gray-600 mb-6">This action cannot be undone.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteImage(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
