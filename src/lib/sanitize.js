// Sanea un array de productos a POJO
export function sanitizeProductos(productos) {
  return (productos || []).map((p) => ({
    id: p.id != null ? String(p.id) : null,
    nombre: p.nombre,
    slug: p.slug,
    precio: p.precio != null ? Number(p.precio) : null,
    imagen_url: p.imagen_url,
    imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
    created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
  }));
}

// Sanea un array de categorías (con subcategorías anidadas) a POJO
export function sanitizeCategorias(categorias) {
  return (categorias || []).map((cat) => ({
    id: cat.id != null ? String(cat.id) : null,
    nombre: cat.nombre,
    slug: cat.slug,
    subcategorias: (cat.subcategorias || []).map((sc) => ({
      id: sc.id != null ? String(sc.id) : null,
      nombre: sc.nombre,
      slug: sc.slug,
    })),
  }));
}
