"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    FolderPlus,
    Upload,
    Trash2,
    Folder,
    ArrowLeft,
    AlertCircle,
    Download,
    Lock,
    FileText,
    File,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./client-gallery.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;
const CREATED_FOLDER_NAME = "Created";

function getCsrfToken() {
    const name = "csrftoken";
    if (!document.cookie) return "";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i += 1) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === `${name}=`) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return "";
}

function clientName(client) {
    return client?.client_profile?.practice_name || client?.username || "Untitled client";
}

function isSharedFolder(folder) {
    return folder?.folder_name?.trim().toLowerCase() === "shared content";
}

function FileKind({ item }) {
    if (item.is_pdf) {
        return (
            <div className="cg-tile__file cg-tile__file--pdf">
                <FileText size={28} />
                <span>PDF</span>
            </div>
        );
    }
    return (
        <div className="cg-tile__file">
            <File size={28} />
            <span>.{item.file_type?.toUpperCase() || "FILE"}</span>
        </div>
    );
}

export default function ClientGalleryPage() {
    const router = useRouter();
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [imageSearchTerm, setImageSearchTerm] = useState("");
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadClientsError, setLoadClientsError] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderNameError, setFolderNameError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteConfirmType, setDeleteConfirmType] = useState("image");
    const [isDeleting, setIsDeleting] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            router.push("/login");
            return;
        }
        setCsrfToken(getCsrfToken());
        fetchClients();
    }, [router]);

    useEffect(() => {
        if (selectedClient) fetchFolders(selectedClient.id);
    }, [selectedClient]);

    useEffect(() => {
        if (selectedFolder) {
            fetchImages(selectedFolder.id);
            setImageSearchTerm("");
        }
    }, [selectedFolder]);

    const fetchClients = async () => {
        setLoadingClients(true);
        setLoadClientsError(false);
        try {
            const response = await fetch(`${API_BASE}/users/clients/`, {
                credentials: "include",
            });
            if (!response.ok) {
                setClients([]);
                setLoadClientsError(true);
                toast.error("Could not load clients.");
                return;
            }
            setClients(await response.json());
        } catch (err) {
            setClients([]);
            setLoadClientsError(true);
            toast.error("Network error while loading clients.");
            console.error("Error fetching clients:", err);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchFolders = async (clientId) => {
        try {
            setLoadingFolders(true);
            const response = await fetch(`${API_BASE}/gallery/clients/${clientId}/folders/`, {
                credentials: "include",
            });

            if (!response.ok) {
                toast.error("Could not load folders.");
                setFolders([]);
                return;
            }

            const data = await response.json();
            let nextFolders = data;

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
                    const retryResponse = await fetch(`${API_BASE}/gallery/clients/${clientId}/folders/`, {
                        credentials: "include",
                    });
                    if (retryResponse.ok) nextFolders = await retryResponse.json();
                }
            }

            try {
                const sharedResponse = await fetch(
                    `${API_BASE}/gallery/clients/${clientId}/shared-content/`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "X-CSRFToken": csrfToken || getCsrfToken() },
                    }
                );
                if (sharedResponse.ok) {
                    const sharedFolder = await sharedResponse.json();
                    const hasShared = nextFolders.some(
                        (folder) => folder.folder_name?.trim().toLowerCase() === "shared content"
                    );
                    if (!hasShared) nextFolders = [sharedFolder, ...nextFolders];
                }
            } catch {
                /* non-critical */
            }

            setFolders(nextFolders);
            setSelectedFolder(null);
            setImages([]);
        } catch (err) {
            toast.error("Network error while loading folders.");
            console.error("Error fetching folders:", err);
        } finally {
            setLoadingFolders(false);
        }
    };

    const fetchImages = async (folderId) => {
        try {
            setLoadingImages(true);
            const isShared = isSharedFolder(selectedFolder);
            const url = isShared && selectedClient
                ? `${API_BASE}/gallery/clients/${selectedClient.id}/shared-content/images/`
                : `${API_BASE}/gallery/folders/${folderId}/images/`;

            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) {
                toast.error("Could not load files.");
                setImages([]);
                return;
            }
            setImages(await response.json());
        } catch (err) {
            toast.error("Network error while loading files.");
            console.error("Error fetching images:", err);
        } finally {
            setLoadingImages(false);
        }
    };

    const closeCreateFolder = () => {
        setShowCreateFolderModal(false);
        setNewFolderName("");
        setFolderNameError(null);
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        setFolderNameError(null);

        if (!newFolderName.trim()) {
            setFolderNameError("Folder name is required");
            return;
        }
        if (newFolderName.trim().toLowerCase() === "shared content") {
            setFolderNameError("This folder name is reserved");
            return;
        }
        if (folders.some((folder) => folder.folder_name === newFolderName)) {
            setFolderNameError("A folder with this name already exists");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/gallery/clients/${selectedClient.id}/folders/create/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken || getCsrfToken(),
                    },
                    body: JSON.stringify({ folder_name: newFolderName }),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setFolderNameError(data.error || "Could not create folder");
                return;
            }

            const newFolder = await response.json();
            setFolders([newFolder, ...folders]);
            closeCreateFolder();
            toast.success("Folder created.");
        } catch (err) {
            setFolderNameError(err.message);
            console.error("Error creating folder:", err);
        }
    };

    const handleFileSelect = (e) => {
        setSelectedFiles(Array.from(e.target.files || []));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (uploading) return;
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return;
        setSelectedFiles(droppedFiles);
    };

    const handleUploadImages = async () => {
        if (selectedFiles.length === 0) {
            toast.error("Select at least one file.");
            return;
        }

        try {
            setUploading(true);
            const isShared = isSharedFolder(selectedFolder);
            const formData = new FormData();
            const fieldName = isShared ? "files" : "images";
            selectedFiles.forEach((file) => formData.append(fieldName, file));

            const url = isShared && selectedClient
                ? `${API_BASE}/gallery/clients/${selectedClient.id}/shared-content/upload/`
                : `${API_BASE}/gallery/folders/${selectedFolder.id}/images/upload/`;

            const response = await fetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "X-CSRFToken": csrfToken || getCsrfToken() },
                body: formData,
            });

            const responseData = await response.json().catch(() => null);
            if (!response.ok) {
                let errorMessage =
                    responseData?.error
                    || responseData?.message
                    || `Could not upload (HTTP ${response.status})`;

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

            const uploadedItems = responseData.documents || responseData.images || responseData;
            setImages([...uploadedItems, ...images]);
            setSelectedFiles([]);

            let message = `${uploadedItems.length} file(s) uploaded.`;
            if (responseData.errors && responseData.errors.length > 0) {
                message += ` (${responseData.errors.length} failed)`;
            }
            toast.success(message);

            const fileInput = document.getElementById("imageInput");
            if (fileInput) fileInput.value = "";
        } catch (err) {
            toast.error(err.message || "Could not upload.");
            console.error("Error uploading:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            const isDoc = deleteConfirmType === "document";
            const url = isDoc
                ? `${API_BASE}/gallery/shared-documents/${deleteConfirm}/`
                : `${API_BASE}/gallery/images/${deleteConfirm}/`;

            const response = await fetch(url, {
                method: "DELETE",
                credentials: "include",
                headers: { "X-CSRFToken": csrfToken || getCsrfToken() },
            });

            if (!response.ok) throw new Error("Could not delete this file.");

            setImages((prev) => prev.filter((img) => img.id !== deleteConfirm));
            setDeleteConfirm(null);
            toast.success("File deleted.");
        } catch (err) {
            toast.error(err.message);
            console.error("Error deleting:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredClients = clients.filter((client) =>
        clientName(client).toLowerCase().includes(searchTerm.toLowerCase())
        || (client.username || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredImages = images.filter((image) => {
        if (!imageSearchTerm) return true;
        const searchLower = imageSearchTerm.toLowerCase();
        return (
            image.title?.toLowerCase().includes(searchLower)
            || image.folio?.toLowerCase().includes(searchLower)
        );
    });

    const shared = isSharedFolder(selectedFolder);

    return (
        <div className="content-board client-gallery">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Client Gallery</h1>
                    <p>Libraries of images and files, organized by client and folder.</p>
                </div>
                <div className="cb-header__actions">
                    {selectedClient && !selectedFolder && (
                        <button type="button" className="cb-btn cb-btn--primary" onClick={() => setShowCreateFolderModal(true)}>
                            <FolderPlus size={16} />
                            Create folder
                        </button>
                    )}
                </div>
            </div>

            {!selectedClient ? (
                <>
                    <div className="cg-toolbar">
                        <div className="cg-search">
                            <Search size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search clients"
                                aria-label="Search clients"
                            />
                        </div>
                    </div>

                    <div className="cg-panel">
                        {loadingClients ? (
                            <div className="cb-empty"><strong>Loading clients…</strong></div>
                        ) : loadClientsError ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Folder size={18} /></div>
                                <strong>Could not load clients</strong>
                                <p>Sign in with an admin account, then try again.</p>
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={fetchClients}>Retry</button>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Search size={18} /></div>
                                <strong>No clients found</strong>
                                <p>{clients.length === 0 ? "There are no client libraries yet." : "Try another search."}</p>
                            </div>
                        ) : (
                            <div className="cg-grid">
                                {filteredClients.map((client) => (
                                    <button
                                        key={client.id}
                                        type="button"
                                        className="cg-card"
                                        onClick={() => setSelectedClient(client)}
                                    >
                                        <span className="cg-avatar">{clientName(client).charAt(0).toUpperCase()}</span>
                                        <div className="cg-card__meta">
                                            <strong>{clientName(client)}</strong>
                                            <span>@{client.username}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <nav className="cg-crumb">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedFolder) {
                                    setSelectedFolder(null);
                                    setSelectedFiles([]);
                                    return;
                                }
                                setSelectedClient(null);
                                setSelectedFolder(null);
                                setSearchTerm("");
                            }}
                        >
                            <ArrowLeft size={14} />
                            {selectedFolder ? "Folders" : "Clients"}
                        </button>
                        <span>/</span>
                        <strong>{clientName(selectedClient)}</strong>
                        {selectedFolder && (
                            <>
                                <span>/</span>
                                <strong>{selectedFolder.folder_name}</strong>
                            </>
                        )}
                    </nav>

                    {!selectedFolder ? (
                        <div className="cg-panel">
                            {loadingFolders ? (
                                <div className="cb-empty"><strong>Loading folders…</strong></div>
                            ) : folders.length === 0 ? (
                                <div className="cb-empty">
                                    <div className="cb-empty__icon"><Folder size={18} /></div>
                                    <strong>No folders yet</strong>
                                    <p>Create a folder to start organizing files.</p>
                                </div>
                            ) : (
                                <div className="cg-grid">
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            type="button"
                                            className={`cg-card cg-card--folder${folder.is_system_folder ? " cg-card--system" : ""}`}
                                            onClick={() => setSelectedFolder(folder)}
                                        >
                                            <span className="cg-folder-icon">
                                                {folder.is_system_folder ? <Lock size={16} /> : <Folder size={16} />}
                                            </span>
                                            <div className="cg-card__meta">
                                                <div className="cg-folder-name">
                                                    <strong>{folder.folder_name}</strong>
                                                    {folder.is_system_folder && <span className="cg-system">System</span>}
                                                </div>
                                                <span>
                                                    {folder.image_count} {folder.image_count === 1 ? "file" : "files"}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="cg-panel">
                            <div className="cg-toolbar">
                                <div className="cg-search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        value={imageSearchTerm}
                                        onChange={(e) => setImageSearchTerm(e.target.value)}
                                        placeholder="Search by title or folio"
                                        aria-label="Search files"
                                    />
                                </div>
                            </div>

                            <div
                                className={`cg-drop${isDragOver ? " is-over" : ""}`}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    id="imageInput"
                                    type="file"
                                    multiple
                                    accept={shared ? "*/*" : "image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"}
                                    onChange={handleFileSelect}
                                />
                                <label htmlFor="imageInput" className="cg-drop__label">
                                    <span className="cg-drop__icon"><Upload size={18} /></span>
                                    <strong>{isDragOver ? "Drop files to upload" : (shared ? "Click or drop any file type" : "Click or drop images and videos")}</strong>
                                    <p>
                                        {shared
                                            ? "PDFs, Word, Excel, images, videos, and more"
                                            : "JPG, PNG, GIF, WebP, MP4, MOV, AVI"}
                                    </p>
                                </label>

                                {selectedFiles.length > 0 && (
                                    <div className="cg-files">
                                        <p>Selected ({selectedFiles.length})</p>
                                        <div className="cg-file-list">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={`${file.name}-${idx}`} className="cg-file">
                                                    <span>{file.name}</span>
                                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="cb-btn cb-btn--primary"
                                            onClick={handleUploadImages}
                                            disabled={uploading}
                                        >
                                            <Upload size={15} />
                                            {uploading ? "Uploading…" : "Upload files"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {loadingImages ? (
                                <div className="cb-empty"><strong>Loading files…</strong></div>
                            ) : images.length === 0 ? (
                                <div className="cb-empty">
                                    <div className="cb-empty__icon"><Upload size={18} /></div>
                                    <strong>No files in this folder</strong>
                                    <p>Drop files above to get started.</p>
                                </div>
                            ) : filteredImages.length === 0 ? (
                                <div className="cb-empty">
                                    <div className="cb-empty__icon"><Search size={18} /></div>
                                    <strong>No files match</strong>
                                    <p>Try another title or folio.</p>
                                </div>
                            ) : (
                                <div className="cg-tiles">
                                    {filteredImages.map((item) => {
                                        const isDoc = item._type === "document";
                                        const href = isDoc ? item.file_url : (item.image_url_original || item.image_url);
                                        return (
                                            <div key={`${isDoc ? "doc" : "img"}-${item.id}`} className="cg-tile">
                                                {isDoc ? (
                                                    item.is_image ? (
                                                        <img src={item.file_url} alt={item.title || "Shared file"} />
                                                    ) : item.is_video ? (
                                                        <video src={item.file_url} muted preload="metadata" />
                                                    ) : (
                                                        <FileKind item={item} />
                                                    )
                                                ) : (
                                                    <img src={item.image_url} alt={item.title || "Gallery image"} />
                                                )}
                                                <div className="cg-tile__meta">
                                                    {item.folio && <small>{item.folio}</small>}
                                                    <p title={item.title}>{item.title || "Untitled"}</p>
                                                </div>
                                                <div className="cg-tile__actions">
                                                    <a href={href} target="_blank" rel="noopener noreferrer" title="View / download" aria-label="View or download">
                                                        <Download size={14} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        aria-label="Delete file"
                                                        onClick={() => {
                                                            setDeleteConfirm(item.id);
                                                            setDeleteConfirmType(isDoc ? "document" : "image");
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {showCreateFolderModal && (
                <div className="cb-overlay">
                    <div className="cb-dialog">
                        <form onSubmit={handleCreateFolder}>
                            <div className="cb-dialog__body">
                                <div className="cb-dialog__intro">
                                    <div className="cb-dialog__icon cg-dialog-icon">
                                        <FolderPlus size={18} />
                                    </div>
                                    <div>
                                        <h3>Create folder</h3>
                                        <p>A new library inside {clientName(selectedClient)}.</p>
                                    </div>
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="cg-folder-name">Folder name</label>
                                    <input
                                        id="cg-folder-name"
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="e.g. Marketing 2026"
                                        autoFocus
                                    />
                                    {folderNameError && (
                                        <p className="cg-field-error"><AlertCircle size={13} /> {folderNameError}</p>
                                    )}
                                </div>
                            </div>
                            <div className="cb-dialog__actions">
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={closeCreateFolder}>Cancel</button>
                                <button type="submit" className="cb-btn cb-btn--primary">Create folder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon"><Trash2 size={20} /></div>
                                <div>
                                    <h3>Delete file</h3>
                                    <p>This cannot be undone.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Remove this file from the gallery?
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Cancel</button>
                            <button type="button" className="cb-btn cb-btn--danger" onClick={handleDeleteImage} disabled={isDeleting}>
                                {isDeleting ? "Deleting…" : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
