import React, { useState } from 'react';
import RealisticTooth from './RealisticTooth';
import { Save } from 'lucide-react';

const TOOLS = {
  SELECT: { id: 'select', label: 'Seleccionar', color: 'transparent' },
  CARIES: { id: 'caries', label: 'Caries', color: '#ef4444' },
  RESIN: { id: 'resin', label: 'Restauración', color: '#3b82f6' },
  SEALANT: { id: 'sealant', label: 'Sellante', color: '#22c55e' },
  MISSING: { id: 'missing', label: 'Ausente', color: '#1f2937' },
  CROWN_GOOD: { id: 'crown_good', label: 'Corona (buena)', color: '#3b82f6' },
  CROWN_CHANGE: { id: 'crown_change', label: 'Corona (cambio)', color: '#ef4444' },
  EXTRACTION: { id: 'extraction', label: 'Extracción', color: '#ef4444' },
};

const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const CHILD_TEETH_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const CHILD_TEETH_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const RealisticOdontogram = ({ data, onSave, readOnly = false, onChange }) => {
  const [teethState, setTeethState] = useState(data || {});
  const [activeTool, setActiveTool] = useState('select');
  

  const handleToothUpdate = (toothId, face, toolId) => {
    if (readOnly) return;
    const newTeethState = { ...teethState };
    if (!newTeethState[toothId]) newTeethState[toothId] = {};
    if (toolId === null) {
      delete newTeethState[toothId][face];
    } else {
      newTeethState[toothId][face] = toolId;
    }
    setTeethState(newTeethState);
    if (onChange) onChange(newTeethState);
  };

  const handleSave = () => {
    onSave(teethState);
  };

  const renderRow = (teethIds, position) => (
    <div className="odontogram-row flex flex-nowrap items-start gap-2 md:justify-center px-2 py-2">
      {teethIds.map(id => (
        <RealisticTooth 
          key={id} 
          id={id} 
          data={teethState[id]} 
          activeTool={activeTool} 
          onUpdate={handleToothUpdate}
          position={position}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
      {/* Toolbar */}
      {!readOnly && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="tool-scroll flex flex-nowrap gap-2 w-full md:w-auto overflow-x-auto md:overflow-visible pb-1">
            {Object.values(TOOLS).map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`
                  tool-chip flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all md:w-auto min-w-[140px]
                  ${activeTool === tool.id 
                    ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white' 
                    : 'text-slate-600 dark:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                  }
                `}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tool.color, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                {tool.label}
              </button>
            ))}
          </div>

          <div className="md:hidden text-[11px] text-slate-500 mt-1">Desliza para ver más herramientas →</div>

          

          <button 
            onClick={handleSave}
            className="md:ml-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors w-full md:w-auto"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      )}

      {/* Odontogram View */}
      <div className="overflow-y-auto overflow-x-hidden pb-4">
        <div className="space-y-8">
          
          {/* Adult Teeth */}
          <div className="space-y-4">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">Dentición Adulta</h3>
            <div className="md:hidden text-center text-[11px] text-slate-500">Desliza cada fila para ver todos los dientes →</div>
            <div className="relative">
              {/* Upper */}
              <div className="mb-2">
                 {renderRow(ADULT_TEETH_UPPER, 'upper')}
              </div>
              
              <div className="border-t border-dashed border-slate-200 my-4"></div>

              {/* Lower */}
              <div>
                 {renderRow(ADULT_TEETH_LOWER, 'lower')}
              </div>
            </div>
          </div>

          {/* Child Teeth */}
          <div className="space-y-4 pt-8">
             <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">Dentición Decidua (Niños)</h3>
             <div className="relative w-full">
                <div className="mb-2">
                  {renderRow(CHILD_TEETH_UPPER, 'upper')}
                </div>
                <div className="border-t border-dashed border-slate-200 my-4"></div>
                <div>
                  {renderRow(CHILD_TEETH_LOWER, 'lower')}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RealisticOdontogram;
