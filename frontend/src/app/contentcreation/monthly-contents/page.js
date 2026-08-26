"use client";
import React, { useState, useRef } from 'react';
import {
    ChevronRight,
    Sparkles,
    Check,
    ChevronDown,
    ChevronLeft,
    Search,
    Folder,
    Image as ImageIcon,
    X,
    RefreshCw,
    Upload,
    Loader2,
    MessageSquare,
    Trash2,
    AlertTriangle,
    Maximize2,
    RotateCw,
    SlidersHorizontal,
    Type,
    Layers,
    Video,
    CircleHelp,
    FileText,
} from 'lucide-react';
import { useTheme } from "../../../context/ThemeContext";
import ContentMediaPreview, { isPdfMedia, isVideoMedia as isVideoMediaType } from "../../../components/ContentMediaPreview";
import "../monthly-contents.css";

const FLOW_STEPS = [
    { id: "job", number: 1, name: "Job", meaning: "Pick the client or request to work on" },
    { id: "media", number: 2, name: "Media", meaning: "Attach the photo, carousel, video, story, or PDF" },
    { id: "copy", number: 3, name: "Copy", meaning: "Write the caption for this piece" },
    { id: "send", number: 4, name: "Send", meaning: "Sends this piece to the next stage" },
];

const PIPELINE_STAGES = [
    { id: "TO_DO", number: 1, name: "To Do", meaning: "Waiting to start" },
    { id: "IN_PROGRESS", number: 2, name: "In Progress", meaning: "Being created" },
    { id: "QA", number: 3, name: "QA", meaning: "Internal review" },
    { id: "IN_REVISION", number: 4, name: "In Revision", meaning: "Changes requested" },
    { id: "CLIENT_REVIEW", number: 5, name: "Client Review", meaning: "Waiting on client" },
    { id: "APPROVED", number: 6, name: "Approved", meaning: "Ready to schedule" },
    { id: "DONE", number: 7, name: "Done", meaning: "Published" },
];

const FORMAT_ICONS = {
    photos: ImageIcon,
    carousels: Layers,
    videos: Video,
    stories: Type,
};

export default function MonthlyContentsPage() {
    const { requireQAReview } = useTheme();
    const [clientName, setClientName] = useState("");

    // Superuser check
    const [isSuperuser, setIsSuperuser] = useState(false);

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Media expand preview state
    const [isMediaExpanded, setIsMediaExpanded] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(0);

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

    // Advanced filters
    const [filterClient, setFilterClient] = useState('ALL');
    const [filterContentType, setFilterContentType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showLearn, setShowLearn] = useState(false);

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

    const extractInstructions = (notes) => {
        if (!notes) return null;
        const cleaned = notes
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                const isMeta = /^(Content Type|Post Date|Photos|Carousels|Videos|Stories|Total):/i.test(line);
                const isEmpty = !line || line === '[Meta]';
                return !isMeta && !isEmpty;
            })
            .join('\n')
            .replace(/Content Type:\s*\w*/gi, '')
            .replace(/Post Date:\s*\S*/gi, '')
            .replace(/Photos:\s*\d*/gi, '')
            .replace(/Carousels:\s*\d*/gi, '')
            .replace(/Videos:\s*\d*/gi, '')
            .replace(/Stories:\s*\d*/gi, '')
            .replace(/Total:\s*\d*/gi, '')
            .replace(/\[Meta\]/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return cleaned || null;
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
                                instructions: extractInstructions(req.notes),
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

    React.useEffect(() => {
        setIsSuperuser(localStorage.getItem('userRole') === 'SUPERUSER');
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

    // Carousel reorder state
    const [reorderDragIndex, setReorderDragIndex] = useState(null);
    const [reorderOverIndex, setReorderOverIndex] = useState(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
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

    const filteredItems = React.useMemo(() => {
        return items.filter(item => {
            if (filterClient !== 'ALL') {
                const clientId = item.originalData?.client_details?.id;
                if (String(clientId) !== String(filterClient)) return false;
            }
            if (filterContentType !== 'ALL') {
                if (item.type === 'adhoc_request') {
                    const ct = item.originalData?.notes?.match(/Content Type: (\w+)/)?.[1]?.toLowerCase();
                    if (ct !== filterContentType.toLowerCase()) return false;
                } else {
                    const planCounts = item.planCounts || {};
                    const keyMap = { story: 'stories', image: 'photos', carousel: 'carousels', video: 'videos', pdf: 'pdfs' };
                    const countKey = keyMap[filterContentType.toLowerCase()];
                    if (!countKey || !(planCounts[countKey] > 0)) return false;
                }
            }
            if (filterStatus !== 'ALL') {
                if (filterStatus === 'new' && item.status !== 'TO_DO') return false;
                if (filterStatus === 'in_progress' && item.status !== 'IN_PROGRESS') return false;
                if (filterStatus === 'in_revision' && item.status !== 'IN_REVISION') return false;
                if (filterStatus === 'with_feedback' && !item.feedback && !item.clientFeedback) return false;
            }
            if (filterType !== 'ALL') {
                if (filterType === 'monthly' && item.type !== 'client') return false;
                if (filterType === 'adhoc' && item.type !== 'adhoc_request') return false;
            }
            return true;
        });
    }, [items, filterClient, filterContentType, filterStatus, filterType]);

    const activeItem = filteredItems[activeItemIndex] || {};
    const isAdhoc = activeItem.type === 'adhoc_request';

    React.useEffect(() => {
        setActiveItemIndex(0);
        setCurrentStepIndex(0);
        setActiveContentIndex(0);
    }, [filterClient, filterContentType, filterStatus, filterType]);

    const activeFilterCount = [filterClient, filterContentType, filterStatus, filterType].filter(f => f !== 'ALL').length;

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
            } else if (typeUpper === 'PDF') {
                mediaType = 'PDF';
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

    const handleReorderCarousel = async (newStepItems) => {
        const allItems = activeItem.originalData?.content_items || [];
        const otherItems = allItems.filter(ci => ci.media_type !== 'CAROUSEL_IMAGE' && ci.media_type !== currentStepMediaType);
        const reorderedCarouselItems = newStepItems.map((ci, idx) => ({ ...ci, order: idx }));
        const updatedItems = [...otherItems, ...reorderedCarouselItems];

        setIsSavingOrder(true);
        try {
            const res = await fetch(`${API_BASE}/contents/monthly-requests/${activeItem.id}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify({ status: activeItem.originalData?.status, content_items: updatedItems }),
            });
            if (!res.ok) throw new Error('Failed to save order');
            const updated = await res.json();
            setItems(prev => prev.map(itm => {
                if (itm.id !== activeItem.id) return itm;
                return { ...itm, originalData: updated };
            }));
        } catch (err) {
            console.error('Reorder save error:', err);
            alert('Could not save new order. Please try again.');
        } finally {
            setIsSavingOrder(false);
        }
    };

    const handleRotateImage = async (contentItemId) => {
        const allItems = activeItem.originalData?.content_items || [];
        const targetItem = allItems.find(ci => ci.id === contentItemId);
        if (!targetItem) return;
        const newRotation = ((targetItem.rotation || 0) + 90) % 360;
        const updatedItems = allItems.map(ci =>
            ci.id === contentItemId ? { ...ci, rotation: newRotation } : ci
        );

        try {
            const res = await fetch(`${API_BASE}/contents/monthly-requests/${activeItem.id}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify({ status: activeItem.originalData?.status, content_items: updatedItems }),
            });
            if (!res.ok) throw new Error('Failed to save rotation');
            const updated = await res.json();
            setItems(prev => prev.map(itm => {
                if (itm.id !== activeItem.id) return itm;
                return { ...itm, originalData: updated };
            }));
        } catch (err) {
            console.error('Rotation save error:', err);
        }
    };

    const handleDeleteMediaItem = async () => {
        if (!confirm('Are you sure you want to delete this media item?')) return;

        const allItems = activeItem.originalData?.content_items || [];
        const stepKey = steps[currentStepIndex]?.id || 'photos';
        let targetMediaType = 'IMAGE';
        if (isAdhoc) {
            const typeUpper = activeItem.contentType?.toUpperCase();
            if (typeUpper === 'CAROUSEL') targetMediaType = 'CAROUSEL_IMAGE';
            else if (typeUpper === 'STORY') targetMediaType = 'STORY';
            else if (typeUpper === 'VIDEO') targetMediaType = 'VIDEO';
            else if (typeUpper === 'PDF') targetMediaType = 'PDF';
        } else {
            targetMediaType = stepKey === 'videos' ? 'VIDEO' : stepKey === 'carousels' ? 'CAROUSEL_IMAGE' : stepKey === 'stories' ? 'STORY' : 'IMAGE';
        }

        // Separate items matching our media type and other media types
        const targetItems = allItems.filter(ci => ci.media_type === targetMediaType);
        const otherItems = allItems.filter(ci => ci.media_type !== targetMediaType);

        if (targetItems.length === 0) return;

        // Remove the active item and rebuild orders
        const safeIndex = Math.min(activeContentIndex, Math.max(0, targetItems.length - 1));
        const updatedTargetItems = targetItems
            .filter((_, idx) => idx !== safeIndex)
            .map((item, idx) => ({ ...item, order: idx }));

        const updatedItems = [...otherItems, ...updatedTargetItems];

        setIsUploading(true);
        try {
            const payload = {
                status: activeItem.originalData?.status,
                content_items: updatedItems,
            };

            // If we deleted the main linked_image, reset it to the first item left, or null
            if (activeItem.originalData?.linked_image) {
                const firstImg = updatedTargetItems.find(ci => ci.gallery_image);
                payload.linked_image = firstImg ? firstImg.gallery_image : null;
            }

            const res = await fetch(`${API_BASE}/contents/monthly-requests/${activeItem.id}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to delete item');
            const updated = await res.json();
            setItems(prev => prev.map(itm => {
                if (itm.id !== activeItem.id) return itm;
                return {
                    ...itm,
                    originalData: updated,
                };
            }));
            setActiveContentIndex(0);
            alert('Media item deleted successfully.');
        } catch (err) {
            console.error('Delete item error:', err);
            alert('Could not delete media item. Please try again.');
        } finally {
            setIsUploading(false);
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
        const isPdfRequest = isAdhoc && activeItem?.contentType?.toUpperCase() === 'PDF';
        const allowedExtensions = isPdfRequest
            ? ['.pdf']
            : ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.mkv', '.avi'];
        const invalidFiles = droppedFiles.filter(f => {
            const name = f.name.toLowerCase();
            if (isPdfRequest) {
                return !name.endsWith('.pdf') && f.type !== 'application/pdf';
            }
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
        const files = Array.isArray(filesToUse) ? filesToUse : uploadSelectedFiles;
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
                } else if (typeUpper === 'PDF') {
                    targetMediaType = 'PDF';
                } else {
                    const firstFile = files[0];
                    const isPdfFile = firstFile && (firstFile.type === 'application/pdf' || firstFile.name?.toLowerCase().endsWith('.pdf'));
                    const isVideoFile = firstFile && (firstFile.type?.startsWith('video/') || 
                        ['.mp4', '.mov', '.webm', '.mkv', '.avi'].some(ext => firstFile.name?.toLowerCase().endsWith(ext)));
                    targetMediaType = isPdfFile ? 'PDF' : isVideoFile ? 'VIDEO' : 'IMAGE';
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

            // Group files into images, videos, and PDFs
            const imagesToUpload = [];
            const videosToUpload = [];
            const pdfsToUpload = [];

            files.forEach(file => {
                const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
                const isVideo = file.type?.startsWith('video/') || 
                    ['.mp4', '.mov', '.webm', '.mkv', '.avi'].some(ext => file.name?.toLowerCase().endsWith(ext));
                if (isPdf) {
                    pdfsToUpload.push(file);
                } else if (isVideo) {
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

            // 2. Upload PDFs
            for (let i = 0; i < pdfsToUpload.length; i++) {
                const file = pdfsToUpload[i];
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch(
                    `${API_BASE}/contents/upload-content-pdf/`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'X-CSRFToken': csrfToken },
                        body: formData,
                    }
                );

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.error || 'PDF upload failed');
                }

                const uploadData = await uploadRes.json();
                newItems.push({
                    media_type: 'PDF',
                    order: orderCounter++,
                    file_url: uploadData.url,
                    file_name: uploadData.filename,
                });
            }

            // 3. Upload Images
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
                                instructions: extractInstructions(updatedRequestData.notes),
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
            const updatedItems = items.filter(item => item.id !== activeItem.id);
            const updatedFiltered = updatedItems.filter(item => {
                if (filterClient !== 'ALL' && String(item.originalData?.client_details?.id) !== String(filterClient)) return false;
                if (filterContentType !== 'ALL') {
                    const ct = item.originalData?.notes?.match(/Content Type: (\w+)/)?.[1]?.toLowerCase();
                    if (ct !== filterContentType.toLowerCase()) return false;
                }
                if (filterStatus === 'new' && item.status !== 'TO_DO') return false;
                if (filterStatus === 'in_progress' && item.status !== 'IN_PROGRESS') return false;
                if (filterStatus === 'in_revision' && item.status !== 'IN_REVISION') return false;
                if (filterStatus === 'with_feedback' && !item.feedback && !item.clientFeedback) return false;
                if (filterType === 'monthly' && item.type !== 'client') return false;
                if (filterType === 'adhoc' && item.type !== 'adhoc_request') return false;
                return true;
            });
            let newIndex = activeItemIndex;
            if (newIndex >= updatedFiltered.length) {
                newIndex = Math.max(0, updatedFiltered.length - 1);
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

                const updatedItems = items.filter(item => item.id !== activeItem.id);
                const updatedFiltered = updatedItems.filter(item => {
                    if (filterClient !== 'ALL' && String(item.originalData?.client_details?.id) !== String(filterClient)) return false;
                    if (filterContentType !== 'ALL') return false;
                    if (filterStatus !== 'ALL') {
                        if (filterStatus === 'new' && item.status !== 'TO_DO') return false;
                        if (filterStatus === 'in_progress' && item.status !== 'IN_PROGRESS') return false;
                        if (filterStatus === 'in_revision' && item.status !== 'IN_REVISION') return false;
                        if (filterStatus === 'with_feedback' && !item.feedback && !item.clientFeedback) return false;
                    }
                    if (filterType !== 'ALL') {
                        if (filterType === 'monthly' && item.type !== 'client') return false;
                        if (filterType === 'adhoc' && item.type !== 'adhoc_request') return false;
                    }
                    return true;
                });
                let newIndex = activeItemIndex;
                if (newIndex >= updatedFiltered.length) {
                    newIndex = Math.max(0, updatedFiltered.length - 1);
                }
                setItems(updatedItems);
                setActiveItemIndex(newIndex);

                if (updatedItems.length > 0) {
                    const nextItem = updatedFiltered[newIndex] || updatedItems[0];
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

    const sendDestination = requireQAReview ? "QA" : "Client Review";
    const sendDestinationId = requireQAReview ? "QA" : "CLIENT_REVIEW";
    const hasJob = Boolean(activeItem?.id);
    const hasMedia = stepItems.length > 0;
    const hasCopy = contentText.trim().length > 0 || aiCaption.trim().length > 0;
    const canSend = hasJob && hasMedia;
    let activeFlowStep = "job";
    if (hasJob && !hasMedia) activeFlowStep = "media";
    else if (hasJob && hasMedia && !hasCopy) activeFlowStep = "copy";
    else if (hasJob && hasMedia) activeFlowStep = "send";

    const isCarousel =
        currentStepMediaType === "CAROUSEL_IMAGE" ||
        (isAdhoc && activeItem.contentType?.toUpperCase() === "CAROUSEL") ||
        steps[currentStepIndex]?.id === "carousels";

    const newRequests = filteredItems.filter((item) => item.status !== "IN_REVISION");
    const returnedQA = filteredItems.filter((item) => item.status === "IN_REVISION" && !item.returnedByClient);
    const returnedClient = filteredItems.filter((item) => item.status === "IN_REVISION" && item.returnedByClient);

    const uniqueClients = [...new Map(items.map((i) => {
        const d = i.originalData?.client_details;
        return d ? [d.id, d.username || d.client_profile?.practice_name || `Client #${d.id}`] : null;
    }).filter(Boolean))];

    const getJobMeta = (item) => {
        if (item.returnedByClient) return "Client asked for changes";
        if (item.status === "IN_REVISION") return "QA asked for changes";
        if (item.type === "adhoc_request") return `One-off · ${item.contentType || "Request"}`;
        return item.month ? `Monthly plan · ${item.month}` : "Monthly plan";
    };

    const resolveMediaSrc = (ci) => {
        const hasContentItems = (activeItem.originalData?.content_items?.length || 0) > 0;
        return (
            ci?.gallery_image_details?.image_url ||
            ci?.gallery_image_details?.image_compressed ||
            ci?.gallery_image_details?.image ||
            normalizeUrl(ci?.file_url) ||
            (!hasContentItems ? (
                normalizeUrl(activeItem.originalData?.linked_image_details?.image_url) ||
                normalizeUrl(activeItem.originalData?.linked_image_details?.image_compressed) ||
                normalizeUrl(activeItem.originalData?.linked_image_details?.image)
            ) : null)
        );
    };

    const isVideoMedia = (ci, imgSrc) => isVideoMediaType(ci, imgSrc);
    const isPdfItem = (ci, imgSrc) => isPdfMedia(ci, imgSrc);

    const currentStep = steps[currentStepIndex];
    const remaining = currentStep ? counts[currentStep.id] : 0;
    const isLastType = currentStepIndex === steps.length - 1;
    const nextStep = steps[currentStepIndex + 1];
    const singular = currentStep?.label?.replace(/s$/, "") || "piece";
    let sendLabel = `Send to ${sendDestination}`;
    if (!isAdhoc && currentStep) {
        if (remaining > 1) sendLabel = `Save this ${singular.toLowerCase()} — ${remaining - 1} left`;
        else if (!isLastType) sendLabel = `Finish ${currentStep.label.toLowerCase()} — next ${nextStep.label.toLowerCase()}`;
        else sendLabel = `Finish plan — send to ${sendDestination}`;
    }

    const handleFlowClick = (stepId) => {
        setShowLearn(false);
        if (stepId === "send") {
            window.setTimeout(() => document.getElementById("mc-send")?.focus(), 0);
            return;
        }
        const map = { job: "mc-jobs", media: "mc-media", copy: "mc-copy" };
        window.setTimeout(() => {
            document.getElementById(map[stepId])?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
    };

    const safeIndex = Math.min(activeContentIndex, Math.max(0, stepItems.length - 1));
    const currentCi = stepItems[safeIndex] || {};
    const currentSrc = resolveMediaSrc(currentCi);
    const currentIsVideo = isVideoMedia(currentCi, currentSrc);
    const currentIsPdf = isPdfItem(currentCi, currentSrc);

    const renderJobGroup = (title, key, list, group) => {
        if (list.length === 0) return null;
        const isExpanded = expandedSections[key];
        return (
            <div className="mc-group" data-group={group} key={key}>
                {!isSidebarCollapsed && (
                    <button type="button" className="mc-group__toggle" onClick={() => toggleSection(key)}>
                        <span>
                            <span className="mc-group__dot" />
                            {title} ({list.length})
                        </span>
                        <ChevronDown size={14} className={isExpanded ? "" : "is-closed"} />
                    </button>
                )}
                {(isExpanded || isSidebarCollapsed) && (
                    <div className="mc-group__items">
                        {list.map((item) => {
                            const globalIndex = filteredItems.findIndex((x) => x.id === item.id);
                            const isActive = globalIndex === activeItemIndex;
                            const isRequest = item.type === "adhoc_request";
                            const isReturned = item.status === "IN_REVISION";
                            return (
                                <div
                                    key={item.id}
                                    className={`mc-job${isActive ? " is-active" : ""}`}
                                    onClick={() => {
                                        if (globalIndex !== -1 && globalIndex !== activeItemIndex) {
                                            setActiveItemIndex(globalIndex);
                                        }
                                    }}
                                    title={isSidebarCollapsed ? item.name : undefined}
                                >
                                    <span className="mc-job__mark">
                                        {item.completed ? <Check size={14} strokeWidth={3} /> : (isReturned ? "!" : (isRequest ? "R" : globalIndex + 1))}
                                    </span>
                                    {!isSidebarCollapsed && (
                                        <div className="mc-job__body">
                                            <span className="mc-job__name">{item.name}</span>
                                            <span className="mc-job__meta">{getJobMeta(item)}</span>
                                        </div>
                                    )}
                                    {!isSidebarCollapsed && isSuperuser && (
                                        <button
                                            type="button"
                                            className="mc-icon-btn is-danger mc-job__delete"
                                            title="Delete request"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteModal({ open: true, item });
                                            }}
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
        <div className="monthly-contents">
            <header className="mc-header">
                <div className="mc-header__titles">
                    <h1>Create content</h1>
                    <p>Pick a job, attach the media, write the caption, then send it on.</p>
                </div>
                <div className="mc-header__actions">
                    <span className="mc-chip">
                        <span className={`mc-chip__dot${requireQAReview ? "" : " is-client"}`} />
                        Goes to {sendDestination}
                    </span>
                    <button
                        type="button"
                        className={`mc-learn-btn${showLearn ? " is-open" : ""}`}
                        onClick={() => setShowLearn(true)}
                        aria-expanded={showLearn}
                        aria-controls="mc-learn-panel"
                    >
                        <CircleHelp size={16} />
                        How this works
                    </button>
                    <div className="mc-filter">
                        <button
                            type="button"
                            className={`mc-filter__trigger${showFilterDropdown ? " is-open" : ""}`}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <SlidersHorizontal size={16} />
                            {activeFilterCount > 0 ? `${filteredItems.length} jobs` : `${items.length} jobs`}
                            {activeFilterCount > 0 && <span className="mc-filter__count">{activeFilterCount}</span>}
                            <ChevronDown size={14} className="mc-filter__chevron" />
                        </button>
                        {showFilterDropdown && (
                            <>
                                <div className="mc-filter__scrim" onClick={() => setShowFilterDropdown(false)} />
                                <div className="mc-filter__panel">
                                    <div className="mc-filter__group">
                                        <label>Content type</label>
                                        <div className="mc-chips">
                                            {["ALL", "story", "image", "carousel", "video", "pdf"].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    className={`mc-chip-opt${filterContentType === type ? " is-on" : ""}`}
                                                    onClick={() => setFilterContentType(type)}
                                                >
                                                    {type === "ALL" ? "All" : type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mc-filter__group">
                                        <label>Status</label>
                                        <div className="mc-chips">
                                            {[
                                                { id: "ALL", label: "All" },
                                                { id: "new", label: "New" },
                                                { id: "in_progress", label: "In Progress" },
                                                { id: "in_revision", label: "In Revision" },
                                                { id: "with_feedback", label: "With Feedback" },
                                            ].map((st) => (
                                                <button
                                                    key={st.id}
                                                    type="button"
                                                    className={`mc-chip-opt${filterStatus === st.id ? " is-on" : ""}`}
                                                    onClick={() => setFilterStatus(st.id)}
                                                >
                                                    {st.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mc-filter__group">
                                        <label>Request type</label>
                                        <div className="mc-chips">
                                            {[
                                                { id: "ALL", label: "All" },
                                                { id: "monthly", label: "Monthly" },
                                                { id: "adhoc", label: "One-off" },
                                            ].map((rt) => (
                                                <button
                                                    key={rt.id}
                                                    type="button"
                                                    className={`mc-chip-opt${filterType === rt.id ? " is-on" : ""}`}
                                                    onClick={() => setFilterType(rt.id)}
                                                >
                                                    {rt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mc-filter__group">
                                        <label htmlFor="mc-filter-client">Client</label>
                                        <select
                                            id="mc-filter-client"
                                            value={filterClient}
                                            onChange={(e) => setFilterClient(e.target.value)}
                                        >
                                            <option value="ALL">All clients</option>
                                            {uniqueClients.map(([id, name]) => (
                                                <option key={id} value={id}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            className="mc-btn mc-btn--ghost mc-filter__clear"
                                            onClick={() => {
                                                setFilterClient("ALL");
                                                setFilterContentType("ALL");
                                                setFilterStatus("ALL");
                                                setFilterType("ALL");
                                            }}
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {showLearn && (
                <div
                    className="mc-learn-overlay"
                    onClick={() => setShowLearn(false)}
                >
                    <div
                        id="mc-learn-panel"
                        className="mc-learn"
                        role="dialog"
                        aria-labelledby="mc-learn-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mc-learn__head">
                            <div>
                                <h2 id="mc-learn-title">How creating content works</h2>
                                <p>Pick a job, attach media, write the caption, then send it on. Monthly plans go format by format until the whole plan is done.</p>
                            </div>
                            <button
                                type="button"
                                className="mc-icon-btn"
                                onClick={() => setShowLearn(false)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="mc-learn__label">On this page</p>
                        <nav className="mc-flow" aria-label="Creation steps">
                            {FLOW_STEPS.map((step) => {
                                const isDone =
                                    (step.id === "job" && hasJob) ||
                                    (step.id === "media" && hasMedia) ||
                                    (step.id === "copy" && hasCopy);
                                const isActive = activeFlowStep === step.id;
                                const isReady = step.id === "send" && canSend;
                                const meaning = step.id === "send"
                                    ? `Sends this piece to ${sendDestination}`
                                    : step.meaning;
                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        className={[
                                            "mc-flow__step",
                                            isDone && !isActive ? "is-done" : "",
                                            isActive ? "is-active" : "",
                                            isReady ? "is-ready" : "",
                                        ].filter(Boolean).join(" ")}
                                        onClick={() => handleFlowClick(step.id)}
                                    >
                                        <div className="mc-flow__top">
                                            <span className="mc-flow__num">{step.number}</span>
                                            <span className="mc-flow__name">{step.name}</span>
                                        </div>
                                        <p className="mc-flow__meaning">{meaning}</p>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mc-destination">
                            <p className="mc-destination__label">After you send — Content Board pipeline</p>
                            <div className="mc-destination__track">
                                {PIPELINE_STAGES.map((stage) => {
                                    const hereId = activeItem.status === "IN_REVISION"
                                        ? "IN_REVISION"
                                        : activeItem.status === "TO_DO"
                                            ? "TO_DO"
                                            : "IN_PROGRESS";
                                    const isHere = hasJob && stage.id === hereId;
                                    const isLanding = stage.id === sendDestinationId;
                                    return (
                                        <div
                                            key={stage.id}
                                            className={`mc-dest${isHere ? " is-here" : ""}${isLanding ? " is-landing" : ""}`}
                                            data-stage={stage.id}
                                        >
                                            <div className="mc-dest__top">
                                                <span className="mc-dest__num">{stage.number}</span>
                                                <span className="mc-dest__name">{stage.name}</span>
                                            </div>
                                            <p className="mc-dest__meaning">
                                                {isHere ? "You are here" : isLanding ? "Lands here when you send" : stage.meaning}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`mc-workspace${isSidebarCollapsed ? " is-collapsed" : ""}`}>
                <aside className={`mc-jobs${isSidebarCollapsed ? " is-collapsed" : ""}`} id="mc-jobs">
                    <div className="mc-jobs__head">
                        {!isSidebarCollapsed && (
                            <h2 className="mc-jobs__title">
                                Jobs
                                <span className="mc-jobs__badge">{filteredItems.length}</span>
                            </h2>
                        )}
                        <button
                            type="button"
                            className="mc-icon-btn"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            aria-label={isSidebarCollapsed ? "Expand job list" : "Collapse job list"}
                        >
                            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                    </div>
                    <div className="mc-jobs__list">
                        {renderJobGroup("Ready to create", "newRequests", newRequests, "new")}
                        {renderJobGroup("Returned by QA", "returnedQA", returnedQA, "qa")}
                        {renderJobGroup("Returned by client", "returnedClient", returnedClient, "client")}
                    </div>
                </aside>

                {filteredItems.length === 0 ? (
                    <div className="mc-caught-up">
                        <div className="mc-caught-up__icon"><Sparkles size={28} /></div>
                        <h3>All caught up</h3>
                        <p>No production jobs right now. New monthly plans and one-off requests will land here from To Do.</p>
                    </div>
                ) : (
                    <div className="mc-stage">
                        <div className="mc-media-col" id="mc-media">
                            {isAdhoc ? (
                                <div className="mc-adhoc-banner">
                                    <span className="mc-adhoc-banner__icon"><Sparkles size={18} /></span>
                                    <div>
                                        <h3>One-off request</h3>
                                        <p>{activeItem.contentType || "Request"} for {activeItem.name || "this client"}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mc-formats" aria-label="Content formats">
                                    {steps.map((step, index) => {
                                        const Icon = FORMAT_ICONS[step.id] || ImageIcon;
                                        const isActive = index === currentStepIndex;
                                        const isDone = index < currentStepIndex;
                                        return (
                                            <button
                                                key={step.id}
                                                type="button"
                                                data-format={step.id}
                                                className={`mc-format${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                                                onClick={() => {
                                                    setCurrentStepIndex(index);
                                                    setActiveContentIndex(0);
                                                }}
                                            >
                                                <div className="mc-format__top">
                                                    <span className="mc-format__icon"><Icon size={14} /></span>
                                                    <span className="mc-format__name">{step.label}</span>
                                                </div>
                                                <span className="mc-format__left">
                                                    {isDone ? "Done" : `${step.count} left`}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mc-pager">
                                <button
                                    type="button"
                                    className="mc-btn mc-btn--ghost"
                                    disabled={activeItemIndex === 0}
                                    onClick={() => {
                                        setActiveItemIndex(Math.max(0, activeItemIndex - 1));
                                        setActiveContentIndex(0);
                                    }}
                                >
                                    <ChevronLeft size={14} />
                                    Previous
                                </button>
                                <div className="mc-pager__label">
                                    <strong>{activeItem.name || "Job"}</strong>
                                    <span>{activeItemIndex + 1} of {filteredItems.length}</span>
                                </div>
                                <button
                                    type="button"
                                    className="mc-btn mc-btn--ghost"
                                    disabled={activeItemIndex >= filteredItems.length - 1}
                                    onClick={() => {
                                        setActiveItemIndex(Math.min(filteredItems.length - 1, activeItemIndex + 1));
                                        setActiveContentIndex(0);
                                    }}
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </button>
                            </div>

                            <div
                                className={`mc-visual${isDragOver ? " is-drop" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                                onDrop={handleDrop}
                            >
                                {isDragOver && (
                                    <div className="mc-drop">
                                        <Upload size={28} />
                                        <p>Drop to upload</p>
                                        <small>{isCarousel ? "Multiple files allowed" : "One file only"}</small>
                                    </div>
                                )}

                                {currentSrc ? (
                                    currentIsPdf ? (
                                        <ContentMediaPreview src={currentSrc} item={currentCi} alt={currentCi.file_name || "PDF"} />
                                    ) : currentIsVideo ? (
                                        <video
                                            key={currentSrc}
                                            src={currentSrc}
                                            controls
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : (
                                        <img
                                            src={currentSrc}
                                            alt={currentCi.gallery_image_details?.title || currentCi.file_name || "Media"}
                                            style={{ transform: `rotate(${currentCi.rotation || 0}deg)` }}
                                        />
                                    )
                                ) : (
                                    <div className="mc-empty-media">
                                        <div className="mc-empty-media__icon">
                                            {isAdhoc && activeItem?.contentType?.toUpperCase() === "PDF" ? <FileText size={22} /> : <ImageIcon size={22} />}
                                        </div>
                                        <h4>No media yet</h4>
                                        <p>
                                            {isAdhoc && activeItem?.contentType?.toUpperCase() === "PDF"
                                                ? "Drop a PDF here or upload one below."
                                                : "Select from the gallery, search by folio, or drop a file here."}
                                        </p>
                                    </div>
                                )}

                                {isCarousel && stepItems.length > 1 && (
                                    <>
                                        {safeIndex > 0 && (
                                            <button
                                                type="button"
                                                className="mc-media-nav is-prev"
                                                onClick={() => setActiveContentIndex(safeIndex - 1)}
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                        )}
                                        {safeIndex < stepItems.length - 1 && (
                                            <button
                                                type="button"
                                                className="mc-media-nav is-next"
                                                onClick={() => setActiveContentIndex(safeIndex + 1)}
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        )}
                                        <div className="mc-media-count">{safeIndex + 1}/{stepItems.length}</div>
                                    </>
                                )}

                                <div className="mc-media-tools">
                                    {stepItems.length > 0 && (
                                        <button type="button" className="mc-tool is-icon is-danger" title="Delete this media" onClick={handleDeleteMediaItem}>
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="mc-tool"
                                        onClick={() => {
                                            setSelectionAction(stepItems.length > 0 ? "change" : "add");
                                            setIsImageSelectionOpen(true);
                                            fetchClientFolders();
                                        }}
                                    >
                                        <RefreshCw size={12} />
                                        {stepItems.length > 0 ? "Change" : "Select"}
                                    </button>
                                    {isCarousel && stepItems.length > 0 && (
                                        <button
                                            type="button"
                                            className="mc-tool is-add"
                                            onClick={() => {
                                                setSelectionAction("add");
                                                setIsImageSelectionOpen(true);
                                                fetchClientFolders();
                                            }}
                                        >
                                            <Upload size={12} />
                                            Add slide
                                        </button>
                                    )}
                                    {currentSrc && (
                                        <button
                                            type="button"
                                            className="mc-tool is-icon"
                                            title="Expand preview"
                                            onClick={() => {
                                                setExpandedIndex(safeIndex);
                                                setIsMediaExpanded(true);
                                            }}
                                        >
                                            <Maximize2 size={13} />
                                        </button>
                                    )}
                                </div>

                                {isCarousel && stepItems.length > 1 && (
                                    <div className="mc-reorder">
                                        <div className="mc-reorder__head">
                                            <span>Drag to reorder</span>
                                            {isSavingOrder && <span>Saving...</span>}
                                        </div>
                                        <div className="mc-reorder__row">
                                            {stepItems.map((ci, idx) => {
                                                const thumb =
                                                    ci.gallery_image_details?.image_compressed ||
                                                    ci.gallery_image_details?.image_url ||
                                                    ci.gallery_image_details?.image ||
                                                    normalizeUrl(ci.file_url) ||
                                                    null;
                                                const thumbVideo = ci.media_type === "VIDEO" || (ci.file_url && [".mp4", ".mov", ".webm"].some((ext) => ci.file_url.toLowerCase().endsWith(ext)));
                                                return (
                                                    <div
                                                        key={ci.id || idx}
                                                        draggable
                                                        className={`mc-thumb${idx === activeContentIndex ? " is-active" : ""}${reorderDragIndex === idx ? " is-dragging" : ""}${reorderOverIndex === idx && reorderDragIndex !== idx ? " is-over" : ""}`}
                                                        onDragStart={() => setReorderDragIndex(idx)}
                                                        onDragEnter={() => setReorderOverIndex(idx)}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDragEnd={() => {
                                                            if (reorderDragIndex !== null && reorderOverIndex !== null && reorderDragIndex !== reorderOverIndex) {
                                                                const reordered = [...stepItems];
                                                                const [moved] = reordered.splice(reorderDragIndex, 1);
                                                                reordered.splice(reorderOverIndex, 0, moved);
                                                                setActiveContentIndex(reorderOverIndex);
                                                                handleReorderCarousel(reordered);
                                                            }
                                                            setReorderDragIndex(null);
                                                            setReorderOverIndex(null);
                                                        }}
                                                        onClick={() => setActiveContentIndex(idx)}
                                                    >
                                                        {thumb ? (
                                                            thumbVideo ? (
                                                                <div className="mc-thumb__play">▶</div>
                                                            ) : (
                                                                <img src={thumb} alt={`Slide ${idx + 1}`} style={{ transform: `rotate(${ci.rotation || 0}deg)` }} />
                                                            )
                                                        ) : (
                                                            <div className="mc-thumb__play"><ImageIcon size={14} /></div>
                                                        )}
                                                        <span className="mc-thumb__n">{idx + 1}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {isImageSelectionOpen && (
                                    <div className="mc-picker">
                                        <div className="mc-picker__head">
                                            <div>
                                                <h3>{stepItems.length > 0 && selectionAction === "change" ? "Change media" : "Attach media"}</h3>
                                                <p>Search by folio, browse the client gallery, or upload a new file.</p>
                                            </div>
                                            <button type="button" className="mc-icon-btn" onClick={() => setIsImageSelectionOpen(false)} aria-label="Close">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="mc-picker__tabs">
                                            <button
                                                type="button"
                                                className={`mc-picker__tab${imageSearchMode === "search" ? " is-on" : ""}`}
                                                onClick={() => setImageSearchMode("search")}
                                            >
                                                <Search size={14} /> By folio
                                            </button>
                                            <button
                                                type="button"
                                                className={`mc-picker__tab${imageSearchMode === "gallery" ? " is-on" : ""}`}
                                                onClick={() => {
                                                    setImageSearchMode("gallery");
                                                    if (clientFolders.length === 0) fetchClientFolders();
                                                }}
                                            >
                                                <Folder size={14} /> Gallery
                                            </button>
                                            <button
                                                type="button"
                                                className={`mc-picker__tab${imageSearchMode === "upload" ? " is-on" : ""}`}
                                                onClick={() => setImageSearchMode("upload")}
                                            >
                                                <Upload size={14} /> Upload
                                            </button>
                                        </div>
                                        <div className="mc-picker__body">
                                            {imageSearchMode === "search" && (
                                                <>
                                                    <div className="mc-search">
                                                        <div className="mc-search__field">
                                                            <Search size={16} />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Enter folio (e.g. C5F12-001)"
                                                                value={imageSearchQuery}
                                                                onChange={(e) => setImageSearchQuery(e.target.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleSearchImage()}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="mc-btn mc-btn--primary"
                                                            onClick={handleSearchImage}
                                                            disabled={isLoadingImages || !imageSearchQuery.trim()}
                                                        >
                                                            {isLoadingImages ? "Searching..." : "Search"}
                                                        </button>
                                                    </div>
                                                    {searchError && <div className="mc-error">{searchError}</div>}
                                                    {foundImage && (
                                                        <div className="mc-found">
                                                            <img src={foundImage.image_url} alt={foundImage.title} />
                                                            <div>
                                                                <code>{foundImage.folio}</code>
                                                                <h4>{foundImage.title}</h4>
                                                                <button type="button" className="mc-btn mc-btn--primary" onClick={() => handleSelectImage(foundImage)}>
                                                                    <Check size={14} /> Use this image
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {imageSearchMode === "gallery" && (
                                                selectedFolderId ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="mc-btn mc-btn--ghost"
                                                            onClick={() => {
                                                                setSelectedFolderId(null);
                                                                setFolderImages([]);
                                                            }}
                                                        >
                                                            <ChevronLeft size={14} /> Back to folders
                                                        </button>
                                                        {isLoadingImages ? (
                                                            <div className="mc-muted">Loading images...</div>
                                                        ) : folderImages.length === 0 ? (
                                                            <div className="mc-muted">No images in this folder</div>
                                                        ) : (
                                                            <div className="mc-gallery-grid">
                                                                {folderImages.map((img) => (
                                                                    <button
                                                                        key={img.id}
                                                                        type="button"
                                                                        className="mc-gallery-item"
                                                                        onClick={() => handleSelectImage(img)}
                                                                    >
                                                                        <img src={img.image_url} alt={img.title} />
                                                                        <span className="mc-gallery-item__cap">{img.title}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    isLoadingImages && clientFolders.length === 0 ? (
                                                        <div className="mc-muted">Loading folders...</div>
                                                    ) : clientFolders.length === 0 ? (
                                                        <div className="mc-muted">No folders found for this client</div>
                                                    ) : (
                                                        clientFolders.map((folder) => (
                                                            <button
                                                                key={folder.id}
                                                                type="button"
                                                                className="mc-folder"
                                                                onClick={() => fetchFolderImages(folder.id)}
                                                            >
                                                                <span className="mc-folder__icon"><Folder size={18} /></span>
                                                                <span className="mc-folder__body">
                                                                    <strong>{folder.folder_name}</strong>
                                                                    <span>Open folder</span>
                                                                </span>
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        ))
                                                    )
                                                )
                                            )}

                                            {imageSearchMode === "upload" && (
                                                <div className="mc-upload">
                                                    <input
                                                        id="uploadImageInput"
                                                        type="file"
                                                        multiple
                                                        accept={isAdhoc && activeItem?.contentType?.toUpperCase() === "PDF"
                                                            ? "application/pdf,.pdf"
                                                            : "image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,application/pdf,.pdf"}
                                                        onChange={handleUploadFileSelect}
                                                    />
                                                    <label htmlFor="uploadImageInput">
                                                        <Upload size={28} />
                                                        <strong>
                                                            {isAdhoc && activeItem?.contentType?.toUpperCase() === "PDF"
                                                                ? "Click to select a PDF"
                                                                : "Click to select images, videos, or a PDF"}
                                                        </strong>
                                                        <span>
                                                            {isAdhoc && activeItem?.contentType?.toUpperCase() === "PDF"
                                                                ? "PDF up to 100 MB — published to LinkedIn as a document"
                                                                : "JPG, PNG, GIF, MP4, MOV, AVI, PDF"}
                                                        </span>
                                                    </label>
                                                    {uploadSelectedFiles.length > 0 && (
                                                        <div className="mc-file-list">
                                                            <p>Selected: {uploadSelectedFiles.length} file(s)</p>
                                                            {uploadSelectedFiles.map((file, idx) => (
                                                                <div key={idx} className="mc-file">
                                                                    <span>{file.name}</span>
                                                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                className="mc-btn mc-btn--primary"
                                                                onClick={handleUploadNewImage}
                                                                disabled={isUploading}
                                                            >
                                                                {isUploading ? <><Loader2 size={16} className="mc-spin" /> Uploading...</> : "Upload and attach"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mc-copy-col" id="mc-copy">
                            <div className="mc-section-label">
                                <span className="mc-section-label__num">3</span>
                                <div>
                                    <span className={`mc-tag${activeItem.status === "IN_REVISION" ? " is-revision" : ""}`}>
                                        {activeItem.returnedByClient
                                            ? "Client revision"
                                            : activeItem.status === "IN_REVISION"
                                                ? "QA revision"
                                                : isAdhoc
                                                    ? "One-off request"
                                                    : `Editing ${singular.toLowerCase()}`}
                                    </span>
                                    <h3>Copy</h3>
                                    <p>Use the brief, then write the caption that goes with this piece.</p>
                                </div>
                            </div>

                            {isAdhoc && (
                                <div className="mc-meta-row">
                                    <div className="mc-meta">
                                        <label>Type</label>
                                        <p>{activeItem.contentType || "General"}</p>
                                    </div>
                                    <div className="mc-meta">
                                        <label>Status</label>
                                        <p>{activeItem.status === "IN_REVISION" ? "Needs changes" : "In production"}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mc-brief">
                                <label>Brief</label>
                                <p>{activeItem.instructions || "No specific instructions provided."}</p>
                            </div>

                            {activeItem.clientFeedback && (
                                <div className="mc-banner mc-banner--client">
                                    <label><MessageSquare size={12} /> {activeItem.name} · Client feedback</label>
                                    <p>{activeItem.clientFeedback}</p>
                                </div>
                            )}

                            {activeItem.feedback && !activeItem.clientFeedback && (
                                <div className="mc-banner mc-banner--qa">
                                    <label>QA feedback</label>
                                    <p>{activeItem.feedback}</p>
                                </div>
                            )}

                            <div className="mc-field">
                                <div className="mc-field__head">
                                    <label htmlFor="mc-caption">Caption</label>
                                </div>
                                <textarea
                                    id="mc-caption"
                                    value={contentText}
                                    onChange={(e) => setContentText(e.target.value)}
                                    placeholder="Write the caption for this piece..."
                                />
                            </div>

                            <div className="mc-field">
                                <div className="mc-field__head">
                                    <label htmlFor="mc-ai-caption">AI caption</label>
                                    <button
                                        type="button"
                                        className="mc-gen"
                                        onClick={handleGenerateCaption}
                                        disabled={isGeneratingCaption}
                                    >
                                        {isGeneratingCaption ? <Loader2 size={12} className="mc-spin" /> : <Sparkles size={12} />}
                                        {isGeneratingCaption ? "Generating..." : "Generate"}
                                    </button>
                                </div>
                                <textarea
                                    id="mc-ai-caption"
                                    className="is-short"
                                    value={aiCaption}
                                    onChange={(e) => setAiCaption(e.target.value)}
                                    placeholder="Optional generated caption..."
                                />
                            </div>

                            <button
                                id="mc-send"
                                type="button"
                                className={`mc-btn mc-btn--primary mc-send${canSend ? " is-ready" : ""}`}
                                onClick={handleNext}
                            >
                                <Check size={16} />
                                {sendLabel}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isMediaExpanded && (() => {
                const totalItems = stepItems.length;
                const safeIdx = Math.min(expandedIndex, Math.max(0, totalItems - 1));
                const ci = stepItems[safeIdx] || {};
                const imgSrc = resolveMediaSrc(ci);
                const isVideo = isVideoMedia(ci, imgSrc);
                const isPdf = isPdfItem(ci, imgSrc);
                const currentRotation = ci.rotation || 0;
                return (
                    <div className="mc-overlay" onClick={() => setIsMediaExpanded(false)}>
                        <div className="mc-preview" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Media preview">
                            <div className="mc-preview__head">
                                <div>
                                    <strong>Media preview</strong>
                                    {isCarousel && totalItems > 1 && <span>{safeIdx + 1} / {totalItems}</span>}
                                </div>
                                <div>
                                    {imgSrc && !isVideo && !isPdf && (
                                        <button
                                            type="button"
                                            className="mc-icon-btn"
                                            title={`Rotate (${currentRotation}°)`}
                                            onClick={() => handleRotateImage(ci.id)}
                                        >
                                            <RotateCw size={16} />
                                        </button>
                                    )}
                                    <button type="button" className="mc-icon-btn" onClick={() => setIsMediaExpanded(false)} aria-label="Close">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="mc-preview__body">
                                {isCarousel && totalItems > 1 && safeIdx > 0 && (
                                    <button type="button" className="mc-media-nav is-prev" onClick={() => setExpandedIndex(safeIdx - 1)}>
                                        <ChevronLeft size={18} />
                                    </button>
                                )}
                                {isCarousel && totalItems > 1 && safeIdx < totalItems - 1 && (
                                    <button type="button" className="mc-media-nav is-next" onClick={() => setExpandedIndex(safeIdx + 1)}>
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                                {imgSrc ? (
                                    isPdf ? (
                                        <ContentMediaPreview src={imgSrc} item={ci} alt={ci.file_name || "PDF preview"} />
                                    ) : isVideo ? (
                                        <video key={imgSrc} src={imgSrc} controls autoPlay playsInline />
                                    ) : (
                                        <img
                                            src={imgSrc}
                                            alt={ci.gallery_image_details?.title || ci.file_name || "Media preview"}
                                            style={{ transform: `rotate(${currentRotation}deg)` }}
                                        />
                                    )
                                ) : (
                                    <div className="mc-muted">
                                        <ImageIcon size={36} />
                                        <p>No media available</p>
                                    </div>
                                )}
                            </div>
                            {isCarousel && totalItems > 1 && (
                                <div className="mc-preview__thumbs">
                                    {stepItems.map((thumbCi, idx) => {
                                        const thumb =
                                            thumbCi.gallery_image_details?.image_compressed ||
                                            thumbCi.gallery_image_details?.image_url ||
                                            thumbCi.gallery_image_details?.image ||
                                            normalizeUrl(thumbCi.file_url) ||
                                            null;
                                        const thumbVideo = thumbCi.media_type === "VIDEO" || (thumbCi.file_url && [".mp4", ".mov", ".webm"].some((ext) => thumbCi.file_url.toLowerCase().endsWith(ext)));
                                        return (
                                            <button
                                                key={thumbCi.id || idx}
                                                type="button"
                                                className={`mc-thumb${idx === safeIdx ? " is-active" : ""}`}
                                                onClick={() => setExpandedIndex(idx)}
                                            >
                                                {thumb ? (
                                                    thumbVideo ? <div className="mc-thumb__play">▶</div> : (
                                                        <img src={thumb} alt="" style={{ transform: `rotate(${thumbCi.rotation || 0}deg)` }} />
                                                    )
                                                ) : (
                                                    <div className="mc-thumb__play"><ImageIcon size={14} /></div>
                                                )}
                                                <span className="mc-thumb__n">{idx + 1}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {deleteModal.open && deleteModal.item && (
                <div
                    className="mc-overlay"
                    onClick={() => !isDeleting && setDeleteModal({ open: false, item: null })}
                >
                    <div className="mc-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="mc-delete-title">
                        <div className="mc-dialog__accent" />
                        <div className="mc-dialog__body">
                            <div className="mc-dialog__icon"><AlertTriangle size={26} /></div>
                            <h2 id="mc-delete-title">Delete request</h2>
                            <p>
                                Delete the request for <strong>{deleteModal.item.name}</strong>? This cannot be undone.
                            </p>
                            <div className="mc-dialog__card">
                                <span className="mc-job__mark">
                                    {deleteModal.item.type === "adhoc_request" ? "R" : "#"}
                                </span>
                                <div>
                                    <strong>{deleteModal.item.name}</strong>
                                    <span>
                                        {deleteModal.item.type === "adhoc_request" ? "One-off request" : "Monthly plan"} · ID {deleteModal.item.id}
                                    </span>
                                </div>
                            </div>
                            <div className="mc-dialog__actions">
                                <button
                                    type="button"
                                    className="mc-btn mc-btn--ghost"
                                    disabled={isDeleting}
                                    onClick={() => setDeleteModal({ open: false, item: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="mc-btn mc-btn--danger"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteRequest(deleteModal.item)}
                                >
                                    {isDeleting ? <><Loader2 size={15} className="mc-spin" /> Deleting...</> : <><Trash2 size={15} /> Delete</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
