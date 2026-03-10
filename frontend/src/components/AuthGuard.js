"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children, allowedRoles = [] }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // 1. Check if user is logged in
        const userId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");

        if (!userId || !userRole) {
            // Not logged in, redirect to login
            // Encode the return URL to redirect back after login if desired
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        // Temporary restriction: clients can only access customization and insights routes.
        if (userRole === "CLIENT") {
            const allowedClientPaths = ['/contentcreation/customize', '/contentcreation/your-insights'];
            const isAllowedPath = allowedClientPaths.some((allowedPath) => pathname.startsWith(allowedPath));

            if (!isAllowedPath) {
                router.push('/contentcreation/your-insights');
                return;
            }
        }

        // 2. Check Permissions (Role based)
        // Define route-specific permissions configuration
        const routePermissions = {
            '/contentcreation/manage-users': ['SUPERUSER'],
            '/contentcreation/client-gallery': ['SUPERUSER'],
            '/contentcreation/assignments': ['SUPERUSER'],
            '/contentcreation/lets-talk': ['SUPERUSER'],
            '/contentcreation/qa': ['SUPERUSER', 'CONTENT_CREATOR', 'QA'],
            '/contentcreation/your-insights': ['CLIENT'],
            // Add more specific routes here
        };

        // Check for exact match or partial match logic could go here
        // For now, let's check strict prefix or exact match
        const matchingRoute = Object.keys(routePermissions).find(route => pathname.startsWith(route));

        if (matchingRoute) {
            const requiredRoles = routePermissions[matchingRoute];
            if (!requiredRoles.includes(userRole)) {
                // User does not have permission for this specific route
                // Redirect to a default authorized page or show 403
                // For now, redirect to main dashboard
                if (pathname !== '/contentcreation') {
                    router.push('/contentcreation');
                } else {
                    // If they can't even access main dashboard (unlikely if logged in?), logout
                    router.push('/login');
                }
                return;
            }
        }

        // If no specific restriction, or passed constraint check
        setAuthorized(true);

    }, [router, pathname]);

    if (!authorized) {
        // Show a loading state or nothing while checking
        // This prevents the "flash" of protected content
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#EFF8FF]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#192853]"></div>
            </div>
        );
    }

    return <>{children}</>;
}
