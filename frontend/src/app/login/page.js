"use client";

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/login/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const user = await response.json();

                localStorage.setItem('userRole', user.role);
                localStorage.setItem('userId', String(user.id));
                localStorage.setItem('userPermissions', JSON.stringify(user.access_permissions || {}));
                localStorage.setItem('username', user.username);
                // Optional: Store username or token if needed

                if (user.role === 'CLIENT') {
                    router.push('/contentcreation/your-insights');
                } else {
                    router.push('/contentcreation');
                }
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Login failed due to invalid credentials.");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Network error. Please try again.");
        }
    }

    return (
        <div className="min-h-screen flex w-full bg-[#EFF8FF] font-sans">
            {/* Left side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white/60 backdrop-blur-md shadow-2xl z-10 w-full lg:w-[45%] rounded-r-[3rem] border-r border-white/40">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <div className="h-10 w-10 bg-[#192853] rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-[#192853]/20">
                            <span className="text-[#FFE14F] font-bold text-xl">L</span>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[#192853]">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm font-medium text-[#192853]/60">
                            Please enter your details to continue.
                        </p>
                    </div>

                    <div className="mt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-[#192853] mb-2">
                                    Email address
                                </label>
                                <div className="mt-1 group">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="name@company.com"
                                        className="block w-full appearance-none rounded-2xl border-0 bg-white/80 px-4 py-4 text-[#192853] ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#192853] sm:text-sm sm:leading-6 shadow-sm transition-all duration-200 group-hover:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-bold text-[#192853] mb-2">
                                    Password
                                </label>
                                <div className="mt-1 group">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        placeholder="••••••••"
                                        className="block w-full appearance-none rounded-2xl border-0 bg-white/80 px-4 py-4 text-[#192853] ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#192853] sm:text-sm sm:leading-6 shadow-sm transition-all duration-200 group-hover:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-[#192853] focus:ring-[#192853]"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-[#192853]/70 font-medium">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-semibold text-[#192853] hover:text-[#192853]/80 hover:underline decoration-2 underline-offset-2">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-2xl bg-[#192853] px-4 py-4 text-sm font-bold text-white shadow-xl shadow-[#192853]/20 hover:bg-[#203163] hover:shadow-2xl hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#192853] transition-all duration-300"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm">
                            <span className="text-[#192853]/60">Don&apos;t have an account?</span>{' '}
                            <a href="#" className="font-bold text-[#192853] hover:underline decoration-[#FFE14F] decoration-2 underline-offset-2">Contact us</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Image/Decoration */}
            <div className="hidden lg:block relative w-0 flex-1 overflow-hidden bg-[#EFF8FF]">
                <div className="absolute inset-0 flex items-center justify-center p-20">
                    {/* Abstract Shapes/Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_70%)] opacity-60"></div>

                    <div className="absolute top-20 right-20 w-64 h-64 bg-[#FFE14F] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#192853] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

                    <div className="relative z-10 max-w-2xl w-full">
                        <div className="bg-white/30 backdrop-blur-xl rounded-[2.5rem] p-12 shadow-[0_8px_32px_0_rgba(25,40,83,0.1)] border border-white/50">
                            <div className="mb-8 h-16 w-16 rounded-2xl bg-[#FFE14F] flex items-center justify-center text-[#192853] shadow-lg shadow-[#FFE14F]/30 transform -rotate-6">
                                <CheckCircle2 size={32} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-5xl font-extrabold text-[#192853] mb-6 leading-tight">
                                Power your brand <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#192853] to-[#2a4595]">to the next level.</span>
                            </h2>
                            <p className="text-lg text-[#192853]/80 font-medium leading-relaxed mb-8">
                                The all-in-one platform designed for doctors seeking excellence and speed.
                            </p>

                            <div className="flex gap-4">
                                <div className="h-2 w-16 rounded-full bg-[#192853]"></div>
                                <div className="h-2 w-4 rounded-full bg-[#192853]/20"></div>
                                <div className="h-2 w-4 rounded-full bg-[#192853]/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
