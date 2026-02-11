"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Camera, Calendar, AlertCircle, Loader2, Video } from "lucide-react";

const API_URL = "http://localhost:8000/api/contents/monthly-requests/";

const statusStyles = {
    TO_DO: "bg-slate-100 text-slate-700 border-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
    QA: "bg-indigo-100 text-indigo-700 border-indigo-200",
    IN_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
    DONE: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

function getStatusLabel(status) {
    if (!status) return "Unknown";
    return status.replaceAll("_", " ");
}

export default function VideoShootsPage() {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchShoots = async () => {
            setIsLoading(true);
            setError("");

            const userId = localStorage.getItem("userId");
            const userRole = localStorage.getItem("userRole");

            if (!userId || !userRole) {
                window.location.href = "/login";
                return;
            }

            try {
                const url = new URL(API_URL);
                url.searchParams.append("user_id", userId);
                url.searchParams.append("role", userRole);

                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error("Failed to fetch video shoots");
                }

                const data = await response.json();
                const onlyVideoShoots = data.filter((item) => item.request_type === "VIDEO_SHOOT");
                setRequests(onlyVideoShoots);
            } catch (err) {
                console.error("Error loading video shoots:", err);
                setError("No se pudieron cargar los video shoots.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShoots();
    }, []);

    const orderedRequests = useMemo(() => {
        return [...requests].sort((a, b) => {
            const aDate = a.updated_at || a.created_at || "";
            const bDate = b.updated_at || b.created_at || "";
            return String(bDate).localeCompare(String(aDate));
        });
    }, [requests]);

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 pl-1 border-l-4 border-primary">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Video Shoots</h1>
                    <p className="mt-2 text-muted-foreground text-lg">
                        Gestiona y revisa solicitudes de grabacion en un solo lugar.
                    </p>
                </div>

                {isLoading && (
                    <div className="bg-card border border-border rounded-3xl p-12 flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="font-semibold">Cargando video shoots...</span>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {!isLoading && !error && orderedRequests.length === 0 && (
                    <div className="bg-card border border-border rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <Camera size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Sin pendientes</h2>
                        <p className="text-muted-foreground font-medium">No hay video shoots para mostrar en este momento.</p>
                    </div>
                )}

                {!isLoading && !error && orderedRequests.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {orderedRequests.map((request) => {
                            const statusClass = statusStyles[request.status] || "bg-slate-100 text-slate-700 border-slate-200";
                            const clientName =
                                request.client_details?.client_profile?.practice_name ||
                                request.client_details?.username ||
                                `Client #${request.client}`;

                            return (
                                <article
                                    key={request.id}
                                    className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Video size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-bold text-foreground text-sm truncate">{clientName}</h2>
                                                <p className="text-xs text-muted-foreground">Request #{request.id}</p>
                                            </div>
                                        </div>

                                        <span className={`text-[11px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
                                            {getStatusLabel(request.status)}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1.5 rounded-lg">
                                            <Calendar size={13} />
                                            <span className="font-semibold">{request.month || "No month"}</span>
                                        </div>

                                        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 min-h-[5rem]">
                                            {request.notes || "Sin notas disponibles para este video shoot."}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
