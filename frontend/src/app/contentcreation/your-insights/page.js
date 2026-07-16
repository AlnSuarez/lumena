"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, HelpCircle, FileText, Download, ExternalLink, File, FileImage, Video, FileSpreadsheet, FileType } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const fallbackData = {
    timeframe: "Last 30 days",
    performance_snapshot: [
        "Posting consistency: On track",
        "Content focus: Educational + Authority",
        "Engagement trend: Improving",
        "Platform focus: Primary focus on Instagram",
    ],
    opportunity_title: "Opportunity Insight",
    opportunity_description: "Short Q&A-style videos are generating the most shares and saves.",
    focus_next_month: [
        "Produce more Q&A style videos",
        "Strengthen thought-leadership content",
        "Continue building Instagram presence",
    ],
};

const normalizeData = (raw) => {
    const safe = raw && typeof raw === "object" ? raw : {};
    return {
        timeframe: safe.timeframe || fallbackData.timeframe,
        performance_snapshot: Array.isArray(safe.performance_snapshot) && safe.performance_snapshot.length > 0
            ? safe.performance_snapshot
            : fallbackData.performance_snapshot,
        opportunity_title: safe.opportunity_title || fallbackData.opportunity_title,
        opportunity_description: safe.opportunity_description || fallbackData.opportunity_description,
        focus_next_month: Array.isArray(safe.focus_next_month) && safe.focus_next_month.length > 0
            ? safe.focus_next_month
            : fallbackData.focus_next_month,
    };
};

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

export default function YourInsightsPage() {
    const [data, setData] = useState(fallbackData);
    const [sharedDocuments, setSharedDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDocs, setLoadingDocs] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/users/manage/`);
                if (!response.ok) { setLoading(false); return; }
                const users = await response.json();
                const currentUser = users.find((u) => String(u.id) === String(userId));
                setData(normalizeData(currentUser?.insights_metrics));
            } catch (error) {
                console.error("Error loading insights data:", error);
            } finally {
                setLoading(false);
            }
        };

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

        fetchInsights();
        fetchSharedDocuments();
    }, []);

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Your Insights</h1>
                        <p className="text-muted-foreground mt-2 text-lg">An overview of your recent performance and strategy focus.</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground inline-flex items-center gap-2">
                        {data.timeframe}
                        <ChevronDown size={16} />
                    </button>
                </div>

                <div className="h-px bg-border mb-6" />

                {loading ? (
                    <div className="flex-1 grid place-items-center text-muted-foreground">Loading insights...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-6 pb-2">
                        <h2 className="text-2xl font-bold text-foreground">Performance Snapshot</h2>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                {(data.performance_snapshot || []).map((item, idx) => (
                                    <div key={`snapshot-${idx}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${idx !== 0 ? "border-t border-border" : ""}`}>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                            <p className="text-foreground text-lg">{item}</p>
                                        </div>
                                        <ChevronDown size={16} className="text-muted-foreground" />
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-5">
                                <h3 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <FileText className="text-primary" size={28} />
                                    Shared Documents
                                </h3>
                                {loadingDocs ? (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">Loading documents...</div>
                                ) : sharedDocuments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <FileText size={40} className="text-muted-foreground/30 mb-3" />
                                        <p className="text-muted-foreground">No shared documents yet</p>
                                        <p className="text-muted-foreground/60 text-sm mt-1">Documents shared by your team will appear here</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
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
                                                    className="group rounded-xl border border-border bg-background/60 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
                                                >
                                                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
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
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-primary backdrop-blur-sm transition-all"
                                                                title="Open"
                                                            >
                                                                <ExternalLink size={14} />
                                                            </a>
                                                            <a
                                                                href={fileUrl}
                                                                download
                                                                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-primary backdrop-blur-sm transition-all"
                                                                title="Download"
                                                            >
                                                                <Download size={14} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5 flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-foreground truncate" title={doc.title}>
                                                                {doc.title || "Untitled"}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
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

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div>
                                <h3 className="text-3xl font-bold text-foreground mb-3">{data.opportunity_title}</h3>
                                <div className="rounded-2xl border border-border overflow-hidden">
                                    <div className="bg-muted px-6 py-5 text-2xl font-semibold text-foreground leading-tight">
                                        {data.opportunity_description}
                                    </div>
                                    <div className="bg-card px-6 py-4 text-base text-muted-foreground">
                                        Patients are responding well to short, engaging videos where you answer common questions in a Q&A style.
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-bold text-foreground mb-4">Focus for Next Month</h3>
                                <div className="space-y-3">
                                    {(data.focus_next_month || []).map((item, idx) => (
                                        <div key={`focus-${idx}`} className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                            <p className="text-foreground text-xl">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                    <button className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
                        <HelpCircle size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        className="flex-1 h-12 rounded-xl border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    />
                    <button className="h-12 px-8 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
