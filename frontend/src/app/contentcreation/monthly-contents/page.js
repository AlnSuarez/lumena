"use client";
import React, { useState, useRef } from 'react';
import { ChevronRight, Sparkles, Check, ChevronDown, ChevronLeft, Search, Folder, Image as ImageIcon, X, RefreshCw, Upload, Loader2, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import { useTheme } from "../../../context/ThemeContext";

export default function MonthlyContentsPage() {
    const { requireQAReview } = useTheme();
    const [clientName, setClientName] = useState("");

    // Superuser check
    const isSuperuser = typeof window !== 'undefined'
        ? localStorage.getItem('userRole') === 'SUPERUSER'
        : false;

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Combined list of Monthly Clients and Adhoc Requests
    const [items, setItems] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeContentIndex, setActiveContentIndex] = useState(0);
    const [expandedSections, setExpandedSections] = useState({
        newRequests: true,
        returnedQA: true,
        returnedClient: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const DEFAULT_COUNTS = { photos: 4, carousels: 4, videos: 4, stories: 4 };

    const parseCountsFromNotes = (notes) => {
        if (!notes) return null;
        const photos = notes.match(/Photos:\s*(\d+)/)?.[1];
        const carousels = notes.match(/Carousels:\s*(\d+)/)?.[1];
        const videos = notes.match(/Videos:\s*(\d+)/)?.[1];
        const stories = notes.match(/Stories:\s*(\d+)/)?.[1];
        if (photos !== undefined || carousels !== undefined || videos !== undefined || stories !== undefined) {
            return {
                photos: photos !== undefined ? parseInt(photos, 10) : 4,
                carousels: carousels !== undefined ? parseInt(carousels, 10) : 4,
                videos: videos !== undefined ? parseInt(videos, 10) : 4,
                stories: stories !== undefined ? parseInt(stories, 10) : 4,
            };
        }
        return null;
    };

    const updateCountsInNotes = (notes, counts) => {
        if (!notes) return notes;
        let updated = notes;
        if (counts.photos !== undefined) updated = updated.replace(/Photos:\s*\d+/, `Photos: ${counts.photos}`);
        if (counts.carousels !== undefined) updated = updated.replace(/Carousels:\s*\d+/, `Carousels: ${counts.carousels}`);
        if (counts.videos !== undefined) updated = updated.replace(/Videos:\s*\d+/, `Videos: ${counts.videos}`);
        if (counts.stories !== undefined) updated = updated.replace(/Stories:\s*\d+/, `Stories: ${counts.stories}`);
        const p = parseInt(updated.match(/Photos:\s*(\d+)/)?.[1]) || 0;
        const c = parseInt(updated.match(/Carousels:\s*(\d+)/)?.[1]) || 0;
        const v = parseInt(updated.match(/Videos:\s*(\d+)/)?.[1]) || 0;
        const s = parseInt(updated.match(/Stories:\s*(\d+)/)?.[1]) || 0;
        updated = updated.replace(/Total:\s*\d+/, `Total: ${p + c + v + s}`);
        return updated;
    };

    const [counts, setCounts] = useState({ ...DEFAULT_COUNTS });

    const steps = [
        { id: 'photos', label: 'Photos', count: counts.photos },
        { id: 'carousels', label: 'Carousels', count: counts.carousels },
        { id: 'videos', label: 'Videos', count: counts.videos },
        { id: 'stories', label: 'Stories', count: counts.stories }
    ];

    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Get CSRF Token
    React.useEffect(() => {
        const getCookie = (name) => {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        };
        setCsrfToken(getCookie('csrftoken') || '');
    }, []);

    // Initialize Data
    React.useEffect(() => {
        const fetchRequests = async () => {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');

            if (!userId || !userRole) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
                return;
            }

            try {
                // Construct URL with query params for our "simulated" auth
                const url = new URL((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/contents/monthly-requests/');
                url.searchParams.append('user_id', userId);
                url.searchParams.append('role', userRole);

                const response = await fetch(url.toString());
                if (response.ok) {
                    const data = await response.json();

                    // Transform API data to Component Item format
                    const apiItems = data
                        .filter(req => req.status !== 'QA' && req.status !== 'DONE' && req.status !== 'CONTENT_REVISION' && req.status !== 'CLIENT_REVIEW' && req.status !== 'APPROVED')
                        .map(req => {
                            const isAdhoc = req.request_type !== 'MONTHLY_CONTENT';
                            const isReturned = req.status === 'IN_REVISION';
                            // returnedByClient: has client_feedback AND no QA-only feedback scenario.
                            // If client_feedback is set → client returned it.
                            // If only feedback (QA) is set → QA returned it.
                            // If both are set → client was the last to return (client_feedback wins).
                            const returnedByClient = isReturned && !!req.client_feedback;
                            const parsedCounts = isAdhoc ? null : parseCountsFromNotes(req.notes);
                            return {
                                id: req.id,
                                type: isAdhoc ? 'adhoc_request' : 'client',
                                name: req.client_details ? req.client_details.username : `Client #${req.client}`,
                                completed: false,
                                month: req.month,
                                status: req.status,
                                returnedByClient: !!returnedByClient,
                                contentType: isAdhoc ? (req.notes?.match(/Content Type: (\w+)/)?.[1] || 'General') : null,
                                instructions: req.notes,
                                asignee: req.assigned_to_details?.username,
                                feedback: req.feedback,
                                clientFeedback: req.client_feedback,
                                planCounts: parsedCounts,
                                originalData: req
                            };
                        });

                    setItems(apiItems);

                } else {
                    console.error("Failed to fetch requests");
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            }
        };

        fetchRequests();
    }, []);

    // Sync header name
    React.useEffect(() => {
        if (items[activeItemIndex]) {
            setClientName(items[activeItemIndex].name);
        }
    }, [activeItemIndex, items]);

    const [contentText, setContentText] = useState("");
    const [aiCaption, setAiCaption] = useState("");

    // Image Selection State
    const [isImageSelectionOpen, setIsImageSelectionOpen] = useState(false);
    const [imageSearchMode, setImageSearchMode] = useState('search'); // 'search' or 'gallery'
    const [imageSearchQuery, setImageSearchQuery] = useState('');
    const [foundImage, setFoundImage] = useState(null);
    const [clientFolders, setClientFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [folderImages, setFolderImages] = useState([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [selectionAction, setSelectionAction] = useState('add'); // 'add' or 'change'

    // Upload functionality
    const [uploadSelectedFiles, setUploadSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [contentFolderId, setContentFolderId] = useState(null);
    const dropFilesRef = React.useRef(null);
    const CREATED_CONTENT_FOLDER_NAME = "Created";
    const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;
    const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

    const normalizeUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${API_ORIGIN}${url}`;
    };
    const [csrfToken, setCsrfToken] = useState('');

    // Reset inputs when active item changes
    const prevItemIdRef = useRef(null);

    React.useEffect(() => {
        const currentItem = items[activeItemIndex];
        if (!currentItem) return;

        if (currentItem.id === prevItemIdRef.current) return;

        prevItemIdRef.current = currentItem.id;

        setContentText(currentItem.originalData?.content_text || "");
        setAiCaption(currentItem.originalData?.ai_caption || "");

        if (currentItem.planCounts) {
            setCounts({ ...currentItem.planCounts });
        } else if (currentItem.type !== 'adhoc_request') {
            setCounts({ ...DEFAULT_COUNTS });
        }
        setCurrentStepIndex(0);
        setActiveContentIndex(0);

        setIsImageSelectionOpen(false);
        setFoundImage(null);
        setClientFolders([]);
        setSelectedFolderId(null);
        setFolderImages([]);
        setImageSearchQuery('');
        setSearchError('');
        setUploadSelectedFiles([]);
        setIsUploading(false);
        setIsGeneratingCaption(false);
        setImageSearchMode('search');
    }, [activeItemIndex, items]);

    // Reset content index when step changes
    React.useEffect(() => {
        setActiveContentIndex(0);
    }, [currentStepIndex]);

    const activeItem = items[activeItemIndex] || {};
    const isAdhoc = activeItem.type === 'adhoc_request';

    const getDisplayItems = () => {
        const contentItems = activeItem.originalData?.content_items || [];
        if (contentItems.length === 0 && activeItem.originalData?.linked_image_details) {
            return [{ media_type: 'IMAGE', gallery_image_details: activeItem.originalData.linked_image_details }];
        }
        return contentItems;
    };
    const displayItems = getDisplayItems();

    const getStepMediaType = (stepId) => {
        if (!stepId) return null;
        const map = { photos: 'IMAGE', carousels: 'CAROUSEL_IMAGE', videos: 'VIDEO', stories: 'STORY' };
        return map[stepId] || null;
    };
    const currentStepMediaType = !isAdhoc ? getStepMediaType(steps[currentStepIndex]?.id) : null;
    const stepItems = currentStepMediaType
        ? displayItems.filter(ci => ci.media_type === currentStepMediaType)
        : displayItems;

    // Mock ID for the current item
    const currentId = isAdhoc ? `REQ-${activeItem.id}`.slice(0, 12) : "IMG-2024-00" + (5 - steps[currentStepIndex].count);

    const handleDeleteRequest = async (item) => {
        setIsDeleting(true);
        try {
            const userId = localStorage.getItem('userId');
            const deleteUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${item.id}/`);
            if (userId) deleteUrl.searchParams.append('user_id', userId);

            const response = await fetch(deleteUrl.toString(), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok || response.status === 204) {
                setItems(prev => {
                    const updated = prev.filter(i => i.id !== item.id);
                    return updated;
                });
                setActiveItemIndex(prev => Math.max(0, prev - 1));
                setDeleteModal({ open: false, item: null });
            } else {
                const errBody = await response.text().catch(() => '');
                alert(`Error al eliminar: ${response.status}${errBody ? '\n' + errBody.slice(0, 300) : ''}`);
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert(`Error de red al eliminar: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const updateRequestStatus = async (id, status, extraData = {}) => {
        try {
            const userId = localStorage.getItem('userId');
            const updateUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${id}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);

            const response = await fetch(updateUrl.toString(), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, ...extraData })
            });

            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                const msg = `Error updating request #${id}: ${response.status} ${response.statusText}${errBody ? ' — ' + errBody : ''}`;
                console.error(msg);
                alert(`Failed to update: ${response.status}${errBody ? '\n\n' + errBody.slice(0, 300) : ''}`);
                return;
            }

            // If we updated the image, we should update the local state to reflect it immediately
            if (extraData.linked_image) {
                setItems(prev => prev.map(item => {
                    if (item.id === id) {
                        const newItem = { ...item };
                        if (foundImage && foundImage.id === extraData.linked_image) {
                            newItem.originalData = {
                                ...item.originalData,
                                linked_image: foundImage.id,
                                linked_image_details: foundImage
                            };
                        }
                        return newItem;
                    }
                    return item;
                }));
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert(`Network error updating request #${id}: ${error.message}`);
        }
    };

    // Image Selection Functions
    const handleSearchImage = async () => {
        if (!imageSearchQuery.trim()) return;
        setSearchError('');
        setIsLoadingImages(true);
        try {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');

            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/gallery/images/search/`);
            url.searchParams.append('folio', imageSearchQuery);
            if (userId) url.searchParams.append('user_id', userId);
            if (userRole) url.searchParams.append('role', userRole);

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                setFoundImage(data);
            } else {
                setFoundImage(null);
                setSearchError('Image not found with this ID');
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchError('Error searching for image');
        } finally {
            setIsLoadingImages(false);
        }
    };

    const fetchClientFolders = async () => {
        if (!activeItem?.originalData?.client) {
            console.log("No client ID found for folders fetch");
            return;
        }
        setIsLoadingImages(true);
        try {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');

            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/gallery/clients/${activeItem.originalData.client}/folders/`);
            if (userId) url.searchParams.append('user_id', userId);
            if (userRole) url.searchParams.append('role', userRole);

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                // Ensure data is array
                if (Array.isArray(data)) {
                    setClientFolders(data);
                } else {
                    console.error("Folders data is not an array:", data);
                    setClientFolders([]);
                }
            } else {
                console.error("Failed to fetch folders:", response.status);
            }
        } catch (error) {
            console.error("Error fetching folders:", error);
        } finally {
            setIsLoadingImages(false);
        }
    };

    const fetchFolderImages = async (folderId) => {
        setIsLoadingImages(true);
        setSelectedFolderId(folderId);
        try {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');

            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/gallery/folders/${folderId}/images/`);
            if (userId) url.searchParams.append('user_id', userId);
            if (userRole) url.searchParams.append('role', userRole);

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                setFolderImages(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setIsLoadingImages(false);
        }
    };

    const handleSelectImage = async (image) => {
        let mediaType = 'IMAGE';
        if (isAdhoc) {
            const typeUpper = activeItem.contentType?.toUpperCase();
            if (typeUpper === 'CAROUSEL') {
                mediaType = 'CAROUSEL_IMAGE';
            } else if (typeUpper === 'STORY') {
                mediaType = 'STORY';
            } else if (typeUpper === 'VIDEO') {
                mediaType = 'VIDEO';
            }
        } else {
            const stepKey = steps[currentStepIndex]?.id || 'photos';
            mediaType = stepKey === 'videos' ? 'VIDEO' : stepKey === 'carousels' ? 'CAROUSEL_IMAGE' : stepKey === 'stories' ? 'STORY' : 'IMAGE';
        }

        let currentItems = activeItem.originalData?.content_items || [];
        if (currentItems.length === 0 && activeItem.originalData?.linked_image) {
            currentItems = [{
                media_type: mediaType,
                order: 0,
                gallery_image: activeItem.originalData.linked_image,
                gallery_image_details: activeItem.originalData.linked_image_details
            }];
        }
        let updatedItems = [];

        if (selectionAction === 'change' && currentItems.length > 0) {
            const safeIndex = Math.min(activeContentIndex, Math.max(0, currentItems.length - 1));
            updatedItems = currentItems.map((item, idx) => {
                if (idx === safeIndex) {
                    return {
                        ...item,
                        media_type: mediaType,
                        gallery_image: image.id,
                        gallery_image_details: image,
                        file_url: '',
                        file_name: ''
                    };
                }
                return item;
            });
        } else {
            if (mediaType === 'CAROUSEL_IMAGE' || mediaType === 'STORY') {
                const sameTypeItems = currentItems.filter(item => item.media_type === mediaType);
                const newItem = {
                    media_type: mediaType,
                    order: sameTypeItems.length,
                    gallery_image: image.id,
                    gallery_image_details: image
                };
                updatedItems = [...currentItems, newItem];
            } else {
                const newItem = { 
                    media_type: mediaType, 
                    order: 0, 
                    gallery_image: image.id,
                    gallery_image_details: image
                };
                const itemsOtherTypes = currentItems.filter(item => item.media_type !== mediaType);
                updatedItems = [...itemsOtherTypes, newItem];
            }
        }

        await updateRequestStatus(activeItem.id, activeItem.status, {
            content_items: updatedItems,
            linked_image: image.id,
        });

        setItems(prev => prev.map(item => {
            if (item.id === activeItem.id) {
                return {
                    ...item,
                    originalData: {
                        ...item.originalData,
                        content_items: updatedItems,
                        linked_image: image.id,
                        linked_image_details: image,
                    }
                };
            }
            return item;
        }));

        setIsImageSelectionOpen(false);
        setActiveContentIndex(0);
        setFoundImage(null);
        setSelectedFolderId(null);
        setFolderImages([]);

        alert("Image added successfully!");
    };

    const findOrCreateContentFolder = async (clientId) => {
        // Si ya está cacheado, retornar
        if (contentFolderId) return contentFolderId;

        try {
            // Buscar carpetas del cliente
            const response = await fetch(
                `${API_BASE}/gallery/clients/${clientId}/folders/`,
                { credentials: 'include' }
            );
            const folders = await response.json();

            // Buscar carpeta "Created"
            const contentFolder = folders.find(
                f => f.folder_name === CREATED_CONTENT_FOLDER_NAME
            );

            if (contentFolder) {
                setContentFolderId(contentFolder.id);
                return contentFolder.id;
            }

            // Crear si no existe
            const createResponse = await fetch(
                `${API_BASE}/gallery/clients/${clientId}/folders/create/`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({ folder_name: CREATED_CONTENT_FOLDER_NAME }),
                }
            );

            const newFolder = await createResponse.json();
            setContentFolderId(newFolder.id);
            return newFolder.id;
        } catch (error) {
            console.error('Error finding/creating folder:', error);
            throw error;
        }
    };

    const handleUploadFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setUploadSelectedFiles(files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (isUploading) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return;

        // Determine if this is a carousel type
        const isCarousel = currentStepMediaType === 'CAROUSEL_IMAGE' ||
            (isAdhoc && activeItem?.contentType?.toUpperCase() === 'CAROUSEL') ||
            steps[currentStepIndex]?.id === 'carousels';

        // For non-carousel types, only allow 1 file
        if (!isCarousel && droppedFiles.length > 1) {
            alert('Only 1 file allowed for this content type. Please drop a single file.');
            return;
        }

        // Validate accepted types
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.mkv', '.avi'];
        const invalidFiles = droppedFiles.filter(f => {
            const name = f.name.toLowerCase();
            return !allowedExtensions.some(ext => name.endsWith(ext)) && !f.type.startsWith('image/') && !f.type.startsWith('video/');
        });
        if (invalidFiles.length > 0) {
            alert(`Unsupported file type: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        // Set files and trigger upload automatically
        setUploadSelectedFiles(droppedFiles);
        setSelectionAction(stepItems.length > 0 ? 'change' : 'add');
        dropFilesRef.current = droppedFiles;
        // Use timeout so state updates flush before the upload runs
        setTimeout(() => {
            if (dropFilesRef.current) {
                handleUploadNewImage(dropFilesRef.current);
                dropFilesRef.current = null;
            }
        }, 50);
    };

    const handleUploadNewImage = async (filesToUse) => {
        const files = filesToUse || uploadSelectedFiles;
        if (files.length === 0) {
            alert('Por favor selecciona al menos un archivo');
            return;
        }

        setIsUploading(true);
        try {
            const stepKey = steps[currentStepIndex]?.id || 'photos';
            let targetMediaType = 'IMAGE';
            if (isAdhoc) {
                const typeUpper = activeItem.contentType?.toUpperCase();
                if (typeUpper === 'CAROUSEL') {
                    targetMediaType = 'CAROUSEL_IMAGE';
                } else if (typeUpper === 'STORY') {
                    targetMediaType = 'STORY';
                } else if (typeUpper === 'VIDEO') {
                    targetMediaType = 'VIDEO';
                } else {
                    const firstFile = files[0];
                    const isVideoFile = firstFile && (firstFile.type?.startsWith('video/') || 
                        ['.mp4', '.mov', '.webm', '.mkv', '.avi'].some(ext => firstFile.name?.toLowerCase().endsWith(ext)));
                    targetMediaType = isVideoFile ? 'VIDEO' : 'IMAGE';
                }
            } else {
                targetMediaType = stepKey === 'videos' ? 'VIDEO' : stepKey === 'carousels' ? 'CAROUSEL_IMAGE' : stepKey === 'stories' ? 'STORY' : 'IMAGE';
            }

            let currentItems = activeItem.originalData?.content_items || [];
            if (currentItems.length === 0 && activeItem.originalData?.linked_image) {
                currentItems = [{
                    media_type: targetMediaType,
                    order: 0,
                    gallery_image: activeItem.originalData.linked_image,
                    gallery_image_details: activeItem.originalData.linked_image_details
                }];
            }

            // Group files into images and videos
            const imagesToUpload = [];
            const videosToUpload = [];

            files.forEach(file => {
                const isVideo = file.type?.startsWith('video/') || 
                    ['.mp4', '.mov', '.webm', '.mkv', '.avi'].some(ext => file.name?.toLowerCase().endsWith(ext));
                if (isVideo) {
                    videosToUpload.push(file);
                } else {
                    imagesToUpload.push(file);
                }
            });

            let newItems = [];
            let linkedImageId = activeItem.originalData?.linked_image || null;
            let orderCounter = currentItems.length;

            // 1. Upload Videos
            for (let i = 0; i < videosToUpload.length; i++) {
                const file = videosToUpload[i];
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch(
                    `${API_BASE}/contents/upload-content-video/`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'X-CSRFToken': csrfToken },
                        body: formData,
                    }
                );

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.error || 'Video upload failed');
                }

                const uploadData = await uploadRes.json();
                newItems.push({
                    media_type: targetMediaType,
                    order: orderCounter++,
                    file_url: uploadData.url,
                    file_name: uploadData.filename,
                });
            }

            // 2. Upload Images
            if (imagesToUpload.length > 0) {
                const folderId = await findOrCreateContentFolder(activeItem.originalData.client);

                const formData = new FormData();
                imagesToUpload.forEach(file => {
                    formData.append('images', file);
                });

                const uploadResponse = await fetch(
                    `${API_BASE}/gallery/folders/${folderId}/images/upload/`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'X-CSRFToken': csrfToken },
                        body: formData,
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error('Upload failed');
                }

                const uploadResult = await uploadResponse.json();
                const uploadedImages = uploadResult.images || [uploadResult];

                uploadedImages.forEach(img => {
                    newItems.push({
                        media_type: targetMediaType,
                        order: orderCounter++,
                        gallery_image: img.id,
                        gallery_image_details: img
                    });
                });

                linkedImageId = uploadedImages[0].id;
            }
        
            // We use targetMediaType below to filter and link
            const mediaType = targetMediaType;

            // 4. Vincular al request como ContentItems
            if (newItems.length > 0) {
                let updatedItems = [];
                if (selectionAction === 'change' && currentItems.length > 0) {
                    const firstNewItem = newItems[0];
                    const safeIndex = Math.min(activeContentIndex, Math.max(0, currentItems.length - 1));
                    const replacedItems = currentItems.map((item, idx) => {
                        if (idx === safeIndex) {
                            return {
                                ...item,
                                media_type: mediaType,
                                gallery_image: firstNewItem.gallery_image || null,
                                file_url: firstNewItem.file_url || '',
                                file_name: firstNewItem.file_name || ''
                            };
                        }
                        return item;
                    });
                    const additionalItems = newItems.slice(1).map((item, idx) => ({
                        ...item,
                        order: replacedItems.length + idx
                    }));
                    updatedItems = [...replacedItems, ...additionalItems];
                } else {
                    if (mediaType === 'CAROUSEL_IMAGE' || mediaType === 'STORY') {
                        updatedItems = [...currentItems, ...newItems];
                    } else {
                        const itemsOtherTypes = currentItems.filter(item => item.media_type !== mediaType);
                        updatedItems = [...itemsOtherTypes, ...newItems];
                    }
                }

                const updatePayload = {
                    status: activeItem.originalData.status,
                    content_items: updatedItems,
                };
                if (linkedImageId) {
                    updatePayload.linked_image = linkedImageId;
                }

                const updateResponse = await fetch(
                    `${API_BASE}/contents/monthly-requests/${activeItem.id}/`,
                    {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,
                        },
                        body: JSON.stringify(updatePayload),
                    }
                );

                if (!updateResponse.ok) {
                    throw new Error('Failed to link content items');
                }

                const updatedRequestData = await updateResponse.json();

                setItems(prevItems =>
                    prevItems.map(itm => {
                        if (itm.id === activeItem.id) {
                            const isAdhoc = updatedRequestData.request_type !== 'MONTHLY_CONTENT';
                            const isReturned = updatedRequestData.status === 'IN_REVISION';
                            const returnedByClient = isReturned && !!updatedRequestData.client_feedback;
                            const parsedCounts = isAdhoc ? null : parseCountsFromNotes(updatedRequestData.notes);
                            return {
                                ...itm,
                                status: updatedRequestData.status,
                                returnedByClient: !!returnedByClient,
                                contentType: isAdhoc ? (updatedRequestData.notes?.match(/Content Type: (\w+)/)?.[1] || 'General') : null,
                                instructions: updatedRequestData.notes,
                                feedback: updatedRequestData.feedback,
                                clientFeedback: updatedRequestData.client_feedback,
                                planCounts: parsedCounts,
                                originalData: updatedRequestData,
                            };
                        }
                        return itm;
                    })
                );
            }

            // 5. Limpiar y cerrar
            setUploadSelectedFiles([]);
            const fileInput = document.getElementById('uploadImageInput');
            if (fileInput) fileInput.value = '';
            setIsImageSelectionOpen(false);

            const targetStepIndex = steps.findIndex(s => s.id === stepKey);
            setCurrentStepIndex(targetStepIndex >= 0 ? targetStepIndex : 0);
            setActiveContentIndex(0);

            const label = videosToUpload.length > 0 ? (imagesToUpload.length > 0 ? 'media file(s)' : 'video(s)') : 'image(s)';
            alert(`${newItems.length} ${label} uploaded and linked successfully.`);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir el archivo. Por favor intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerateCaption = async () => {
        if (!activeItem?.id) {
            alert('No hay request seleccionado.');
            return;
        }

        if (!activeItem.originalData?.linked_image_details?.id) {
            alert('Primero vincula una imagen para poder generar el caption con AI.');
            return;
        }

        setIsGeneratingCaption(true);
        try {
            const requirements =
                activeItem.instructions ||
                activeItem.originalData?.notes ||
                '';
            const userId = localStorage.getItem('userId');
            const captionUrl = new URL(`${API_BASE}/contents/monthly-requests/${activeItem.id}/generate-caption/`);
            if (userId) captionUrl.searchParams.append('user_id', userId);

            const response = await fetch(
                captionUrl.toString(),
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({
                        requirements,
                        content_text: contentText,
                    }),
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error || data?.details || `Error generating caption (${response.status})`);
            }

            const generatedCaption = data?.caption || '';
            setAiCaption(generatedCaption);
            setItems(prevItems =>
                prevItems.map(itm =>
                    itm.id === activeItem.id
                        ? {
                            ...itm,
                            originalData: {
                                ...itm.originalData,
                                ai_caption: generatedCaption,
                            },
                        }
                        : itm
                )
            );
        } catch (error) {
            console.error('Caption generation error:', error);
            if (error?.message === 'Failed to fetch') {
                alert('Could not reach backend/Ollama. Verify Django is running on ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} and try again.');
            } else {
                alert(error.message || 'No se pudo generar el caption.');
            }
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleNext = () => {
        const dataToUpdate = {
            content_text: contentText,
            ai_caption: aiCaption
        };

        if (isAdhoc) {
            const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);
            let newIndex = activeItemIndex;
            if (newIndex >= updatedItems.length) {
                newIndex = Math.max(0, updatedItems.length - 1);
            }
            setItems(updatedItems);
            setActiveItemIndex(newIndex);
            const nextStatus = requireQAReview ? 'QA' : 'CLIENT_REVIEW';
            updateRequestStatus(activeItem.id, nextStatus, dataToUpdate);
            if (updatedItems.length === 0) {
                alert("All pending items reviewed!");
            }
            return;
        }

        const currentStepKey = steps[currentStepIndex].id;
        const newCounts = counts[currentStepKey] > 1
            ? { ...counts, [currentStepKey]: counts[currentStepKey] - 1 }
            : { ...counts, [currentStepKey]: 0 };

        setCounts(newCounts);

        const updatedNotes = updateCountsInNotes(activeItem.originalData?.notes, newCounts);
        const saveData = { ...dataToUpdate, notes: updatedNotes };

        // Update local state immediately
        setItems(prev => prev.map(item =>
            item.id === activeItem.id
                ? { ...item, originalData: { ...item.originalData, notes: updatedNotes } }
                : item
        ));

        if (counts[currentStepKey] > 1) {
            updateRequestStatus(activeItem.id, activeItem.status, saveData);
            setContentText("");
            setAiCaption("");
        } else {
            if (currentStepIndex < steps.length - 1) {
                updateRequestStatus(activeItem.id, 'IN_PROGRESS', saveData);
                setCurrentStepIndex(prev => prev + 1);
                setContentText("");
                setAiCaption("");
            } else {
                const nextStatus = requireQAReview ? 'QA' : 'CLIENT_REVIEW';
                updateRequestStatus(activeItem.id, nextStatus, saveData);

                const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);
                let newIndex = activeItemIndex;
                if (newIndex >= updatedItems.length) {
                    newIndex = Math.max(0, updatedItems.length - 1);
                }
                setItems(updatedItems);
                setActiveItemIndex(newIndex);

                if (updatedItems.length > 0) {
                    const nextItem = updatedItems[newIndex];
                    if (nextItem?.planCounts) {
                        setCounts({ ...nextItem.planCounts });
                    } else {
                        setCounts({ ...DEFAULT_COUNTS });
                    }
                    setCurrentStepIndex(0);
                } else {
                    alert("All clients completed!");
                }
            }
        }
    };

    return (
        <>
        <div className="w-full h-full flex flex-col p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full max-w-[1800px] mx-auto">
                {/* Header Area */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Monthly Content</h1>
                        <p className="text-muted-foreground mt-2 text-lg font-medium">Customize and approve monthly assets</p>
                    </div>

                    {/* Integrated Client Selector */}
                    <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</span>
                        <div className="h-4 w-px bg-border"></div>
                        {activeItem && activeItem.originalData?.client_details?.client_profile?.logo ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${activeItem.originalData.client_details.client_profile.logo}`}
                                alt={clientName}
                                className="w-8 h-8 rounded-full object-cover border border-border ring-2 ring-background"
                            />
                        ) : activeItem ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-border">
                                {clientName.charAt(0).toUpperCase()}
                            </div>
                        ) : null}
                        <span className="text-foreground font-bold text-sm min-w-[120px] text-center truncate max-w-[200px]">
                            {clientName || "Select Item..."}
                        </span>
                        <ChevronDown size={14} className="text-muted-foreground" />
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-card/60 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-border shadow-2xl flex-1 flex flex-col min-h-0 relative overflow-hidden">
                    {/* Decorative Gradients */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 disabled:hidden"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -z-10 disabled:hidden"></div>

                    {/* Content Area Wrapper */}
                    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-secondary/20 lg:p-1">

                        {/* Sidebar - Client Checklist */}
                        <div className={`${isSidebarCollapsed ? 'w-20 items-center' : 'w-full lg:w-72 xl:w-80'} transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] bg-card/50 lg:bg-transparent border-b lg:border-b-0 lg:border-r border-border flex flex-col shrink-0 lg:ml-1`}>

                            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-6' : 'justify-between py-6 px-6'}`}>
                                {!isSidebarCollapsed && (
                                    <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                        Pending
                                        <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm">
                                            {items.length}
                                        </span>
                                    </h2>
                                )}
                                <button
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                                </button>
                            </div>

                            <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-6 ${isSidebarCollapsed ? 'px-3 overflow-x-hidden' : 'px-4'}`}>
                                {(() => {
                                    const newRequests = items.filter(item => item.status !== 'IN_REVISION');
                                    const returnedQA = items.filter(item => item.status === 'IN_REVISION' && !item.returnedByClient);
                                    const returnedClient = items.filter(item => item.status === 'IN_REVISION' && item.returnedByClient);

                                    const renderGroup = (title, key, list, colorClass, iconColorClass) => {
                                        if (list.length === 0) return null;
                                        const isExpanded = expandedSections[key];

                                        return (
                                            <div className="space-y-1 mb-2">
                                                {!isSidebarCollapsed && (
                                                    <button
                                                        onClick={() => toggleSection(key)}
                                                        className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-muted/40 rounded-lg text-xs font-bold text-muted-foreground uppercase tracking-wider transition-colors"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
                                                            {title} ({list.length})
                                                        </span>
                                                        <ChevronDown size={14} className={`transform transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                                                    </button>
                                                )}
                                                
                                                {(isExpanded || isSidebarCollapsed) && (
                                                    <div className="space-y-2">
                                                        {list.map((item) => {
                                                            const globalIndex = items.findIndex(x => x.id === item.id);
                                                            const isActive = globalIndex === activeItemIndex;
                                                            const isRequest = item.type === 'adhoc_request';
                                                            const isReturned = item.status === 'IN_REVISION';

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        if (globalIndex !== -1 && globalIndex !== activeItemIndex) {
                                                                            setActiveItemIndex(globalIndex);
                                                                        }
                                                                    }}
                                                                    className={`
                                                                group flex items-center transition-all cursor-pointer border relative overflow-hidden
                                                                ${isSidebarCollapsed
                                                                            ? 'justify-center p-3 rounded-2xl aspect-square'
                                                                            : 'gap-4 p-4 rounded-2xl'}
                                                                ${isActive
                                                                            ? 'bg-primary border-primary shadow-lg shadow-primary/25'
                                                                            : 'bg-card border-transparent hover:border-border hover:bg-muted/50'}
                                                            `}
                                                                    title={isSidebarCollapsed ? item.name : ''}
                                                                >
                                                                    <div className={`
                                                                w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all duration-300
                                                                ${isActive
                                                                            ? 'border-white/20 bg-white/20 text-white'
                                                                            : item.completed
                                                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                                                                : iconColorClass}
                                                            `}>
                                                                        {item.completed ? <Check size={16} strokeWidth={3} /> : (
                                                                            <span className="text-sm font-black">
                                                                                {isReturned ? '!' : (isRequest ? 'R' : globalIndex + 1)}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {!isSidebarCollapsed && (
                                                                        <div className="flex flex-col min-w-0 z-10">
                                                                            <span className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                                                {item.name}
                                                                            </span>
                                                                            <span className={`text-[11px] font-medium truncate mt-0.5 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                                                {item.completed ? 'Completed' : isActive ? 'Reviewing' : item.returnedByClient ? 'Client Revision' : isReturned ? 'Returned by QA' : isRequest ? 'Adhoc Request' : 'Monthly Plan'}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {!isSidebarCollapsed && isActive && (
                                                                        <ChevronRight size={18} className="text-primary-foreground/50 ml-auto" />
                                                                    )}

                                                                    {/* Delete button - superuser only */}
                                                                    {!isSidebarCollapsed && isSuperuser && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setDeleteModal({ open: true, item });
                                                                            }}
                                                                            title="Eliminar request"
                                                                            className={`ml-auto p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0
                                                                                ${isActive
                                                                                    ? 'hover:bg-white/20 text-primary-foreground/70 hover:text-primary-foreground'
                                                                                    : 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'}`}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    };

                                    return (
                                        <>
                                            {renderGroup("New Requests", "newRequests", newRequests, "bg-blue-500", "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20")}
                                            {renderGroup("Returned by QA", "returnedQA", returnedQA, "bg-amber-500", "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20")}
                                            {renderGroup("Returned by Client", "returnedClient", returnedClient, "bg-red-500", "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 group-hover:bg-red-500/20")}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Main Interaction Area */}
                        <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden bg-card/30">

                            {items.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                                        <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center border-4 border-emerald-500/10 shadow-2xl relative z-10">
                                            <Sparkles className="w-16 h-16 text-emerald-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">
                                        All Caught Up!
                                    </h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto text-lg font-medium">
                                        There are no pending content requests for this month.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Left Column: Visualizer & Progress */}
                                    <div className="lg:w-[52%] xl:w-1/2 flex flex-col gap-6 min-h-0 border-b lg:border-b-0 lg:border-r border-border p-6 lg:p-8">

                                        {/* Header: Stepper or Request Info */}
                                        {isAdhoc ? (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-foreground">Adhoc Request</h3>
                                                    <p className="text-sm text-muted-foreground font-medium">Requested by <span className="text-foreground">{activeItem.name || 'Unknown'}</span></p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Modern Stepper */
                                            <div className="flex justify-between items-center relative px-4 py-2 shrink-0">
                                                {/* Track Line */}
                                                <div className="absolute left-6 right-6 top-1/2 h-1 bg-muted rounded-full -z-10"></div>

                                                {steps.map((step, index) => {
                                                    const isActive = index === currentStepIndex;
                                                    const isCompleted = index < currentStepIndex;

                                                    return (
                                                        <div key={step.id} className="relative flex flex-col items-center gap-3 bg-transparent z-10 group cursor-default">
                                                            <div className={`
                                                                w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border-[3px] transition-all duration-500 ease-out
                                                                ${isActive
                                                                    ? 'bg-primary border-primary text-primary-foreground scale-125 shadow-xl shadow-primary/30 rotate-3'
                                                                    : isCompleted
                                                                        ? 'bg-foreground border-foreground text-background'
                                                                        : 'bg-card border-input text-muted-foreground'}
                                                            `}>
                                                                {isCompleted ? <Check size={16} strokeWidth={4} /> : step.count}
                                                            </div>
                                                            <span className={`
                                                                absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300
                                                                ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                                                            `}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Publication Navigation */}
                                        <div className="flex items-center justify-between shrink-0 bg-card/40 rounded-2xl border border-border/50 px-3 py-2">
                                            <button
                                                onClick={() => {
                                                    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
                                                    setActiveContentIndex(0);
                                                }}
                                                disabled={activeItemIndex === 0}
                                                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors px-3 py-1.5 rounded-xl hover:bg-muted/50"
                                            >
                                                <ChevronLeft size={14} />
                                                Previous
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                                                    {activeItem.name || 'Publication'}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                    {activeItemIndex + 1}/{items.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveItemIndex(Math.min(items.length - 1, activeItemIndex + 1));
                                                    setActiveContentIndex(0);
                                                }}
                                                disabled={activeItemIndex >= items.length - 1}
                                                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors px-3 py-1.5 rounded-xl hover:bg-muted/50"
                                            >
                                                Next
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>

                                        {/* Visualizer Frame */}
                                        <div className="flex-1 bg-secondary/30 rounded-3xl border border-border/50 relative flex items-center justify-center overflow-hidden group min-h-[350px] shadow-inner">

                                            {/* Pattern Overlay */}
                                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                            {/* Media - Instagram style */}
                                            <div
                                                className={`w-full h-full relative flex items-center justify-center bg-black/5 transition-all duration-200 ${isDragOver ? 'bg-primary/10 ring-2 ring-primary ring-inset' : ''}`}
                                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                                                onDrop={handleDrop}
                                            >
                                                {/* Drag overlay */}
                                                {isDragOver && (
                                                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-primary/20 backdrop-blur-sm pointer-events-none rounded-xl">
                                                        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center mb-4 animate-pulse">
                                                            <Upload size={32} className="text-primary" />
                                                        </div>
                                                        <p className="text-primary font-black text-lg">Drop to upload</p>
                                                        <p className="text-primary/70 text-sm mt-1">
                                                            {(currentStepMediaType === 'CAROUSEL_IMAGE' || (isAdhoc && activeItem?.contentType?.toUpperCase() === 'CAROUSEL') || steps[currentStepIndex]?.id === 'carousels')
                                                                ? 'Multiple files allowed'
                                                                : 'One file only'}
                                                        </p>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const totalItems = stepItems.length;
                                                    const safeIndex = Math.min(activeContentIndex, Math.max(0, totalItems - 1));
                                                    const ci = stepItems[safeIndex] || {};
                                                    // Resolve media source: prioritize the content item's own sources first.
                                                    // Only fall back to linked_image_details if there are NO content_items at all.
                                                    const hasContentItems = (activeItem.originalData?.content_items?.length || 0) > 0;
                                                    const imgSrc = 
                                                        ci.gallery_image_details?.image_url ||
                                                        ci.gallery_image_details?.image_compressed ||
                                                        ci.gallery_image_details?.image ||
                                                        normalizeUrl(ci.file_url) ||
                                                        (!hasContentItems ? (
                                                            normalizeUrl(activeItem.originalData?.linked_image_details?.image_url) ||
                                                            normalizeUrl(activeItem.originalData?.linked_image_details?.image_compressed) ||
                                                            normalizeUrl(activeItem.originalData?.linked_image_details?.image)
                                                        ) : null);
                                                    const isCarousel = currentStepMediaType === 'CAROUSEL_IMAGE' || (isAdhoc && activeItem.contentType?.toUpperCase() === 'CAROUSEL');

                                                    if (imgSrc) {
                                                        const isVideo = ci.media_type === 'VIDEO' || 
                                                            (typeof imgSrc === 'string' && (
                                                                imgSrc.toLowerCase().split('?')[0].split('#')[0].endsWith('.mp4') || 
                                                                imgSrc.toLowerCase().split('?')[0].split('#')[0].endsWith('.mov') || 
                                                                imgSrc.toLowerCase().split('?')[0].split('#')[0].endsWith('.webm') || 
                                                                imgSrc.toLowerCase().split('?')[0].split('#')[0].endsWith('.mkv') || 
                                                                imgSrc.toLowerCase().split('?')[0].split('#')[0].endsWith('.avi') ||
                                                                imgSrc.toLowerCase().includes('/videos/')
                                                            ));
                                                        return (
                                                            <>
                                                                {isVideo ? (
                                                                    <video
                                                                        key={imgSrc}
                                                                        src={imgSrc}
                                                                        controls
                                                                        playsInline
                                                                        preload="metadata"
                                                                        className="w-full h-full min-h-[300px] object-contain bg-black rounded-xl"
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={imgSrc}
                                                                        alt={ci.gallery_image_details?.title || ci.file_name || "Media"}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                )}

                                                                {/* Carousel-only navigation */}
                                                                {isCarousel && totalItems > 1 && (
                                                                    <>
                                                                        {safeIndex > 0 && (
                                                                            <button
                                                                                onClick={() => setActiveContentIndex(safeIndex - 1)}
                                                                                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-all"
                                                                            >
                                                                                <ChevronLeft size={20} />
                                                                            </button>
                                                                        )}
                                                                        {safeIndex < totalItems - 1 && (
                                                                            <button
                                                                                onClick={() => setActiveContentIndex(safeIndex + 1)}
                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-all"
                                                                            >
                                                                                <ChevronRight size={20} />
                                                                            </button>
                                                                        )}
                                                                        {/* Instagram-style dots */}
                                                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                                                                            {stepItems.map((_ci, ciIdx) => (
                                                                                <button
                                                                                    key={_ci.id || ciIdx}
                                                                                    onClick={() => setActiveContentIndex(ciIdx)}
                                                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                                                        ciIdx === activeContentIndex
                                                                                            ? 'bg-white scale-110'
                                                                                            : 'bg-white/40 hover:bg-white/60'
                                                                                    }`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        {/* Counter badge */}
                                                                        <div className="absolute top-3 right-14 z-30 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white font-medium">
                                                                            {activeContentIndex + 1}/{stepItems.length}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </>
                                                        );
                                                    }
                                                    return (
                                                        <div className="text-center p-8">
                                                            <div className="w-24 h-24 bg-secondary/50 rounded-full mx-auto mb-6 flex items-center justify-center text-muted-foreground">
                                                                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <h4 className="text-lg font-bold text-foreground mb-1">Content Preview</h4>
                                                            <p className="text-sm text-muted-foreground">Linked media will appear here</p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Media Control Buttons */}
                                                <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                                                    {/* Change Media or Select Image */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectionAction(stepItems.length > 0 ? 'change' : 'add');
                                                            setIsImageSelectionOpen(true);
                                                            fetchClientFolders();
                                                        }}
                                                        className="flex items-center gap-2 bg-black/60 backdrop-blur-md hover:bg-black/85 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg border border-white/10"
                                                    >
                                                        <RefreshCw size={12} />
                                                        {stepItems.length > 0 ? 'Change Media' : 'Select Image'}
                                                    </button>

                                                    {/* Add Photo/Video to Carousel */}
                                                    {(() => {
                                                        const isCarousel = currentStepMediaType === 'CAROUSEL_IMAGE' || (isAdhoc && activeItem.contentType?.toUpperCase() === 'CAROUSEL');
                                                        return isCarousel && stepItems.length > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectionAction('add');
                                                                    setIsImageSelectionOpen(true);
                                                                    fetchClientFolders();
                                                                }}
                                                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg border border-emerald-500/20"
                                                            >
                                                                <Upload size={12} />
                                                                Add Photo/Video
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Image Selection Modal/Overlay */}
                                            {isImageSelectionOpen && (
                                                <div className="absolute inset-0 z-50 bg-card/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-xl font-black text-foreground">Select Image</h3>
                                                        <button
                                                            onClick={() => setIsImageSelectionOpen(false)}
                                                            className="p-2 hover:bg-muted rounded-full transition-colors"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2 mb-6">
                                                        <button
                                                            onClick={() => setImageSearchMode('search')}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${imageSearchMode === 'search' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                                                        >
                                                            <Search size={14} />
                                                            By ID
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setImageSearchMode('gallery');
                                                                if (clientFolders.length === 0) fetchClientFolders();
                                                            }}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${imageSearchMode === 'gallery' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                                                        >
                                                            <Folder size={14} />
                                                            Browse Gallery
                                                        </button>
                                                        <button
                                                            onClick={() => setImageSearchMode('upload')}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                                                imageSearchMode === 'upload'
                                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                                            }`}
                                                        >
                                                            <Upload size={14} />
                                                            Upload New
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                                                        {imageSearchMode === 'search' && (
                                                            <div className="space-y-6">
                                                                <div className="relative">
                                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                                        <Search size={16} />
                                                                    </div>
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        placeholder="Enter Image Folio ID (e.g. C5F12-001)"
                                                                        className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-14 py-4 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                        value={imageSearchQuery}
                                                                        onChange={(e) => setImageSearchQuery(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchImage()}
                                                                    />
                                                                    <button
                                                                        onClick={handleSearchImage}
                                                                        disabled={isLoadingImages || !imageSearchQuery.trim()}
                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                                                                    >
                                                                        <ChevronRight size={16} />
                                                                    </button>
                                                                </div>

                                                                {searchError && (
                                                                    <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-bold text-center">
                                                                        {searchError}
                                                                    </div>
                                                                )}

                                                                {foundImage && (
                                                                    <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
                                                                        <div className="aspect-square w-full bg-slate-950/5 relative">
                                                                            <img
                                                                                src={foundImage.image_url}
                                                                                alt={foundImage.title}
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        </div>
                                                                        <div className="p-4 flex items-center justify-between gap-4">
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-foreground text-sm truncate">{foundImage.title}</p>
                                                                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{foundImage.folio}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleSelectImage(foundImage)}
                                                                                className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors shrink-0"
                                                                            >
                                                                                Select
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {imageSearchMode === 'gallery' && (
                                                            <div className="h-full flex flex-col">
                                                                {selectedFolderId ? (
                                                                    <div className="space-y-4">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedFolderId(null);
                                                                                setFolderImages([]);
                                                                            }}
                                                                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
                                                                        >
                                                                            <ChevronLeft size={14} />
                                                                            Back to Folders
                                                                        </button>

                                                                        {isLoadingImages ? (
                                                                            <div className="py-12 text-center text-muted-foreground">Loading images...</div>
                                                                        ) : folderImages.length === 0 ? (
                                                                            <div className="py-12 text-center text-muted-foreground text-sm">No images in this folder</div>
                                                                        ) : (
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                {folderImages.map(img => (
                                                                                    <div
                                                                                        key={img.id}
                                                                                        onClick={() => handleSelectImage(img)}
                                                                                        className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary/10 cursor-pointer hover:border-primary transition-all"
                                                                                    >
                                                                                        <img
                                                                                            src={img.image_url}
                                                                                            alt={img.title}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-md">Select</span>
                                                                                        </div>
                                                                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                                                            <p className="text-[10px] text-white truncate font-medium">{img.title}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-full">
                                                                        {isLoadingImages && clientFolders.length === 0 ? (
                                                                            <div className="py-12 text-center text-muted-foreground">Loading folders...</div>
                                                                        ) : clientFolders.length === 0 ? (
                                                                            <div className="py-12 text-center text-muted-foreground text-sm">No folders found for this client</div>
                                                                        ) : (
                                                                            <div className="grid grid-cols-1 gap-3">
                                                                                {clientFolders.map(folder => (
                                                                                    <div
                                                                                        key={folder.id}
                                                                                        onClick={() => fetchFolderImages(folder.id)}
                                                                                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 hover:border-primary/20 cursor-pointer transition-all"
                                                                                    >
                                                                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                                                                            <Folder size={20} />
                                                                                        </div>
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-sm font-bold text-foreground truncate">{folder.folder_name}</p>
                                                                                            <p className="text-[10px] text-muted-foreground">Click to view images</p>
                                                                                        </div>
                                                                                        <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {imageSearchMode === 'upload' && (
                                                            <div className="space-y-6">
                                                                <div className="p-8 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors">
                                                                    <input
                                                                        id="uploadImageInput"
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                                                                        onChange={handleUploadFileSelect}
                                                                        className="hidden"
                                                                    />
                                                                    <label htmlFor="uploadImageInput" className="cursor-pointer block">
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                                <Upload className="text-primary" size={32} />
                                                                            </div>
                                                                            <p className="font-bold text-foreground">Click to select images or videos</p>
                                                                            <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, GIF, MP4, MOV, AVI &mdash; saved in client&apos;s &quot;Created&quot; folder</p>
                                                                        </div>
                                                                    </label>

                                                                    {uploadSelectedFiles.length > 0 && (
                                                                        <div className="mt-6 pt-6 border-t border-primary/10">
                                                                            <p className="text-sm font-bold mb-3">
                                                                                Selected: {uploadSelectedFiles.length} file(s)
                                                                            </p>
                                                                            <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
                                                                                {uploadSelectedFiles.map((file, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className="text-xs bg-secondary/50 px-3 py-2 rounded-lg flex items-center justify-between"
                                                                                    >
                                                                                        <span className="truncate flex-1">{file.name}</span>
                                                                                        <span className="text-muted-foreground ml-2">
                                                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <button
                                                                                onClick={handleUploadNewImage}
                                                                                disabled={isUploading}
                                                                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                                            >
                                                                                {isUploading ? (
                                                                                    <span className="flex items-center justify-center gap-2">
                                                                                        <Loader2 className="animate-spin" size={16} />
                                                                                        Uploading...
                                                                                    </span>
                                                                                ) : (
                                                                                    'Upload and Link to Request'
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Form Inputs */}
                                    <div className="lg:w-[48%] xl:w-1/2 flex flex-col gap-6 overflow-y-auto px-6 lg:px-8 py-6 custom-scrollbar min-h-0 bg-card">

                                        {isAdhoc ? (
                                            /* --- Adhoc Request Form --- */
                                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                                                <div className="pb-4">
                                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md uppercase tracking-wider inline-block mb-3">
                                                        Reviewing Request
                                                    </span>
                                                    <h3 className="text-2xl font-black text-foreground">Request Details</h3>
                                                </div>

                                                <div className="space-y-6 flex-1">
                                                    <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Instructions</label>
                                                        <p className="text-foreground text-sm leading-relaxed font-medium">
                                                            {activeItem.instructions || "No specific instructions provided."}
                                                        </p>
                                                    </div>

                                                    {/* Client Feedback Banner */}
                                                    {activeItem.clientFeedback && (
                                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                                    <MessageSquare size={12} className="text-orange-500" />
                                                                </div>
                                                                <label className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                                                                    {activeItem.name} · Client Feedback
                                                                </label>
                                                            </div>
                                                            <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed font-semibold">
                                                                {activeItem.clientFeedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* QA Feedback Display */}
                                                    {activeItem.feedback && !activeItem.clientFeedback && (
                                                        <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10">
                                                            <label className="text-[11px] font-bold text-destructive uppercase tracking-widest block mb-2">
                                                                QA Feedback
                                                            </label>
                                                            <p className="text-destructive text-sm leading-relaxed font-bold">
                                                                {activeItem.feedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Type</label>
                                                            <p className="font-bold text-foreground capitalize">{activeItem.contentType || "General"}</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</label>
                                                            <p className="font-bold text-orange-500">Pending Review</p>
                                                        </div>
                                                    </div>

                                                    {/* Content Text */}
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Content Text</label>
                                                        <textarea
                                                            rows={6}
                                                            value={contentText}
                                                            onChange={(e) => setContentText(e.target.value)}
                                                            className="w-full bg-input/50 border border-input rounded-2xl px-5 py-4 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:bg-card focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="Enter the content text here..."
                                                        />
                                                    </div>

                                                    {/* AI Caption */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center px-1">
                                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI Caption</label>
                                                            <button
                                                                type="button"
                                                                onClick={handleGenerateCaption}
                                                                disabled={isGeneratingCaption}
                                                                className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-500/5 px-2 py-1 rounded-lg border border-orange-500/20 hover:bg-orange-500/10 transition-colors disabled:opacity-60"
                                                            >
                                                                {isGeneratingCaption ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                {isGeneratingCaption ? 'Generating...' : 'Generate'}
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={4}
                                                            value={aiCaption}
                                                            onChange={(e) => setAiCaption(e.target.value)}
                                                            className="w-full bg-input/50 border border-input rounded-2xl px-5 py-4 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:bg-card focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="AI generated caption..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-6 mt-auto">
                                                    <button
                                                        onClick={handleNext}
                                                        className="w-full py-4 bg-foreground hover:bg-foreground/90 text-background font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={20} className="text-background" />
                                                        <span>Submit to QA</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- Standard Monthly Form --- */
                                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                                                <div className="pb-4 shrink-0">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider inline-block mb-3 ${activeItem.returnedByClient ? 'text-red-600 bg-red-500/10 border border-red-500/20' : 'text-primary bg-primary/10 border border-primary/20'}`}>
                                                        {activeItem.returnedByClient ? 'Client Revision' : `Editing ${steps[currentStepIndex].label.slice(0, -1)}`}
                                                    </span>
                                                    <h3 className="text-2xl font-black text-foreground">Customize Details</h3>
                                                </div>

                                                <div className="space-y-5 flex-1">

                                                    {/* Client Feedback Banner for Monthly Content */}
                                                    {activeItem.clientFeedback && (
                                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                                    <MessageSquare size={12} className="text-orange-500" />
                                                                </div>
                                                                <label className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                                                                    {activeItem.name} · Client Feedback
                                                                </label>
                                                            </div>
                                                            <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed font-semibold">
                                                                {activeItem.clientFeedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* QA Feedback Display for Monthly Content */}
                                                    {activeItem.feedback && !activeItem.clientFeedback && (
                                                        <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10">
                                                            <label className="text-[11px] font-bold text-destructive uppercase tracking-widest block mb-1">
                                                                QA Feedback
                                                            </label>
                                                            <p className="text-destructive text-sm leading-relaxed font-bold">
                                                                {activeItem.feedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* AI Content */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center px-1">
                                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI Generated Content</label>
                                                            <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
                                                                <Sparkles size={12} />
                                                                Regenerate
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={6}
                                                            value={contentText}
                                                            onChange={(e) => setContentText(e.target.value)}
                                                            className="w-full bg-input/50 border border-input rounded-2xl px-5 py-4 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="AI content will appear here..."
                                                        />
                                                    </div>

                                                    {/* Caption */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center px-1">
                                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Caption</label>
                                                            <button
                                                                type="button"
                                                                onClick={handleGenerateCaption}
                                                                disabled={isGeneratingCaption}
                                                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors disabled:opacity-60"
                                                            >
                                                                {isGeneratingCaption ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                {isGeneratingCaption ? 'Generating...' : 'Generate Caption'}
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={4}
                                                            value={aiCaption}
                                                            onChange={(e) => setAiCaption(e.target.value)}
                                                            className="w-full bg-input/50 border border-input rounded-2xl px-5 py-4 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="Refine the caption..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Next Button */}
                                                <div className="pt-6 shrink-0 mt-auto">
                                                    <button
                                                        onClick={handleNext}
                                                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
                                                    >
                                                        <span>{currentStepIndex === steps.length - 1 && counts.stories <= 1 ? "Finish All" : "Approve & Next"}</span>
                                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.open && deleteModal.item && (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                onClick={() => !isDeleting && setDeleteModal({ open: false, item: null })}
            >

                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

                {/* Modal */}
                <div
                    className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 fade-in duration-200 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Red accent top bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-destructive/80 via-destructive to-destructive/80" />

                    <div className="p-7">
                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                                <AlertTriangle className="text-destructive" size={30} />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-black text-foreground text-center mb-1">
                            Delete Request
                        </h2>
                        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                            Are you sure you want to delete the request for{' '}
                            <span className="font-bold text-foreground">{deleteModal.item.name}</span>?
                            This action is <span className="font-bold text-destructive">permanent</span> and cannot be undone.
                        </p>

                        {/* Info card */}
                        <div className="bg-secondary/40 rounded-2xl p-4 mb-6 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-muted-foreground">
                                        {deleteModal.item.type === 'adhoc_request' ? 'R' : '#'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-foreground text-sm truncate">{deleteModal.item.name}</p>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {deleteModal.item.type === 'adhoc_request' ? 'Adhoc Request' : 'Monthly Plan'}{' '}·{' '}
                                        ID {deleteModal.item.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, item: null })}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground font-bold text-sm transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteRequest(deleteModal.item)}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-sm transition-all shadow-lg shadow-destructive/20 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <><Loader2 size={15} className="animate-spin" /> Deleting...</>
                                ) : (
                                    <><Trash2 size={15} /> Delete</>  
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
