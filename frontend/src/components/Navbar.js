"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({ name: "", role: "" });
    const router = useRouter();

    useEffect(() => {
        const storedName = localStorage.getItem("username");
        const storedRole = localStorage.getItem("userRole");

        if (storedName || storedRole) {
            setUserInfo({
                name: storedName || "User",
                role: storedRole ? storedRole.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Guest"
            });
        }
    }, []);

    const handleLogout = () => {
        // Here you would typically clear auth tokens/cookies
        localStorage.clear();

        // Navigate to login
        router.push("/login");
    };

    return (
        <nav className="w-full bg-transparent px-8 py-4 sticky top-0 z-50">
            <div className="flex justify-end items-center max-w-7xl mx-auto">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF8FF] border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group"
                    >
                        <div className="h-8 w-8 bg-[#192853] rounded-full flex items-center justify-center group-hover:bg-[#FFE14F] transition-colors">
                            <User size={18} className="text-white group-hover:text-[#192853] transition-colors" />
                        </div>

                        <div className="flex flex-col items-start min-w-[80px]">
                            <span className="text-sm font-bold text-[#192853] leading-none">{userInfo.name || "Loading..."}</span>
                            <span className="text-xs text-gray-500 font-medium">{userInfo.role || "..."}</span>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`text-gray-600 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
