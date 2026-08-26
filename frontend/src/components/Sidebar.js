"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import {
    FileText,
    Calendar,
    CheckSquare,
    Users,
    Camera,
    Send,
    Layout,
    UserPlus,
    Palette,
    Images,
    BarChart3,
    ClipboardList,
    Mail,
    Clock,
    Folder,
    Settings,
    Layers,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";
import "./sidebar.css";

const PERMISSIONS = {
    monthlyContents: ["CONTENT_CREATOR"],
    qa: ["QA"],
    videoProduction: ["CONTENT_CREATOR", "EDITOR"],
    submitContent: ["ALL"],
    createClient: [],
};

const NAV_GROUPS = [
    {
        id: "overview",
        label: "Overview",
        items: [
            { href: "/contentcreation", label: "Content Board", icon: Layout, permissionKey: "dashboards", roles: ["ALL"] },
        ],
    },
    {
        id: "create",
        label: "Create",
        items: [
            { href: "/contentcreation/submit-story", label: "Submit request", icon: Send, permissionKey: "submit_requests", roles: PERMISSIONS.submitContent },
            { href: "/contentcreation/create-monthly-plan", label: "Monthly plan", icon: Calendar, permissionKey: "submit_requests", roles: PERMISSIONS.submitContent },
        ],
    },
    {
        id: "produce",
        label: "Produce",
        items: [
            { href: "/contentcreation/monthly-contents", label: "Monthly Contents", icon: FileText, permissionKey: "content_production", roles: PERMISSIONS.monthlyContents },
            { href: "/contentcreation/qa", label: "QA", icon: CheckSquare, permissionKey: "content_production", roles: PERMISSIONS.qa, qaOnly: true },
            { href: "/contentcreation/scheduler", label: "Scheduler", icon: Clock, superuserOnly: true },
            { href: "/contentcreation/publication-log", label: "Publication Log", icon: ClipboardList, superuserOnly: true },
            { href: "/contentcreation/video-editors", label: "Video Editors", icon: Users, permissionKey: "video_production", roles: PERMISSIONS.videoProduction },
            { href: "/contentcreation/shoots", label: "Video Shoots", icon: Camera, permissionKey: "video_production", roles: PERMISSIONS.videoProduction },
            { href: "/contentcreation/calendar", label: "Calendar", icon: Calendar, permissionKey: "video_production", roles: PERMISSIONS.videoProduction },
        ],
    },
    {
        id: "workspace",
        label: "Workspace",
        items: [
            { href: "/contentcreation/customize", label: "Site Personalization", icon: Palette, permissionKey: "customization", roles: ["ALL"] },
        ],
    },
    {
        id: "account",
        label: "Your account",
        items: [
            { href: "/contentcreation/your-insights", label: "Insights", icon: BarChart3, permissionKey: "your_insights", roles: ["CLIENT"] },
            { href: "/contentcreation/client-review", label: "Client Review", icon: CheckSquare, permissionKey: "client_review", roles: ["CLIENT"] },
            { href: "/contentcreation/completed-content", label: "Completed Content", icon: Layers, permissionKey: "completed_content", roles: ["CLIENT"] },
            { href: "/contentcreation/shared-content", label: "Strategy", icon: Folder, permissionKey: "shared_content", roles: ["CLIENT"] },
            { href: "/contentcreation/client-settings", label: "Social networks", icon: Settings, permissionKey: "client_settings", roles: ["CLIENT"] },
        ],
    },
    {
        id: "admin",
        label: "Admin",
        items: [
            { href: "/contentcreation/create-client", label: "Create Client", icon: UserPlus, permissionKey: "administration", roles: PERMISSIONS.createClient },
            { href: "/contentcreation/manage-users", label: "Manage Users", icon: Users, permissionKey: "administration", roles: PERMISSIONS.createClient },
            { href: "/contentcreation/client-gallery", label: "Client Gallery", icon: Images, permissionKey: "administration", roles: PERMISSIONS.createClient },
            { href: "/contentcreation/assignments", label: "Assignments", icon: ClipboardList, permissionKey: "administration", roles: PERMISSIONS.createClient },
            { href: "/contentcreation/lets-talk", label: "Lets Talk Leads", icon: Mail, permissionKey: "administration", roles: PERMISSIONS.createClient },
        ],
    },
];

function formatRole(role) {
    if (!role) return "Guest";
    return role.replaceAll("_", " ").toLowerCase();
}

export function Sidebar() {
    const pathname = usePathname();
    const { requireQAReview } = useTheme();
    const [userRole, setUserRole] = React.useState("GUEST");
    const [userPermissions, setUserPermissions] = React.useState({});
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    React.useEffect(() => {
        const role = localStorage.getItem("userRole");
        setUserRole(role || "GUEST");

        try {
            const perms = JSON.parse(localStorage.getItem("userPermissions") || "{}");
            setUserPermissions(perms);
        } catch (e) {
            console.error("Error parsing permissions", e);
            setUserPermissions({});
        }
    }, []);

    const checkAccess = (sectionKey, allowedRoles = []) => {
        if (userRole === "CLIENT") {
            return sectionKey === "customization" || sectionKey === "your_insights" || sectionKey === "client_review" || sectionKey === "shared_content" || sectionKey === "client_settings" || sectionKey === "completed_content";
        }

        if (sectionKey === "your_insights" || sectionKey === "client_review" || sectionKey === "shared_content" || sectionKey === "client_settings" || sectionKey === "completed_content") {
            return false;
        }

        if (userRole === "SUPERUSER") return true;

        if (userPermissions && userPermissions[sectionKey] !== undefined) {
            return userPermissions[sectionKey];
        }

        if (allowedRoles.includes("ALL")) return true;
        return allowedRoles.includes(userRole);
    };

    const isItemVisible = (item) => {
        if (item.superuserOnly) return userRole === "SUPERUSER";
        if (item.qaOnly && !requireQAReview) return false;
        return checkAccess(item.permissionKey, item.roles || []);
    };

    const visibleGroups = NAV_GROUPS
        .map((group) => ({
            ...group,
            items: group.items.filter(isItemVisible),
        }))
        .filter((group) => group.items.length > 0);

    const isActive = (href) => pathname === href;

    return (
        <aside className={`app-sidebar${isCollapsed ? " is-collapsed" : ""}`} aria-label="Workspace navigation">
            <div className="sb-header">
                <div className="sb-brand">
                    <img
                        src="/lumenalogo.png"
                        alt="Lumena"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                        }}
                    />
                    {!isCollapsed && (
                        <div className="sb-brand__meta">
                            <p className="sb-brand__name">Lumena</p>
                            <span className="sb-role">{formatRole(userRole)}</span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="sb-collapse"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="sb-nav">
                {visibleGroups.map((group) => (
                    <div key={group.id} className="sb-group">
                        <p className="sb-group-label">{group.label}</p>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.label}
                                    className={`sb-item${active ? " is-active" : ""}`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    <Icon size={isCollapsed ? 18 : 16} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {!isCollapsed && (
                <div className="sb-footer">
                    <p>&copy; 2026 Lumena Agency</p>
                </div>
            )}
        </aside>
    );
}
