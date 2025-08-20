'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // 👈 Import Link
import { supabase } from '@/lib/supabase/client';

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!formData.nombre.trim()) {
      setError('El nombre completo es obligatorio.');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { nombre: formData.nombre.trim() } },
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          setError('Este correo electrónico ya está registrado.');
        } else {
          setError(signUpError.message || 'Error al crear la cuenta.');
        }
        throw signUpError;
      }

      if (!authData || !authData.user) {
        throw new Error('No se pudo crear el usuario en el sistema de autenticación.');
      }

      if (authData.session) {
        await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'SIGNED_IN', session: authData.session }),
        });
      }

      setSuccessMessage(
        `Cuenta creada correctamente. 
        Hemos enviado un correo de verificación a ${formData.email}. 
        Revisa tu bandeja de entrada para activar tu cuenta.`
      );
    } catch (err) {
      console.error('Error en el proceso de registro:', err);
      if (!error) setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">CREA TU CUENTA</h1>
            <p className="text-gray-400 text-sm">Únete a nuestra comunidad</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border-l-4 border-red-500 p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/40 border-l-4 border-green-500 p-4 text-center">
              <p className="text-green-200 text-sm mb-4">{successMessage}</p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-yellow-400 text-black font-bold rounded-md hover:bg-yellow-500 transition"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          )}

          {!successMessage && (
            <>
              <div className="space-y-4">
                <input {...{
                  id:"nombre", name:"nombre", type:"text", placeholder:"Nombre completo",
                  value:formData.nombre, onChange:handleChange, disabled:loading, required:true,
                  className:"w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                }} />

                <input {...{
                  id:"email", name:"email", type:"email", placeholder:"Correo electrónico",
                  value:formData.email, onChange:handleChange, disabled:loading, required:true,
                  className:"w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                }} />

                <input {...{
                  id:"password", name:"password", type:"password", placeholder:"Contraseña",
                  value:formData.password, onChange:handleChange, disabled:loading, required:true,
                  className:"w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                }} />

                <input {...{
                  id:"confirmPassword", name:"confirmPassword", type:"password", placeholder:"Repetir contraseña",
                  value:formData.confirmPassword, onChange:handleChange, disabled:loading, required:true,
                  className:"w-full px-4 py-3 bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                }} />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-md font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 flex items-center justify-center ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}>
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      CREANDO CUENTA...
                    </>
                  ) : 'CREAR CUENTA'}
                </button>
              </div>

              <div className="text-center text-sm text-gray-400">
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
