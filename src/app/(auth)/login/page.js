'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        setError('Credenciales incorrectas o usuario no encontrado.');
        setLoading(false);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      console.log('Datos de sesión obtenidos:', session);

      // Sincronizar sesión con el servidor para el middleware
      if (data?.session) {
        await fetch('/api/auth/callback', {
          method: 'POST',
          body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Redirige al home o dashboard
      router.push('/');
      router.refresh(); // Forzar actualización para que el layout detecte la sesión
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">INICIAR SESIÓN</h1>
        <p className="text-gray-400 text-sm">Accede a tu cuenta</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 flex items-center justify-center ${
            loading ? 'opacity-80 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              INGRESANDO...
            </>
          ) : 'INGRESAR'}
        </button>
      </div>

      <div className="text-center text-sm text-gray-400 mt-6">
        <p>¿No tienes una cuenta?{' '}
          <a href="/registro" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200">
            Regístrate
          </a>
        </p>
      </div>
    </form>
  );
}
