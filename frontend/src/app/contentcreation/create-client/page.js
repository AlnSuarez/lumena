
"use client";

import React, { useState } from "react";
import {
    User, FileText, Upload, Lock, AtSign, CheckCircle,
    Briefcase, Image as ImageIcon, MessageSquare, Shield, Target, Mail
} from "lucide-react";

// Helper components moved OUTSIDE the main component to prevent re-rendering issues
const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    </div>
);

const InputGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground/80">{label}</label>
        {children}
    </div>
);

const TextInput = ({ value, onChange, placeholder, type = "text" }) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
        placeholder={placeholder}
    />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full p-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
        placeholder={placeholder}
    />
);

const SelectInput = ({ value, onChange, options }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

export default function CreateClientPage() {
    const [logoPreview, setLogoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Structured according to the 8 sections
    const [formData, setFormData] = useState({
        // User Credentials
        username: "",
        password: "",
        email: "",

        // Profile Data
        profile: {
            // 1. Client Basics
            practice_name: "",
            primary_contact: "",
            role_title: "",
            primary_email: "", // Differs from user email? Let's assume contact_email
            phone: "",
            practice_address: "",
            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // 2. Industry & Practice Details
            medical_specialty: "",
            sub_specialty: "",
            practice_type: "Private practice",
            target_patient_type: "",

            // 3. Brand Assets (Logo handled separately)
            brand_colors: "",
            brand_fonts: "",
            website_url: "",
            social_media_links: "",

            // 4. Brand Pillars
            primary_brand_pillars: "",

            // 5. Voice & Tone
            overall_voice: "",
            tone_guidelines: "", // Generic field or specific? Images show specific.
            emojis: "Limited",
            humor: "Subtle",
            formality_level: "Medium",
            words_to_use: "",
            words_to_avoid: "",
            doctor_voice_preference: "",

            // 6. Content Boundaries
            topics_to_emphasize: "",
            topics_to_avoid: "",
            medical_claims_limitations: "",
            hipaa_considerations: "",
            faces_allowed: "Yes",
            testimonials_allowed: "Yes",
            consent_required: "Yes",

            // 7. Goals & KPIs
            primary_goal: "",
            secondary_goals: "",
            kpis_to_track: "",
            success_looks_like: "",

            // 8. Communication
            communication_channel: "Email",
            feedback_style: "Written"
        }
    });

    const [logoFile, setLogoFile] = useState(null);

    const handleInputChange = (section, field, value) => {
        if (section === 'user') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    [field]: value
                }
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submitData = new FormData();

            // Construct payload
            const payload = {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                profile: { ...formData.profile, contact_email: formData.profile.primary_email }
            };

            submitData.append('json_data', JSON.stringify(payload));
            if (logoFile) {
                submitData.append('logo', logoFile);
            }

            // Using fetch to call the backend
            // Adjust URL to match your backend port/route
            const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + '/api/users/create-client/', {
                method: 'POST',
                body: submitData,
            });

            if (response.ok) {
                alert("Client Created Successfully!");
                // Reset form or redirect
                window.location.href = "/contentcreation/monthly-contents"; // Redirect to dashboard
            } else {
                const errorData = await response.json();
                console.error("Error creating client:", errorData);
                alert("Failed to create client. Please check fields.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-foreground">Client Preferences & Brand Profile</h1>
                <p className="text-muted-foreground mt-2 text-lg">Internal use only - Create a new client profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1600px]">

                {/* LEFT COLUMN */}
                <div className="space-y-8">

                    {/* 0. Account Credentials */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Lock} title="Account Credentials" description="Login information for the client." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Username">
                                <TextInput value={formData.username} onChange={(v) => handleInputChange('user', 'username', v)} placeholder="username" />
                            </InputGroup>
                            <InputGroup label="Password">
                                <TextInput type="password" value={formData.password} onChange={(v) => handleInputChange('user', 'password', v)} placeholder="••••••••" />
                            </InputGroup>
                            <div className="md:col-span-2">
                                <InputGroup label="Administrative Email">
                                    <TextInput type="email" value={formData.email} onChange={(v) => handleInputChange('user', 'email', v)} placeholder="admin@client.com" />
                                </InputGroup>
                            </div>
                        </div>
                    </div>

                    {/* 1. Client Basics */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={User} title="1. Client Basics" />
                        <div className="space-y-5">
                            <InputGroup label="Practice / Brand Name">
                                <TextInput value={formData.profile.practice_name} onChange={(v) => handleInputChange('profile', 'practice_name', v)} placeholder="e.g. Lumena Health" />
                            </InputGroup>
                            <div className="grid grid-cols-2 gap-5">
                                <InputGroup label="Primary Contact">
                                    <TextInput value={formData.profile.primary_contact} onChange={(v) => handleInputChange('profile', 'primary_contact', v)} />
                                </InputGroup>
                                <InputGroup label="Role / Title">
                                    <TextInput value={formData.profile.role_title} onChange={(v) => handleInputChange('profile', 'role_title', v)} />
                                </InputGroup>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <InputGroup label="Contact Email">
                                    <TextInput type="email" value={formData.profile.primary_email} onChange={(v) => handleInputChange('profile', 'primary_email', v)} />
                                </InputGroup>
                                <InputGroup label="Phone">
                                    <TextInput value={formData.profile.phone} onChange={(v) => handleInputChange('profile', 'phone', v)} />
                                </InputGroup>
                            </div>
                            <InputGroup label="Practice Address">
                                <TextInput value={formData.profile.practice_address} onChange={(v) => handleInputChange('profile', 'practice_address', v)} />
                            </InputGroup>
                        </div>
                    </div>

                    {/* 2. Industry & Practice Details */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Briefcase} title="2. Industry & Practice Details" />
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <InputGroup label="Medical Specialty">
                                    <TextInput value={formData.profile.medical_specialty} onChange={(v) => handleInputChange('profile', 'medical_specialty', v)} placeholder="e.g. Dermatology" />
                                </InputGroup>
                                <InputGroup label="Sub-specialty">
                                    <TextInput value={formData.profile.sub_specialty} onChange={(v) => handleInputChange('profile', 'sub_specialty', v)} />
                                </InputGroup>
                            </div>
                            <InputGroup label="Type of Practice">
                                <SelectInput
                                    value={formData.profile.practice_type}
                                    onChange={(v) => handleInputChange('profile', 'practice_type', v)}
                                    options={["Private practice", "Group practice", "Clinic", "Concierge / membership-based", "Hospital", "Other"]}
                                />
                            </InputGroup>
                            <InputGroup label="Target Patient Type">
                                <TextArea
                                    value={formData.profile.target_patient_type}
                                    onChange={(v) => handleInputChange('profile', 'target_patient_type', v)}
                                    placeholder="Age range, gender, insurance vs cash-pay..."
                                />
                            </InputGroup>
                        </div>
                    </div>

                    {/* 3. Brand Assets */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={ImageIcon} title="3. Brand Assets" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="h-20 object-contain mb-3" />
                                ) : (
                                    <Upload className="text-muted-foreground mb-3" size={32} />
                                )}
                                <label className="cursor-pointer">
                                    <span className="bg-primary/10 text-primary py-2 px-4 rounded-lg text-sm font-semibold hover:bg-primary/20 transition">Upload Logo</span>
                                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                </label>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <InputGroup label="Website URL">
                                    <TextInput value={formData.profile.website_url} onChange={(v) => handleInputChange('profile', 'website_url', v)} placeholder="https://..." />
                                </InputGroup>
                                <InputGroup label="Brand Colors">
                                    <TextInput value={formData.profile.brand_colors} onChange={(v) => handleInputChange('profile', 'brand_colors', v)} placeholder="e.g. #FF5500, Navy Blue" />
                                </InputGroup>
                                <InputGroup label="Brand Fonts">
                                    <TextInput value={formData.profile.brand_fonts} onChange={(v) => handleInputChange('profile', 'brand_fonts', v)} />
                                </InputGroup>
                            </div>
                        </div>
                        <div className="mt-5">
                            <InputGroup label="Social Media Links">
                                <TextArea value={formData.profile.social_media_links} onChange={(v) => handleInputChange('profile', 'social_media_links', v)} placeholder="Instagram, TikTok, LinkedIn..." rows={2} />
                            </InputGroup>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* 4. Brand Pillars */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Target} title="4. Brand Pillars" />
                        <InputGroup label="Primary Brand Pillars">
                            <TextArea
                                value={formData.profile.primary_brand_pillars}
                                onChange={(v) => handleInputChange('profile', 'primary_brand_pillars', v)}
                                placeholder="e.g. Trust, Education, Results, Innovation..."
                            />
                        </InputGroup>
                    </div>

                    {/* 5. Voice & Tone */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={MessageSquare} title="5. Voice & Tone Preferences" />
                        <div className="space-y-5">
                            <InputGroup label="Overall Voice">
                                <TextInput value={formData.profile.overall_voice} onChange={(v) => handleInputChange('profile', 'overall_voice', v)} placeholder="Professional, Warm, Educational..." />
                            </InputGroup>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InputGroup label="Emojis">
                                    <SelectInput value={formData.profile.emojis} onChange={(v) => handleInputChange('profile', 'emojis', v)} options={["Yes", "No", "Limited"]} />
                                </InputGroup>
                                <InputGroup label="Humor">
                                    <SelectInput value={formData.profile.humor} onChange={(v) => handleInputChange('profile', 'humor', v)} options={["Yes", "No", "Subtle"]} />
                                </InputGroup>
                                <InputGroup label="Formality">
                                    <SelectInput value={formData.profile.formality_level} onChange={(v) => handleInputChange('profile', 'formality_level', v)} options={["High", "Medium", "Low"]} />
                                </InputGroup>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputGroup label="Words/Phrases to Use">
                                    <TextArea value={formData.profile.words_to_use} onChange={(v) => handleInputChange('profile', 'words_to_use', v)} rows={2} />
                                </InputGroup>
                                <InputGroup label="Words/Phrases to Avoid">
                                    <TextArea value={formData.profile.words_to_avoid} onChange={(v) => handleInputChange('profile', 'words_to_avoid', v)} rows={2} />
                                </InputGroup>
                            </div>

                            <InputGroup label="How the Doctor Wants to Sound">
                                <TextArea value={formData.profile.doctor_voice_preference} onChange={(v) => handleInputChange('profile', 'doctor_voice_preference', v)} placeholder="Expert but human, calm and reassuring..." />
                            </InputGroup>
                        </div>
                    </div>

                    {/* 6. Content Boundaries */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Shield} title="6. Content Boundaries & Compliance" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputGroup label="Topics to Emphasize">
                                    <TextArea value={formData.profile.topics_to_emphasize} onChange={(v) => handleInputChange('profile', 'topics_to_emphasize', v)} rows={2} />
                                </InputGroup>
                                <InputGroup label="Topics to Avoid">
                                    <TextArea value={formData.profile.topics_to_avoid} onChange={(v) => handleInputChange('profile', 'topics_to_avoid', v)} rows={2} />
                                </InputGroup>
                            </div>

                            <InputGroup label="Medical Claims Limitations">
                                <TextInput value={formData.profile.medical_claims_limitations} onChange={(v) => handleInputChange('profile', 'medical_claims_limitations', v)} placeholder="No guarantees, before/after rules..." />
                            </InputGroup>

                            <div className="grid grid-cols-3 gap-4">
                                <InputGroup label="Faces Allowed?">
                                    <SelectInput value={formData.profile.faces_allowed} onChange={(v) => handleInputChange('profile', 'faces_allowed', v)} options={["Yes", "No"]} />
                                </InputGroup>
                                <InputGroup label="Testimonials?">
                                    <SelectInput value={formData.profile.testimonials_allowed} onChange={(v) => handleInputChange('profile', 'testimonials_allowed', v)} options={["Yes", "No"]} />
                                </InputGroup>
                                <InputGroup label="Consent Required?">
                                    <SelectInput value={formData.profile.consent_required} onChange={(v) => handleInputChange('profile', 'consent_required', v)} options={["Yes", "No"]} />
                                </InputGroup>
                            </div>
                        </div>
                    </div>

                    {/* 7. Goals & KPIs */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Target} title="7. Goals & KPIs" />
                        <div className="space-y-4">
                            <InputGroup label="Primary Goal">
                                <TextInput value={formData.profile.primary_goal} onChange={(v) => handleInputChange('profile', 'primary_goal', v)} placeholder="Growth, bookings, authority..." />
                            </InputGroup>
                            <InputGroup label="KPIs We Track">
                                <TextInput value={formData.profile.kpis_to_track} onChange={(v) => handleInputChange('profile', 'kpis_to_track', v)} placeholder="Engagement, clicks, leads..." />
                            </InputGroup>
                            <InputGroup label="Success Looks Like">
                                <TextArea value={formData.profile.success_looks_like} onChange={(v) => handleInputChange('profile', 'success_looks_like', v)} rows={2} />
                            </InputGroup>
                        </div>
                    </div>

                    {/* 8. Communication */}
                    <div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-sm">
                        <SectionHeader icon={Mail} title="8. Communication Preferences" />
                        <div className="grid grid-cols-2 gap-5">
                            <InputGroup label="Preferred Channel">
                                <SelectInput value={formData.profile.communication_channel} onChange={(v) => handleInputChange('profile', 'communication_channel', v)} options={["Email", "Slack", "Calls"]} />
                            </InputGroup>
                            <InputGroup label="Feedback Style">
                                <SelectInput value={formData.profile.feedback_style} onChange={(v) => handleInputChange('profile', 'feedback_style', v)} options={["Written", "Call-based", "Async"]} />
                            </InputGroup>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creating..." : (
                                <>
                                    <CheckCircle size={24} className="text-primary-foreground" />
                                    <span className="text-xl">Create Client Profile</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
