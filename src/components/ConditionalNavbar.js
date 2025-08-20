import { headers } from 'next/headers';
import Navbar from './Navbar';
import { fetchCategoriasConSubcategorias } from '@/lib/supabase/categories';

export const revalidate = 60; // Cache for 60 seconds

export default async function ConditionalNavbar() {
  const headersList = headers();
  const pathname = headersList.get('next-url') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  const categorias = await fetchCategoriasConSubcategorias();

  return <Navbar categorias={categorias} />;
}
