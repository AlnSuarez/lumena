"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import {
    FileText,
    Calendar,
    CheckSquare,
    Edit,
    Video,
    Users,
    Camera,
    Send,
    Instagram,
    Layers,
    Film,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Layout,
    Shield,
    UserPlus,
    Palette,
    Images,
    BarChart3,
    ClipboardList,
    Mail,
    CheckCircle2,
    Clock,
    Folder,
    Settings
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { requireQAReview } = useTheme();
    const [userRole, setUserRole] = React.useState('GUEST');
    const [userPermissions, setUserPermissions] = React.useState({});
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [expandedSections, setExpandedSections] = React.useState({
        dashboards: false,
        contentProduction: true,
        videoProduction: false,
        submitRequests: false,
        customization: false,
        yourInsights: false,
        sharedContent: false,
        administration: false,
        scheduler: false,
        clientSettings: true
    });

    React.useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role || 'GUEST');

        try {
            const perms = JSON.parse(localStorage.getItem('userPermissions') || '{}');
            setUserPermissions(perms);
        } catch (e) {
            console.error("Error parsing permissions", e);
            setUserPermissions({});
        }
    }, []);

    React.useEffect(() => {
        // Expand the appropriate section based on current pathname
        if (pathname === '/contentcreation') {
            setExpandedSections(prev => ({ ...prev, dashboards: true }));
        } else if (pathname.startsWith('/contentcreation/monthly-contents') || pathname.startsWith('/contentcreation/qa')) {
            setExpandedSections(prev => ({ ...prev, contentProduction: true }));
        } else if (pathname.startsWith('/contentcreation/video-editors') || pathname.startsWith('/contentcreation/shoots') || pathname.startsWith('/contentcreation/calendar')) {
            setExpandedSections(prev => ({ ...prev, videoProduction: true }));
        } else if (pathname.startsWith('/contentcreation/submit-story') || pathname.startsWith('/contentcreation/create-monthly-plan')) {
            setExpandedSections(prev => ({ ...prev, submitRequests: true }));
        } else if (pathname.startsWith('/contentcreation/customize')) {
            setExpandedSections(prev => ({ ...prev, customization: true }));
        } else if (pathname.startsWith('/contentcreation/your-insights') || pathname.startsWith('/contentcreation/client-review') || pathname.startsWith('/contentcreation/completed-content')) {
            setExpandedSections(prev => ({ ...prev, yourInsights: true }));
        } else if (pathname.startsWith('/contentcreation/shared-content')) {
            setExpandedSections(prev => ({ ...prev, sharedContent: true }));
        } else if (pathname.startsWith('/contentcreation/create-client') || pathname.startsWith('/contentcreation/manage-users') || pathname.startsWith('/contentcreation/client-gallery') || pathname.startsWith('/contentcreation/assignments') || pathname.startsWith('/contentcreation/lets-talk')) {
            setExpandedSections(prev => ({ ...prev, administration: true }));
        } else if (pathname.startsWith('/contentcreation/scheduler')) {
            setExpandedSections(prev => ({ ...prev, scheduler: true }));
        } else if (pathname.startsWith('/contentcreation/client-settings')) {
            setExpandedSections(prev => ({ ...prev, clientSettings: true }));
        }
    }, [pathname]);

    const isActive = (href) => {
        return pathname === href;
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const checkAccess = (sectionKey, allowedRoles = []) => {
        // Temporary restriction: clients can only access customization, insights, and client_review.
        if (userRole === 'CLIENT') {
            return sectionKey === 'customization' || sectionKey === 'your_insights' || sectionKey === 'client_review' || sectionKey === 'shared_content' || sectionKey === 'client_settings' || sectionKey === 'completed_content';
        }

        // Your Insights, Client Review, Shared Content, Client Settings, and Completed Content are exclusive to clients.
        if (sectionKey === 'your_insights' || sectionKey === 'client_review' || sectionKey === 'shared_content' || sectionKey === 'client_settings' || sectionKey === 'completed_content') {
            return false;
        }

        // 1. Superuser always has access
        if (userRole === 'SUPERUSER') return true;

        // 2. Explicit Override from granular permissions
        if (userPermissions && userPermissions[sectionKey] !== undefined) {
            return userPermissions[sectionKey];
        }

        // 3. Fallback to Role-Based
        if (allowedRoles.includes('ALL')) return true;
        return allowedRoles.includes(userRole);
    };

    // Alias for backward compatibility or cached versions
    const hasPermission = checkAccess;

    const PERMISSIONS = {
        monthlyContents: ['CONTENT_CREATOR'],
        qa: ['QA'],
        videoProduction: ['CONTENT_CREATOR', 'EDITOR'],
        submitContent: ['ALL'],
        createClient: [] // Only SU
    };

    return (
        <div className={`h-screen bg-sidebar flex flex-col text-sidebar-foreground shadow-2xl relative overflow-hidden rounded-2xl m-4 border border-sidebar-border transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-80'}`}>
            {/* Background decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Collapse Button */}
            <div className="p-4 flex justify-end">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? (
                        <ChevronRight size={20} />
                    ) : (
                        <ChevronLeft size={20} />
                    )}
                </button>
            </div>

            {/* Header / Logo Area */}
            {!isCollapsed && (
                <div className="px-8 pb-4">
                    <h1 className="text-2xl font-extrabold tracking-tight text-sidebar-foreground flex items-center gap-2">
                        <img src="/lumenalogo.png" alt="Lumena" className="h-32 w-32 object-contain" />
                    </h1>
                    <div className="mt-2 px-2 py-1 bg-sidebar-accent rounded text-xs text-muted-foreground inline-block">
                        {userRole.replace('_', ' ')}
                    </div>
                </div>
            )}

            {/* Navigation Scroll Area */}
            {isCollapsed ? (
                <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col items-center gap-6 scrollbar-hide">
                    {/* Dashboards Icon */}
                    {/* Dashboards Icon */}
                    {checkAccess('dashboards', ['ALL']) && (
                        <Link href="/contentcreation" title="Dashboards" className={`p-3 rounded-full transition-all ${isActive('/contentcreation') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Layout size={24} />
                        </Link>
                    )}

                    {/* Submit Requests Icon */}
                    {/* Submit Requests Icon */}
                    {/* Submit Requests Icon */}
                    {checkAccess('submit_requests', PERMISSIONS.submitContent) && (
                        <button onClick={() => toggleSection('submitRequests')} title="Submit Requests" className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-primary">
                            <Send size={24} />
                        </button>
                    )}

                    {/* Content Production Icon */}
                    {checkAccess('content_production', ['CONTENT_CREATOR', 'QA']) && (
                        <button onClick={() => toggleSection('contentProduction')} title="Content Production" className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-primary">
                            <FileText size={24} />
                        </button>
                    )}

                    {/* Video Production Icon */}
                    {checkAccess('video_production', PERMISSIONS.videoProduction) && (
                        <button onClick={() => toggleSection('videoProduction')} title="Video Production" className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-primary">
                            <Video size={24} />
                        </button>
                    )}

                    {/* Customization Icon */}
                    {/* Customization Icon */}
                    {/* Customization Icon */}
                    {checkAccess('customization', ['ALL']) && (
                        <Link href="/contentcreation/customize" title="Customization" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/customize') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Palette size={24} />
                        </Link>
                    )}

                    {checkAccess('your_insights', ['CLIENT']) && (
                        <Link href="/contentcreation/your-insights" title="Your Insights" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/your-insights') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <BarChart3 size={24} />
                        </Link>
                    )}

                    {checkAccess('client_review', ['CLIENT']) && (
                        <Link href="/contentcreation/client-review" title="Client Review" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/client-review') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <CheckSquare size={24} />
                        </Link>
                    )}

                    {checkAccess('completed_content', ['CLIENT']) && (
                        <Link href="/contentcreation/completed-content" title="Completed Content" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/completed-content') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Layers size={24} />
                        </Link>
                    )}

                    {checkAccess('shared_content', ['CLIENT']) && (
                        <Link href="/contentcreation/shared-content" title="Shared Content" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/shared-content') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Folder size={24} />
                        </Link>
                    )}

                    {checkAccess('client_settings', ['CLIENT']) && (
                        <Link href="/contentcreation/client-settings" title="Client Settings" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/client-settings') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Settings size={24} />
                        </Link>
                    )}

                    {/* Scheduler Icon */}
                    {userRole === 'SUPERUSER' && (
                        <Link href="/contentcreation/scheduler" title="Scheduler" className={`p-3 rounded-full transition-all ${isActive('/contentcreation/scheduler') ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-sidebar-accent text-muted-foreground hover:text-primary'}`}>
                            <Clock size={24} />
                        </Link>
                    )}
                    
                    {/* Administration Icon */}
                    {checkAccess('administration', PERMISSIONS.createClient) && (
                        <button onClick={() => toggleSection('administration')} title="Administration" className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-primary">
                            <Shield size={24} />
                        </button>
                    )}
                </nav>
            ) : (
                <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scrollbar-hide">

                    {/* Section: Dashboards */}
                    {checkAccess('dashboards', ['ALL']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('dashboards')}
                                className="w-full flex items-center justify-between font-semibold text-lg transition-all px-3 py-2 text-foreground hover:text-primary"
                            >
                                <div className="flex items-center gap-2">
                                    <Layout size={20} className="text-muted-foreground" />
                                    <h3>Dashboards</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 text-gray-700 ${expandedSections.dashboards ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.dashboards && (
                                <ul className="space-y-2 ml-3 border-l-2 border-blue-200 pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation') ? 'text-white bg-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                                            <span className="flex items-center gap-2">
                                                <Layout size={16} className="group-hover:text-primary transition-colors" />
                                                Content Board
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Submit Content Requests */}
                    {checkAccess('submit_requests', PERMISSIONS.submitContent) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('submitRequests')}
                                className="w-full flex items-center justify-between text-foreground font-semibold text-lg hover:text-primary transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Send size={20} className="text-muted-foreground" />
                                    <h3>Submit Requests</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-300 ${expandedSections.submitRequests ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.submitRequests && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    {checkAccess('submit_requests', PERMISSIONS.submitContent) && (
                                        <li>
                                            <Link href="/contentcreation/submit-story" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/submit-story') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <Send size={16} className="group-hover:text-primary transition-colors" />
                                                    Submit content request
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                    {checkAccess('submit_requests', PERMISSIONS.submitContent) && (
                                        <li>
                                            <Link href="/contentcreation/create-monthly-plan" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/create-monthly-plan') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <Calendar size={16} className="group-hover:text-primary transition-colors" />
                                                    Create Monthly plan
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Content Production */}
                    {checkAccess('content_production', ['CONTENT_CREATOR', 'QA']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('contentProduction')}
                                className="w-full flex items-center justify-between text-foreground font-semibold text-lg hover:text-primary transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={20} className="text-muted-foreground" />
                                    <h3>Content Production</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-300 ${expandedSections.contentProduction ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.contentProduction && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    {checkAccess('content_production', PERMISSIONS.monthlyContents) && (
                                        <li>
                                            <Link href="/contentcreation/monthly-contents" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/monthly-contents') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <Calendar size={16} className="group-hover:text-primary transition-colors" />
                                                    Monthly Contents
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                    {requireQAReview && checkAccess('content_production', PERMISSIONS.qa) && (
                                        <li>
                                            <Link href="/contentcreation/qa" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/qa') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <CheckSquare size={16} className="group-hover:text-primary transition-colors" />
                                                    QA
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                    {userRole === 'SUPERUSER' && (
                                        <li>
                                            <Link href="/contentcreation/scheduler" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/scheduler') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <Clock size={16} className="group-hover:text-primary transition-colors" />
                                                    Scheduler
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Video Production */}
                    {checkAccess('video_production', PERMISSIONS.videoProduction) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('videoProduction')}
                                className="w-full flex items-center justify-between text-foreground font-semibold text-lg hover:text-primary transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Video size={20} className="text-muted-foreground" />
                                    <h3>Video Production</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-300 ${expandedSections.videoProduction ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.videoProduction && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/video-editors" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/video-editors') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Users size={16} className="group-hover:text-primary transition-colors" />
                                                Video Editors
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/shoots" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/shoots') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Camera size={16} className="group-hover:text-primary transition-colors" />
                                                Video Shoots
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/calendar" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/calendar') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Calendar size={16} className="group-hover:text-primary transition-colors" />
                                                Calendar
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Site Customization */}
                    {checkAccess('customization', ['ALL']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('customization')}
                                className="w-full flex items-center justify-between font-semibold text-lg transition-all px-3 py-2 text-foreground hover:text-primary"
                            >
                                <div className="flex items-center gap-2">
                                    <Palette size={20} className="text-muted-foreground" />
                                    <h3>Customization</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 text-muted-foreground ${expandedSections.customization ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.customization && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/customize" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/customize') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Palette size={16} className="group-hover:text-primary transition-colors" />
                                                Site Personalization
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Your Insights */}
                    {checkAccess('your_insights', ['CLIENT']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('yourInsights')}
                                className="w-full flex items-center justify-between font-semibold text-lg transition-all px-3 py-2 text-foreground hover:text-primary"
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-muted-foreground" />
                                    <h3>Your Insights</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 text-muted-foreground ${expandedSections.yourInsights ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.yourInsights && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/your-insights" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/your-insights') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <BarChart3 size={16} className="group-hover:text-primary transition-colors" />
                                                Insights Dashboard
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    {checkAccess('client_review', ['CLIENT']) && (
                                        <li>
                                            <Link href="/contentcreation/client-review" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/client-review') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <CheckSquare size={16} className="group-hover:text-primary transition-colors" />
                                                    Client Review
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                    {checkAccess('completed_content', ['CLIENT']) && (
                                        <li>
                                            <Link href="/contentcreation/completed-content" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/completed-content') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <span className="flex items-center gap-2">
                                                    <Layers size={16} className="group-hover:text-primary transition-colors" />
                                                    Completed Content
                                                </span>
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Section: Shared Content */}
                    {checkAccess('shared_content', ['CLIENT']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('sharedContent')}
                                className="w-full flex items-center justify-between font-semibold text-lg transition-all px-3 py-2 text-foreground hover:text-primary"
                            >
                                <div className="flex items-center gap-2">
                                    <Folder size={20} className="text-muted-foreground" />
                                    <h3>Shared Content</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 text-muted-foreground ${expandedSections.sharedContent ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.sharedContent && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/shared-content" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/shared-content') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <FileText size={16} className="group-hover:text-primary transition-colors" />
                                                Shared Documents
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}
                    {/* Section: Client Settings */}
                    {checkAccess('client_settings', ['CLIENT']) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('clientSettings')}
                                className="w-full flex items-center justify-between font-semibold text-lg transition-all px-3 py-2 text-foreground hover:text-primary"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-muted-foreground" />
                                    <h3>Client Settings</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 text-muted-foreground ${expandedSections.clientSettings ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.clientSettings && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/client-settings" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/client-settings') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Settings size={16} className="group-hover:text-primary transition-colors" />
                                                Social Networks
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}
                    {/* Section: Administration (Only visible to admins) */}
                    {checkAccess('administration', PERMISSIONS.createClient) && (
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('administration')}
                                className="w-full flex items-center justify-between text-foreground font-semibold text-lg hover:text-primary transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Shield size={20} className="text-muted-foreground" />
                                    <h3>Administration</h3>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-300 ${expandedSections.administration ? 'rotate-0' : '-rotate-90'}`}
                                />
                            </button>
                            {expandedSections.administration && (
                                <ul className="space-y-2 ml-3 border-l-2 border-sidebar-border pl-4 animate-in fade-in duration-200">
                                    <li>
                                        <Link href="/contentcreation/create-client" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/create-client') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <UserPlus size={16} className="group-hover:text-primary transition-colors" />
                                                Create Client
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/manage-users" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/manage-users') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Users size={16} className="group-hover:text-primary transition-colors" />
                                                Manage Users
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/client-gallery" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/client-gallery') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Images size={16} className="group-hover:text-primary transition-colors" />
                                                Client Gallery
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/assignments" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/assignments') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <ClipboardList size={16} className="group-hover:text-primary transition-colors" />
                                                Assignments
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/contentcreation/lets-talk" className={`group flex items-center justify-between transition-all py-2 px-3 rounded-full ${isActive('/contentcreation/lets-talk') ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <span className="flex items-center gap-2">
                                                <Mail size={16} className="group-hover:text-primary transition-colors" />
                                                Lets Talk Leads
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}

                </nav>
            )}

            {/* Footer Info */}
            {!isCollapsed && (
                <div className="p-6 border-t border-sidebar-border bg-sidebar-accent/50 text-xs text-muted-foreground">
                    <p>&copy; 2026 Lumena Agency</p>
                </div>
            )}
        </div>
    );
}
