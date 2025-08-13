/**
 * Layout compartido para todas las páginas de autenticación (login, registro, etc.)
 * Proporciona un diseño consistente para los formularios de autenticación
 */
export default function AuthLayout({ children }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </section>
  );
}
