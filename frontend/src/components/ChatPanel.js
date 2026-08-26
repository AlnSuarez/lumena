"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronLeft, Trash2 } from "lucide-react";
import "./navbar.css";

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
        <div className="nb-slot">
            <button
                type="button"
                className={`nb-icon-btn${isOpen ? " is-open" : ""}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setView("list");
                        setActiveContact(null);
                        setDeleteConfirm(false);
                        initializedRef.current = false;
                    }
                }}
                aria-label="Chat"
                aria-expanded={isOpen}
            >
                <MessageCircle size={16} />
                {totalUnread > 0 && (
                    <span className="nb-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>
                )}
            </button>

            {isOpen && (
                <div className="nb-panel">
                    {view === "list" && (
                        <>
                            <div className="nb-panel__head">
                                <div>
                                    <h3>Chats</h3>
                                    <p>{contacts.length} {contacts.length === 1 ? "client" : "clients"}</p>
                                </div>
                                <button type="button" className="nb-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="nb-panel__body">
                                {contacts.length === 0 ? (
                                    <div className="nb-empty">
                                        <div className="nb-empty__icon"><MessageCircle size={18} /></div>
                                        <strong>No conversations</strong>
                                        <p>Clients appear here when they send a message.</p>
                                    </div>
                                ) : (
                                    contacts.map((c) => (
                                        <div key={c.contact_id} className="nb-contact">
                                            <button type="button" className="nb-contact__btn" onClick={() => openChat(c)}>
                                                <span className="nb-mini-avatar">
                                                    {c.contact_name?.[0]?.toUpperCase() || "?"}
                                                </span>
                                                <span className="nb-contact__meta">
                                                    <strong>{c.contact_name}</strong>
                                                    <span>{c.last_message || "No messages"}</span>
                                                </span>
                                                {(c.unread_count || 0) > 0 && <span className="nb-contact__unread" />}
                                            </button>
                                            <button
                                                type="button"
                                                className="nb-contact__del"
                                                title="Delete conversation"
                                                aria-label="Delete conversation"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Delete conversation with ${c.contact_name}?`)) {
                                                        await deleteConversation(c.contact_id);
                                                        fetchContacts();
                                                    }
                                                }}
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
                            <div className="nb-chat-head">
                                {isAdmin && (
                                    <button type="button" className="nb-icon-btn" onClick={backToList} aria-label="Back to chats">
                                        <ChevronLeft size={16} />
                                    </button>
                                )}
                                <span className="nb-mini-avatar">{activeContact.contact_name?.[0]?.toUpperCase() || "?"}</span>
                                <div className="nb-chat-head__who">
                                    <h4>{isClient ? "Chat with your team" : activeContact.contact_name}</h4>
                                    <p>Online</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="nb-icon-btn"
                                        onClick={() => setDeleteConfirm(true)}
                                        title="Delete conversation"
                                        aria-label="Delete conversation"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="nb-icon-btn"
                                    onClick={() => { setIsOpen(false); backToList(); }}
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="nb-messages">
                                {deleteConfirm && (
                                    <div className="nb-inline-warn">
                                        <p>Delete the conversation with {activeContact.contact_name}?</p>
                                        <button type="button" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                                        <button type="button" className="nb-btn" onClick={handleDeleteConversation}>Delete</button>
                                    </div>
                                )}
                                {loading ? (
                                    <div className="nb-empty"><strong>Loading…</strong></div>
                                ) : messages.length === 0 ? (
                                    <div className="nb-empty">
                                        <div className="nb-empty__icon"><MessageCircle size={18} /></div>
                                        <strong>Start the conversation</strong>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMine = String(msg.sender) === String(userInfo.userId);
                                        const showDate = i === 0
                                            || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="nb-day"><span>{formatDate(msg.created_at)}</span></div>
                                                )}
                                                <div className={`nb-bubble-row${isMine ? " is-mine" : ""}`}>
                                                    <div className="nb-bubble">
                                                        {!isMine && msg.sender_role !== "CLIENT" && (
                                                            <p className="nb-bubble__from">{msg.sender_name}</p>
                                                        )}
                                                        <p>{msg.message}</p>
                                                        <small>{formatTime(msg.created_at)}</small>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSend} className="nb-compose">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message…"
                                    aria-label="Message"
                                />
                                <button type="submit" disabled={!newMessage.trim()} aria-label="Send">
                                    <Send size={15} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
