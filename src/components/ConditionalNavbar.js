'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  console.log('[TRACE] ConditionalNavbar render, pathname:', pathname);
  if (!pathname) return null;
  // No mostrar navbar global en rutas admin (incluye subrutas)
  if (pathname.startsWith('/admin')) return null;
  return <Navbar />;
}
