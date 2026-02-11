"use client";
import React, { useState } from 'react';
import { ChevronRight, Sparkles, Check, ChevronDown, ChevronLeft, Search, Folder, Image as ImageIcon, X, RefreshCw, Upload, Loader2 } from 'lucide-react';

export default function MonthlyContentsPage() {
    const [clientName, setClientName] = useState("");

    // Dummy clients list
    // Combined list of Monthly Clients and Adhoc Requests
    const [items, setItems] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [counts, setCounts] = useState({
        photos: 4,
        carousels: 4,
        videos: 4,
        stories: 4
    });

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
                const url = new URL('http://localhost:8000/api/contents/monthly-requests/');
                url.searchParams.append('user_id', userId);
                url.searchParams.append('role', userRole);

                const response = await fetch(url.toString());
                if (response.ok) {
                    const data = await response.json();

                    // Transform API data to Component Item format
                    const apiItems = data
                        .filter(req => req.status !== 'QA' && req.status !== 'DONE' && req.status !== 'CONTENT_REVISION')
                        .map(req => {
                            const isAdhoc = req.request_type !== 'MONTHLY_CONTENT';
                            return {
                                id: req.id,
                                type: isAdhoc ? 'adhoc_request' : 'client',
                                name: req.client_details ? req.client_details.username : `Client #${req.client}`,
                                completed: false, // Since we filter, all remaining are "pending" for user
                                month: req.month,
                                status: req.status,
                                // If adhoc, we need some fields mapped or extracted from notes if possible
                                contentType: isAdhoc ? (req.notes.match(/Content Type: (\w+)/)?.[1] || 'General') : null,
                                instructions: req.notes,
                                asignee: req.assigned_to_details?.username,
                                feedback: req.feedback,
                                originalData: req // Keep original data for robust usage
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

    // Upload functionality
    const [uploadSelectedFiles, setUploadSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [contentFolderId, setContentFolderId] = useState(null);
    const CREATED_CONTENT_FOLDER_NAME = "Created";
    const API_BASE = 'http://localhost:8000/api';
    const [csrfToken, setCsrfToken] = useState('');

    // Reset inputs when active item changes
    React.useEffect(() => {
        if (items[activeItemIndex]) {
            // If the item already has these fields (e.g. if we fetched them), load them
            // For now, assuming we start fresh or from previous props if available
            setContentText(items[activeItemIndex].originalData?.content_text || "");
            setAiCaption(items[activeItemIndex].originalData?.ai_caption || "");

            // Reset Image Selection State
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
        }
    }, [activeItemIndex, items]);

    const activeItem = items[activeItemIndex] || {};
    const isAdhoc = activeItem.type === 'adhoc_request';

    // Mock ID for the current item
    const currentId = isAdhoc ? `REQ-${activeItem.id}`.slice(0, 12) : "IMG-2024-00" + (5 - steps[currentStepIndex].count);

    const updateRequestStatus = async (id, status, extraData = {}) => {
        try {
            const userId = localStorage.getItem('userId');
            const updateUrl = new URL(`http://localhost:8000/api/contents/monthly-requests/${id}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);

            await fetch(updateUrl.toString(), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, ...extraData })
            });

            // If we updated the image, we should update the local state to reflect it immediately
            if (extraData.linked_image) {
                setItems(prev => prev.map(item => {
                    if (item.id === id) {
                        // We need the full image object to display it properly, 
                        // but extraData only has the ID. 
                        // For now, relying on the 'foundImage' state to update the view or fetching again would be better.
                        // Let's manually patch the originalData.linked_image_details with foundImage if available.
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

            const url = new URL(`http://localhost:8000/api/gallery/images/search/`);
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

            const url = new URL(`http://localhost:8000/api/gallery/clients/${activeItem.originalData.client}/folders/`);
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

            const url = new URL(`http://localhost:8000/api/gallery/folders/${folderId}/images/`);
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
        // Update the request with the new image ID
        await updateRequestStatus(activeItem.id, activeItem.status, { linked_image: image.id });

        // Update local state manually to reflect change immediately without full reload
        setItems(prev => prev.map(item => {
            if (item.id === activeItem.id) {
                return {
                    ...item,
                    originalData: {
                        ...item.originalData,
                        linked_image: image.id,
                        linked_image_details: image
                    }
                };
            }
            return item;
        }));

        setIsImageSelectionOpen(false);
        // Reset selection state
        setFoundImage(null);
        setSelectedFolderId(null);
        setFolderImages([]);

        alert("Image updated successfully!");
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

    const handleUploadNewImage = async () => {
        if (uploadSelectedFiles.length === 0) {
            alert('Por favor selecciona al menos una imagen');
            return;
        }

        setIsUploading(true);
        try {
            // 1. Obtener o crear carpeta "Created"
            const folderId = await findOrCreateContentFolder(activeItem.originalData.client);

            // 2. Preparar FormData con las imágenes
            const formData = new FormData();
            uploadSelectedFiles.forEach(file => {
                formData.append('images', file);
            });

            // 3. Subir imágenes
            const uploadResponse = await fetch(
                `${API_BASE}/gallery/folders/${folderId}/images/upload/`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                    body: formData,
                }
            );

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const uploadResult = await uploadResponse.json();
            const uploadedImages = uploadResult.images || [uploadResult];

            // 4. Vincular primera imagen al request
            if (uploadedImages.length > 0) {
                const firstImage = uploadedImages[0];

                // Actualizar request con imagen vinculada
                const updateResponse = await fetch(
                    `${API_BASE}/contents/monthly-requests/${activeItem.id}/`,
                    {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,
                        },
                        body: JSON.stringify({
                            status: activeItem.originalData.status,
                            linked_image: firstImage.id,
                        }),
                    }
                );

                if (!updateResponse.ok) {
                    throw new Error('Failed to link image');
                }

                // Actualizar estado local
                setItems(prevItems =>
                    prevItems.map(itm =>
                        itm.id === activeItem.id
                            ? {
                                ...itm,
                                originalData: {
                                    ...itm.originalData,
                                    linked_image: firstImage.id,
                                    linked_image_details: firstImage,
                                },
                            }
                            : itm
                    )
                );
            }

            // 5. Limpiar y cerrar
            setUploadSelectedFiles([]);
            const fileInput = document.getElementById('uploadImageInput');
            if (fileInput) fileInput.value = '';
            setIsImageSelectionOpen(false);

            const folios = uploadedImages.map(img => img.folio).filter(Boolean);
            const folioMsg = folios.length ? ` Folio(s): ${folios.join(', ')}` : '';
            alert(`${uploadedImages.length} image(s) uploaded and linked successfully.${folioMsg}`);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir la imagen. Por favor intenta de nuevo.');
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
                alert('Could not reach backend/Ollama. Verify Django is running on http://localhost:8000 and try again.');
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
            // Logic for completing a request
            // remove item from list
            const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);

            // Adjust active index
            let newIndex = activeItemIndex;
            if (newIndex >= updatedItems.length) {
                newIndex = Math.max(0, updatedItems.length - 1);
            }

            setItems(updatedItems);
            setActiveItemIndex(newIndex);

            // Update status to QA in backend with content
            updateRequestStatus(activeItem.id, 'QA', dataToUpdate);

            if (updatedItems.length === 0) {
                alert("All pending items reviewed!");
            }
            return;
        }

        // Logic for Monthly Client Stepper
        const currentStepKey = steps[currentStepIndex].id;

        if (counts[currentStepKey] > 1) {
            setCounts(prev => ({
                ...prev,
                [currentStepKey]: prev[currentStepKey] - 1
            }));
            // We should probably save the content for this specific item/step, but for now
            // as per simplified requirements, we are updating the request itself.
            // CAUTION: If we update the request on every step, we overwrite. 
            // The user request implies "resolve a content request... what was written... has to appear".
            // Since Monthly Request is one big object for the whole month, this might be tricky if there are multiple assets.
            // But the current implementation seems to treat the whole "Request" as one item in the sidebar, 
            // even though the counters imply multiple assets.
            // Ideally, we'd have a separate model for ContentItem.
            // But I will stick to the requested scope: save what is written when "Resolving".

            // However, the "Approve & Next" button is here.
            // If I save now, it overwrites.
            // But since I don't have a ContentItem model, I will update the MonthlyRequest.
            // This might mean only the LAST written content is saved if multiple assets are made.
            // Given the constraints and the user prompt "what was written... has to appear", I will save it.
            updateRequestStatus(activeItem.id, 'IN_PROGRESS', dataToUpdate); // Keep it safe or update partial?
            // Actually, the user says "resolved a content request", which implies finishing it.
            // Finishing happens when `counts` reach 0 or `Finish All`.

            // For now, I will clear the inputs for the next asset to simulate fresh start,
            // but I can't really "save" multiple contents without a new model.
            // I will assume the prompt refers to the Request level text.
            setContentText("");
            setAiCaption("");

        } else {
            if (currentStepIndex < steps.length - 1) {
                setCounts(prev => ({ ...prev, [currentStepKey]: 0 }));
                setCurrentStepIndex(prev => prev + 1);
                setContentText(""); // Clear for next step
                setAiCaption("");
            } else {
                setCounts(prev => ({ ...prev, [currentStepKey]: 0 }));

                // Remove item from list
                const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);

                // Adjust active index
                let newIndex = activeItemIndex;
                if (newIndex >= updatedItems.length) {
                    newIndex = Math.max(0, updatedItems.length - 1);
                }

                setItems(updatedItems);
                setActiveItemIndex(newIndex);

                // Update status to QA in backend
                updateRequestStatus(activeItem.id, 'QA', dataToUpdate);

                // Reset internal steps for the new item now at activeItemIndex
                if (updatedItems.length > 0) {
                    setCounts({ photos: 4, carousels: 4, videos: 4, stories: 4 });
                    setCurrentStepIndex(0);
                    // Content fields will be reset by useEffect
                } else {
                    alert("All clients completed!");
                }
            }
        }
    };

    return (
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
                                src={`http://localhost:8000${activeItem.originalData.client_details.client_profile.logo}`}
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

                            <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-6 ${isSidebarCollapsed ? 'px-3 overflow-x-hidden' : 'px-4'}`}>
                                {items.map((item, index) => {
                                    const isActive = index === activeItemIndex;
                                    const isRequest = item.type === 'adhoc_request';
                                    const isReturned = item.status === 'IN_REVISION';

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (index !== activeItemIndex) {
                                                    setActiveItemIndex(index);
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
                                                        : isReturned
                                                            ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                                            : isRequest
                                                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-600'
                                                                : 'border-border bg-slate-50 dark:bg-slate-900 text-muted-foreground group-hover:bg-white'}
                                    `}>
                                                {item.completed ? <Check size={16} strokeWidth={3} /> : <span className="text-sm font-black">{isReturned ? '!' : (isRequest ? 'R' : index + 1)}</span>}
                                            </div>

                                            {!isSidebarCollapsed && (
                                                <div className="flex flex-col min-w-0 z-10">
                                                    <span className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                        {item.name}
                                                    </span>
                                                    <span className={`text-[11px] font-medium truncate mt-0.5 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        {item.completed ? 'Completed' : isActive ? 'Reviewing' : isReturned ? 'Returned by QA' : isRequest ? 'Adhoc Request' : 'Monthly Plan'}
                                                    </span>
                                                </div>
                                            )}

                                            {!isSidebarCollapsed && isActive && (
                                                <ChevronRight size={18} className="text-primary-foreground/50 ml-auto" />
                                            )}
                                        </div>
                                    );
                                })}
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

                                        {/* Visualizer Frame */}
                                        <div className="flex-1 bg-secondary/30 rounded-3xl border border-border/50 relative flex items-center justify-center overflow-hidden group min-h-[350px] shadow-inner">

                                            {/* Pattern Overlay */}
                                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                            {/* ID Badge */}
                                            <div className="absolute top-6 left-6 bg-card/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-sm z-20">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Asset ID</span>
                                                <span className="text-sm font-black text-foreground">{currentId}</span>
                                            </div>

                                            {/* Content Container */}
                                            <div className="w-[85%] h-[85%] bg-card rounded-2xl border border-border shadow-2xl shadow-black/5 flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-xl">
                                                {activeItem.originalData?.linked_image_details?.image_url ? (
                                                    <img
                                                        src={activeItem.originalData.linked_image_details.image_url}
                                                        alt={activeItem.originalData.linked_image_details.title || "Reference Image"}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-center p-8">
                                                        <div className="w-24 h-24 bg-secondary/50 rounded-full mx-auto mb-6 flex items-center justify-center text-muted-foreground">
                                                            <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-foreground mb-1">Content Preview</h4>
                                                        <p className="text-sm text-muted-foreground">Linked media will appear here</p>
                                                    </div>
                                                )}

                                                {/* Change Image Button Overlay */}
                                                <div className="absolute top-4 right-4 z-30">
                                                    <button
                                                        onClick={() => {
                                                            setIsImageSelectionOpen(true);
                                                            // Fetch folders initially just in case they want to switch mode
                                                            fetchClientFolders();
                                                        }}
                                                        className="flex items-center gap-2 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg border border-white/10"
                                                    >
                                                        <RefreshCw size={12} />
                                                        {activeItem.originalData?.linked_image_details ? 'Change Image' : 'Select Image'}
                                                    </button>
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
                                                                        accept="image/*"
                                                                        onChange={handleUploadFileSelect}
                                                                        className="hidden"
                                                                    />
                                                                    <label htmlFor="uploadImageInput" className="cursor-pointer block">
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                                <Upload className="text-primary" size={32} />
                                                                            </div>
                                                                            <p className="font-bold text-foreground">Click to select images</p>
                                                                            <p className="text-sm text-muted-foreground mt-1">Images will be saved in the client's \"Created\" folder</p>
                                                                        </div>
                                                                    </label>

                                                                    {uploadSelectedFiles.length > 0 && (
                                                                        <div className="mt-6 pt-6 border-t border-primary/10">
                                                                            <p className="text-sm font-bold mb-3">
                                                                                Selected: {uploadSelectedFiles.length} image(s)
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

                                                    {/* QA Feedback Display */}
                                                    {activeItem.feedback && (
                                                        <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10">
                                                            <label className="text-[11px] font-bold text-destructive uppercase tracking-widest block mb-2">QA Feedback</label>
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
                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md uppercase tracking-wider inline-block mb-3">
                                                        Editing {steps[currentStepIndex].label.slice(0, -1)}
                                                    </span>
                                                    <h3 className="text-2xl font-black text-foreground">Customize Details</h3>
                                                </div>

                                                <div className="space-y-5 flex-1">

                                                    {/* QA Feedback Display for Monthly Content */}
                                                    {activeItem.feedback && (
                                                        <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10">
                                                            <label className="text-[11px] font-bold text-destructive uppercase tracking-widest block mb-1">QA Feedback</label>
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
    );
}
