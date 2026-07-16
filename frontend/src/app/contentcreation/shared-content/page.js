"use client";

import { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, File, FileImage, Video, FileSpreadsheet, FileType } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

function formatSize(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
}

function getFileIcon(fileType, isImage, isVideo, isPdf) {
    if (isImage) return <FileImage size={32} className="text-blue-500" />;
    if (isVideo) return <Video size={32} className="text-purple-500" />;
    if (isPdf) return <FileType size={32} className="text-red-500" />;
    if (fileType && ["doc", "docx"].includes(fileType)) return <FileText size={32} className="text-blue-600" />;
    if (fileType && ["xls", "xlsx", "csv"].includes(fileType)) return <FileSpreadsheet size={32} className="text-emerald-600" />;
    return <File size={32} className="text-muted-foreground" />;
}

function getFileLabel(fileType) {
    const labels = { pdf: "PDF", doc: "DOC", docx: "DOCX", xls: "XLS", xlsx: "XLSX", csv: "CSV", ppt: "PPT", pptx: "PPTX", txt: "TXT", zip: "ZIP", rar: "RAR", mp3: "MP3", wav: "WAV", mp4: "MP4", mov: "MOV", jpg: "JPG", jpeg: "JPEG", png: "PNG", gif: "GIF" };
    return labels[fileType] || fileType?.toUpperCase() || "FILE";
}

export default function SharedContentPage() {
    const [sharedDocuments, setSharedDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    useEffect(() => {
        const fetchSharedDocuments = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) { setLoadingDocs(false); return; }
            try {
                const response = await fetch(`${API_BASE}/gallery/clients/${userId}/shared-content/images/`);
                if (response.ok) {
                    const docs = await response.json();
                    setSharedDocuments(docs);
                }
            } catch (error) {
                console.error("Error loading shared documents:", error);
            } finally {
                setLoadingDocs(false);
            }
        };

        fetchSharedDocuments();
    }, []);

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Shared Content</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Documents and files shared by your team.</p>
                    </div>
                </div>

                <div className="h-px bg-border mb-6" />

                <div className="flex-1 overflow-y-auto min-h-0">
                    {loadingDocs ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading documents...</div>
                    ) : sharedDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText size={64} className="text-muted-foreground/30 mb-4 animate-pulse" />
                            <p className="text-foreground text-xl font-semibold">No shared documents yet</p>
                            <p className="text-muted-foreground/60 mt-2 max-w-sm">Documents and assets shared by our team with you will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pr-1">
                            {sharedDocuments.map((doc) => {
                                const isDoc = doc._type === 'document';
                                const isImage = isDoc ? doc.is_image : true;
                                const isVideo = isDoc ? doc.is_video : false;
                                const isPdf = isDoc ? doc.is_pdf : false;
                                const fileUrl = isDoc ? doc.file_url : (doc.image_url_original || doc.image_url);
                                const thumbUrl = isDoc ? doc.file_url : doc.image_url;

                                return (
                                    <div
                                        key={`${isDoc ? 'd' : 'i'}-${doc.id}`}
                                        className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="aspect-[4/3] bg-muted relative overflow-hidden shrink-0">
                                            {isImage ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt={doc.title || "Shared"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : isVideo ? (
                                                <video
                                                    src={fileUrl}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                    preload="metadata"
                                                />
                                            ) : isPdf ? (
                                                <iframe
                                                    src={fileUrl}
                                                    className="w-full h-full border-0"
                                                    title={doc.title || "PDF"}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-background/80">
                                                    {getFileIcon(doc.file_type, false, false, false)}
                                                    <span className="text-xs font-bold text-muted-foreground">{getFileLabel(doc.file_type)}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-black/60 text-white rounded-full hover:bg-primary backdrop-blur-md transition-all shadow-lg"
                                                    title="Open"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <a
                                                    href={fileUrl}
                                                    download
                                                    className="p-2 bg-black/60 text-white rounded-full hover:bg-primary backdrop-blur-md transition-all shadow-lg"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate" title={doc.title}>
                                                    {doc.title || "Untitled"}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground mt-1">
                                                    {getFileLabel(doc.file_type || "img")} {doc.file_size ? `· ${formatSize(doc.file_size)}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
