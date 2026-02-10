import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";

export default function ContentCreationLayout({ children }) {
    return (
        <AuthGuard>
            <div className="contentcreation-scrollbars flex h-screen bg-secondary overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
