"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LetsTalkForm } from "./LetsTalkForm";

export function LandingNavbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleWebClick = (e) => {
    e.preventDefault();
    router.push('/web');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <nav className="flex items-center justify-between rounded-full border border-white/70 bg-white/90 px-6 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="mr-2 text-xl font-semibold tracking-tight text-[#fbb92a]"
            >
              Lumena
            </Link>
            <Link
              href="/"
              className="ml-6 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Home
            </Link>
            <Link
              href="/web"
              onClick={handleWebClick}
              className="ml-3 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Web
            </Link>
          </div>

          <button
            onClick={openModal}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Let&apos;s Talk
          </button>
        </nav>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          <div className="relative w-full max-w-2xl rounded-[2.5rem] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/80 overflow-hidden">
            <div className="absolute top-6 right-6">
              <button
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 md:p-12">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3768FF]">
                  Let&apos;s Talk
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  Book a strategy meeting
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                  Share your details and we&apos;ll contact you to plan your next steps.
                </p>
              </div>

              <div className="mt-8">
                <LetsTalkForm />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
