// components/Hero.js
"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from "next/navigation";

// Slides con versiones desktop y mobile por cada imagen.
// Puedes reemplazar cada ruta por las optimizadas en WebP/AVIF, por ejemplo:
// { desktop: '/fondo1-desktop.webp', mobile: '/fondo1-mobile.webp' }
const slides = [
  { desktop: "/fondo1.png", mobile: "/fondo1mobile.png" },
  { desktop: "/fondo2.png", mobile: "/fondo2mobile.png" },
  { desktop: "/fondo3.png", mobile: "/fondo3mobile.png" },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Preload del siguiente slide según viewport para suavizar la transición
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextIndex = (index + 1) % slides.length;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const nextSrc = isMobile ? slides[nextIndex].mobile : slides[nextIndex].desktop;
    if (nextSrc) {
      const img = new Image();
      img.src = nextSrc;
    }
  }, [index]);

  const goBack = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const handleClick = () => {
    router.push("/productos"); // O redirige a `/producto/[id]` si tienes uno definido
  };

  return (
    <section className="relative w-full h-[70vh] md:h-[75vh] overflow-hidden bg-primary text-accent">
      {slides.map((s, i) => (
        <picture
          key={i}
          onClick={handleClick}
          className={`absolute top-0 left-0 w-full h-full cursor-pointer transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <source media="(max-width: 768px)" srcSet={s.mobile} />
          <source media="(min-width: 769px)" srcSet={s.desktop} />
          <img
            src={s.desktop}
            alt={`banner-${i}`}
            className="w-full h-full object-cover"
            loading={i === index ? "eager" : "lazy"}
          />
        </picture>
      ))}

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido en la parte inferior */}
      <div className="relative z-10 flex items-end justify-center h-full px-4 pb-12 md:pb-20">
        <div className="w-full max-w-4xl text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white opacity-80 animate-fadeUp animate-delay-100"
            style={{ letterSpacing: '-0.02em' }}
            aria-label="NBH STREETWEAR"
          >
            NBH STREETWEAR
          </h1>

          <p className="mt-3 text-xs sm:text-sm md:text-base text-gray-200 animate-fadeUp animate-delay-200">
            Estilo urbano que define tu actitud
          </p>
        </div>
      </div>

      {/* BOTONES DE NAVEGACIÓN */}
      <button
        onClick={goBack}
        aria-label="Imagen anterior"
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-20 animate-fadeUp animate-delay-300"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        onClick={goNext}
        aria-label="Imagen siguiente"
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-20 animate-fadeUp animate-delay-300"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </section>
  );
}
