import React, { useState } from 'react';
import { Stethoscope, AlertTriangle, Loader2 } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (e) {
      setError(e?.message || 'Error de inicio de sesión');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-8">
          <div className="bg-teal-50 p-4 rounded-2xl">
            <Stethoscope className="w-10 h-10 text-teal-600" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
          <p className="text-slate-500 mt-2">Ingresa tus credenciales para acceder</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Código de Acceso</label>
            <input 
              type="text" 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
              placeholder="Código de la clínica"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-600/20 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Ingresar al Sistema'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          © 2025 OdontoKaren. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
