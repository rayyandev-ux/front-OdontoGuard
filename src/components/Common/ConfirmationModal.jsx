import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex items-center mb-4 text-red-600">
            <div className="bg-red-100 p-2 rounded-full mr-3">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Confirmar Acción</h3>
        </div>
        <p className="text-slate-600 mb-6 ml-11 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
