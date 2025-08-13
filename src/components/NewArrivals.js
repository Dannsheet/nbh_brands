// components/NewArrivals.js
export default function NewArrivals() {
  const products = [
    {
      id: 1,
      name: "Camiseta Boxy Fit",
      price: 45.0,
      colors: ["#000000", "#FFFFFF", "#FF0000"],
      isNew: true,
      discount: null,
      image: "/placeholder.jpg",
    },
    {
      id: 2,
      name: "Pantalón Cargo",
      price: 60.0,
      colors: ["#CCCCCC", "#333333"],
      isNew: false,
      discount: 30,
      image: "/placeholder.jpg",
    },
  ];

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10">Recién Llegados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="border p-4 rounded-lg relative hover:shadow-lg"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded"
            />
            {product.isNew && (
              <span className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs rounded">
                Nuevo
              </span>
            )}
            {product.discount && (
              <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                Oferta {product.discount}% -
              </span>
            )}
            <h3 className="mt-4 font-semibold">{product.name}</h3>
            <p className="text-gray-600">${product.price}</p>
            <div className="flex gap-2 mt-2">
              {product.colors.map((color, i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color }}
                ></span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
