export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE = `${API_ORIGIN}/api`;

function isApiUrl(url) {
    if (!url) return false;
    return (
        url.startsWith(API_ORIGIN) ||
        url.startsWith("/api/") ||
        /localhost:8000|127\.0\.0\.1:8000/.test(url)
    );
}

export function installApiSession() {
    if (typeof window === "undefined" || window.__lumenaApiSession) {
        return;
    }
    window.__lumenaApiSession = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        const url =
            typeof input === "string"
                ? input
                : input instanceof Request
                    ? input.url
                    : String(input);
        if (isApiUrl(url) && init.credentials === undefined) {
            return originalFetch(input, { ...init, credentials: "include" });
        }
        return originalFetch(input, init);
    };
}
