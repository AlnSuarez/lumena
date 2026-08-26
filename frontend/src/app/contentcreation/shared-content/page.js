"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Download,
    ExternalLink,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileType,
    Folder,
    RefreshCw,
    Video,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./shared-content.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

const KINDS = [
    { id: "ALL", label: "All", meaning: "Everything shared" },
    { id: "image", label: "Images", meaning: "Photos and stills" },
    { id: "video", label: "Videos", meaning: "Clips to review" },
    { id: "file", label: "Documents", meaning: "PDFs and files" },
];

const FILE_LABELS = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOCX",
    xls: "XLS",
    xlsx: "XLSX",
    csv: "CSV",
    ppt: "PPT",
    pptx: "PPTX",
    txt: "TXT",
    zip: "ZIP",
    rar: "RAR",
    mp3: "MP3",
    wav: "WAV",
    mp4: "MP4",
    mov: "MOV",
    jpg: "JPG",
    jpeg: "JPEG",
    png: "PNG",
    gif: "GIF",
    webp: "WEBP",
};

function formatSize(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i += 1;
    }
    return `${size.toFixed(1)} ${units[i]}`;
}

function fileLabel(fileType) {
    return FILE_LABELS[fileType] || fileType?.toUpperCase() || "FILE";
}

function classify(doc) {
    const isDoc = doc._type === "document";
    if (isDoc && doc.is_video) return "video";
    if (isDoc && doc.is_image) return "image";
    if (!isDoc) return "image";
    return "file";
}

function fileUrl(doc) {
    return doc._type === "document"
        ? doc.file_url
        : (doc.image_url_original || doc.image_url);
}

function thumbUrl(doc) {
    return doc._type === "document" ? doc.file_url : doc.image_url;
}

function FileGlyph({ kind, fileType }) {
    if (kind === "image") return <FileImage size={28} />;
    if (kind === "video") return <Video size={28} />;
    if (fileType === "pdf") return <FileType size={28} />;
    if (["doc", "docx"].includes(fileType)) return <FileText size={28} />;
    if (["xls", "xlsx", "csv"].includes(fileType)) return <FileSpreadsheet size={28} />;
    return <File size={28} />;
}

function fileTone(fileType) {
    if (fileType === "pdf") return "pdf";
    if (["doc", "docx"].includes(fileType)) return "doc";
    if (["xls", "xlsx", "csv"].includes(fileType)) return "sheet";
    return "";
}

export default function SharedContentPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [kindFilter, setKindFilter] = useState("ALL");

    const loadDocuments = async ({ silent = false } = {}) => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setLoading(false);
            return;
        }

        if (silent) setRefreshing(true);
        else setLoading(true);
        setLoadError(false);

        try {
            const response = await fetch(
                `${API_BASE}/gallery/clients/${userId}/shared-content/images/`
            );
            if (!response.ok) {
                toast.error("Could not load strategy files.");
                setDocuments([]);
                setLoadError(true);
                return;
            }
            setDocuments(await response.json());
        } catch (error) {
            console.error("Error loading shared documents:", error);
            toast.error("Network error while loading files.");
            setDocuments([]);
            setLoadError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const counts = useMemo(() => ({
        ALL: documents.length,
        image: documents.filter((doc) => classify(doc) === "image").length,
        video: documents.filter((doc) => classify(doc) === "video").length,
        file: documents.filter((doc) => classify(doc) === "file").length,
    }), [documents]);

    const filtered = kindFilter === "ALL"
        ? documents
        : documents.filter((doc) => classify(doc) === kindFilter);

    return (
        <div className="content-board shared-content">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Strategy</h1>
                    <p>Documents and files shared by your team.</p>
                </div>
                <div className="cb-header__actions">
                    <button
                        type="button"
                        className="cb-btn cb-btn--ghost"
                        onClick={() => loadDocuments({ silent: true })}
                        disabled={loading || refreshing}
                    >
                        <RefreshCw size={15} />
                        {refreshing || loading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="cb-summary">
                {KINDS.map((kind) => (
                    <button
                        key={kind.id}
                        type="button"
                        className={`cb-chip${kindFilter === kind.id ? " is-active" : ""}`}
                        onClick={() => setKindFilter(kind.id)}
                    >
                        <span>{kind.label}<small>{kind.meaning}</small></span>
                        <strong>{counts[kind.id]}</strong>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="cb-empty"><strong>Loading files…</strong></div>
            ) : loadError ? (
                <div className="cb-empty">
                    <div className="cb-empty__icon"><Folder size={18} /></div>
                    <strong>Could not load files</strong>
                    <p>Try again in a moment. Your session stays signed in.</p>
                    <button type="button" className="cb-btn cb-btn--ghost" onClick={() => loadDocuments()}>
                        Retry
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="cb-empty">
                    <div className="cb-empty__icon"><Folder size={18} /></div>
                    <strong>{documents.length === 0 ? "No strategy documents yet" : "Nothing in this filter"}</strong>
                    <p>
                        {documents.length === 0
                            ? "Files shared by your team will appear here."
                            : "Try another type."}
                    </p>
                </div>
            ) : (
                <div className="sc-grid">
                    {filtered.map((doc) => {
                        const kind = classify(doc);
                        const href = fileUrl(doc);
                        const preview = thumbUrl(doc);
                        const type = doc.file_type || (kind === "image" ? "img" : "");
                        const tone = fileTone(type);
                        return (
                            <article key={`${doc._type || "item"}-${doc.id}`} className="sc-tile">
                                <div className="sc-preview">
                                    {kind === "image" && preview ? (
                                        <img src={preview} alt={doc.title || "Shared file"} />
                                    ) : kind === "video" && href ? (
                                        <video src={href} muted preload="metadata" />
                                    ) : (
                                        <div className={`sc-file${tone ? ` sc-file--${tone}` : ""}`}>
                                            <FileGlyph kind={kind} fileType={type} />
                                            <span>{fileLabel(type)}</span>
                                        </div>
                                    )}
                                    {href && (
                                        <div className="sc-actions">
                                            <a href={href} target="_blank" rel="noopener noreferrer" title="Open" aria-label="Open file">
                                                <ExternalLink size={14} />
                                            </a>
                                            <a href={href} download title="Download" aria-label="Download file">
                                                <Download size={14} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="sc-meta">
                                    <p title={doc.title}>{doc.title || "Untitled"}</p>
                                    <small>
                                        {fileLabel(type)}
                                        {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""}
                                    </small>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
