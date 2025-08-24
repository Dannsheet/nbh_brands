// Sanea un array de productos a POJO seguro y serializable para RSC/Client Components
export function sanitizeProductos(productos) {
  function safeArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const arr = JSON.parse(val);
        return Array.isArray(arr) ? arr : [];
      } catch { return []; }
    }
    return [];
  }

  return (productos || []).map((p) => ({
    id: p.id != null ? String(p.id) : null,
    nombre: p.nombre ?? "",
    slug: p.slug ?? "",
    descripcion: typeof p.descripcion === "string" ? p.descripcion : (p.descripcion ? String(p.descripcion) : ""),
    precio: p.precio != null ? Number(p.precio) : null,
    activo: Boolean(p.activo),
    categoria_id: p.categoria_id != null ? String(p.categoria_id) : null,
    subcategoria_id: p.subcategoria_id != null ? String(p.subcategoria_id) : null,
    es_colaboracion: Boolean(p.es_colaboracion),
    etiqueta: typeof p.etiqueta === "string" ? p.etiqueta : (p.etiqueta ? String(p.etiqueta) : ""),
    descuento: p.descuento != null ? Number(p.descuento) : 0,
    imagen_url: typeof p.imagen_url === "string" ? p.imagen_url : null,
    imagenes: safeArray(p.imagenes),
    imagen_principal: typeof p.imagen_url === "string"
      ? p.imagen_url
      : (safeArray(p.imagenes)[0] || null),
    colores: safeArray(p.colores),
    tallas: safeArray(p.tallas),
    corte: typeof p.corte === "string" ? p.corte : (p.corte ? String(p.corte) : ""),
    created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
    variantes: Array.isArray(p.variantes)
      ? p.variantes.map((v) => ({
          ...v,
          stock: v?.stock != null ? Number(v.stock) : undefined,
        }))
      : [],
    inventario: Array.isArray(p.inventario)
      ? p.inventario.map((i) => ({
          ...i,
          cantidad: i?.cantidad != null ? Number(i.cantidad) : undefined,
        }))
      : [],
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
