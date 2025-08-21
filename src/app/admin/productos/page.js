import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import SearchBar from './_components/SearchBar';
import PaginationControls from './_components/PaginationControls';
import ProductActions from './_components/ProductActions';

// Configuración de paginación
const ITEMS_PER_PAGE = 10;

// Función para obtener productos desde Supabase
async function getProducts({ search, page }) {
  const supabase = createServerComponentClient({ cookies });

  let query = supabase
    .from('productos')
    .select('id, nombre, precio, estado, imagen_url', { count: 'exact' });

  if (search) {
    query = query.ilike('nombre', `%${search}%`);
  }

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], count: 0 };
  }

  return { products: data, count };
}

export default async function ProductosAdminPage({ searchParams }) {
  const search = searchParams.q || '';
  const page = parseInt(searchParams.page || '1', 10);

  const { products, count } = await getProducts({ search, page });

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold uppercase">Gestión de Productos</h1>
        <Button asChild>
          <Link href="/admin/productos/nuevo">Crear Producto</Link>
        </Button>
      </div>

      <div className="mb-4">
        <SearchBar placeholder="Buscar por nombre..." />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imagen_url || '/placeholder.png'}
                      alt={product.nombre}
                      width={50}
                      height={50}
                      className="rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.nombre}</TableCell>
                  <TableCell>${product.precio}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.estado === 'activo'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                      {product.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActions product={product} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}