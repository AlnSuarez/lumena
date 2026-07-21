"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronLeft, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({ userId: "", name: "", role: "" });
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("list");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const initializedRef = useRef(false);

    const isAdmin = ["SUPERUSER", "ADMIN"].includes(userInfo.role);
    const isClient = userInfo.role === "CLIENT";

    const buildUrl = useCallback((path) => {
        const url = new URL(`${API_BASE}${path}`);
        if (userInfo.userId) url.searchParams.append("user_id", userInfo.userId);
        return url.toString();
    }, [userInfo.userId]);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch(buildUrl("/api/chat/contacts/"), { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (e) {
            console.error("Error fetching contacts:", e);
        }
    }, [buildUrl]);

    const fetchMessages = useCallback(async (contactId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(buildUrl(`/api/chat/messages/${contactId}/`), { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
        if (!silent) setLoading(false);
    }, [buildUrl]);

    const markRead = useCallback(async (contactId) => {
        await fetch(buildUrl(`/api/chat/messages/${contactId}/read/`), {
            method: "PATCH",
            credentials: "include"
        }).catch(() => {});
    }, [buildUrl]);

    const deleteConversation = useCallback(async (contactId) => {
        try {
            const res = await fetch(buildUrl(`/api/chat/conversations/${contactId}/delete/`), {
                method: "DELETE",
                credentials: "include"
            });
            return res.ok;
        } catch (e) {
            console.error("Error deleting conversation:", e);
            return false;
        }
    }, [buildUrl]);

    useEffect(() => {
        setUserInfo({
            userId: localStorage.getItem("userId") || "",
            name: localStorage.getItem("username") || "",
            role: localStorage.getItem("userRole") || ""
        });
    }, []);

    useEffect(() => {
        if (!userInfo.role || !isOpen) return;
        fetchContacts();
        pollRef.current = setInterval(fetchContacts, 10000);
        return () => clearInterval(pollRef.current);
    }, [userInfo.role, isOpen, fetchContacts]);

    useEffect(() => {
        if (!contacts.length || !isOpen || initializedRef.current) return;

        if (isClient && contacts.length === 1) {
            setView("chat");
            setActiveContact(contacts[0]);
            initializedRef.current = true;
        }
    }, [contacts, isOpen, isClient]);

    useEffect(() => {
        if (activeContact && isOpen) {
            fetchMessages(activeContact.contact_id);
            markRead(activeContact.contact_id);
            const msgPoll = setInterval(() => fetchMessages(activeContact.contact_id, true), 5000);
            return () => clearInterval(msgPoll);
        }
    }, [activeContact, isOpen, fetchMessages, markRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openChat = async (contact) => {
        setActiveContact(contact);
        setView("chat");
        await markRead(contact.contact_id);
    };

    const backToList = () => {
        setView("list");
        setActiveContact(null);
        setMessages([]);
        setDeleteConfirm(false);
        initializedRef.current = false;
        fetchContacts();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;
        const payload = {
            message: newMessage.trim(),
            user_id: userInfo.userId
        };
        if (isAdmin) {
            payload.client = activeContact.contact_id;
        }
        setNewMessage("");
        try {
            const res = await fetch(buildUrl("/api/chat/send/"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
            }
        } catch (e) {
            console.error("Error sending message:", e);
        }
    };

    const handleDeleteConversation = async () => {
        if (!activeContact) return;
        const ok = await deleteConversation(activeContact.contact_id);
        if (ok) {
            setDeleteConfirm(false);
            backToList();
        }
    };

    const totalUnread = contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    if (!isAdmin && !isClient) return null;

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return "Today";
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setView("list");
                        setActiveContact(null);
                        setDeleteConfirm(false);
                        initializedRef.current = false;
                    }
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${
                    isOpen
                        ? "bg-primary/10 text-primary"
                        : "bg-white/50 border border-primary/10 text-gray-500 hover:text-primary hover:bg-white dark:hover:text-primary"
                }`}
            >
                <MessageCircle size={20} />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                        {totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-96 max-h-[560px] overflow-hidden flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-primary/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 z-50">
                    {view === "list" && (
                        <>
                            <div className="p-5 border-b border-primary/5 bg-primary/5 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">Chats</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {contacts.length} client{contacts.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/50 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-2 space-y-1">
                                {contacts.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 px-8">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MessageCircle size={24} />
                                        </div>
                                        <p className="font-medium text-sm text-slate-600">No conversations</p>
                                        <p className="text-xs mt-1 text-slate-400">Clients will appear here when they send messages.</p>
                                    </div>
                                ) : (
                                    contacts.map(c => (
                                        <div key={c.contact_id} className="flex items-center gap-1 group">
                                            <button
                                                onClick={() => openChat(c)}
                                                className="flex-1 p-3 flex items-center gap-3 rounded-2xl hover:bg-primary/5 transition-all text-left"
                                            >
                                                <div className="relative shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">
                                                            {c.contact_name?.[0]?.toUpperCase() || "?"}
                                                        </span>
                                                    </div>
                                                    {(c.unread_count || 0) > 0 && (
                                                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                                            {c.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 truncate">
                                                        {c.contact_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {c.last_message || "No messages"}
                                                    </p>
                                                </div>
                                                {(c.unread_count || 0) > 0 && (
                                                    <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                                                )}
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Delete conversation with ${c.contact_name}?`)) {
                                                        await deleteConversation(c.contact_id);
                                                        fetchContacts();
                                                    }
                                                }}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                title="Delete conversation"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {view === "chat" && activeContact && (
                        <>
                            <div className="p-4 border-b border-primary/5 bg-primary/5 flex items-center gap-3 shrink-0">
                                {isAdmin && (
                                    <button
                                        onClick={backToList}
                                        className="p-1 hover:bg-white/50 rounded-full text-slate-400 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                )}
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">
                                        {activeContact.contact_name?.[0]?.toUpperCase() || "?"}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800">
                                            {isClient ? "Chat with your team" : activeContact.contact_name}
                                        </h4>
                                        <p className="text-[10px] text-slate-400">Online</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setDeleteConfirm(true)}
                                        className="p-1.5 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete conversation"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsOpen(false); backToList(); }}
                                    className="p-1.5 hover:bg-white/50 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[360px]">
                                {deleteConfirm && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
                                        <p className="text-xs text-red-700 flex-1">
                                            {`Delete entire conversation with ${activeContact.contact_name}?`}
                                        </p>
                                        <button
                                            onClick={() => setDeleteConfirm(false)}
                                            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteConversation}
                                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <MessageCircle size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm">Start the conversation</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMine = String(msg.sender) === String(userInfo.userId);
                                        const showDate = i === 0 ||
                                            new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="flex justify-center">
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                            {formatDate(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                                        isMine
                                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md"
                                                    }`}>
                                                        {!isMine && msg.sender_role !== "CLIENT" && (
                                                            <p className="text-[10px] font-bold text-primary mb-0.5">
                                                                {msg.sender_name}
                                                            </p>
                                                        )}
                                                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                        <span className={`text-[10px] mt-1 block ${
                                                            isMine ? "text-primary-foreground/80" : "text-slate-400"
                                                        }`}>
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSend} className="p-3 border-t border-primary/5 flex items-center gap-2 shrink-0">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
