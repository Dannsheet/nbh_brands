export default function EncuentranosPage() {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 uppercase">
          Encuéntranos
        </h1>
        <div className="text-center">
          <p className="mb-4">
            Visita nuestra tienda física para una experiencia de compra única.
          </p>
          <p className="font-semibold">
            Dirección: Av. Siempre Viva 742, Springfield
          </p>
          <p>Horario: Lunes a Sábado de 10:00 a 20:00</p>
        </div>
        {/* Aquí se podría agregar un mapa de Google Maps en el futuro */}
      </div>
    );
  }