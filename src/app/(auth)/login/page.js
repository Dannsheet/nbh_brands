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
      // 1) Intentar login
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        if (loginError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Correo o contraseña incorrectos.');
        } else if (loginError.message.toLowerCase().includes('email not confirmed')) {
          setError('Debes confirmar tu correo antes de ingresar.');
        } else {
          setError('No se pudo iniciar sesión. Inténtalo nuevamente.');
        }
        return;
      }

      if (!data?.session) {
        setError('No se pudo obtener una sesión activa.');
        return;
      }

      // 2) Sincronizar sesión con tu backend para cookies/middleware
      await fetch('/api/auth/callback', {
        method: 'POST',
        body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 3) Redirigir
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Ocurrió un error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">INICIAR SESIÓN</h1>
            <p className="text-gray-400 text-sm">Accede a tu cuenta</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border-l-4 border-red-500 p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
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

          <div className="text-center text-sm text-gray-400">
            <p>¿No tienes una cuenta?{' '}
              <a href="/registro" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200">
                Regístrate
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
