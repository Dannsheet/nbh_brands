// components/Footer.js
export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 mt-16 normal-case">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} NBH Studios. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
