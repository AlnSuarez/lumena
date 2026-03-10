"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Mail, Phone, RefreshCw, Stethoscope } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
};

export default function LetsTalkAdminPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState(null);

  const loadSubmissions = async ({ silent = false } = {}) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const url = new URL(`${API_BASE}/contents/lets-talk/admin/`);
      url.searchParams.append("user_id", userId);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to load submissions");

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading lets-talk submissions:", error);
      alert("Could not load Let’s Talk submissions.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredItems = useMemo(() => {
    if (statusFilter === "PENDING") return items.filter((item) => !item.reviewed);
    if (statusFilter === "REVIEWED") return items.filter((item) => item.reviewed);
    return items;
  }, [items, statusFilter]);

  const markReviewed = async (id, reviewed) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setSavingId(id);
    try {
      const url = new URL(`${API_BASE}/contents/lets-talk/admin/${id}/reviewed/`);
      url.searchParams.append("user_id", userId);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewed }),
      });

      if (!response.ok) throw new Error("Failed to update reviewed state");

      const updated = await response.json();
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error("Error updating reviewed state:", error);
      alert("Could not update submission status.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col px-0 py-2 h-full">
      <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Let&apos;s Talk Submissions</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              New contact requests from the public landing page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground outline-none"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
            </select>

            <button
              onClick={() => loadSubmissions({ silent: true })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 rounded-2xl border border-border bg-card flex items-center justify-center text-muted-foreground">
            Loading submissions...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 rounded-2xl border border-border bg-card flex items-center justify-center text-muted-foreground">
            No submissions found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                      item.reviewed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.reviewed ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                    {item.reviewed ? "Reviewed" : "Pending"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-foreground md:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Mail size={15} className="text-muted-foreground" />
                    {item.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={15} className="text-muted-foreground" />
                    {item.phone || "-"}
                  </p>
                  <p className="flex items-center gap-2 md:col-span-2">
                    <Stethoscope size={15} className="text-muted-foreground" />
                    {item.specialty || "-"}
                  </p>
                </div>

                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.message || "No message provided."}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => markReviewed(item.id, true)}
                    disabled={savingId === item.id || item.reviewed}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Mark as reviewed
                  </button>
                  <button
                    onClick={() => markReviewed(item.id, false)}
                    disabled={savingId === item.id || !item.reviewed}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Mark as pending
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
