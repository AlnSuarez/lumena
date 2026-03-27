"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LetsTalkForm } from "./LetsTalkForm";

export function ContactFormModal({
  buttonText = "Book a Strategy Call",
  buttonClassName = "",
  showIcon = true,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`w-fit mt-9 inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#3768FF] shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-100 ${buttonClassName}`}
      >
        {buttonText}
        {showIcon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3768FF] text-white">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
