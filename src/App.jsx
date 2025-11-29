import React, { useState, useEffect, useMemo, useRef } from 'react';
import { login as apiLogin, listPatients, createPatient, updatePatient, deletePatient, listServices, createService, updateService, deleteService, sendEmail, listAppointments, createAppointment, updateAppointment, deleteAppointment, listReminderRules, createReminderRule, updateReminderRule, deleteReminderRule, listReminders, createReminder, deleteReminder, processDueReminders, sendReminderNow, listMessageLogs } from './api.js'
import { 
  User, 
  FileText, 
  FileSpreadsheet,
  Activity, 
  Image as ImageIcon, 
  Save, 
  Plus, 
  Search, 
  LogOut, 
  Trash2, 
  ChevronRight,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Briefcase,
  MapPin,
  Heart,
  Loader2,
  Wallet,
  DollarSign,
  Calendar,
  Clock,
  ArrowLeft,
  History,
  CreditCard,
  Stethoscope as StethoscopeIcon,
  AlertTriangle,
  Upload,
  FileImage,
  Camera,
  Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DNI_API_KEY = "9471419289872be41891b833cdafbf78561b067536c9aedc4fc001f869973138";
const DNI_API_URL = "https://apiperu.dev/api/dni";
const LOGIN_EMAIL = 'odontokaren@odonto.com';
const LOGIN_PASSWORD = 'odonto123karen';
const ACCESS_CODE = 'ODONTO-ACCESS-2025';

const TOOLS = {
  SELECT: { id: 'select', label: 'Seleccionar', color: 'transparent' },
  CARIES: { id: 'caries', label: 'Caries (Rojo)', color: '#ef4444' },
  RESIN: { id: 'resin', label: 'Restauración (Azul)', color: '#3b82f6' },
  SEALANT: { id: 'sealant', label: 'Sellante (Verde)', color: '#22c55e' },
  MISSING: { id: 'missing', label: 'Ausente (X)', color: '#1f2937' },
  CROWN: { id: 'crown', label: 'Corona (Círculo)', color: '#eab308' },
};

const SERVICES = [
  { name: 'Resina simple', price: 50 },
  { name: 'Resina compuesta', price: 70 },
  { name: 'Carilla directa con resina', price: 200 },
  { name: 'Endodoncia anterior', price: 300 },
  { name: 'Endodoncia posterior', price: 450 },
  { name: 'Retratamiento', price: 500 },
  { name: 'Perno', price: 200 },
  { name: 'Corona zirconio', price: 1200 },
  { name: 'Corona metal cerámica', price: 700 },
  { name: 'Carilla cerámica', price: 1200 },
  { name: 'Prótesis parcial removible dientes olimpic', price: 1200 },
  { name: 'Prótesis parcial removible dientes ivostar', price: 1300 },
  { name: 'Prótesis completa', price: 1300 },
  { name: 'Extracción simple', price: 50 },
  { name: 'Extracción compleja / Tercera molar superior erupcionada', price: 150 },
  { name: 'Cirugía tercera molar', price: 300 },
  { name: 'Blanqueamiento láser', price: 400 },
  { name: 'Blanqueamiento cubetas', price: 400 },
  { name: 'Blanqueamiento mixto', price: 800 },
  { name: 'Pulpotomia', price: 250 },
  { name: 'Pulpectomia', price: 350 },
  { name: 'Corona de acero cromo niño', price: 150 },
  { name: 'Exodoncias niño', price: 100 },
  { name: 'Mantenedor de espacio unilateral', price: 250 },
  { name: 'Mantenedor de espacio bilateral', price: 350 },
  { name: 'Ortodoncia inicial', price: 1100 },
  { name: 'Ortodoncia cuotas mensuales', price: 180 },
  { name: 'Ortodoncia contención', price: 400 },
  { name: 'Recementado/reposición de bracket', price: 50 },
  { name: 'Destartraje y profilaxis', price: 100 },
  { name: 'Fluor barniz', price: 100 }
];

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const CHILD_TEETH_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const CHILD_TEETH_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

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

const LoginForm = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-teal-600">
        <div className="flex justify-center mb-6">
          <div className="bg-teal-100 p-4 rounded-full">
            <Stethoscope className="w-10 h-10 text-teal-700" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">OdontoKaren</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Email"
          />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Contraseña"
          />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código de Acceso</label>
          <input 
            type="text" 
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Código de Acceso"
          />
          </div>
          {error && (
            <div className="flex items-center text-red-600 text-sm"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>
          )}
          <button 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
          >
            {loading ? 'Accediendo...' : 'Ingresar al Sistema'}
          </button>
        </form>
        
      </div>
    </div>
  );
};

const Tooth = ({ id, data, activeTool, onUpdate }) => {
  const handleFaceClick = (face) => {
    if (!activeTool || activeTool === 'select') return;
    const currentStatus = data?.[face];
    const newStatus = currentStatus === activeTool ? null : activeTool;
    onUpdate(id, face, newStatus);
  };

  const getFaceColor = (face) => {
    const toolId = data?.[face];
    return toolId ? TOOLS[toolId.toUpperCase()]?.color : 'white';
  };

  const isMissing = Object.values(data || {}).some(v => v === 'missing');

  return (
    <div className="flex flex-col items-center mx-0.5 mb-4">
      <span className="text-xs text-slate-100 font-mono mb-1">{id}</span>
      <div className="relative w-9 h-9 md:w-10 md:h-10 shadow-sm">
        {isMissing && (
           <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
             <X className="w-12 h-12 text-white opacity-90" strokeWidth={3} />
           </div>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm cursor-pointer">
           <polygon points="0,0 100,0 70,30 30,30" fill={getFaceColor('top')} stroke="#000000" strokeWidth="1" onClick={() => handleFaceClick('top')} className="hover:opacity-80 transition-opacity" />
           <polygon points="0,100 100,100 70,70 30,70" fill={getFaceColor('bottom')} stroke="#000000" strokeWidth="1" onClick={() => handleFaceClick('bottom')} className="hover:opacity-80 transition-opacity" />
           <polygon points="0,0 0,100 30,70 30,30" fill={getFaceColor('left')} stroke="#000000" strokeWidth="1" onClick={() => handleFaceClick('left')} className="hover:opacity-80 transition-opacity" />
           <polygon points="100,0 100,100 70,70 70,30" fill={getFaceColor('right')} stroke="#000000" strokeWidth="1" onClick={() => handleFaceClick('right')} className="hover:opacity-80 transition-opacity" />
           <rect x="30" y="30" width="40" height="40" fill={getFaceColor('center')} stroke="#000000" strokeWidth="1" onClick={() => handleFaceClick('center')} className="hover:opacity-80 transition-opacity" />
        </svg>
      </div>
      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-black mt-0.5"></div>
    </div>
  );
};

const Odontogram = ({ data, onSave, readOnly = false, onChange }) => {
  const [teethState, setTeethState] = useState(data || {});
  const [activeTool, setActiveTool] = useState(readOnly ? 'select' : 'select');
  const [toolsOpen, setToolsOpen] = useState(false);

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

  const renderRow = (teethIds) => (
    <div className="flex justify-center bg-slate-900 p-3 rounded-lg border border-slate-700 mb-2 shadow-md overflow-x-auto">
      {teethIds.map(id => (
        <Tooth key={id} id={id} data={teethState[id]} activeTool={activeTool} onUpdate={handleToothUpdate} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {!readOnly && (
        <div className="md:sticky md:top-0 md:z-10">
          <div className="bg-slate-800 text-white md:p-4 p-3 rounded-lg shadow-lg w-full">
            <div className="flex items-center justify-between md:justify-start md:gap-4">
              <span className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-200">Herramientas</span>
              <button onClick={() => setToolsOpen(v => !v)} className="md:hidden bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm">
                {toolsOpen ? 'Cerrar' : 'Mostrar'}
              </button>
              <div className="hidden md:flex items-center gap-3 flex-wrap ml-4">
                {Object.values(TOOLS).map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm md:text-base font-bold transition-all ${
                      activeTool === tool.id ? 'bg-white text-slate-900 shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-slate-500" style={{ backgroundColor: tool.color }}></div>
                    <span>{tool.label}</span>
                  </button>
                ))}
                <div className="flex-grow"></div>
                <button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-full text-sm md:text-base font-bold inline-flex items-center shadow-lg transition-colors">
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </div>
            <div className={`${toolsOpen ? 'block' : 'hidden'} md:hidden mt-3`}>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(TOOLS).map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-bold transition-all ${
                      activeTool === tool.id ? 'bg-white text-slate-900 shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-slate-500" style={{ backgroundColor: tool.color }}></div>
                    <span className="truncate">{tool.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={handleSave} className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold inline-flex items-center justify-center shadow-lg transition-colors">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl border border-slate-200 ${readOnly ? 'bg-gray-50 opacity-90' : 'bg-slate-50'}`}>
        <h3 className="text-center font-bold text-slate-700 mb-2 uppercase tracking-wide">Dentición Adulta</h3>
        <div className="grid grid-cols-1 gap-4">
            <div>
               <p className="text-center text-xs text-slate-400 mb-1">Superior Derecha (Q1) - Superior Izquierda (Q2)</p>
               {renderRow(ADULT_TEETH_UPPER)}
            </div>
            <div>
                <p className="text-center text-xs text-slate-400 mb-1">Inferior Derecha (Q4) - Inferior Izquierda (Q3)</p>
                {renderRow(ADULT_TEETH_LOWER)}
            </div>
        </div>

        <h3 className="text-center font-bold text-slate-700 mt-6 mb-2 uppercase tracking-wide">Dentición Infantil</h3>
        <div className="flex flex-col items-center">
             <div className="w-full max-w-4xl">
               {renderRow(CHILD_TEETH_UPPER)}
               {renderRow(CHILD_TEETH_LOWER)}
             </div>
        </div>
      </div>
      
      {!readOnly && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start space-x-3 text-sm text-blue-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <div>
                <p className="font-semibold">Instrucciones:</p>
                <p>Seleccione una herramienta del panel superior y haga clic en la cara del diente correspondiente para marcarla.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login'); 
  const [patients, setPatients] = useState([]);
  const [patientsError, setPatientsError] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); 
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: () => {} });
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [isCreatingProgress, setIsCreatingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({ date: '', notes: '', title: '', attachments: [] });
  const [progressOdontogram, setProgressOdontogram] = useState({});
  const [isSearchingDNI, setIsSearchingDNI] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: 'Pago a cuenta',
    amount: '',
  });
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '' });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceEditForm, setServiceEditForm] = useState({ name: '', price: '' });
  const [serviceQuery, setServiceQuery] = useState('');
  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services || [];
    return (services || []).filter(s => String(s.name).toLowerCase().includes(q));
  }, [services, serviceQuery]);
  const [imagePreview, setImagePreview] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [appointmentEditForm, setAppointmentEditForm] = useState({ title: '', serviceId: '', startAt: '' });
  const [dayModal, setDayModal] = useState({ open: false, date: null });
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayModalForm, setDayModalForm] = useState({ patientId: '', serviceId: '', time: '', durationMinutes: '', notes: '' });
  const [rules, setRules] = useState([]);
  const [completeBusyId, setCompleteBusyId] = useState(null);
  
  const [reminders, setReminders] = useState([]);
  const [logsByReminder, setLogsByReminder] = useState({});
  const [reminderStatusFilter, setReminderStatusFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const weekDayRefs = useRef([]);
  
  const defaultFollowUpTemplate = 'Hola {nombre} 😊, soy la Dra. Karen. Te escribo para recordarte tu {servicio} el {fecha}. Si tienes alguna duda, cuéntame por aquí. ¡Nos vemos pronto! 🦷✨';
  const [manualReminderOpen, setManualReminderOpen] = useState(false);
  const [manualReminderForm, setManualReminderForm] = useState({ patientId: '', serviceId: '', dueDate: '', dueTime: '', messageText: defaultFollowUpTemplate });
  const [followRuleForm, setFollowRuleForm] = useState({ serviceId: '', delayDays: 7, templateText: defaultFollowUpTemplate });
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formErrors, setFormErrors] = useState({ serviceId: '', delayDays: '', templateText: '' });
  const [saveNotice, setSaveNotice] = useState('');
  const messageRef = useRef(null);

  const DEFAULT_SERVICES = [
    { name: 'Resina simple', price: 50 },
    { name: 'Carilla directa con resina', price: 200 },
    { name: 'Endodoncia anterior', price: 300 },
    { name: 'Endodoncia posterior', price: 450 },
    { name: 'Retratamiento', price: 500 },
    { name: 'Perno', price: 200 },
    { name: 'Corona zirconio', price: 1200 },
    { name: 'Corona metal cerámica', price: 700 },
    { name: 'Carilla cerámica', price: 1200 },
    { name: 'Prótesis parcial removible (dientes Olympic)', price: 1200 },
    { name: 'Prótesis parcial removible (dientes Ivostar)', price: 1300 },
    { name: 'Prótesis completa', price: 1300 },
    { name: 'Extracción simple', price: 50 },
    { name: 'Extracción compleja / Tercera molar superior erupcionada', price: 150 },
    { name: 'Cirugía tercera molar', price: 300 },
    { name: 'Blanqueamiento láser', price: 400 },
    { name: 'Blanqueamiento cubetas', price: 400 },
    { name: 'Blanqueamiento mixto', price: 800 },
    { name: 'Pulpotomía', price: 250 },
    { name: 'Pulpectomía', price: 350 },
    { name: 'Corona de acero cromo niño', price: 150 },
    { name: 'Exodoncias niño', price: 100 },
    { name: 'Mantenedor de espacio unilateral', price: 250 },
    { name: 'Mantenedor de espacio bilateral', price: 350 },
    { name: 'Ortodoncia inicial', price: 1100 },
    { name: 'Ortodoncia cuota mensual', price: 180 },
    { name: 'Ortodoncia contención', price: 400 },
    { name: 'Recementado o reposición de bracket', price: 50 },
    { name: 'Destartraje y profilaxis', price: 100 },
    { name: 'Fluor barniz', price: 100 },
  ];

  const seedDefaultServices = async () => {
    try {
      if (!token) return;
      const existingByName = new Map((services || []).map(s => [String(s.name).trim().toLowerCase(), s]));
      let created = 0, updated = 0;
      for (const svc of DEFAULT_SERVICES) {
        const key = String(svc.name).trim().toLowerCase();
        const found = existingByName.get(key);
        if (!found) {
          const createdSvc = await createService(token, { name: svc.name, price: svc.price });
          created++;
          setServices(prev => [createdSvc, ...prev]);
        } else if (Number(found.price) !== Number(svc.price)) {
          const saved = await updateService(token, found.id, { name: found.name, price: svc.price });
          updated++;
          setServices(prev => prev.map(x => x.id === saved.id ? saved : x));
        }
      }
      alert(`Servicios creados: ${created} • Actualizados: ${updated}`);
    } catch (e) { alert(e?.message || 'Error cargando servicios por defecto'); }
  };
  
  const [calendarView, setCalendarView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('all');
  

  const startOfWeek = (d) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio
    x.setDate(x.getDate() + diff);
    x.setHours(0,0,0,0);
    return x;
  };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const sameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const formatDate = (d) => { const x = new Date(d); const dd = String(x.getDate()).padStart(2,'0'); const mm = String(x.getMonth()+1).padStart(2,'0'); const yyyy = x.getFullYear(); return `${dd}/${mm}/${yyyy}`; };
  const formatDateTime = (d) => { const x = new Date(d); const time = x.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }); return `${formatDate(x)} ${time}`; };
  
  const weekDays = useMemo(() => {
    const s = startOfWeek(calendarDate);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [calendarDate]);
  const monthMatrix = useMemo(() => {
    const base = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const start = startOfWeek(base);
    return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  }, [calendarDate]);
  const filteredAppointments = useMemo(() => {
    if (calendarStatusFilter === 'all') return appointments;
    return (appointments || []).filter(a => a.status === calendarStatusFilter);
  }, [appointments, calendarStatusFilter]);
  const apptsByDay = useMemo(() => {
    const map = new Map();
    for (const a of filteredAppointments || []) {
      const dt = new Date(a.startAt);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }, [filteredAppointments]);

  const filteredReminders = useMemo(() => {
    return reminderStatusFilter === 'all' ? reminders : (reminders || []).filter(r => r.status === reminderStatusFilter);
  }, [reminders, reminderStatusFilter]);
  const groupedReminders = useMemo(() => {
    const map = new Map();
    for (const r of filteredReminders || []) {
      const key = r.appointmentId ? `appt:${r.appointmentId}` : `manual:${r.patientId}:${new Date(r.dueAt).toISOString()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    const groups = [];
    for (const [key, items] of map.entries()) {
      const any = items[0] || {};
      const appt = any.appointmentId ? (appointments || []).find(a => a.id === any.appointmentId) : null;
      const patient = (patients || []).find(p => p.id === any.patientId) || null;
      const service = (services || []).find(s => s.id === (any.serviceId || appt?.serviceId)) || null;
      const headerDate = appt ? formatDateTime(appt.startAt) : formatDateTime(any.dueAt);
      const pendingCount = items.filter(x => x.status === 'pending').length;
      const title = appt ? `Cita del ${headerDate}` : `Recordatorio del ${headerDate}`;
      const subtitlePatient = patient ? `${patient.apellidos}, ${patient.nombres}` : (any.patientName || 'Paciente');
      const subtitleService = service ? service.name : (appt?.title || '');
      groups.push({ key, items, appt, patient, service, title, subtitlePatient, subtitleService, pendingCount });
    }
    return groups.sort((a,b) => {
      const da = a.appt ? new Date(a.appt.startAt) : new Date(a.items[0].dueAt);
      const db = b.appt ? new Date(b.appt.startAt) : new Date(b.items[0].dueAt);
      return db - da;
    });
  }, [filteredReminders, appointments, patients, services, formatDateTime]);
  const defaultExamForm = {
    habitos: '',
    antecedentesFamiliares: '',
    farmacologicos: '',
    noFarmacologicos: '',
    otrosAntecedentes: '',
    examenFisicoGeneral: '',
    examenFisicoRegional: { cabeza: '', cuello: '', cara: '' },
    examenExtraoral: '',
    examenIntraoral: { labios: '', mejilla: '', mucosa: '', paladarDuro: '', paladarBlando: '', tipoDeBoca: '' },
    analisisOclusion: { clase: '', observaciones: '' },
    examenesComplementarios: { rx: '', rpo: '', rmo: '', obl: '' },
    laboratorioClinico: '',
    diagnosticoDefinitivo: '',
    planTratamiento: '',
    pronostico: ''
  };
  const [examForm, setExamForm] = useState(defaultExamForm);
  const progressFileInputRef = useRef(null);
  const generalFileInputRef = useRef(null);
  const initialFormState = {
    nombres: '', apellidos: '', sexo: 'M', dni: '',
    fechaNacimiento: '', edad: '',
    lugarNacimiento: '', lugarProcedencia: '', raza: '',
    domicilio: '', telefono: '', email: '',
    estadoCivil: 'Soltero', gradoInstruccion: '',
    profesion: '', ocupacion: '',
    centroEstudios: '', direccionCentroEstudios: '',
    religion: '',
    emergenciaNombre: '', emergenciaParentesco: '',
    emergenciaDomicilio: '', emergenciaTelefono: '',
    medicoTratante: '',
    antecedentes: '',
    treatments: [],
    progress_records: [],
    general_attachments: []
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (stored) { setToken(stored); setView('dashboard'); }
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!activePatient) { setExamForm(defaultExamForm); return; }
    const raw = activePatient.antecedentes || '';
    try {
      const obj = raw && JSON.parse(raw);
      if (obj && typeof obj === 'object') setExamForm({ ...defaultExamForm, ...obj });
      else setExamForm(defaultExamForm);
    } catch { setExamForm(defaultExamForm); }
  }, [activePatient]);
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await listPatients(token);
        setPatients(data);
        setPatientsError(null);
      } catch (e) {
        setPatientsError(e?.message || 'Error cargando pacientes');
      }
    };
    load();
  }, [token]);
  useEffect(() => {
    const load = async () => {
      if (!token) { setServices(SERVICES.map(s => ({ id: slug(s.name), ...s }))); return; }
      try {
        const data = await listServices(token);
        setServices(data.length ? data.map(s => ({ id: s.id, name: s.name, price: s.price })) : SERVICES.map(s => ({ id: slug(s.name), ...s, local: true })));
        localStorage.setItem('ok_services', JSON.stringify(data));
      } catch {
        try {
          const raw = localStorage.getItem('ok_services');
          if (raw) { const arr = JSON.parse(raw); setServices(arr.map(s => ({ id: s.id || slug(s.name), name: s.name, price: s.price, local: !s.id }))); } else { setServices(SERVICES.map(s => ({ id: slug(s.name), ...s, local: true }))); }
        } catch { setServices(SERVICES.map(s => ({ id: slug(s.name), ...s, local: true }))); }
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try { const a = await listAppointments(token); setAppointments(a); } catch (e) { void e }
      try { const r = await listReminderRules(token); setRules(r); } catch (e) { void e }
      try { const d = await listReminders(token); setReminders(d); } catch (e) { void e }
    };
    load();
  }, [token]);

  useEffect(() => {
    const fn = () => { setIsMobile(window.innerWidth < 768); };
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  useEffect(() => {
    if (isMobile && view === 'agenda') setCalendarView('week');
  }, [isMobile, view]);
  useEffect(() => {
    if (!isMobile || view !== 'agenda' || calendarView !== 'week') return;
    const todayIdx = weekDays.findIndex(d => sameDay(d, new Date()));
    if (todayIdx >= 0 && weekDayRefs.current[todayIdx]) {
      try { weekDayRefs.current[todayIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch { void 0 }
    }
  }, [isMobile, view, calendarView, weekDays]);


  const searchDNI = async (dniValue) => {
    if (!dniValue || dniValue.length < 8) { alert("Por favor ingrese un DNI válido de 8 dígitos."); return; }
    setIsSearchingDNI(true);
    try {
      const response = await fetch(`${DNI_API_URL}/${dniValue}?api_token=${DNI_API_KEY}`);
      const data = await response.json();
      if (data.success) {
        const apellidos = `${data.data.apellido_paterno || ''} ${data.data.apellido_materno || ''}`.trim();
        const nombres = data.data.nombres || '';
        setFormData(prev => ({ ...prev, nombres: nombres, apellidos: apellidos }));
        alert("¡Datos encontrados y rellenados!");
      } else { alert("No se encontraron datos para este DNI."); }
    } catch (error) { console.error("Error fetching DNI:", error); alert("Error al conectar con el servicio de RENIEC."); }
    finally { setIsSearchingDNI(false); }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (creatingPatient) return;
    const dni = String(formData.dni || '').trim();
    const nombres = String(formData.nombres || '').trim().toLowerCase();
    const apellidos = String(formData.apellidos || '').trim().toLowerCase();
    if (!dni || dni.length !== 8) { alert('DNI inválido, debe tener 8 dígitos'); return; }
    const exists = (patients || []).some(p => {
      const pdni = String(p.dni || '').trim();
      const pn = String(p.nombres || '').trim().toLowerCase();
      const pa = String(p.apellidos || '').trim().toLowerCase();
      return (pdni && pdni === dni) || (pn === nombres && pa === apellidos);
    });
    if (exists) { alert('Ya existe un paciente con este DNI o con los mismos nombres y apellidos'); return; }
    setCreatingPatient(true);
    try {
      const created = await createPatient(token, {
        ...formData,
        antecedentes: JSON.stringify(examForm),
        odontogram_initial: {},
        progress_records: [],
        treatments: [],
        general_attachments: []
      });
      const newPatientData = created;
      setPatients(prev => [newPatientData, ...prev]);
      setActivePatient(newPatientData);
      setFormData(newPatientData);
      setView('patient-detail');
      setActiveTab('general');
    } catch (error) { alert("Error creando paciente: " + (error?.message || error)); }
    finally { setCreatingPatient(false); }
  };

  const handleDeletePatient = async (pid) => {
      setConfirmModal({
          isOpen: true,
          message: "¿Estás seguro de eliminar permanentemente el historial de este paciente? Esta acción no se puede deshacer.",
          onConfirm: async () => {
            try {
              await deletePatient(token, pid);
              setPatients(prev => (prev || []).filter(p => p.id !== pid));
              if(activePatient?.id === pid) { setView('dashboard'); setActivePatient(null); setFormData(initialFormState); }
            } catch (e) {
              alert("Error eliminando paciente: " + (e?.message || e));
            }
          }
      });
  };

  const handleSaveOdontogramInitial = async (data) => {
      if (!activePatient) return;
      try {
        await updatePatient(token, activePatient.id, { odontogram_initial: data });
        setActivePatient(prev => ({ ...prev, odontogram_initial: data }));
        alert("Odontograma inicial guardado.");
      } catch (e) { alert("Error guardando odontograma: " + (e?.message || e)); }
  };

  const handleStartNewProgress = () => {
      let baseData = activePatient?.odontogram_initial || {};
      if (activePatient?.progress_records && activePatient.progress_records.length > 0) {
          const last = activePatient.progress_records[activePatient.progress_records.length - 1];
          if (last?.odontogramData) baseData = last.odontogramData;
      }
      setIsCreatingProgress(true);
      setSelectedProgress({ id: 'new', date: new Date().toISOString().split('T')[0], notes: '', title: '', attachments: [], odontogramData: JSON.parse(JSON.stringify(baseData)) });
      setProgressForm({ date: new Date().toISOString().split('T')[0], notes: '', title: '', attachments: [] });
      setProgressOdontogram(baseData);
  };

  const handleAddAttachmentToProgress = () => {
      if (progressFileInputRef.current) progressFileInputRef.current.click();
  };

  const handleAddGeneralAttachment = async () => {
      if (generalFileInputRef.current) generalFileInputRef.current.click();
  };

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });

  const handleProgressFilesSelected = async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      try {
        const items = await Promise.all(files.map(async (f) => ({ id: Date.now().toString() + '_' + f.name, type: 'image', name: f.name, url: await fileToDataURL(f), size: f.size })));
        setProgressForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...items] }));
      } catch (err) { alert('Error leyendo archivos: ' + (err?.message || err)); }
      e.target.value = '';
  };

  const handleRemoveProgressAttachment = (attachmentId) => {
      setProgressForm(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== attachmentId) }));
  };

  const handleGeneralFilesSelected = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!activePatient || files.length === 0) return;
      try {
        const items = await Promise.all(files.map(async (f) => ({ id: Date.now().toString() + '_' + f.name, type: 'image', name: f.name, url: await fileToDataURL(f), size: f.size })));
        const updatedGeneral = [...(activePatient.general_attachments || []), ...items];
        await updatePatient(token, activePatient.id, { general_attachments: updatedGeneral });
        setActivePatient(prev => ({ ...prev, general_attachments: updatedGeneral }));
      } catch (err) { alert('Error agregando anexos: ' + (err?.message || err)); }
      e.target.value = '';
  };

  const handleRemoveGeneralAttachment = async (attachmentId) => {
      if (!activePatient) return;
      try {
        const updatedGeneral = (activePatient.general_attachments || []).filter(a => a.id !== attachmentId);
        await updatePatient(token, activePatient.id, { general_attachments: updatedGeneral });
        setActivePatient(prev => ({ ...prev, general_attachments: updatedGeneral }));
      } catch (e) { alert('Error eliminando anexo: ' + (e?.message || e)); }
  };

  const handleSaveProgress = async (odontogramData) => {
    if (!activePatient) return;
    if (!progressForm.date) { alert("Por favor ingrese la fecha del avance."); return; }
    try {
      const newRecord = { id: selectedProgress.id === 'new' ? Date.now().toString() : selectedProgress.id, date: progressForm.date, notes: progressForm.notes, title: progressForm.title || 'Sin título', attachments: progressForm.attachments || [], odontogramData };
      let updatedRecords = [];
      if (selectedProgress.id === 'new') { updatedRecords = [...(activePatient.progress_records || []), newRecord]; }
      else { updatedRecords = activePatient.progress_records.map(r => r.id === newRecord.id ? newRecord : r); }
      updatedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      await updatePatient(token, activePatient.id, { progress_records: updatedRecords });
      setActivePatient(prev => ({ ...prev, progress_records: updatedRecords }));
      setIsCreatingProgress(false);
      setSelectedProgress(null);
      alert("Avance registrado correctamente.");
    } catch (e) { alert("Error guardando avance: " + (e?.message || e)); }
  };

  

  const handleUpdateGeneralInfo = async (e) => {
      e.preventDefault();
      try {
        const payload = { ...formData, antecedentes: JSON.stringify(examForm) };
        await updatePatient(token, activePatient.id, payload);
        setActivePatient(prev => ({ ...prev, ...payload }));
        setFormData(payload);
        alert("Información actualizada.");
      } catch (e) { alert("Error actualizando información: " + (e?.message || e)); }
  };

  

  const handleMarkAppointmentCompleted = async (id) => {
    setCompleteBusyId(id);
    try {
      const updated = await updateAppointment(token, id, { status: 'completed' });
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
      setCalendarStatusFilter('all');
      let currentReminders = reminders || [];
      try {
        const d = await listReminders(token);
        setReminders(d);
        currentReminders = d || [];
      } catch (e) { void e }
      try {
        const appt = updated || (appointments || []).find(a => a.id === id);
        const sid = appt?.serviceId || null;
        const pid = appt?.patientId || null;
        const rule = (rules || []).find(r => r.serviceId === sid);
        if (token && pid && sid && rule && Number(rule.delayDays) > 0) {
          const start = new Date(appt.startAt);
          start.setDate(start.getDate() + Number(rule.delayDays));
          const dueAtIso = start.toISOString();
          const existing = currentReminders.some(r => r.appointmentId === appt.id && new Date(r.dueAt).toISOString() === dueAtIso);
          if (existing) { return; }
          const svcName = services.find(s => s.id === sid)?.name || 'servicio';
          const patName = patients.find(p => p.id === pid)?.nombres || 'cliente';
          const fechaTxt = formatDate(start);
          const msg = (rule.templateText || defaultFollowUpTemplate)
            .replace('{nombre}', patName)
            .replace('{servicio}', svcName)
            .replace('{fecha}', fechaTxt);
          const created = await createReminder(token, { patientId: pid, serviceId: sid, dueAt: dueAtIso, messageText: msg, channel: 'whatsapp', appointmentId: appt.id });
          setReminders(prev => [created, ...prev]);
        }
      } catch (e) { void e }
    } catch (e) { alert(e?.message || 'Error actualizando cita'); }
    finally { setCompleteBusyId(null); }
  };

  const handleDeleteAppointment = async (id) => { try { await deleteAppointment(token, id); setAppointments(prev => prev.filter(a => a.id !== id)); } catch (e) { alert(e?.message || 'Error eliminando cita'); } };

  const handleStartEditAppointment = (a) => {
    setEditingAppointmentId(a.id);
    setAppointmentEditForm({ title: a.title || '', serviceId: a.serviceId || '', startAt: new Date(a.startAt).toISOString().slice(0,16) });
  };

  const handleCancelEditAppointment = () => { setEditingAppointmentId(null); };

  const handleUpdateAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!editingAppointmentId) return;
    try {
      let sid = appointmentEditForm.serviceId || null;
      if (sid) {
        const sel = services.find(s => s.id === sid);
        if (sel && sel.local) {
          const createdService = await createService(token, { name: sel.name, price: sel.price });
          sid = createdService.id;
          setServices(prev => prev.map(x => x.id === sel.id ? { id: createdService.id, name: createdService.name, price: createdService.price } : x));
        }
      }
      const payload = { title: appointmentEditForm.title, serviceId: sid, startAt: appointmentEditForm.startAt };
      const updated = await updateAppointment(token, editingAppointmentId, payload);
      setAppointments(prev => prev.map(x => x.id === editingAppointmentId ? updated : x));
      setEditingAppointmentId(null);
      try { const d = await listReminders(token); setReminders(d); } catch (e) { void e }
    } catch (e) { alert(e?.message || 'Error actualizando cita'); }
  };

  

  

  const handleProcessReminders = async () => { try { await processDueReminders(token); const d = await listReminders(token); setReminders(d); alert('Recordatorios procesados'); } catch (e) { alert(e?.message || 'Error procesando recordatorios'); } };

  const handleDeleteReminder = async (id) => {
    try {
      if (!token) return;
      await deleteReminder(token, id);
      setReminders(prev => prev.filter(r => r.id !== id));
      setLogsByReminder(prev => { const { [id]: _, ...rest } = prev; return rest; });
      alert('Recordatorio eliminado');
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('reminder_not_found')) {
        setReminders(prev => prev.filter(r => r.id !== id));
        setLogsByReminder(prev => { const { [id]: _, ...rest } = prev; return rest; });
        alert('El recordatorio no existe, se eliminó de la lista');
      } else {
        alert(e?.message || 'Error eliminando recordatorio');
      }
    }
  };

  

  

  



  const handleAddVisit = async (e) => {
      e.preventDefault();
      if (!activePatient) return;
      try {
        const newEntry = { id: Date.now().toString(), date: visitForm.date, description: visitForm.description, cost: parseFloat(visitForm.cost) || 0, payment: 0, type: 'visit' };
        const updatedTreatments = [...(activePatient.treatments || []), newEntry];
        await updatePatient(token, activePatient.id, { treatments: updatedTreatments });
        setActivePatient(prev => ({ ...prev, treatments: updatedTreatments }));
        setVisitForm({ date: new Date().toISOString().split('T')[0], description: '', cost: '' });
      } catch (e) { alert("Error agregando tratamiento: " + (e?.message || e)); }
  };

  const handleAddPayment = async (e) => {
      e.preventDefault();
      if (!activePatient) return;
      try {
        const newEntry = { id: Date.now().toString(), date: paymentForm.date, description: paymentForm.description || 'Pago a cuenta', cost: 0, payment: parseFloat(paymentForm.amount) || 0, type: 'payment' };
        const updatedTreatments = [...(activePatient.treatments || []), newEntry];
        await updatePatient(token, activePatient.id, { treatments: updatedTreatments });
        setActivePatient(prev => ({ ...prev, treatments: updatedTreatments }));
        setPaymentForm({ date: new Date().toISOString().split('T')[0], description: 'Pago a cuenta', amount: '' });
      } catch (e) { alert("Error registrando pago: " + (e?.message || e)); }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    const name = (serviceForm.name || '').trim();
    const priceNum = parseFloat(serviceForm.price) || 0;
    if (!name) { alert('Nombre requerido'); return; }
    const optimistic = { id: Date.now().toString(), name, price: priceNum };
    setServices(prev => [...prev, optimistic]);
    setServiceForm({ name: '', price: '' });
    try {
      if (token) {
        const created = await createService(token, { name, price: priceNum });
        setServices(prev => prev.map(s => s.id === optimistic.id ? { ...created } : s));
      }
    } catch (e) { void e }
  };

  const handleDeleteService = async (id) => {
    const current = services;
    const svc = current.find(s => s.id === id);
    const next = current.filter(s => s.id !== id);
    setServices(next);
    if (!token || (svc && svc.local)) {
      try { localStorage.setItem('ok_services', JSON.stringify(next.map(s => ({ id: s.id, name: s.name, price: s.price })))); } catch { void 0 }
      return;
    }
    try { await deleteService(token, id); localStorage.setItem('ok_services', JSON.stringify(next.map(s => ({ id: s.id, name: s.name, price: s.price })))); }
    catch { setServices(current); }
  };

  const handleStartEditService = (s) => { setEditingServiceId(s.id || slug(s.name)); setServiceEditForm({ name: s.name, price: String(s.price) }); };
  const handleCancelEditService = () => { setEditingServiceId(null); setServiceEditForm({ name: '', price: '' }); };
  const handleSaveEditService = async () => {
    if (!editingServiceId) return;
    const name = (serviceEditForm.name || '').trim();
    const priceNum = parseFloat(serviceEditForm.price) || 0;
    setServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, name, price: priceNum } : s));
    const sid = editingServiceId;
    setEditingServiceId(null);
    setServiceEditForm({ name: '', price: '' });
    try { if (token) await updateService(token, sid, { name, price: priceNum }); } catch (e) { void e }
  };

  const handleDeleteTreatment = async (tid) => {
      setConfirmModal({
          isOpen: true,
          message: "¿Eliminar este registro económico (visita o pago)? Esto afectará el saldo total.",
          onConfirm: async () => {
            try {
              const updatedTreatments = activePatient.treatments.filter(t => t.id !== tid);
              await updatePatient(token, activePatient.id, { treatments: updatedTreatments });
              setActivePatient(prev => ({ ...prev, treatments: updatedTreatments }));
            } catch (e) { alert("Error eliminando registro: " + (e?.message || e)); }
          }
      });
  };

  const handleDOBChange = (e) => { const dob = e.target.value; const age = calculateAge(dob); setFormData({ ...formData, fechaNacimiento: dob, edad: age }); };

  const totals = useMemo(() => {
      if (!activePatient?.treatments) return { cost: 0, paid: 0, balance: 0 };
      const cost = activePatient.treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
      const paid = activePatient.treatments.reduce((sum, t) => sum + (t.payment || 0), 0);
      return { cost, paid, balance: cost - paid };
  }, [activePatient]);

  const exportPatientsExcel = () => {
    const rows = patients.map(p => ({ Apellidos: p.apellidos || '', Nombres: p.nombres || '', DNI: p.dni || '', Telefono: p.telefono || '', Email: p.email || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
    XLSX.writeFile(wb, 'pacientes.xlsx');
  };

  const exportPatientsPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { head: [['Apellidos','Nombres','DNI','Teléfono','Email']], body: patients.map(p => [p.apellidos || '', p.nombres || '', p.dni || '', p.telefono || '', p.email || '']) });
    doc.save('pacientes.pdf');
  };

  const exportServicesExcel = () => {
    const rows = services.map(s => ({ Servicio: s.name || '', Precio: Number(s.price || 0) }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
    XLSX.writeFile(wb, 'servicios.xlsx');
  };

  const exportServicesPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { head: [['Servicio','Precio (S/)']], body: services.map(s => [s.name || '', Number(s.price || 0).toFixed(2)]) });
    doc.save('servicios.pdf');
  };

  const buildPatientPDF = () => {
    const doc = new jsPDF();
    const title = `Paciente: ${(activePatient?.apellidos || '')}, ${(activePatient?.nombres || '')}`;
    doc.setFontSize(16);
    doc.text(title, 10, 14);
    const info = [
      ['DNI', activePatient?.dni || ''],
      ['Teléfono', activePatient?.telefono || ''],
      ['Email', activePatient?.email || ''],
      ['Edad', activePatient?.edad || ''],
      ['Sexo', activePatient?.sexo || ''],
      ['Domicilio', activePatient?.domicilio || '']
    ];
    autoTable(doc, { startY: 20, head: [['Campo','Valor']], body: info });
    const tr = (activePatient?.treatments || []).map(t => [t.date || '', t.description || '', Number(t.cost || 0).toFixed(2), Number(t.payment || 0).toFixed(2), t.type || '']);
    if (tr.length) autoTable(doc, { margin: { top: 10 }, head: [['Fecha','Descripción','Costo','Pago','Tipo']], body: tr });
    return doc;
  };

  const buildGeneralPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Datos Generales', 10, 14);
    const filiacion = [
      ['Nombres', formData.nombres || ''],
      ['Apellidos', formData.apellidos || ''],
      ['Sexo', formData.sexo || ''],
      ['DNI', formData.dni || ''],
      ['Fecha Nacimiento', formData.fechaNacimiento || ''],
      ['Edad', formData.edad || '']
    ];
    autoTable(doc, { startY: 20, head: [['Campo','Valor']], body: filiacion });
    const ubicacion = [
      ['Domicilio', formData.domicilio || ''],
      ['Email', formData.email || ''],
      ['Teléfono', formData.telefono || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: ubicacion });
    const estado = [
      ['Estado Civil', formData.estadoCivil || ''],
      ['Grado Instrucción', formData.gradoInstruccion || ''],
      ['Religión', formData.religion || ''],
      ['Profesión', formData.profesion || ''],
      ['Ocupación', formData.ocupacion || ''],
      ['Centro de Estudios', formData.centroEstudios || ''],
      ['Dirección del Centro', formData.direccionCentroEstudios || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: estado });
    const salud = [
      ['Médico Tratante', formData.medicoTratante || ''],
      ['Emergencia Nombre', formData.emergenciaNombre || ''],
      ['Emergencia Parentesco', formData.emergenciaParentesco || ''],
      ['Emergencia Domicilio', formData.emergenciaDomicilio || ''],
      ['Emergencia Teléfono', formData.emergenciaTelefono || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: salud });
    const antecedentes = [
      ['Hábitos', examForm.habitos || ''],
      ['Familiares', examForm.antecedentesFamiliares || ''],
      ['Farmacológicos', examForm.farmacologicos || ''],
      ['No farmacológicos', examForm.noFarmacologicos || ''],
      ['Otros', examForm.otrosAntecedentes || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: antecedentes });
    const fisico1 = [
      ['General', examForm.examenFisicoGeneral || ''],
      ['Cabeza', examForm.examenFisicoRegional?.cabeza || ''],
      ['Cuello', examForm.examenFisicoRegional?.cuello || ''],
      ['Cara', examForm.examenFisicoRegional?.cara || ''],
      ['Extraoral', examForm.examenExtraoral || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: fisico1 });
    const intra = [
      ['Labios', examForm.examenIntraoral?.labios || ''],
      ['Mejilla', examForm.examenIntraoral?.mejilla || ''],
      ['Mucosa', examForm.examenIntraoral?.mucosa || ''],
      ['Paladar duro', examForm.examenIntraoral?.paladarDuro || ''],
      ['Paladar blando', examForm.examenIntraoral?.paladarBlando || ''],
      ['Tipo de boca', examForm.examenIntraoral?.tipoDeBoca || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: intra });
    const oclusion = [
      ['Clase', examForm.analisisOclusion?.clase || ''],
      ['Observaciones', examForm.analisisOclusion?.observaciones || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: oclusion });
    const compl = [
      ['RX', examForm.examenesComplementarios?.rx || ''],
      ['RPO', examForm.examenesComplementarios?.rpo || ''],
      ['RMO', examForm.examenesComplementarios?.rmo || ''],
      ['OBL', examForm.examenesComplementarios?.obl || '']
    ];
    autoTable(doc, { head: [['Campo','Valor']], body: compl });
    autoTable(doc, { head: [['Campo','Valor']], body: [
      ['Laboratorio clínico', examForm.laboratorioClinico || ''],
      ['Diagnóstico definitivo', examForm.diagnosticoDefinitivo || ''],
      ['Plan de tratamiento', examForm.planTratamiento || ''],
      ['Pronóstico', examForm.pronostico || '']
    ]});
    return doc;
  };

  const buildEvolutionPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Evolución y Pagos', 10, 14);
    const rows = (activePatient?.treatments || []).map(t => [t.date || '', t.description || '', t.type === 'visit' ? Number(t.cost || 0).toFixed(2) : '', t.type === 'payment' ? Number(t.payment || 0).toFixed(2) : '', t.type || '']);
    autoTable(doc, { startY: 20, head: [['Fecha','Descripción','Costo','Pago','Tipo']], body: rows });
    return doc;
  };

  const buildOdontogramPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Odontograma de Ingreso', 10, 14);
    const data = activePatient?.odontogram_initial || {};
    const rows = Object.keys(data).map(k => [k, data[k]?.top || '', data[k]?.bottom || '', data[k]?.left || '', data[k]?.right || '', data[k]?.center || '']);
    autoTable(doc, { startY: 20, head: [['Diente','Top','Bottom','Left','Right','Center']], body: rows });
    return doc;
  };

  const buildProgressPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historial de Avances', 10, 14);
    const rows = (activePatient?.progress_records || []).map(r => [r.date || '', r.title || '', r.notes || '', (r.attachments || []).length || 0]);
    autoTable(doc, { startY: 20, head: [['Fecha','Título','Notas','Adjuntos (#)']], body: rows });
    return doc;
  };

  const exportEvolutionExcel = () => {
    const rows = (activePatient?.treatments || []).map(t => ({ Fecha: t.date || '', Descripción: t.description || '', Costo: t.type === 'visit' ? Number(t.cost || 0) : 0, Pago: t.type === 'payment' ? Number(t.payment || 0) : 0, Tipo: t.type || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evolución');
    XLSX.writeFile(wb, 'evolucion_y_pagos.xlsx');
  };

  const exportOdontogramExcel = () => {
    const data = activePatient?.odontogram_initial || {};
    const rows = Object.keys(data).map(k => ({ Diente: k, Top: data[k]?.top || '', Bottom: data[k]?.bottom || '', Left: data[k]?.left || '', Right: data[k]?.right || '', Center: data[k]?.center || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Odontograma');
    XLSX.writeFile(wb, 'odontograma_ingreso.xlsx');
  };

  const exportProgressExcel = () => {
    const rows = (activePatient?.progress_records || []).map(r => ({ Fecha: r.date || '', Título: r.title || '', Notas: r.notes || '', Adjuntos: (r.attachments || []).length || 0 }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avances');
    XLSX.writeFile(wb, 'historial_avances.xlsx');
  };

  const [emailModal, setEmailModal] = useState({ open: false, to: '', context: null });

  const openSendServicesEmail = () => setEmailModal({ open: true, to: '', context: 'services' });
  const closeEmailModal = () => setEmailModal(prev => ({ ...prev, open: false }));

  const handleSendEmail = async () => {
    try {
      if (!token) return;
      let attachments = [];
      let subject = 'OdontoKaren';
      let html = '';
      if (emailModal.context === 'patient') {
        const doc = buildPatientPDF();
        const base64 = doc.output('datauristring').split(',')[1];
        attachments = [{ filename: 'paciente.pdf', content: base64 }];
        subject = 'Resumen de paciente';
        html = `<div>Adjunto resumen del paciente ${(activePatient?.apellidos || '')}, ${(activePatient?.nombres || '')}.</div>`;
      } else if (emailModal.context === 'services') {
        const doc = new jsPDF();
        autoTable(doc, { head: [['Servicio','Precio (S/)']], body: services.map(s => [s.name || '', Number(s.price || 0).toFixed(2)]) });
        const base64 = doc.output('datauristring').split(',')[1];
        attachments = [{ filename: 'servicios.pdf', content: base64 }];
        subject = 'Listado de servicios';
        html = `<div>Adjunto listado de servicios del consultorio.</div>`;
      } else if (emailModal.context === 'general') {
        const d = buildGeneralPDF();
        const b = d.output('datauristring').split(',')[1];
        attachments = [{ filename: 'datos_generales.pdf', content: b }];
        subject = 'Datos generales del paciente';
        html = `<div>Adjunto datos generales del paciente.</div>`;
      } else if (emailModal.context === 'evolution') {
        const d = buildEvolutionPDF();
        const b = d.output('datauristring').split(',')[1];
        attachments = [{ filename: 'evolucion_y_pagos.pdf', content: b }];
        subject = 'Evolución y pagos';
        html = `<div>Adjunto evolución y pagos.</div>`;
      } else if (emailModal.context === 'odontogram') {
        const d = buildOdontogramPDF();
        const b = d.output('datauristring').split(',')[1];
        attachments = [{ filename: 'odontograma_ingreso.pdf', content: b }];
        subject = 'Odontograma de ingreso';
        html = `<div>Adjunto odontograma de ingreso.</div>`;
      } else if (emailModal.context === 'progress') {
        const d = buildProgressPDF();
        const b = d.output('datauristring').split(',')[1];
        attachments = [{ filename: 'historial_avances.pdf', content: b }];
        subject = 'Historial de avances';
        html = `<div>Adjunto historial de avances.</div>`;
      } else if (emailModal.context === 'all') {
        const g = buildGeneralPDF();
        const e = buildEvolutionPDF();
        const o = buildOdontogramPDF();
        const p = buildProgressPDF();
        attachments = [
          { filename: 'datos_generales.pdf', content: g.output('datauristring').split(',')[1] },
          { filename: 'evolucion_y_pagos.pdf', content: e.output('datauristring').split(',')[1] },
          { filename: 'odontograma_ingreso.pdf', content: o.output('datauristring').split(',')[1] },
          { filename: 'historial_avances.pdf', content: p.output('datauristring').split(',')[1] }
        ];
        subject = 'Resumen completo del paciente';
        html = `<div>Adjunto archivos de todas las secciones del paciente.</div>`;
      }
      await sendEmail(token, { to: emailModal.to, subject, html, attachments });
      alert('Enviado correctamente');
      closeEmailModal();
    } catch (e) { alert(e?.message || 'Error enviando correo'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-600">Cargando sistema...</div>;
  if (view === 'login') return <LoginForm onLogin={async (email, password) => {
    try { const r = await apiLogin(email, password, ACCESS_CODE); setToken(r.token); localStorage.setItem('authToken', r.token); setView('dashboard'); }
    catch (e) { alert(e?.message || 'Error de inicio de sesión'); }
  }} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />
      {emailModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Enviar por correo</h3>
            <input type="email" value={emailModal.to} onChange={e => setEmailModal(prev => ({ ...prev, to: e.target.value }))} placeholder="Correo del cliente" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={closeEmailModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleSendEmail} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">Enviar</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center md:justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setView('dashboard'); setFormData(initialFormState); }}>
                <div className="bg-teal-600 p-1.5 rounded-lg">
                    <Activity className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">OdontoKaren</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
                <button onClick={() => setView('services')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800">
                  <DollarSign className="w-4 h-4" /> Servicios
                </button>
                <button onClick={() => setView('reminders')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-indigo-700 text-white hover:bg-indigo-600 whitespace-nowrap">
                  <Clock className="w-4 h-4" /> Recordatorios
                </button>
                <button onClick={() => setView('reminders-config')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-600 whitespace-nowrap">
                  <History className="w-4 h-4" /> Config. Recordatorios
                </button>
                <button onClick={() => setView('agenda')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-600">
                  <Calendar className="w-4 h-4" /> Agenda
                </button>
                <span className="text-sm text-slate-500 hidden md:block">Dra. Karen</span>
                <button 
                  onClick={() => { setToken(null); localStorage.removeItem('authToken'); setView('login'); setPatients([]); setActivePatient(null); }}
                  className="hidden md:inline-flex p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6">
        {view === 'dashboard' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {patientsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="text-sm">{patientsError}</span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Pacientes</h2>
                        <p className="text-slate-500">Gestiona los historiales clínicos de tu consultorio.</p>
                    </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-grow md:flex-none">
                    <div className="relative flex-grow md:w-64">
                      <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                      <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full pl-9 pr-4 py-2 text-sm focus:outline-none rounded-md" />
                    </div>
                  </div>
                  <button onClick={exportPatientsExcel} className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-bold whitespace-nowrap">Exportar Excel</button>
                  <button onClick={exportPatientsPDF} className="hidden md:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-bold whitespace-nowrap">Exportar PDF</button>
                  <button onClick={() => { setFormData(initialFormState); setView('new-patient'); }} className="hidden md:inline-flex bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold whitespace-nowrap">Crear nuevo paciente</button>
                  
                </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="grid gap-4">
                        {patients.map(patient => (
                            <div key={patient.id} onClick={() => { setActivePatient(patient); setFormData(patient); setView('patient-detail'); setActiveTab('general'); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">{patient.nombres?.[0]}{patient.apellidos?.[0]}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{patient.apellidos}, {patient.nombres}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1"><span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">DNI: {patient.dni || '---'}</span><span className="text-xs text-slate-500 flex items-center"><Phone className="w-3 h-3 mr-1" />{patient.telefono || 'Sin teléfono'}</span></div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-teal-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {view === 'services' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex md:flex-row flex-col md:items-center md:justify-between gap-2">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center"><DollarSign className="w-6 h-6 mr-2 text-teal-600" /> Servicios del Consultorio</h2>
                <div className="flex items-center gap-2 md:mt-0 mt-2 w-full md:w-auto justify-start md:justify-end">
                  <div className="relative w-full md:w-auto">
                    <input value={serviceQuery} onChange={e => setServiceQuery(e.target.value)} placeholder="Buscar servicio..." className="w-full md:w-64 pl-8 pr-2 py-2 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
                  </div>
                  <button onClick={exportServicesExcel} className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-bold">Exportar Excel</button>
                  <button onClick={exportServicesPDF} className="hidden md:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-bold">Exportar PDF</button>
                  <button onClick={openSendServicesEmail} className="hidden md:inline-flex bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-sm font-bold">Enviar por correo</button>
                  <button onClick={seedDefaultServices} className="hidden md:inline-flex bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm font-bold">Cargar por defecto</button>
                  <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
                </div>
                <div className="md:hidden grid grid-cols-2 gap-2 mt-2">
                  <button onClick={exportServicesExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-bold">Exportar Excel</button>
                  <button onClick={exportServicesPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-bold">Exportar PDF</button>
                  <button onClick={openSendServicesEmail} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-sm font-bold">Enviar por correo</button>
                  <button onClick={seedDefaultServices} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm font-bold">Cargar por defecto</button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre del servicio</label>
                    <input placeholder="Ej. Blanqueamiento láser" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} className="w-full p-2.5 border rounded text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Precio (S/)</label>
                    <input type="number" step="0.01" placeholder="Ej. 400" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} className="w-full p-2.5 border rounded text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded text-sm font-bold">Agregar Servicio</button>
                  </div>
                </form>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-bold text-slate-600 uppercase">Servicio</th>
                        <th className="text-right px-3 py-2 text-xs font-bold text-slate-600 uppercase">Precio</th>
                        <th className="text-center px-3 py-2 text-xs font-bold text-slate-600 uppercase w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map(s => {
                        const isEditing = editingServiceId === (s.id || slug(s.name));
                        return (
                          <tr key={s.id || slug(s.name)} className="border-t border-slate-200">
                            <td className="px-3 py-2 align-middle">
                              {isEditing ? (
                                <input className="w-full p-2 border rounded text-sm" value={serviceEditForm.name} onChange={e => setServiceEditForm({ ...serviceEditForm, name: e.target.value })} />
                              ) : (
                                <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 align-middle text-right">
                              {isEditing ? (
                                <input type="number" step="0.01" className="w-28 p-2 border rounded text-sm" value={serviceEditForm.price} onChange={e => setServiceEditForm({ ...serviceEditForm, price: e.target.value })} />
                              ) : (
                                <span className="text-sm font-extrabold text-slate-900">S/ {Number(s.price).toFixed(2)}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 align-middle text-center">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-2">
                                  <button onClick={handleSaveEditService} className="text-emerald-700 hover:text-emerald-800 p-1 rounded" title="Guardar">
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button onClick={handleCancelEditService} className="text-slate-700 hover:text-slate-900 p-1 rounded" title="Cancelar">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button onClick={() => handleStartEditService(s)} className="text-slate-600 hover:text-blue-600 p-1 rounded" title="Editar">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteService(s.id || slug(s.name))} className="text-slate-600 hover:text-red-600 p-1 rounded" title="Eliminar">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!filteredServices.length && (
                        <tr>
                          <td colSpan="3" className="px-3 py-4 text-center text-sm text-slate-500">Sin resultados para "{serviceQuery}"</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        )}

        {view === 'agenda' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Calendar className="w-6 h-6 mr-2 text-teal-600" /> Agenda</h2>
                <span className="text-slate-500">{calendarView === 'month' ? formatDate(calendarDate) : calendarView === 'week' ? `${formatDate(weekDays[0])} – ${formatDate(weekDays[6])}` : formatDate(calendarDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">Hoy</button>
                  <button onClick={() => setCalendarDate(addDays(calendarDate, calendarView==='month'? -30 : calendarView==='week'? -7 : -1))} className="px-3 py-1 text-sm border-l border-slate-200 text-slate-700 hover:bg-slate-50">←</button>
                  <button onClick={() => setCalendarDate(addDays(calendarDate, calendarView==='month'? 30 : calendarView==='week'? 7 : 1))} className="px-3 py-1 text-sm border-l border-slate-200 text-slate-700 hover:bg-slate-50">→</button>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button onClick={() => setCalendarStatusFilter('all')} className={`px-3 py-1 text-sm ${calendarStatusFilter==='all'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Todas</button>
                  <button onClick={() => setCalendarStatusFilter('scheduled')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarStatusFilter==='scheduled'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Programadas</button>
                  <button onClick={() => setCalendarStatusFilter('completed')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarStatusFilter==='completed'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Atendidas</button>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden ml-auto">
                  <button onClick={() => setCalendarView('month')} className={`px-3 py-1 text-sm ${calendarView==='month'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Mes</button>
                  <button onClick={() => setCalendarView('week')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarView==='week'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Semana</button>
                  <button onClick={() => setCalendarView('day')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarView==='day'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Día</button>
                </div>
                <div className="md:hidden inline-flex items-center gap-2 ml-auto">
                  <input type="month" value={`${calendarDate.getFullYear()}-${String(calendarDate.getMonth()+1).padStart(2,'0')}`} onChange={e => { const [y,m] = e.target.value.split('-'); setCalendarDate(new Date(Number(y), Number(m)-1, 1)); }} className="p-2 border rounded text-sm" />
                </div>
                
              </div>

              

              {calendarView === 'month' && (
                <div className="grid md:grid-cols-7 grid-cols-1 gap-2">
                  <div className="hidden md:contents">
                    {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(h => (
                      <div key={h} className="text-xs font-bold text-slate-500 px-2 py-1">{h}</div>
                    ))}
                  </div>
                  {monthMatrix.flat().map((d, i) => {
                    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                    const items = apptsByDay.get(key) || [];
                    const other = d.getMonth() !== calendarDate.getMonth();
                    const today = sameDay(d, new Date());
                    return (
                      <div key={i} className={`group relative border border-slate-200 rounded-lg p-2 md:min-h-[120px] min-h-[80px] bg-white cursor-pointer hover:bg-slate-50 ${other?'opacity-50':''} ${today?'ring-2 ring-teal-500':''}`} onClick={() => setSelectedDay(d)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`${today?'bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center':'text-xs font-bold text-slate-700'}`}>{d.getDate()}</div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedDay(d); setDayModal({ open: true, date: d }); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-teal-700 p-1 rounded" title="Nueva cita"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1">
                          {(isMobile ? items.slice(0,3) : items.slice(0,3)).map(a => {
                            const c = a.status==='completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : a.status==='scheduled' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200';
                            const t = new Date(a.startAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={a.id} className={`text-[11px] rounded px-2 py-1 flex items-center gap-1 ${c}`}>
                                <span className={`inline-block w-2 h-2 rounded-full ${a.status==='completed'?'bg-emerald-600':a.status==='scheduled'?'bg-blue-600':'bg-slate-500'}`}></span>
                                <span className={`${isMobile?'truncate max-w-[120px]':'inline'}`}>{isMobile ? `${t} • ${a.title}` : `${t} • ${a.title}`}</span>
                              </div>
                            );
                          })}
                          {items.length > 3 && <div className="text-[11px] text-slate-500">+{items.length - 3} más</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {calendarView === 'week' && (
                <div className="grid md:grid-cols-7 grid-cols-1 gap-2">
                  <div className="hidden md:contents">
                    {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((h) => (
                      <div key={h} className="text-xs font-bold text-slate-500 px-2 py-1">{h}</div>
                    ))}
                  </div>
                  {weekDays.map((d, i) => {
                      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                      const items = (apptsByDay.get(key) || []).sort((a,b) => new Date(a.startAt) - new Date(b.startAt));
                      const today = sameDay(d, new Date());
                      return (
                      <div key={i} className={`group relative border border-slate-200 rounded-lg p-2 md:min-h-[140px] min-h-[80px] bg-white cursor-pointer hover:bg-slate-50 ${today?'ring-2 ring-teal-500':''}`} onClick={() => setSelectedDay(d)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`${today?'bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center':'text-xs font-bold text-slate-700'}`}>{d.getDate()}</div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedDay(d); setDayModal({ open: true, date: d }); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-teal-700 p-1 rounded" title="Nueva cita"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1">
                          {items.slice(0,3).map(a => {
                            const c = a.status==='completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : a.status==='scheduled' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200';
                            const t = new Date(a.startAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={a.id} className={`text-[11px] rounded px-2 py-1 flex items-center gap-1 ${c}`}>
                                <span className={`inline-block w-2 h-2 rounded-full ${a.status==='completed'?'bg-emerald-600':a.status==='scheduled'?'bg-blue-600':'bg-slate-500'}`}></span>
                                <span className={`${isMobile?'truncate max-w-[120px]':'inline'}`}>{`${t} • ${a.title}`}</span>
                              </div>
                            );
                          })}
                          {items.length > 3 && <div className="text-[11px] text-slate-500">+{items.length - 3} más</div>}
                        </div>
                      </div>
                      );
                    })}
                </div>
              )}
              {calendarView === 'day' && (
                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-slate-700">{formatDate(calendarDate)}</div>
                    <button onClick={() => setDayModal({ open: true, date: calendarDate })} className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-teal-600 text-white rounded"><Plus className="w-4 h-4" /> Nueva cita</button>
                  </div>
                  <div className="space-y-1">
                    {(appointments || []).filter(a => sameDay(new Date(a.startAt), calendarDate)).sort((a,b) => new Date(a.startAt) - new Date(b.startAt)).map(a => {
                      const c = a.status==='completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : a.status==='scheduled' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200';
                      const t = new Date(a.startAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={a.id} className={`text-sm rounded px-3 py-2 flex items-center justify-between ${c}`}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${a.status==='completed'?'bg-emerald-600':a.status==='scheduled'?'bg-blue-600':'bg-slate-500'}`}></span>
                            <span className="font-semibold">{t}</span>
                            <span>{a.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {a.status !== 'completed' && <button disabled={completeBusyId===a.id} onClick={() => handleMarkAppointmentCompleted(a.id)} className="text-xs px-2 py-0.5 bg-teal-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">Atendida</button>}
                            <button onClick={() => handleStartEditAppointment(a)} className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded">Editar</button>
                            <button onClick={() => handleDeleteAppointment(a.id)} className="text-xs px-2 py-0.5 bg-red-600 text-white rounded">Eliminar</button>
                          </div>
                        </div>
                      );
                    })}
                    {!appointments.filter(a => sameDay(new Date(a.startAt), calendarDate)).length && (
                      <div className="text-sm text-slate-400">Sin citas para este día</div>
                    )}
                  </div>
                </div>
              )}

              

              

              {dayModal?.open && (
                <div className="fixed inset-0 z-50 bg-black/40 flex">
                  <div className="bg-white w-full h-full max-w-none p-0 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDayModal({ open: false, date: null })} className="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-700 border border-slate-300 rounded"><ArrowLeft className="w-4 h-4" /> Atrás</button>
                        <div className="text-xl font-bold text-slate-800">Citas del {dayModal.date ? formatDate(dayModal.date) : ''}</div>
                      </div>
                      <button onClick={() => setDayModal({ open: false, date: null })} className="hidden md:inline-flex px-3 py-1.5 text-sm text-slate-700 border border-slate-300 rounded hover:bg-slate-50">Cerrar</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 pb-24 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paciente*</label>
                        <select value={dayModalForm?.patientId || ''} onChange={e => setDayModalForm(prev => ({ ...prev, patientId: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full">
                          <option value="">Selecciona</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Servicio*</label>
                        <select value={dayModalForm?.serviceId || ''} onChange={e => setDayModalForm(prev => ({ ...prev, serviceId: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full">
                          <option value="">Selecciona</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hora de la cita*</label>
                        <input type="time" value={dayModalForm?.time || ''} onChange={e => setDayModalForm(prev => ({ ...prev, time: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Duración (min) opcional</label>
                        <input type="number" min="5" step="5" placeholder="30" value={dayModalForm?.durationMinutes || ''} onChange={e => setDayModalForm(prev => ({ ...prev, durationMinutes: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Motivo de la cita (opcional)</label>
                        <textarea rows="2" placeholder="Comentarios o notas" value={dayModalForm?.notes || ''} onChange={e => setDayModalForm(prev => ({ ...prev, notes: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t border-slate-200">
                      <div className="text-xs text-slate-500">* Obligatorio</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDayModal({ open: false, date: null })} className="px-4 py-2 text-base md:text-sm text-slate-700 border border-slate-300 rounded hover:bg-slate-50">Cerrar</button>
                        <button onClick={async () => {
                          try {
                            if (!token || !dayModal?.date) return;
                            if (!dayModalForm?.patientId || !dayModalForm?.serviceId || !dayModalForm?.time) { alert('Completa paciente, servicio y hora'); return; }
                            let sid = dayModalForm?.serviceId || null;
                            if (sid) { const sel = services.find(s => s.id === sid); if (sel && sel.local) { const createdService = await createService(token, { name: sel.name, price: sel.price }); sid = createdService.id; setServices(prev => prev.map(x => x.id === sel.id ? { id: createdService.id, name: createdService.name, price: createdService.price } : x)); } }
                            const dt = new Date(dayModal.date);
                            const [hh, mm] = String(dayModalForm.time).split(':');
                            const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), Number(hh || 9), Number(mm || 0));
                            let endAt = null;
                            const dur = Number(dayModalForm?.durationMinutes || 0);
                            if (dur > 0) { const end = new Date(start.getTime() + dur * 60000); endAt = end.toISOString(); }
                            const svcName = services.find(s => s.id === sid)?.name || 'servicio';
                            const patName = patients.find(p => p.id === dayModalForm.patientId)?.nombres || 'cliente';
                            const title = `Cita de ${patName} para ${svcName}`;
                            const payload = { patientId: dayModalForm.patientId, serviceId: sid, title, startAt: start.toISOString(), endAt, notes: dayModalForm?.notes || '' };
                            const created = await createAppointment(token, payload);
                            setAppointments(prev => [created, ...prev]);
                            try {
                              const fechaTxt = formatDate(start);
                              const msg = (defaultFollowUpTemplate || '')
                                .replace('{nombre}', patName)
                                .replace('{servicio}', svcName)
                                .replace('{fecha}', fechaTxt);
                              const r = await createReminder(token, { patientId: dayModalForm.patientId, serviceId: sid, dueAt: start.toISOString(), messageText: msg, channel: 'whatsapp', appointmentId: created.id });
                              setReminders(prev => [r, ...prev]);
                            } catch (e) { void e }
                            setDayModalForm({ patientId: '', serviceId: '', time: '', durationMinutes: '', notes: '' });
                            alert('Cita creada');
                          } catch (e) { alert(e?.message || 'Error creando cita'); }
                        }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-base md:text-sm font-bold">Crear</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                {calendarView !== 'day' && selectedDay && (
                  <div className="space-y-2">
                    {(appointments || []).filter(a => sameDay(new Date(a.startAt), selectedDay)).sort((a,b) => new Date(a.startAt) - new Date(b.startAt)).map(a => {
                        const dt = new Date(a.startAt);
                        const isEditing = editingAppointmentId === a.id;
                        const pendingReminder = (reminders || []).find(r => r.appointmentId === a.id && r.status === 'pending');
                        return (
                          <div key={a.id} className="border border-slate-200 bg-white rounded px-3 py-2 text-xs">
                            {isEditing ? (
                              <form onSubmit={handleUpdateAppointmentSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-1 items-end">
                                <input value={appointmentEditForm.title} onChange={e => setAppointmentEditForm({ ...appointmentEditForm, title: e.target.value })} className="p-1 border rounded text-xs" placeholder="Título" />
                                <select value={appointmentEditForm.serviceId} onChange={e => setAppointmentEditForm({ ...appointmentEditForm, serviceId: e.target.value })} className="p-1 border rounded text-xs">
                                  <option value="">Servicio</option>
                                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <input type="datetime-local" value={appointmentEditForm.startAt} onChange={e => setAppointmentEditForm({ ...appointmentEditForm, startAt: e.target.value })} className="p-1 border rounded text-xs" />
                                <div className="flex gap-1">
                                  <button type="submit" className="px-2 py-0.5 bg-emerald-600 text-white rounded">Guardar</button>
                                  <button type="button" onClick={handleCancelEditAppointment} className="px-2 py-0.5 bg-slate-200 text-slate-900 rounded">Cancelar</button>
                                </div>
                              </form>
                              ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-slate-800">{a.title}</div>
                                  <div className="text-slate-600">{dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} • {a.status}</div>
                                  {pendingReminder && (
                                    <div className="text-[11px] text-amber-700">Recordatorio programado: {formatDateTime(pendingReminder.dueAt)}</div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {a.status !== 'completed' && <button disabled={completeBusyId===a.id} onClick={() => handleMarkAppointmentCompleted(a.id)} className="text-xs px-2 py-0.5 bg-teal-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">Atendida</button>}
                                  {pendingReminder && pendingReminder.status === 'pending' && <button onClick={async () => { try { const updated = await sendReminderNow(token, pendingReminder.id); setReminders(prev => prev.map(x => x.id === pendingReminder.id ? updated : x)); } catch (e) { alert(e?.message || 'No se pudo enviar'); } }} className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded">Enviar ahora</button>}
                                  <button onClick={() => handleStartEditAppointment(a)} className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded">Editar</button>
                                  <button onClick={() => handleDeleteAppointment(a.id)} className="text-xs px-2 py-0.5 bg-red-600 text-white rounded">Eliminar</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                )}
                  </div>
                </div>
              )}

        {view === 'reminders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Clock className="w-6 h-6 mr-2 text-indigo-600" /> Recordatorios</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="hidden md:flex text-xl font-bold text-slate-800 items-center"><Clock className="w-5 h-5 mr-2 text-indigo-600" /> Recordatorios (Autopilot)</h3>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                    <button onClick={() => setReminderStatusFilter('all')} className={`px-3 py-1 text-sm ${reminderStatusFilter==='all'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Todos</button>
                    <button onClick={() => setReminderStatusFilter('pending')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='pending'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Pendientes</button>
                    <button onClick={() => setReminderStatusFilter('sent')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='sent'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Enviados</button>
                    <button onClick={() => setReminderStatusFilter('failed')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='failed'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Fallidos</button>
                  </div>
                  <button onClick={handleProcessReminders} className="hidden md:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-bold">Procesar vencidos</button>
                  <button onClick={() => setManualReminderOpen(o => !o)} className="hidden md:inline-flex bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm font-bold">{manualReminderOpen ? 'Cerrar manual' : 'Crear manual'}</button>
                  
                </div>
              </div>
              {manualReminderOpen && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <select value={manualReminderForm.patientId} onChange={e => setManualReminderForm({ ...manualReminderForm, patientId: e.target.value })} className="p-2 border rounded text-sm">
                      <option value="">Paciente</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                    </select>
                    <select value={manualReminderForm.serviceId} onChange={e => setManualReminderForm({ ...manualReminderForm, serviceId: e.target.value })} className="p-2 border rounded text-sm">
                      <option value="">Servicio (opcional)</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="date" value={manualReminderForm.dueDate} onChange={e => setManualReminderForm({ ...manualReminderForm, dueDate: e.target.value })} className="p-2 border rounded text-base md:text-sm" />
                    <input type="time" value={manualReminderForm.dueTime} onChange={e => setManualReminderForm({ ...manualReminderForm, dueTime: e.target.value })} className="p-2 border rounded text-base md:text-sm" />
                    <input placeholder="Mensaje" value={manualReminderForm.messageText} onChange={e => setManualReminderForm({ ...manualReminderForm, messageText: e.target.value })} className="p-2 border rounded text-base md:text-sm md:col-span-2" />
                    <button onClick={async () => {
                      try {
                        if (!token) return;
                        if (!manualReminderForm.patientId || !manualReminderForm.dueDate || !manualReminderForm.dueTime) { alert('Completa paciente, fecha y hora'); return; }
                        let sid = manualReminderForm.serviceId || null;
                        if (sid) {
                          const sel = services.find(s => s.id === sid);
                          if (sel && sel.local) {
                            const createdService = await createService(token, { name: sel.name, price: sel.price });
                            sid = createdService.id;
                            setServices(prev => prev.map(x => x.id === sel.id ? { id: createdService.id, name: createdService.name, price: createdService.price } : x));
                          }
                        }
                        const [y,m,d] = manualReminderForm.dueDate.split('-').map(n => Number(n));
                        const [hh, mm] = manualReminderForm.dueTime.split(':').map(n => Number(n));
                        const dueAt = new Date(y, (m-1), d, hh || 9, mm || 0).toISOString();
                        const created = await createReminder(token, { patientId: manualReminderForm.patientId, serviceId: sid, dueAt, messageText: manualReminderForm.messageText, channel: 'whatsapp' });
                        setReminders(prev => [created, ...prev]);
                        setManualReminderForm({ patientId: '', serviceId: '', dueDate: '', dueTime: '', messageText: defaultFollowUpTemplate });
                        setManualReminderOpen(false);
                        alert('Recordatorio creado');
                      } catch (e) { alert(e?.message || 'Error creando recordatorio'); }
                    }} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-bold">Crear</button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 gap-3">
                  {groupedReminders.map(g => (
                    <div key={g.key} className="bg-white border border-slate-200 rounded-lg">
                      <button onClick={() => setExpandedGroups(prev => ({ ...prev, [g.key]: !prev[g.key] }))} className="w-full flex items-center justify-between p-3">
                        <div>
                          <div className="font-semibold text-slate-900">{g.title}</div>
                          <div className="text-sm text-slate-600">Paciente: {g.subtitlePatient} • Servicio: {g.subtitleService || '—'} • {g.pendingCount ? `${g.pendingCount} pendientes` : `${g.items.length} total`}</div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedGroups[g.key] ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedGroups[g.key] && (
                        <div className="border-t border-slate-200 p-3 space-y-2">
                          {g.items.map(r => {
                            const isAppt = !!(g.appt && new Date(r.dueAt).toISOString() === new Date(g.appt.startAt).toISOString());
                            const label = isAppt ? 'Recordatorio de Cita' : 'Recordatorio de Seguimiento';
                            return (
                              <div key={r.id} className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-slate-800">{label}</div>
                                  <div className="text-sm text-slate-600">{formatDateTime(r.dueAt)} • {r.status}</div>
                                </div>
                                <div className="text-slate-900 text-sm">{r.messageText || 'Recordatorio'}</div>
                                <div className="flex items-center gap-2">
                                  {r.status === 'pending' && (<button onClick={async () => { try { const updated = await sendReminderNow(token, r.id); setReminders(prev => prev.map(x => x.id === r.id ? updated : x)); } catch (e) { alert(e?.message || 'No se pudo enviar'); } }} className="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs font-bold">Enviar ahora</button>)}
                                  <button onClick={async () => { try { const logs = await listMessageLogs(token, { reminderId: r.id }); setLogsByReminder(prev => ({ ...prev, [r.id]: logs })); } catch (e) { alert(e?.message || 'Error cargando logs'); } }} className="text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs font-bold">Ver detalle</button>
                                  <button onClick={() => handleDeleteReminder(r.id)} className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded text-xs font-bold">Eliminar</button>
                                </div>
                                {Array.isArray(logsByReminder[r.id]) && logsByReminder[r.id].length > 0 && (
                                  <div className="mt-2 border border-slate-200 rounded p-2 text-xs text-slate-700">
                                    {logsByReminder[r.id].map(l => (
                                      <div key={l.id} className="flex items-center justify-between">
                                        <div>
                                          <div>{l.status} • {l.provider}</div>
                                          <div className="text-slate-500">{formatDateTime(l.createdAt)} • {l.error || ''}</div>
                                        </div>
                                        <div className="text-slate-500">{l.toPhone}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'reminders-config' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center"><History className="w-6 h-6 mr-2 text-teal-600" /> Configuración de recordatorios</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setView('reminders')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="hidden md:flex text-xl font-bold text-slate-800 items-center"><History className="w-5 h-5 mr-2 text-teal-600" /> Seguimiento automático por servicio</h3>
              </div>
              {!!saveNotice && (<div className="mb-3 px-3 py-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">{saveNotice}</div>)}
              <form onSubmit={async (e) => { e.preventDefault(); try {
                setFormErrors({ serviceId: '', delayDays: '', templateText: '' });
                if (!token) return;
                const errs = { serviceId: '', delayDays: '', templateText: '' };
                if (!followRuleForm.serviceId) errs.serviceId = 'Selecciona el servicio';
                if (followRuleForm.delayDays === '' || Number(followRuleForm.delayDays) <= 0) errs.delayDays = 'Por favor, introduce un número de días válido';
                if (!followRuleForm.templateText || !followRuleForm.templateText.trim()) errs.templateText = 'Ingresa un mensaje';
                if (errs.serviceId || errs.delayDays || errs.templateText) { setFormErrors(errs); return; }
                const svcName = services.find(s => s.id === followRuleForm.serviceId)?.name || 'Servicio';
                if (editingRuleId) {
                  const existing = (rules || []).find(r => r.id === editingRuleId);
                  if (!existing) { setFormErrors(prev => ({ ...prev, serviceId: 'Regla no encontrada' })); return; }
                  const updated = await updateReminderRule(token, existing.id, { serviceId: followRuleForm.serviceId, delayDays: Number(followRuleForm.delayDays || 0), enabled: Number(followRuleForm.delayDays || 0) > 0, templateText: followRuleForm.templateText, matchKeywords: existing.matchKeywords?.length ? existing.matchKeywords : [svcName] });
                  setRules(prev => prev.map(r => r.id === existing.id ? updated : r));
                  setEditingRuleId(null);
                } else {
                  const existsByService = (rules || []).find(r => r.serviceId === followRuleForm.serviceId);
                  if (existsByService) { setFormErrors(prev => ({ ...prev, serviceId: 'Ya existe una configuración para este servicio' })); return; }
                  const created = await createReminderRule(token, { serviceId: followRuleForm.serviceId, delayDays: Number(followRuleForm.delayDays || 0), enabled: Number(followRuleForm.delayDays || 0) > 0, templateText: followRuleForm.templateText, matchKeywords: [svcName], hourStart: 9, hourEnd: 19, daysOfWeek: [1,2,3,4,5,6] });
                  setRules(prev => [created, ...prev]);
                }
                setSaveNotice('Configuración guardada correctamente');
                setTimeout(() => setSaveNotice(''), 2000);
              } catch (e) { const msg = String(e?.message || ''); if (msg.toLowerCase().includes('rule_already_exists')) { setFormErrors(prev => ({ ...prev, serviceId: 'Ya existe una configuración para este servicio' })); } else { alert(e?.message || 'Error guardando seguimiento'); } } }} className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Servicio</label>
                  <select value={followRuleForm.serviceId} onChange={e => setFollowRuleForm(prev => ({ ...prev, serviceId: e.target.value }))} className="p-2 border rounded text-sm w-full" disabled={!!editingRuleId}>
                    <option value="">Selecciona un servicio</option>
                    {((editingRuleId ? services : services.filter(s => !(rules || []).some(r => r.serviceId === s.id)))).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {!!formErrors.serviceId && (<div className="text-red-600 text-xs mt-1">{formErrors.serviceId}</div>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enviar recordatorio después de</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" step="1" value={followRuleForm.delayDays} onChange={e => setFollowRuleForm(prev => ({ ...prev, delayDays: Number(e.target.value) }))} className="p-2 border rounded text-sm w-24" />
                    <span className="text-slate-600 text-sm">días</span>
                  </div>
                  {!!formErrors.delayDays && (<div className="text-red-600 text-xs mt-1">{formErrors.delayDays}</div>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plantilla del mensaje</label>
                  <textarea ref={messageRef} rows={4} value={followRuleForm.templateText} onChange={e => setFollowRuleForm(prev => ({ ...prev, templateText: e.target.value }))} className="p-2 border rounded text-sm w-full" />
                  {!!formErrors.templateText && (<div className="text-red-600 text-xs mt-1">{formErrors.templateText}</div>)}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-600 text-xs">Insertar variable:</span>
                    <button type="button" onClick={() => { const v = '{nombre}'; const ta = messageRef.current; const start = ta?.selectionStart ?? (followRuleForm.templateText?.length || 0); const end = ta?.selectionEnd ?? start; const before = followRuleForm.templateText.slice(0, start); const after = followRuleForm.templateText.slice(end); setFollowRuleForm(prev => ({ ...prev, templateText: `${before}${v}${after}` })); }} className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{`{nombre}`}</button>
                    <button type="button" onClick={() => { const v = '{servicio}'; const ta = messageRef.current; const start = ta?.selectionStart ?? (followRuleForm.templateText?.length || 0); const end = ta?.selectionEnd ?? start; const before = followRuleForm.templateText.slice(0, start); const after = followRuleForm.templateText.slice(end); setFollowRuleForm(prev => ({ ...prev, templateText: `${before}${v}${after}` })); }} className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{`{servicio}`}</button>
                    <button type="button" onClick={() => { const v = '{fecha}'; const ta = messageRef.current; const start = ta?.selectionStart ?? (followRuleForm.templateText?.length || 0); const end = ta?.selectionEnd ?? start; const before = followRuleForm.templateText.slice(0, start); const after = followRuleForm.templateText.slice(end); setFollowRuleForm(prev => ({ ...prev, templateText: `${before}${v}${after}` })); }} className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{`{fecha}`}</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Guardar
                  </button>
                  {editingRuleId && <button type="button" onClick={() => { setEditingRuleId(null); setFollowRuleForm({ serviceId: '', delayDays: 7, templateText: defaultFollowUpTemplate }); setFormErrors({ serviceId: '', delayDays: '', templateText: '' }); }} className="text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded text-sm font-bold">Cancelar</button>}
                </div>
              </form>
              {!!rules.length && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between border border-slate-200 bg-white rounded px-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{services.find(s => s.id === r.serviceId)?.name || r.serviceId}</div>
                        <div className="text-slate-600">Seguimiento: {r.delayDays ? `${r.delayDays} días` : 'Ninguno'} • Activo: {r.enabled ? 'Sí' : 'No'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setFollowRuleForm({ serviceId: r.serviceId, delayDays: Number(r.delayDays || 0), templateText: r.templateText || defaultFollowUpTemplate }); setEditingRuleId(r.id); }} className="text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs font-bold">Editar</button>
                        <button onClick={async () => { try { await deleteReminderRule(token, r.id); setRules(prev => prev.filter(x => x.id !== r.id)); if (editingRuleId === r.id) { setEditingRuleId(null); setFollowRuleForm({ serviceId: '', delayDays: 7, templateText: defaultFollowUpTemplate }); } } catch (e) { alert(e?.message || 'Error eliminando configuración'); } }} className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded text-xs font-bold">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        

        {view === 'new-patient' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Plus className="w-6 h-6 mr-2 text-teal-600" /> Nuevo Ingreso</h2>
                    <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl">
                    <form onSubmit={handleCreatePatient} className="space-y-3">
                        <div className="relative">
                          <input required placeholder="DNI (Obligatorio)" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-2.5 pr-10 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" maxLength={8} />
                          <button type="button" onClick={() => searchDNI(formData.dni)} disabled={isSearchingDNI} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400" title="Buscar en RENIEC">
                            {isSearchingDNI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                        </div>
                        <input required placeholder="Nombres" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                        <input required placeholder="Apellidos" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="date" required value={formData.fechaNacimiento} onChange={handleDOBChange} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                            <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        <input placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!formData.whatsappConsent} onChange={e => setFormData({ ...formData, whatsappConsent: e.target.checked })} /><span>Consentimiento WhatsApp</span></label>
                        <button type="submit" disabled={creatingPatient} className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{creatingPatient ? 'Creando...' : 'Crear Expediente'}</button>
                    </form>
                </div>
            </div>
        )}

        {view === 'patient-detail' && activePatient && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                <div className="md:hidden flex items-center mb-4">
                    <button onClick={() => { setView('dashboard'); setFormData(initialFormState); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /> Atrás</button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 text-sm">
                    <div className="flex items-center min-w-0">
                      <button onClick={() => { setView('dashboard'); setFormData(initialFormState); }} className="text-slate-500 hover:text-slate-800 whitespace-nowrap flex-shrink-0">Pacientes</button>
                      <ChevronRight className="w-4 h-4 mx-2 text-slate-300 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate max-w-[70vw] sm:max-w-none">{activePatient.apellidos}, {activePatient.nombres}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setEmailModal({ open: true, to: '', context: 'all' })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold whitespace-nowrap">Enviar todo</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-3 lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-row md:flex-col gap-2 fixed top-16 left-0 right-0 md:sticky md:top-24 md:left-auto md:right-auto z-30 overflow-x-auto md:overflow-visible scrollbar-hide">
                        <div className="hidden md:block mb-4 px-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menú Principal</p></div>
                        <button onClick={() => setActiveTab('general')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-teal-50 text-teal-700 shadow-sm border-teal-200 border' : 'text-slate-500 hover:bg-slate-50'}`}><User className="w-4 h-4" /><span>Datos Generales</span></button>
                        <button onClick={() => setActiveTab('evolution')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'evolution' ? 'bg-teal-50 text-teal-700 shadow-sm border-teal-200 border' : 'text-slate-500 hover:bg-slate-50'}`}><Wallet className="w-4 h-4" /><span>Evolución y Pagos</span></button>
                        <button onClick={() => setActiveTab('initial')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'initial' ? 'bg-teal-50 text-teal-700 shadow-sm border-teal-200 border' : 'text-slate-500 hover:bg-slate-50'}`}><Activity className="w-4 h-4" /><span>Odontograma Ingreso</span></button>
                        <button onClick={() => setActiveTab('progress')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'progress' ? 'bg-teal-50 text-teal-700 shadow-sm border-teal-200 border' : 'text-slate-500 hover:bg-slate-50'}`}><CheckCircle2 className="w-4 h-4" /><span>Historial Avances</span></button>
                        <button onClick={() => setActiveTab('attachments')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'attachments' ? 'bg-teal-50 text-teal-700 shadow-sm border-teal-200 border' : 'text-slate-500 hover:bg-slate-50'}`}><ImageIcon className="w-4 h-4" /><span>Anexos (Placas)</span></button>
                        <div className="hidden md:block flex-grow min-h-[50px]"></div>
                        <button onClick={() => handleDeletePatient(activePatient.id)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 mt-auto md:mt-4"><Trash2 className="w-4 h-4" /><span className="hidden md:inline">Eliminar Paciente</span></button>
                    </div>
                    

                    <div className={`md:col-span-9 lg:col-span-9 rounded-xl shadow-lg border border-slate-200 p-6 md:p-8 min-h-[600px] ${activeTab === 'general' ? 'bg-teal-100' : activeTab === 'evolution' ? 'bg-amber-100' : activeTab === 'initial' ? 'bg-slate-100' : activeTab === 'attachments' ? 'bg-indigo-100' : 'bg-white'}` }>
                        {activeTab === 'general' && (
                            <div className="max-w-4xl">
                                <div className="flex items-center justify-between mb-6 border-b pb-4">
                                  <h2 className="text-xl font-bold flex items-center text-slate-800"><FileText className="w-5 h-5 mr-2 text-teal-600" /> Ficha de Anamnesis</h2>
                                  <div className="flex items-center gap-2"></div>
                                </div>
                                <form onSubmit={handleUpdateGeneralInfo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-4">
                                        <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded flex items-center"><User className="w-4 h-4 mr-2" /> Datos de Filiación</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombres y Apellidos</label><div className="flex gap-2"><input className="w-1/2 p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Nombres" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} /><input className="w-1/2 p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Apellidos" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} /></div></div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sexo</label><select className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                                                <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">DNI</label><div className="relative"><input className="w-full p-2.5 pr-10 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} maxLength={8} /><button type="button" onClick={() => searchDNI(formData.dni)} disabled={isSearchingDNI} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400" title="Buscar en RENIEC">{isSearchingDNI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button></div></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha Nacimiento</label><input type="date" className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.fechaNacimiento} onChange={handleDOBChange} /></div>
                                                 <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Edad</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-slate-100" value={formData.edad} readOnly placeholder="Auto" /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lugar Nacimiento</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.lugarNacimiento} onChange={e => setFormData({...formData, lugarNacimiento: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lugar Procedencia</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.lugarProcedencia} onChange={e => setFormData({...formData, lugarProcedencia: e.target.value})} /></div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded flex items-center"><MapPin className="w-4 h-4 mr-2" /> Ubicación y Contacto</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Domicilio</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.domicilio} onChange={e => setFormData({...formData, domicilio: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label><input type="email" className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
                                                <div className="flex items-center gap-2"><input type="checkbox" checked={!!formData.whatsappConsent} onChange={e => setFormData({ ...formData, whatsappConsent: e.target.checked })} /><span className="text-sm">Consentimiento WhatsApp</span></div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Estado y Ocupación</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Estado Civil</label><select className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.estadoCivil || ''} onChange={e => setFormData({...formData, estadoCivil: e.target.value})}><option value="Soltero">Soltero</option><option value="Casado">Casado</option><option value="Divorciado">Divorciado</option><option value="Viudo">Viudo</option></select></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Grado Instrucción</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.gradoInstruccion || ''} onChange={e => setFormData({...formData, gradoInstruccion: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Religión</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.religion || ''} onChange={e => setFormData({...formData, religion: e.target.value})} /></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Profesión</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.profesion || ''} onChange={e => setFormData({...formData, profesion: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ocupación</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.ocupacion || ''} onChange={e => setFormData({...formData, ocupacion: e.target.value})} /></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Centro de Estudios</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.centroEstudios || ''} onChange={e => setFormData({...formData, centroEstudios: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dirección del Centro</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.direccionCentroEstudios || ''} onChange={e => setFormData({...formData, direccionCentroEstudios: e.target.value})} /></div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded flex items-center"><Heart className="w-4 h-4 mr-2" /> Salud y Referencias</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Médico Tratante</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.medicoTratante || ''} onChange={e => setFormData({...formData, medicoTratante: e.target.value})} /></div>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Contacto de Emergencia</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaNombre || ''} onChange={e => setFormData({...formData, emergenciaNombre: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Parentesco</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaParentesco || ''} onChange={e => setFormData({...formData, emergenciaParentesco: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Domicilio</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaDomicilio || ''} onChange={e => setFormData({...formData, emergenciaDomicilio: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaTelefono || ''} onChange={e => setFormData({...formData, emergenciaTelefono: e.target.value})} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Antecedentes y Hábitos</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hábitos</label><input className="w-full p-2.5 border rounded" value={examForm.habitos} onChange={e => setExamForm({ ...examForm, habitos: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Familiares</label><input className="w-full p-2.5 border rounded" value={examForm.antecedentesFamiliares} onChange={e => setExamForm({ ...examForm, antecedentesFamiliares: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Farmacológicos (medicación actual)</label><input className="w-full p-2.5 border rounded" value={examForm.farmacologicos} onChange={e => setExamForm({ ...examForm, farmacologicos: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">No farmacológicos / hipersensibilidad</label><input className="w-full p-2.5 border rounded" value={examForm.noFarmacologicos} onChange={e => setExamForm({ ...examForm, noFarmacologicos: e.target.value })} /></div>
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Otros</label><input className="w-full p-2.5 border rounded" value={examForm.otrosAntecedentes} onChange={e => setExamForm({ ...examForm, otrosAntecedentes: e.target.value })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Examen Físico</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">General</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.examenFisicoGeneral} onChange={e => setExamForm({ ...examForm, examenFisicoGeneral: e.target.value })}></textarea></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cabeza</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cabeza} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cabeza: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cuello</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cuello} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cuello: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cara</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cara} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cara: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Examen extraoral</label><input className="w-full p-2.5 border rounded" value={examForm.examenExtraoral} onChange={e => setExamForm({ ...examForm, examenExtraoral: e.target.value })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Examen Intraoral</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Labios</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.labios} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, labios: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mejilla</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.mejilla} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, mejilla: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mucosa</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.mucosa} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, mucosa: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paladar duro</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.paladarDuro} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, paladarDuro: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paladar blando</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.paladarBlando} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, paladarBlando: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipo de boca</label><input className="w-full p-2.5 border rounded" value={examForm.examenIntraoral.tipoDeBoca} onChange={e => setExamForm({ ...examForm, examenIntraoral: { ...examForm.examenIntraoral, tipoDeBoca: e.target.value } })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Análisis de la Oclusión</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Clase</label><input className="w-full p-2.5 border rounded" placeholder="I / II / III" value={examForm.analisisOclusion.clase} onChange={e => setExamForm({ ...examForm, analisisOclusion: { ...examForm.analisisOclusion, clase: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Observaciones</label><input className="w-full p-2.5 border rounded" value={examForm.analisisOclusion.observaciones} onChange={e => setExamForm({ ...examForm, analisisOclusion: { ...examForm.analisisOclusion, observaciones: e.target.value } })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Exámenes Complementarios</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">RX</label><input className="w-full p-2.5 border rounded" value={examForm.examenesComplementarios.rx} onChange={e => setExamForm({ ...examForm, examenesComplementarios: { ...examForm.examenesComplementarios, rx: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">RPO</label><input className="w-full p-2.5 border rounded" value={examForm.examenesComplementarios.rpo} onChange={e => setExamForm({ ...examForm, examenesComplementarios: { ...examForm.examenesComplementarios, rpo: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">RMO</label><input className="w-full p-2.5 border rounded" value={examForm.examenesComplementarios.rmo} onChange={e => setExamForm({ ...examForm, examenesComplementarios: { ...examForm.examenesComplementarios, rmo: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">OBL</label><input className="w-full p-2.5 border rounded" value={examForm.examenesComplementarios.obl} onChange={e => setExamForm({ ...examForm, examenesComplementarios: { ...examForm.examenesComplementarios, obl: e.target.value } })} /></div>
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Laboratorio clínico</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.laboratorioClinico} onChange={e => setExamForm({ ...examForm, laboratorioClinico: e.target.value })}></textarea></div>

                                            <h3 className="font-semibold text-sm text-teal-700 uppercase tracking-wider bg-teal-50 p-2 rounded">Diagnóstico y Plan</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Diagnóstico definitivo</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.diagnosticoDefinitivo} onChange={e => setExamForm({ ...examForm, diagnosticoDefinitivo: e.target.value })}></textarea></div>
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Plan de tratamiento</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.planTratamiento} onChange={e => setExamForm({ ...examForm, planTratamiento: e.target.value })}></textarea></div>
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pronóstico</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.pronostico} onChange={e => setExamForm({ ...examForm, pronostico: e.target.value })}></textarea></div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center"><Save className="w-4 h-4 mr-2" /> Guardar Cambios</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'evolution' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                  <h2 className="text-xl font-bold flex items-center text-slate-800"><Wallet className="w-5 h-5 mr-2 text-teal-600" /> Evolución y Pagos</h2>
                                  <div className="flex items-center gap-2">
                                    <button onClick={exportEvolutionExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar Excel</button>
                                    <button onClick={() => { const d = buildEvolutionPDF(); d.save('evolucion_y_pagos.pdf'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar PDF</button>
                                    <button onClick={() => setEmailModal({ open: true, to: '', context: 'evolution' })} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold">Enviar por correo</button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <h3 className="font-semibold text-slate-700 mb-3 flex items-center"><StethoscopeIcon className="w-4 h-4 mr-2" /> Registrar Visita</h3>
                                        <form onSubmit={handleAddVisit} className="space-y-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servicio</label>
                                                <select className="w-full p-2 border rounded" value={visitForm.service || ''} onChange={(e) => {
                                                    const s = services.find(x => x.name === e.target.value);
                                                    setVisitForm({ ...visitForm, service: e.target.value, description: s ? s.name : '', cost: s ? String(s.price) : visitForm.cost });
                                                }}>
                                                    <option value="">Seleccionar servicio</option>
                                                    {services.map(s => (<option key={s.name} value={s.name}>{s.name} · S/ {s.price}</option>))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input type="date" className="w-full p-2 border rounded" value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo</label><input type="number" step="0.01" className="w-full p-2 border rounded" value={visitForm.cost} onChange={e => setVisitForm({...visitForm, cost: e.target.value})} /></div>
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label><input className="w-full p-2 border rounded" value={visitForm.description} onChange={e => setVisitForm({...visitForm, description: e.target.value})} placeholder="Motivo o tratamiento" /></div>
                                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold">Agregar Visita</button>
                                        </form>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <h3 className="font-semibold text-slate-700 mb-3 flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Registrar Pago</h3>
                                        <form onSubmit={handleAddPayment} className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input type="date" className="w-full p-2 border rounded" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto</label><input type="number" step="0.01" className="w-full p-2 border rounded" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label><input className="w-full p-2 border rounded" value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} placeholder="Pago a cuenta" /></div>
                                            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-bold">Registrar Pago</button>
                                        </form>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-slate-700">Historial Económico</h3>
                                        <div className="text-sm">
                                            <span className="mr-3">Total: S/ {totals.cost.toFixed(2)}</span>
                                            <span className="mr-3">Pagado: S/ {totals.paid.toFixed(2)}</span>
                                            <span className={totals.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>Saldo: S/ {totals.balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {(!activePatient.treatments || activePatient.treatments.length === 0) ? (
                                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">Sin registros económicos.</div>
                                        ) : (
                                            activePatient.treatments.map(t => (
                                                <div key={t.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-slate-800">{t.type === 'visit' ? 'Visita' : 'Pago'} · {t.date}</div>
                                                        <div className="text-slate-500">{t.description}</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {t.type === 'visit' ? (
                                                            <span className="text-slate-800">S/ {Number(t.cost || 0).toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-green-700 font-bold">S/ {Number(t.payment || 0).toFixed(2)}</span>
                                                        )}
                                                        <button onClick={() => handleDeleteTreatment(t.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded">Eliminar</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'initial' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                  <h2 className="text-xl font-bold flex items-center text-slate-800"><Activity className="w-5 h-5 mr-2 text-teal-600" /> Odontograma de Ingreso</h2>
                                  <div className="flex items-center gap-2">
                                    <button onClick={exportOdontogramExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar Excel</button>
                                    <button onClick={() => { const d = buildOdontogramPDF(); d.save('odontograma_ingreso.pdf'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar PDF</button>
                                    <button onClick={() => setEmailModal({ open: true, to: '', context: 'odontogram' })} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold">Enviar por correo</button>
                                  </div>
                                </div>
                                <Odontogram data={activePatient.odontogram_initial || {}} onSave={handleSaveOdontogramInitial} />
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Registrar Avance</h2>
                                    <div className="flex items-center gap-2">
                                      <button onClick={exportProgressExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar Excel</button>
                                      <button onClick={() => { const d = buildProgressPDF(); d.save('historial_avances.pdf'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold">Exportar PDF</button>
                                      <button onClick={() => setEmailModal({ open: true, to: '', context: 'progress' })} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold">Enviar por correo</button>
                                      <button onClick={handleStartNewProgress} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Nuevo Avance</button>
                                    </div>
                                </div>

                                {!isCreatingProgress && (
                                    <div className="grid gap-4">
                                        {(!activePatient.progress_records || activePatient.progress_records.length === 0) ? (
                                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 font-medium">No hay avances registrados.</p>
                                            </div>
                                        ) : (
                                            activePatient.progress_records.map(record => (
                                                <div
                                                    key={record.id}
                                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-start"
                                                    onClick={() => {
                                                        setSelectedProgress(record);
                                                        setProgressForm({
                                                            date: record.date,
                                                            notes: record.notes || '',
                                                            title: record.title || '',
                                                            attachments: record.attachments || []
                                                        });
                                                        setProgressOdontogram(record.odontogramData || {});
                                                        setIsCreatingProgress(true);
                                                    }}
                                                >
                                                    <div className="flex items-start space-x-4">
                                                        <div className="bg-teal-50 p-3 rounded-lg text-teal-700 font-bold text-center min-w-[80px]">
                                                            <div className="text-xs uppercase tracking-wider mb-1">FECHA</div>
                                                            <div className="text-lg">{record.date}</div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 mb-1">{record.title || 'Registro de Avance'}</h4>
                                                            <p className="text-slate-600 text-sm line-clamp-2">{record.notes || 'Sin notas adicionales.'}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-slate-300" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {isCreatingProgress && selectedProgress && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-12">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título</label>
                                                <input type="text" placeholder="Ej: Control de caries, resinas, extracciones" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.title} onChange={(e) => setProgressForm({...progressForm, title: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha del avance</label>
                                                    <input type="date" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.date} onChange={(e) => setProgressForm({...progressForm, date: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Adjuntar fotos/TAC/Placas</label>
                                                    <button onClick={handleAddAttachmentToProgress} className="w-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 flex items-center justify-center text-sm transition-colors"><Camera className="w-4 h-4 mr-2"/> Agregar Foto</button>
                                                </div>
                                                <div className="md:col-span-12">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Notas Clínicas</label>
                                                    <input type="text" placeholder="Describa el estado o cambios realizados..." className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.notes} onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})} />
                                                </div>
                                            </div>
                                            <input ref={progressFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleProgressFilesSelected} />
                                            {progressForm.attachments && progressForm.attachments.length > 0 && (
                                                <div className="md:col-span-12 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos adjuntas a este avance:</h4>
                                                    <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
                                                        {progressForm.attachments.map((att) => (
                                                            <div key={att.id} className="relative aspect-square bg-slate-200 rounded border border-slate-300 overflow-hidden">
                                                                {att.url ? <img src={att.url} alt={att.name} className="w-full h-full object-cover" /> : <FileImage className="absolute inset-0 m-auto w-8 h-8 text-slate-400" />}
                                                                <button onClick={() => handleRemoveProgressAttachment(att.id)} className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 border border-red-200 hover:bg-red-50">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="md:col-span-12">
                                                <button onClick={() => handleSaveProgress(progressOdontogram)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Guardar Avance</button>
                                            </div>
                                            <div className="md:col-span-12 min-w-0">
                                                <Odontogram key={selectedProgress.id} type="progress" data={selectedProgress.odontogramData} onSave={(data) => handleSaveProgress(data)} onChange={(d) => setProgressOdontogram(d)} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'attachments' && (
                            <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                                <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-4">Galería de Anexos</h2>
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-700 flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-teal-600"/> Placas y Fotos Generales</h3>
                                        <button onClick={handleAddGeneralAttachment} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded border border-slate-300 flex items-center transition-colors"><Upload className="w-4 h-4 mr-2"/> Subir Archivo</button>
                                    </div>
                                    <input ref={generalFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGeneralFilesSelected} />
                                    {(!activePatient.general_attachments || activePatient.general_attachments.length === 0) ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                                            <p className="text-slate-400 text-sm">No hay anexos generales cargados.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {activePatient.general_attachments.map((att, i) => (
                                                <div key={i} className="aspect-square bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                    <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setImagePreview(att)}>
                                                        {att.url ? <img src={att.url} alt={att.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-slate-300" />}
                                                    </div>
                                                    <button onClick={() => handleRemoveGeneralAttachment(att.id)} className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 border border-red-200 hover:bg-red-50">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs text-center truncate border-t border-slate-100">{att.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 flex items-center mb-4"><History className="w-5 h-5 mr-2 text-teal-600"/> Historial de Fotos por Avance</h3>
                                    {(!activePatient.progress_records || activePatient.progress_records.every(r => !r.attachments || r.attachments.length === 0)) ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                                            <p className="text-slate-400 text-sm">No hay fotos vinculadas a los avances clínicos.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {activePatient.progress_records.filter(r => r.attachments && r.attachments.length > 0).map((record) => (
                                                <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                                    <div className="flex items-center mb-3 pb-2 border-b border-slate-100">
                                                        <div className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded mr-2">{record.date}</div>
                                                        <h4 className="font-bold text-slate-800 text-sm">Anexos Avance: {record.title || 'Sin Título'}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        {record.attachments.map((att, idx) => (
                                                            <div key={idx} className="aspect-square bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                                <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setImagePreview(att)}>
                                                                    {att.url ? (
                                                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <ImageIcon className="w-10 h-10 text-slate-300" />
                                                                    )}
                                                                </div>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs text-center truncate border-t border-slate-100">{att.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {view==='dashboard' && (
        <>
          <button onClick={() => { setFormData(initialFormState); setView('new-patient'); }} className="md:hidden fixed bottom-16 right-4 z-50 bg-slate-900 hover:bg-slate-800 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xs font-bold">+
          </button>
          <button onClick={exportPatientsExcel} aria-label="Exportar Excel" className="md:hidden fixed bottom-32 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          <button onClick={exportPatientsPDF} aria-label="Exportar PDF" className="md:hidden fixed bottom-48 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </button>
        </>
      )}
      {view==='reminders' && (
        <>
          <button onClick={handleProcessReminders} className="md:hidden fixed bottom-32 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold">Procesar vencidos</button>
          <button onClick={() => setManualReminderOpen(true)} className="md:hidden fixed bottom-16 right-4 z-50 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold">Crear manual</button>
        </>
      )}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-200">
        <div className="grid grid-cols-5">
          <button onClick={() => setView('agenda')} className={`flex flex-col items-center justify-center py-2 ${view==='agenda'?'text-teal-700':'text-slate-600'}`}><Calendar className="w-6 h-6" /><span className="text-[11px]">Agenda</span></button>
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center py-2 border-l border-slate-200 ${view==='dashboard'?'text-teal-700':'text-slate-600'}`}><User className="w-6 h-6" /><span className="text-[11px]">Pacientes</span></button>
          <button onClick={() => setView('services')} className={`flex flex-col items-center justify-center py-2 border-l border-slate-200 ${view==='services'?'text-teal-700':'text-slate-600'}`}><DollarSign className="w-6 h-6" /><span className="text-[11px]">Servicios</span></button>
          <button onClick={() => setView('reminders')} className={`flex flex-col items-center justify-center py-2 border-l border-slate-200 ${view==='reminders'?'text-teal-700':'text-slate-600'}`}><Clock className="w-6 h-6" /><span className="text-[11px]">Recordatorios</span></button>
          <button onClick={() => setView('reminders-config')} className={`flex flex-col items-center justify-center py-2 border-l border-slate-200 ${view==='reminders-config'?'text-teal-700':'text-slate-600'}`}><History className="w-6 h-6" /><span className="text-[11px]">Config</span></button>
        </div>
      </div>
      {imagePreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImagePreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <div className="font-bold text-slate-800 text-sm truncate">{imagePreview.name || 'Imagen'}</div>
              <div className="flex items-center gap-2">
                <a href={imagePreview.url} download={imagePreview.name || 'anexo'} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold">Descargar</a>
                <button className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-3 py-1.5 rounded text-xs font-bold" onClick={() => setImagePreview(null)}>Cerrar</button>
              </div>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[80vh]">
              <img src={imagePreview.url} alt={imagePreview.name} className="max-h-[80vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
