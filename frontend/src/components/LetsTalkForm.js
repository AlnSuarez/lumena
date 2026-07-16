"use client";

import { useState } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

export function LetsTalkForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialty: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE}/contents/lets-talk/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to submit the form.");
      }

      setIsSuccess(true);
      setStatusMessage("Thanks. We received your request and will contact you soon.");
      setFormData({
        name: "",
        email: "",
        specialty: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Lets Talk form error:", error);
      setIsSuccess(false);
      setStatusMessage("We could not send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Full name</span>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#3768FF] transition focus:ring-2"
          placeholder="Dr. Jane Doe"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#3768FF] transition focus:ring-2"
          placeholder="you@clinic.com"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Specialty</span>
        <input
          type="text"
          name="specialty"
          value={formData.specialty}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#3768FF] transition focus:ring-2"
          placeholder="Dermatology"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Phone</span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#3768FF] transition focus:ring-2"
          placeholder="+1 (555) 123-4567"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-slate-700">Message</span>
        <textarea
          name="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#3768FF] transition focus:ring-2"
          placeholder="Tell us about your goals..."
        />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#3768FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f57d8] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send request"}
        </button>
      </div>

      {statusMessage && (
        <p className={`md:col-span-2 text-sm ${isSuccess ? "text-emerald-700" : "text-red-600"}`}>
          {statusMessage}
        </p>
      )}
    </form>
  );
}
