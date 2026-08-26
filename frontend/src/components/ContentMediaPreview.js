"use client";

import { ExternalLink, FileText } from "lucide-react";

export function isPdfUrl(value) {
    if (typeof value !== "string" || !value) return false;
    const path = value.toLowerCase().split("?")[0].split("#")[0];
    return path.endsWith(".pdf") || path.includes("/pdfs/");
}

export function isPdfMedia(item, src) {
    if (item?.media_type === "PDF") return true;
    if (item?.file_name && String(item.file_name).toLowerCase().endsWith(".pdf")) return true;
    return isPdfUrl(src) || isPdfUrl(item?.file_url);
}

export function isVideoMedia(item, src) {
    if (item?.media_type === "VIDEO") return true;
    const value = src || item?.file_url;
    if (typeof value !== "string" || !value) return false;
    const path = value.toLowerCase().split("?")[0].split("#")[0];
    return [".mp4", ".mov", ".webm", ".mkv", ".avi"].some((ext) => path.endsWith(ext))
        || value.toLowerCase().includes("/videos/");
}

export default function ContentMediaPreview({
    src,
    item,
    alt = "Media",
    className = "",
    style,
    variant = "full",
    videoProps,
}) {
    const isPdf = isPdfMedia(item, src);
    const isVideo = !isPdf && isVideoMedia(item, src);

    if (isPdf) {
        if (variant === "thumb") {
            return (
                <div
                    className={className}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        gap: 4,
                        background: "rgba(15, 23, 42, 0.06)",
                        color: "inherit",
                        ...style,
                    }}
                >
                    <FileText size={18} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>PDF</span>
                </div>
            );
        }

        return (
            <div
                className={className}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    minHeight: 280,
                    background: "#fff",
                    ...style,
                }}
            >
                {src ? (
                    <iframe
                        title={alt}
                        src={src}
                        style={{ flex: 1, width: "100%", height: "100%", minHeight: 280, border: 0 }}
                    />
                ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#64748b" }}>
                        <FileText size={36} />
                        <p style={{ fontWeight: 700 }}>PDF</p>
                    </div>
                )}
                {src && (
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            position: "absolute",
                            right: 12,
                            bottom: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(15, 23, 42, 0.85)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        <ExternalLink size={13} />
                        Open PDF
                    </a>
                )}
            </div>
        );
    }

    if (!src) return null;

    if (isVideo) {
        return (
            <video
                src={src}
                controls
                playsInline
                className={className}
                style={style}
                {...videoProps}
            />
        );
    }

    return <img src={src} alt={alt} className={className} style={style} />;
}
