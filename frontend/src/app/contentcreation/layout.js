import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";

export default function ContentCreationLayout({ children }) {
    return (
        <AuthGuard>
            <div className="flex h-screen bg-[#EFF8FF] overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
