import Image from "next/image";

export function WebUnifiedSystemSection() {
  const cards = [
    {
      id: "web-unified-card-authority",
      title: "Social Authority",
      description:
        "Content on social platforms builds visibility and positions your practice as the trusted option.",
      image: "/SocialAuthority.png",
      imageClassName: "object-top",
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.5L12 4l8 6.5v9.5H4v-9.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M9 13h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "web-unified-card-conversion",
      title: "Website Conversion",
      description:
        "Your website becomes the destination where patients learn, gain trust, and schedule consultations.",
      image: "/conversion.png",
      imageClassName: "object-center",
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.9" />
          <path d="M4 9h16" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      ),
    },
    {
      id: "web-unified-card-dev-team",
      title: "Dedicated Web Team",
      description:
        "Our developers lead each build with responsive UX, technical performance, and scalable infrastructure.",
      image: "/doctor2image.png",
      imageClassName: "object-center",
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 8.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" stroke="currentColor" strokeWidth="1.9" />
          <path d="M4 19c1.4-3 4-4.5 8-4.5S18.6 16 20 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="web-unified-system" className="mt-8 rounded-[2.25rem] border border-[#d3dcec] bg-[#e9eef8] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] md:p-9">
      <div id="web-unified-system-head" className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-[#c8d4e8] bg-white px-5 py-2 text-sm font-bold text-[#1f2a40]">
            Our Services
          </span>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-tight text-[#0b1428] md:text-6xl">
            A Unified Digital System for Medical Growth
          </h2>
        </div>


      </div>

      <div id="web-unified-system-grid" className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.id}
            id={card.id}
            className="rounded-3xl border border-[#d8dfec] bg-[#f7f8fb] p-6 shadow-[0_12px_35px_rgba(15,23,42,0.08)]"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7deec] bg-white text-[#3768FF]">
              {card.icon}
            </span>
            <h3 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
              {card.title}
            </h3>
            <p className="mt-3 text-lg leading-relaxed text-[#5b6578] md:text-[1.65rem]">{card.description}</p>

            <div className="relative mt-8 h-52 overflow-hidden rounded-2xl">
              <Image src={card.image} alt={card.title} fill className={`object-cover ${card.imageClassName}`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
