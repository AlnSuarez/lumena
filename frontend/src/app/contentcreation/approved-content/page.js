"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ApprovedContentPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/contentcreation/scheduler");
    }, [router]);

    return (
        <div className="w-full flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={28} />
            <p className="text-sm font-semibold">Redirecting to Scheduler...</p>
        </div>
    );
}
