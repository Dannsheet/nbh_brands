"use client"
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedSubcatTitle
 * - Staggered letter split, scale, mask reveal, metallic gradient, outline, glow, tracking on hover, parallax, delayed CTA, a11y
 * @param {string} title - The text to animate
 * @param {function} onComplete - Optional callback after animation
 * @param {string} ctaText - Optional CTA button text
 * @param {function} onCtaClick - Optional CTA click handler
 */
export default function AnimatedSubcatTitle({
  title,
  onComplete,
  ctaText = 'Ver productos',
  onCtaClick
}) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();
  const [showCTA, setShowCTA] = useState(false);
  const containerRef = useRef(null);

  // Parallax effect
  useEffect(() => {
    if (shouldReduceMotion) return;
    const handleScroll = () => {
      if (containerRef.current) {
        const y = window.scrollY;
        containerRef.current.style.transform = `translateY(${y * 0.15}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldReduceMotion]);

  // Animation sequencing
  useEffect(() => {
    if (shouldReduceMotion) {
      setShowCTA(true);
      return;
    }
    controls.start('visible').then(() => {
      setTimeout(() => {
        setShowCTA(true);
        if (onComplete) onComplete();
      }, 350); // Delay CTA after letters
    });
  }, [controls, onComplete, shouldReduceMotion]);

  // Letter split
  const letters = title.split('');

  // Animation variants
  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };
  const letter = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 30,
        duration: 0.6,
      },
    },
  };

  // Metal gradient + mask reveal
  // Tailwind can't do clip-path, so use inline style
  return (
    <div className="relative flex flex-col items-center select-none" ref={containerRef} style={{ willChange: 'transform' }}>
      {/* Grain/vignette bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 mix-blend-soft-light" style={{background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%,rgba(0,0,0,0.5) 100%)'}}/>
      {/* Main animated title */}
      <motion.h1
        className="relative z-10 mb-6 text-2xl md:text-4xl font-bold text-center uppercase font-poppins tracking-wide"
        initial="hidden"
        animate={controls}
        variants={container}
        aria-label={title}
        style={{
          WebkitTextStroke: '1.5px #FFD700',
          textShadow: '0 0 10px #FFD70088, 0 2px 20px #fff2',
          background: 'linear-gradient(92deg, #fff 10%, #b3b3b3 35%, #FFD700 60%, #fff 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          clipPath: shouldReduceMotion ? 'none' : 'inset(0 100% 0 0)',
          animation: shouldReduceMotion ? 'none' : 'revealMask 1.2s cubic-bezier(.77,0,.175,1) forwards',
        }}
        onAnimationEnd={() => controls.set('visible')}
      >
        {letters.map((char, i) => (
          <motion.span
            key={i}
            variants={letter}
            className="inline-block transition-all duration-500 hover:tracking-widest hover:text-yellow-400"
            style={{
              WebkitTextStroke: '1.5px #FFD700',
              textShadow: '0 0 10px #FFD70088, 0 2px 20px #fff2',
            }}
            whileHover={{
              scale: 1.15,
              color: '#FFD700',
              letterSpacing: '0.2em',
              transition: { duration: 0.3 },
            }}
            aria-hidden
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h1>
      {/* CTA animada */}
      {/* Botón removido según feedback */}
      {/* <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={showCTA ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
        className="z-10"
      >
        {ctaText && (
          <button
            className="mt-2 px-8 py-2 rounded-full bg-yellow-400 text-black font-bold shadow-lg hover:scale-105 hover:bg-yellow-300 transition-all duration-300 focus:outline-none"
            onClick={onCtaClick}
          >
            {ctaText}
          </button>
        )}
      </motion.div> */}
      {/* Keyframes for mask reveal */}
      <style jsx>{`
        @keyframes revealMask {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0% 0 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          h1, span, div, button { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
