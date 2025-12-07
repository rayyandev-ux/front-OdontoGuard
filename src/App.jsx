import React, { useState, useEffect, useMemo, useRef } from 'react';
import { login as apiLogin, listPatients, createPatient, updatePatient, deletePatient, listServices, createService, updateService, deleteService, sendEmail, listAppointments, createAppointment, updateAppointment, deleteAppointment, listReminderRules, createReminderRule, updateReminderRule, deleteReminderRule, listReminders, createReminder, deleteReminder, processDueReminders, sendReminderNow, listMessageLogs, extractPatientFromImages, listDeletedPatients, recoverPatient } from './api.js'
import { 
  User, 
  FileText, 
  Activity, 
  Image as ImageIcon, 
  Save, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  Loader2,
  Wallet,
  ArrowLeft,
  Briefcase,
  AlertTriangle,
  Calendar,
  Phone,
  Upload,
  FileSpreadsheet,
  DollarSign,
  Clock,
  History,
  Heart,
  Pencil,
  Camera,
  CreditCard,
  FileImage,
  Stethoscope as StethoscopeIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Tesseract from 'tesseract.js';

// New Components
import MainLayout from './components/Layout/MainLayout';
import LoginForm from './components/Auth/LoginForm';
import RealisticOdontogram from './components/Odontogram/RealisticOdontogram';
import ConfirmationModal from './components/Common/ConfirmationModal';

const DNI_API_KEY = "9471419289872be41891b833cdafbf78561b067536c9aedc4fc001f869973138";
const DNI_API_URL = "https://apiperu.dev/api/dni";
const LOGIN_EMAIL = 'odontokaren@odonto.com';
const LOGIN_PASSWORD = 'odonto123karen';
const ACCESS_CODE = 'ODONTO-ACCESS-2025';

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









export default function App() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login'); 
  const [patients, setPatients] = useState([]);
  const [deletedPatients, setDeletedPatients] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState(null);
  const sortedPatients = useMemo(() => {
    const norm = (s) => String(s || '').trim().toLowerCase();
    return (patients || []).slice().sort((a, b) => {
      const al = norm(a.apellidos);
      const bl = norm(b.apellidos);
      if (al && bl && al !== bl) return al.localeCompare(bl, 'es', { sensitivity: 'base' });
      if (!al && bl) return 1;
      if (al && !bl) return -1;
      const an = norm(a.nombres);
      const bn = norm(b.nombres);
      if (an && bn && an !== bn) return an.localeCompare(bn, 'es', { sensitivity: 'base' });
      if (!an && bn) return 1;
      if (an && !bn) return -1;
      const ad = norm(a.dni);
      const bd = norm(b.dni);
      return ad.localeCompare(bd);
    });
  }, [patients]);
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
  const daysUntilPurge = (d) => {
    if (!d) return 7;
    const ms = Date.now() - new Date(d).getTime();
    const passed = Math.ceil(ms / 86400000);
    const left = 7 - passed;
    return left > 0 ? left : 0;
  };
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
  const [dayModalForm, setDayModalForm] = useState({ patientId: '', serviceId: '', time: '', durationMinutes: '30', notes: '' });
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
  const [followRuleForm, setFollowRuleForm] = useState({ serviceId: '', delayDays: 7, delayUnit: 'days', templateText: defaultFollowUpTemplate });
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

  const extractTreatmentsFromText = (raw) => {
    const text = String(raw || '');
    const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const out = [];
    for (const l of lines) {
      const m = l.match(/(\d{2})[/-](\d{2})[/-](\d{2,4})\s+(.+?)$/);
      if (m) {
        const date = `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2]}-${m[1]}`;
        const tail = m[4];
        const numMatch = tail.match(/(\d+[.,]?\d*)\s*$/);
        const amount = numMatch ? Number(String(numMatch[1]).replace(',', '.')) : 0;
        const lower = tail.toLowerCase();
        const isPayment = /pago|abono|cancel/.test(lower);
        out.push({ id: Date.now().toString() + '_' + Math.random().toString(36).slice(2), type: isPayment ? 'payment' : 'visit', date, description: tail.replace(/\s*(\d+[.,]?\d*)\s*$/, '').trim(), cost: isPayment ? 0 : amount, payment: isPayment ? amount : 0 });
      }
    }
    return out;
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
  const uploadFileInputRef = useRef(null);
  const [uploadImages, setUploadImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  useEffect(() => { try { if (window.location?.pathname === '/upload') setView('upload'); } catch (e) { void e } }, []);

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
    if (dni && dni.length !== 8) { alert('DNI inválido, debe tener 8 dígitos'); return; }
    const exists = (patients || []).some(p => {
      const pdni = String(p.dni || '').trim();
      const pn = String(p.nombres || '').trim().toLowerCase();
      const pa = String(p.apellidos || '').trim().toLowerCase();
      return (dni && pdni && pdni === dni) || (pn === nombres && pa === apellidos);
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
          message: "Este paciente se enviará a la Papelera por 7 días. ¿Confirmas?",
          onConfirm: async () => {
            try {
              await deletePatient(token, pid);
              setPatients(prev => (prev || []).filter(p => p.id !== pid));
              if(activePatient?.id === pid) { setView('dashboard'); setActivePatient(null); setFormData(initialFormState); }
              alert('Paciente enviado a la Papelera. Podrás recuperarlo dentro de 7 días.');
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

  const preprocessImageForOCR = async (dataUrl) => {
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const ratio = img.width / img.height;
            const maxW = Math.max(1200, img.width);
            const w = Math.min(maxW, img.width * 1.5);
            const h = Math.round(w / ratio);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const contrast = 1.25; // aumentar contraste
            const brightness = 8;   // leve aumento brillo
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i+1], b = d[i+2];
              // escala de grises (luma)
              let y = 0.2126*r + 0.7152*g + 0.0722*b;
              // ajustar contraste y brillo
              y = (y - 128) * contrast + 128 + brightness;
              if (y < 0) y = 0; if (y > 255) y = 255;
              d[i] = d[i+1] = d[i+2] = y;
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        } catch {
          resolve(dataUrl);
        }
      });
  };

  const compressImageForAI = (dataUrl, maxWidth = 1280, quality = 0.6) => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ratio = img.width / img.height;
          const w = Math.min(maxWidth, img.width);
          const h = Math.round(w / ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch {
        resolve(dataUrl);
      }
    });
  };

  const recognizeImageText = async (dataUrl) => {
      try {
        const processed = await preprocessImageForOCR(dataUrl);
        const res = await Tesseract.recognize(processed, 'spa+eng', {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789 @.-:/,+()\n'
        });
        const text = res?.data?.text || '';
        // Si el texto es muy corto, intentar sin preprocesamiento
        if ((text || '').trim().length < 40) {
          const fallback = await Tesseract.recognize(dataUrl, 'spa+eng', {
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            tessedit_pageseg_mode: '4',
            preserve_interword_spaces: '1'
          });
          return fallback?.data?.text || text;
        }
        return text;
      } catch {
        return '';
      }
  };

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

  const goToUpload = () => { setView('upload'); try { window.history.pushState(null, '', '/upload'); } catch (e) { void e } };

  const openUploadDialog = () => { if (uploadFileInputRef.current) uploadFileInputRef.current.click(); };

  const handleUploadFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, 20 - uploadImages.length);
    const selected = files.slice(0, remaining);
    if (files.length > remaining) alert('Solo se permiten hasta 20 fotos por historial clínico.');
    try {
      const items = await Promise.all(selected.map(async (f) => ({ id: Date.now().toString() + '_' + f.name, type: 'image', name: f.name, url: await fileToDataURL(f), size: f.size })));
      setUploadImages(prev => [...prev, ...items]);
    } catch (err) { alert('Error leyendo archivos: ' + (err?.message || err)); }
    e.target.value = '';
  };

  const removeUploadImage = (id) => { setUploadImages(prev => prev.filter(i => i.id !== id)); };

  const normalizeDate = (s) => {
    if (!s) return '';
    const m1 = s.match(new RegExp('(\\d{4})[-/](\\d{2})[-/](\\d{2})'));
    const m2 = s.match(new RegExp('(\\d{2})[-/](\\d{2})[-/](\\d{4})'));
    if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
    if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
    return '';
  };

  const extractDataFromText = (raw) => {
    const cleanText = (s) => String(s || '')
      .replace(/\r/g, '')
      .replace(/[=—_–•<>~()]{1,}/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\t+/g, ' ');
    const text = cleanText(raw);
    const pick = (re) => { const m = text.match(re); return m && m[1] ? cleanText(m[1]).trim() : ''; };
    let nombres = pick(/Nombres\s*[-:]?\s*(.+)/i);
    let apellidos = pick(/Apellidos\s*[-:]?\s*(.+)/i);
    const lines = text.split(/\n+/).map(s => s.trim()).filter(s => s.length);
    const bothIdx = lines.findIndex(l => /nombres?.{0,40}apellid/i.test(l));
    if (bothIdx >= 0) {
      let both = lines[bothIdx].replace(/^.*apellid\s*(?:o|os)?\s*[-:]?\s*/i, '').trim();
      if (!both || both.length < 3) {
        for (let j = bothIdx + 1; j < Math.min(lines.length, bothIdx + 3); j++) {
          if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(lines[j])) { both = lines[j].trim(); break; }
        }
      }
      const parts = both.split(/\s+/).filter(Boolean);
      if (parts.length >= 3) { apellidos = parts.slice(-2).join(' '); nombres = parts.slice(0, -2).join(' '); }
      else if (parts.length === 2) { nombres = parts[0]; apellidos = parts[1]; }
      else if (parts.length === 1) { nombres = parts[0]; }
    }
    if (!apellidos) {
      const both = pick(/Nombres\s*y\s*Apellid[oa]s?\s*[-:]?\s*(.+)/i);
      if (both) {
        const parts = both.split(/\s+/).filter(Boolean);
        if (parts.length >= 3) { apellidos = parts.slice(-2).join(' '); nombres = parts.slice(0, -2).join(' '); }
        else if (parts.length === 2) { nombres = parts[0]; apellidos = parts[1]; }
      }
    }
    const dni = pick(/DNI\s*[-:]?\s*(\d{8})/i) || pick(/Documento\s*\(DNI\)\s*[-:]?\s*(\d{8})/i);
    const sexoRaw = pick(/Sexo\s*[-:]?\s*(Masculino|Femenino|M|F)/i);
    const sexo = sexoRaw ? (sexoRaw.toUpperCase().startsWith('M') ? 'M' : 'F') : 'M';
    const fechaNacimiento = normalizeDate(pick(/Fecha\s*Nacimiento\s*[-:]?\s*([\d/-]+)/i) || pick(/F\.?\s*Nac\.?\s*[-:]?\s*([\d/-]+)/i) || pick(/Nacimiento\s*[-:]?\s*([\d/-]+)/i));
    const edad = fechaNacimiento ? calculateAge(fechaNacimiento) : pick(/Edad\s*[-:]?\s*(\d{1,3})/i);
    const lugarNacimiento = pick(/Lugar\s*Nacimiento\s*[-:]?\s*(.+)/i) || pick(/Lugar\s*de\s*Nacimiento\s*[-:]?\s*(.+)/i);
    const lugarProcedencia = pick(/Lugar\s*Procedencia\s*[-:]?\s*(.+)/i) || pick(/Procedencia\s*[-:]?\s*(.+)/i);
    const domicilio = pick(/Domicilio\s*[-:]?\s*(.+)/i) || pick(/Direcci[oó]n\s*[-:]?\s*(.+)/i);
    const telefono = (pick(/Tel[eé]fono\s*[-:]?\s*([\d\s+-]+)/i) || '').replace(/[^\d]/g, '');
    const email = pick(/Email\s*[-:]?\s*([^\s]+)/i);
    const estadoCivil = pick(/Estado\s*Civil\s*[-:]?\s*(Soltero|Casado|Divorciado|Viudo)/i);
    const gradoInstruccion = pick(/Grado\s*Instrucci[oó]n\s*[-:]?\s*(.+)/i);
    const profesion = pick(/Profes[ií]?[oó]n\s*[-:]?\s*(.+)/i) || pick(/Profesional\s*[-:]?\s*(.+)/i);
    const ocupacion = pick(/Ocupaci[oó]n\s*[-:]?\s*(.+)/i);
    const centroEstudios = pick(/Centro\s*de\s*Estudios\s*[-:]?\s*(.+)/i);
    const direccionCentroEstudios = pick(/Direcci[oó]n\s*del\s*Centro\s*[-:]?\s*(.+)/i);
    const religion = pick(/Religi[oó]n\s*[-:]?\s*(.+)/i);
    const medicoTratante = pick(/M[eé]dico\s*Tratante\s*[-:]?\s*(.+)/i);
    const emBlock = text.split(/Contacto\s*de\s*Emergencia/i)[1] || '';
    const emergenciaNombre = (() => { const m = emBlock.match(/Nombre\s*[-:]?\s*(.+)/i); return m && m[1] ? m[1].trim() : pick(/Contacto\s*de\s*Emergencia[\s\S]*?Nombre\s*[-:]?\s*(.+)/i); })();
    const emergenciaParentesco = (() => { const m = emBlock.match(/Parentesco\s*[-:]?\s*(.+)/i); return m && m[1] ? m[1].trim() : pick(/Parentesco\s*[-:]?\s*(.+)/i); })();
    const emergenciaDomicilio = (() => { const m = emBlock.match(/Domicilio\s*[-:]?\s*(.+)/i); return m && m[1] ? m[1].trim() : pick(/Domicilio\s*[-:]?\s*(.+)/i); })();
    const emergenciaTelefono = (() => { const m = emBlock.match(/Tel[eé]fono\s*[-:]?\s*([\d\s+-]+)/i); return m && m[1] ? m[1].replace(/[^\d]/g, '') : pick(/Tel[eé]fono\s*[-:]?\s*([\d\s+-]+)/i).replace(/[^\d]/g, ''); })();

    const habitos = pick(/H[aá]bitos\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const antecedentesFamiliares = pick(/Familiares\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const farmacologicos = pick(/Farmacol[oó]gicos.*\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const noFarmacologicos = pick(/No\s*farmacol[oó]gicos.*\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const otrosAntecedentes = pick(/Otros\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const examenFisicoGeneral = pick(/General\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const cabeza = pick(/Cabeza\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const cuello = pick(/Cuello\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const cara = pick(/Cara\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const examenExtraoral = pick(/Examen\s*extraoral\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const labios = pick(/Labios\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const mejilla = pick(/Mejilla\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const mucosa = pick(/Mucosa\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const paladarDuro = pick(/Paladar\s*duro\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const paladarBlando = pick(/Paladar\s*blando\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const tipoDeBoca = pick(/Tipo\s*de\s*boca\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const clase = pick(new RegExp('Clase\\s*[-:]?\\s*(?:I{1,3}|1|2|3|I\\s*/\\s*II\\s*/\\s*III|[IVX]+)', 'i')) || pick(/Clase\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const observaciones = pick(/Observaciones\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const rx = pick(/RX\s*[-:]?\s*(Sí|Si|No)/i);
    const rpo = pick(/RPO\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const rmo = pick(/RMO\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const obl = pick(/OBL\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const laboratorioClinico = pick(/Laboratorio\s*cl[ií]nico\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const diagnosticoDefinitivo = pick(/Diagn[oó]stico\s*definitivo\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const planTratamiento = pick(/Plan\s*de\s*tratamiento\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);
    const pronostico = pick(/Pron[oó]stico\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i);

    const namesObj = { nombres, apellidos };
    const general = {
      ...namesObj,
      sexo,
      dni,
      fechaNacimiento,
      edad,
      lugarNacimiento,
      lugarProcedencia,
      domicilio,
      telefono,
      email,
      estadoCivil,
      gradoInstruccion,
      profesion,
      ocupacion,
      centroEstudios,
      direccionCentroEstudios,
      religion,
      medicoTratante,
      emergenciaNombre,
      emergenciaParentesco,
      emergenciaDomicilio,
      emergenciaTelefono
    };
    const exam = {
      habitos,
      antecedentesFamiliares,
      farmacologicos,
      noFarmacologicos,
      otrosAntecedentes,
      examenFisicoGeneral,
      examenFisicoRegional: { cabeza, cuello, cara },
      examenExtraoral,
      examenIntraoral: { labios, mejilla, mucosa, paladarDuro, paladarBlando, tipoDeBoca },
      analisisOclusion: { clase, observaciones },
      examenesComplementarios: { rx, rpo, rmo, obl },
      laboratorioClinico,
      diagnosticoDefinitivo,
      planTratamiento,
      pronostico
    };
    return { general, exam };
  };

  const analyzeFotos = async () => {
    if (!token) { alert('Debe iniciar sesión'); return; }
    if (!uploadImages.length) { alert('Suba al menos 1 foto'); return; }
    setIsAnalyzing(true);
    try {
      const imgs = await Promise.all(uploadImages.map(async (i) => ({ url: await compressImageForAI(i.url), name: i.name })));
      const ai = await extractPatientFromImages(token, imgs);
      let general = ai.general || {};
      let exam = ai.exam || {};
      let treatments = Array.isArray(ai.treatments) ? ai.treatments : [];
      const keysToCheck = ['domicilio','telefono','email','lugarNacimiento','lugarProcedencia','emergenciaNombre','emergenciaTelefono'];
      const needsOCR = keysToCheck.some(k => !String(general[k] || '').trim()) || treatments.length === 0;
      if (needsOCR) {
        const texts = [];
        for (const img of uploadImages) { texts.push(await recognizeImageText(img.url)); }
        const combined = texts.join('\n\n');
        const parsed = extractDataFromText(combined);
        const fallbackGeneral = parsed.general || {};
        const fallbackExam = parsed.exam || {};
        for (const k of keysToCheck) { if (!String(general[k] || '').trim() && String(fallbackGeneral[k] || '').trim()) general[k] = fallbackGeneral[k]; }
        const mergeObj = (a,b) => { const out = { ...a }; Object.keys(b || {}).forEach(k => { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v)) { out[k] = mergeObj(a?.[k] || {}, v); } else { if (!String(a?.[k] || '').trim() && String(v || '').trim()) out[k] = v; } }); return out; };
        exam = mergeObj(exam, fallbackExam);
        if (!treatments.length) { treatments = extractTreatmentsFromText(combined); }
      }
      const payload = {
        ...initialFormState,
        ...general,
        edad: general.fechaNacimiento ? calculateAge(general.fechaNacimiento) : general.edad || '',
        antecedentes: JSON.stringify({ ...defaultExamForm, ...exam }),
        odontogram_initial: {},
        progress_records: [],
        treatments,
        general_attachments: uploadImages.map(img => ({ ...img, origin: 'initial' }))
      };
      const created = await createPatient(token, payload);
      setPatients(prev => [created, ...prev]);
      setActivePatient(created);
      setFormData(created);
      setUploadImages([]);
      setView('patient-detail');
      setActiveTab('attachments');
      alert('Paciente creado a partir de fotos');
    } catch {
      try {
        const results = [];
        for (const img of uploadImages) {
          const text = await recognizeImageText(img.url);
          results.push(text);
        }
        const combined = results.join('\n\n');
        const { general, exam } = extractDataFromText(combined);
        const payload = {
          ...initialFormState,
          ...general,
          edad: general.fechaNacimiento ? calculateAge(general.fechaNacimiento) : general.edad || '',
          antecedentes: JSON.stringify({ ...defaultExamForm, ...exam }),
          odontogram_initial: {},
          progress_records: [],
          treatments: [],
          general_attachments: uploadImages.map(img => ({ ...img, origin: 'initial' }))
        };
        const created = await createPatient(token, payload);
        setPatients(prev => [created, ...prev]);
        setActivePatient(created);
        setFormData(created);
        setUploadImages([]);
        setView('patient-detail');
        setActiveTab('attachments');
        alert('Paciente creado con OCR');
      } catch (err) {
        alert('Error analizando/creando paciente: ' + (err?.message || err));
      }
    } finally {
      setIsAnalyzing(false);
    }
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

  const handleDeleteProgress = async (recordId) => {
      setConfirmModal({
          isOpen: true,
          message: "¿Eliminar este avance clínico? Esta acción no se puede deshacer.",
          onConfirm: async () => {
            try {
              const updatedRecords = (activePatient.progress_records || []).filter(r => r.id !== recordId);
              await updatePatient(token, activePatient.id, { progress_records: updatedRecords });
              setActivePatient(prev => ({ ...prev, progress_records: updatedRecords }));
              if (selectedProgress && selectedProgress.id === recordId) { setIsCreatingProgress(false); setSelectedProgress(null); }
            } catch (e) { alert("Error eliminando avance: " + (e?.message || e)); }
          }
      });
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
    const rows = sortedPatients.map(p => ({ Apellidos: p.apellidos || '', Nombres: p.nombres || '', DNI: p.dni || '', Telefono: p.telefono || '', Email: p.email || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
    XLSX.writeFile(wb, 'pacientes.xlsx');
  };

  const exportPatientsPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { head: [['Apellidos','Nombres','DNI','Teléfono','Email']], body: sortedPatients.map(p => [p.apellidos || '', p.nombres || '', p.dni || '', p.telefono || '', p.email || '']) });
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

  const exportGeneralExcel = () => {
    const rows = [
      { Campo: 'Nombres', Valor: formData.nombres || '' },
      { Campo: 'Apellidos', Valor: formData.apellidos || '' },
      { Campo: 'Sexo', Valor: formData.sexo || '' },
      { Campo: 'DNI', Valor: formData.dni || '' },
      { Campo: 'Fecha Nacimiento', Valor: formData.fechaNacimiento || '' },
      { Campo: 'Edad', Valor: formData.edad || '' },
      { Campo: 'Domicilio', Valor: formData.domicilio || '' },
      { Campo: 'Email', Valor: formData.email || '' },
      { Campo: 'Teléfono', Valor: formData.telefono || '' },
      { Campo: 'Estado Civil', Valor: formData.estadoCivil || '' },
      { Campo: 'Grado Instrucción', Valor: formData.gradoInstruccion || '' },
      { Campo: 'Religión', Valor: formData.religion || '' },
      { Campo: 'Profesión', Valor: formData.profesion || '' },
      { Campo: 'Ocupación', Valor: formData.ocupacion || '' },
      { Campo: 'Centro de Estudios', Valor: formData.centroEstudios || '' },
      { Campo: 'Dirección del Centro', Valor: formData.direccionCentroEstudios || '' },
      { Campo: 'Médico Tratante', Valor: formData.medicoTratante || '' },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos Generales');
    XLSX.writeFile(wb, 'datos_generales.xlsx');
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
    <MainLayout 
      activeView={view} 
      onViewChange={setView} 
      onLogout={() => { setToken(null); localStorage.removeItem('authToken'); setView('login'); setPatients([]); setActivePatient(null); }}
      userEmail={LOGIN_EMAIL}
    >
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
        {view === 'dashboard' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Pacientes</p>
                            <h3 className="text-3xl font-bold text-slate-800">{patients.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-white">
                          <User className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Citas Hoy</p>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {appointments.filter(a => a.startAt.startsWith(new Date().toISOString().split('T')[0])).length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-white">
                          <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Recordatorios Pendientes</p>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {reminders.filter(r => r.status === 'pending').length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-white">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {patientsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="text-sm">{patientsError}</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Listado de Pacientes</h2>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto md:overflow-visible pb-2 md:pb-0 flex-wrap">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-grow md:flex-none focus-within:ring-2 focus-within:ring-teal-500 transition-all min-w-[200px]">
                        <div className="relative flex-grow md:w-64">
                          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                          <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full pl-9 pr-4 py-2 text-sm focus:outline-none bg-transparent" />
                        </div>
                      </div>
                      <button onClick={exportPatientsExcel} className="hidden md:inline-flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors">Excel</button>
                      <button onClick={exportPatientsPDF} className="hidden md:inline-flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors">PDF</button>
                      <button onClick={() => { setFormData(initialFormState); setView('new-patient'); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm shadow-teal-200 transition-all flex items-center">
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Nuevo Paciente</span>
                        <span className="md:hidden">Nuevo</span>
                      </button>
                      <button onClick={async () => { setView('trash'); setTrashLoading(true); try { const d = await listDeletedPatients(token); setDeletedPatients(d); setTrashError(null); } catch (e) { setTrashError(e?.message || 'Error cargando papelera'); } finally { setTrashLoading(false); } }} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center">
                        <Trash2 className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Papelera</span>
                        <span className="md:hidden">Papelera</span>
                      </button>
                      <button onClick={goToUpload} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm transition-all flex items-center">
                        <Upload className="w-4 h-4 md:mr-2"/> 
                        <span className="hidden md:inline">Subir Foto</span>
                        <span className="md:hidden">Subir</span>
                      </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 font-semibold">Paciente</th>
                                    <th className="hidden md:table-cell px-6 py-4 font-semibold">DNI</th>
                                    <th className="hidden md:table-cell px-6 py-4 font-semibold">Contacto</th>
                                    <th className="px-4 md:px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedPatients.map(patient => (
                                    <tr key={patient.id} onClick={() => { setActivePatient(patient); setFormData(patient); setView('patient-detail'); setActiveTab('general'); }} className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {patient.nombres?.[0]}{patient.apellidos?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{patient.apellidos}, {patient.nombres}</div>
                                                    <div className="text-xs text-slate-500 block md:hidden mt-0.5">DNI: {patient.dni || '---'}</div>
                                                    <div className="text-xs text-slate-500 block md:hidden mt-0.5">{patient.telefono || '---'}</div>
                                                    <div className="text-xs text-slate-500 hidden md:block">{patient.email || 'Sin email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 font-mono text-slate-600">{patient.dni || '---'}</td>
                                        <td className="hidden md:table-cell px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {patient.telefono || '---'}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <ChevronRight className="w-5 h-5 text-slate-300 inline-block group-hover:text-teal-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                                {sortedPatients.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                            No se encontraron pacientes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                <div className="hidden md:block overflow-x-auto">
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

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                  {filteredServices.map(s => {
                    const isEditing = editingServiceId === (s.id || slug(s.name));
                    return (
                      <div key={s.id || slug(s.name)} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre</label>
                              <input className="w-full p-2 border rounded text-sm" value={serviceEditForm.name} onChange={e => setServiceEditForm({ ...serviceEditForm, name: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Precio</label>
                              <input type="number" step="0.01" className="w-full p-2 border rounded text-sm" value={serviceEditForm.price} onChange={e => setServiceEditForm({ ...serviceEditForm, price: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button onClick={handleCancelEditService} className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                              <button onClick={handleSaveEditService} className="px-3 py-1.5 text-white bg-teal-600 rounded text-sm font-medium">Guardar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                              <div className="font-extrabold text-teal-600 text-lg">S/ {Number(s.price).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleStartEditService(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteService(s.id || slug(s.name))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!filteredServices.length && (
                     <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                       Sin resultados para "{serviceQuery}"
                     </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {view === 'upload' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Upload className="w-6 h-6 mr-2 text-teal-600" /> Subir por foto</h2>
              <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 text-center">
                    <p className="text-slate-600 mb-3">Sube hasta 20 fotos del historial clínico</p>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={openUploadDialog} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold"><Camera className="w-4 h-4 mr-2"/> Seleccionar fotos</button>
                      <input ref={uploadFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadFilesSelected} />
                    </div>
                  </div>
                  {uploadImages.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {uploadImages.map(img => (
                          <div key={img.id} className="relative aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <button onClick={() => removeUploadImage(img.id)} className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 border border-red-200 hover:bg-red-50"><X className="w-3 h-3"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Analiza las fotos y crea el paciente automáticamente.</p>
                    <button onClick={analyzeFotos} disabled={isAnalyzing || uploadImages.length === 0} className="w-full mt-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center">
                      {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
                      Analizar fotos
                    </button>
                  </div>
                </div>
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
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4">
                  <div className="w-full md:w-auto pb-2 md:pb-0 flex items-center gap-2 flex-wrap">
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                      <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">Hoy</button>
                      <button onClick={() => setCalendarDate(addDays(calendarDate, calendarView==='month'? -30 : calendarView==='week'? -7 : -1))} className="px-3 py-1 text-sm border-l border-slate-200 text-slate-700 hover:bg-slate-50">←</button>
                      <button onClick={() => setCalendarDate(addDays(calendarDate, calendarView==='month'? 30 : calendarView==='week'? 7 : 1))} className="px-3 py-1 text-sm border-l border-slate-200 text-slate-700 hover:bg-slate-50">→</button>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                      <button onClick={() => setCalendarStatusFilter('all')} className={`px-3 py-1 text-sm ${calendarStatusFilter==='all'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Todas</button>
                      <button onClick={() => setCalendarStatusFilter('scheduled')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarStatusFilter==='scheduled'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Programadas</button>
                      <button onClick={() => setCalendarStatusFilter('completed')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarStatusFilter==='completed'?'bg-teal-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Atendidas</button>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden md:ml-auto flex-shrink-0">
                      <button onClick={() => setCalendarView('month')} className={`px-3 py-1 text-sm ${calendarView==='month'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Mes</button>
                      <button onClick={() => setCalendarView('week')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarView==='week'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Semana</button>
                      <button onClick={() => setCalendarView('day')} className={`px-3 py-1 text-sm border-l border-slate-200 ${calendarView==='day'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Día</button>
                    </div>
                  </div>
                  <div className="md:hidden w-full">
                    <input type="month" value={`${calendarDate.getFullYear()}-${String(calendarDate.getMonth()+1).padStart(2,'0')}`} onChange={e => { const [y,m] = e.target.value.split('-'); setCalendarDate(new Date(Number(y), Number(m)-1, 1)); }} className="w-full p-2 border rounded text-sm" />
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
                          <button onClick={(e) => { e.stopPropagation(); setSelectedDay(d); setDayModal({ open: true, date: d }); }} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-teal-700 p-1 rounded" title="Nueva cita"><Plus className="w-4 h-4" /></button>
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
                          <button onClick={(e) => { e.stopPropagation(); setSelectedDay(d); setDayModal({ open: true, date: d }); }} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-teal-700 p-1 rounded" title="Nueva cita"><Plus className="w-4 h-4" /></button>
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
                <div className="fixed inset-0 z-50 bg-black/40 flex md:items-center md:justify-center">
                  <div className="bg-white w-full md:w-[800px] md:max-w-[800px] h-full md:h-auto p-0 flex flex-col md:rounded-xl md:shadow-2xl md:border">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDayModal({ open: false, date: null })} className="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-700 border border-slate-300 rounded"><ArrowLeft className="w-4 h-4" /> Atrás</button>
                        <div className="flex items-center text-xl font-bold text-slate-800"><Calendar className="w-5 h-5 mr-2 text-slate-600" /> Citas del {dayModal.date ? formatDate(dayModal.date) : ''}</div>
                      </div>
                      <button onClick={() => setDayModal({ open: false, date: null })} className="hidden md:inline-flex px-3 py-1.5 text-sm text-slate-700 border border-slate-300 rounded hover:bg-slate-50">Cerrar</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 pb-24">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paciente*</label>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                              <select value={dayModalForm?.patientId || ''} onChange={e => setDayModalForm(prev => ({ ...prev, patientId: e.target.value }))} className="pl-8 p-2 border rounded text-base md:text-sm w-full">
                                <option value="">Selecciona</option>
                                {sortedPatients.map(p => (
                                  <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Servicio*</label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                              <select value={dayModalForm?.serviceId || ''} onChange={e => setDayModalForm(prev => ({ ...prev, serviceId: e.target.value }))} className="pl-8 p-2 border rounded text-base md:text-sm w-full">
                                <option value="">Selecciona</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hora de la Cita*</label>
                            <div className="relative">
                              <Clock className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                              <input type="time" value={dayModalForm?.time || ''} onChange={e => setDayModalForm(prev => ({ ...prev, time: e.target.value }))} className="pl-8 p-2 border rounded text-base md:text-sm w-full" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Duración (Min)</label>
                            <div className="relative">
                              <input type="number" min="5" step="5" value={dayModalForm?.durationMinutes || ''} onChange={e => setDayModalForm(prev => ({ ...prev, durationMinutes: e.target.value }))} className="p-2 pr-8 border rounded text-base md:text-sm w-full" />
                              <ChevronRight className="absolute right-2 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Motivo de la Cita</label>
                            <textarea rows="2" placeholder="Comentarios o notas" value={dayModalForm?.notes || ''} onChange={e => setDayModalForm(prev => ({ ...prev, notes: e.target.value }))} className="p-2 border rounded text-base md:text-sm w-full" />
                          </div>
                        </div>
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
                            setDayModalForm({ patientId: '', serviceId: '', time: '', durationMinutes: '30', notes: '' });
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="hidden md:flex text-xl font-bold text-slate-800 items-center"><Clock className="w-5 h-5 mr-2 text-indigo-600" /> Recordatorios (Autopilot)</h3>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                    <button onClick={() => setReminderStatusFilter('all')} className={`px-3 py-1 text-sm ${reminderStatusFilter==='all'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Todos</button>
                    <button onClick={() => setReminderStatusFilter('pending')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='pending'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Pendientes</button>
                    <button onClick={() => setReminderStatusFilter('sent')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='sent'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Enviados</button>
                    <button onClick={() => setReminderStatusFilter('failed')} className={`px-3 py-1 text-sm border-l border-slate-200 ${reminderStatusFilter==='failed'?'bg-indigo-600 text-white':'text-slate-700 hover:bg-slate-50'}`}>Fallidos</button>
                  </div>
                  <button onClick={handleProcessReminders} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center">
                    <span className="hidden md:inline">Procesar vencidos</span>
                    <span className="md:hidden">Procesar</span>
                  </button>
                  <button onClick={() => setManualReminderOpen(o => !o)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center">
                    <span className="hidden md:inline">{manualReminderOpen ? 'Cerrar manual' : 'Crear manual'}</span>
                    <span className="md:hidden">{manualReminderOpen ? 'Cerrar' : 'Manual'}</span>
                  </button>
                  
                </div>
              </div>
              {manualReminderOpen && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <select value={manualReminderForm.patientId} onChange={e => setManualReminderForm({ ...manualReminderForm, patientId: e.target.value })} className="p-2 border rounded text-sm">
                      <option value="">Paciente</option>
                      {sortedPatients.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
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
                if (followRuleForm.delayDays === '' || Number(followRuleForm.delayDays) <= 0) errs.delayDays = 'Por favor, introduce un número válido';
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
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={followRuleForm.delayUnit === 'months' ? Math.max(1, Math.round(Number(followRuleForm.delayDays || 0) / 30)) : Number(followRuleForm.delayDays || 0)}
                      onChange={e => {
                        const raw = Number(e.target.value);
                        const asDays = followRuleForm.delayUnit === 'months' ? raw * 30 : raw;
                        setFollowRuleForm(prev => ({ ...prev, delayDays: asDays }));
                      }}
                      className="p-2 border rounded text-sm w-24"
                    />
                    <select
                      value={followRuleForm.delayUnit}
                      onChange={e => setFollowRuleForm(prev => ({ ...prev, delayUnit: e.target.value }))}
                      className="p-2 border rounded text-sm"
                    >
                      <option value="days">días</option>
                      <option value="months">meses</option>
                    </select>
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
                  {editingRuleId && <button type="button" onClick={() => { setEditingRuleId(null); setFollowRuleForm({ serviceId: '', delayDays: 7, delayUnit: 'days', templateText: defaultFollowUpTemplate }); setFormErrors({ serviceId: '', delayDays: '', templateText: '' }); }} className="text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded text-sm font-bold">Cancelar</button>}
                </div>
              </form>
              {!!rules.length && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between border border-slate-200 bg-white rounded px-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{services.find(s => s.id === r.serviceId)?.name || r.serviceId}</div>
                        <div className="text-slate-600">Seguimiento: {r.delayDays ? (Number(r.delayDays) % 30 === 0 && Number(r.delayDays) >= 30 ? `${Math.round(Number(r.delayDays) / 30)} meses` : `${r.delayDays} días`) : 'Ninguno'} • Activo: {r.enabled ? 'Sí' : 'No'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { const dd = Number(r.delayDays || 0); const du = (dd >= 30 && dd % 30 === 0) ? 'months' : 'days'; setFollowRuleForm({ serviceId: r.serviceId, delayDays: dd, delayUnit: du, templateText: r.templateText || defaultFollowUpTemplate }); setEditingRuleId(r.id); }} className="text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs font-bold">Editar</button>
                        <button onClick={async () => { try { await deleteReminderRule(token, r.id); setRules(prev => prev.filter(x => x.id !== r.id)); if (editingRuleId === r.id) { setEditingRuleId(null); setFollowRuleForm({ serviceId: '', delayDays: 7, delayUnit: 'days', templateText: defaultFollowUpTemplate }); } } catch (e) { alert(e?.message || 'Error eliminando configuración'); } }} className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded text-xs font-bold">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        

        {view === 'new-patient' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center"><Plus className="w-6 h-6 mr-2 text-teal-600" /> Nuevo Ingreso</h2>
                    <button onClick={() => setView('dashboard')} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-1">
                          <input placeholder="DNI (Opcional)" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-2.5 pr-10 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none" maxLength={8} />
                          <button type="button" onClick={() => searchDNI(formData.dni)} disabled={isSearchingDNI} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400" title="Buscar en RENIEC">
                            {isSearchingDNI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                        </div>
                        <input required placeholder="Nombres" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none md:col-span-1" />
                        <input required placeholder="Apellidos" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none md:col-span-1" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:col-span-3">
                            <input type="date" required value={formData.fechaNacimiento} onChange={handleDOBChange} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none" />
                            <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        <input placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full p-2.5 border rounded text-base md:text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none md:col-span-1" />
                        <label className="flex items-center gap-2 text-sm md:col-span-2 text-slate-700 dark:text-slate-200"><input type="checkbox" checked={!!formData.whatsappConsent} onChange={e => setFormData({ ...formData, whatsappConsent: e.target.checked })} /><span>Consentimiento WhatsApp</span></label>
                        <button type="submit" disabled={creatingPatient} className="w-full bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed md:col-span-3">{creatingPatient ? 'Creando...' : 'Crear Expediente'}</button>
                    </form>
                </div>
            </div>
        )}

        {view === 'trash' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Trash2 className="w-6 h-6 mr-2 text-teal-600" /> Papelera de Pacientes</h2>
              <button onClick={() => setView('dashboard')} className="text-slate-600 hover:text-slate-800 px-3 py-2 rounded">Volver</button>
            </div>
            {trashError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm">{trashError}</span>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 md:px-6 py-4 font-semibold">Paciente</th>
                      <th className="hidden md:table-cell px-6 py-4 font-semibold">DNI</th>
                      <th className="hidden md:table-cell px-6 py-4 font-semibold">Eliminado</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trashLoading && (
                      <tr><td colSpan="4" className="px-6 py-6 text-center text-slate-400">Cargando...</td></tr>
                    )}
                    {!trashLoading && deletedPatients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-100 cursor-pointer transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="font-bold text-slate-800">{p.apellidos}, {p.nombres}</div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 font-mono text-slate-600">{p.dni || '---'}</td>
                        <td className="hidden md:table-cell px-6 py-4 text-slate-600">{p.deletedAt ? `${new Date(p.deletedAt).toLocaleDateString()} • Quedan ${daysUntilPurge(p.deletedAt)} ${daysUntilPurge(p.deletedAt) === 1 ? 'día' : 'días'}` : '—'}</td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <button onClick={async () => { try { await recoverPatient(token, p.id); setDeletedPatients(prev => prev.filter(x => x.id !== p.id)); const fresh = await listPatients(token); setPatients(fresh); alert('Paciente recuperado'); } catch (e) { alert(e?.message || 'Error recuperando paciente'); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold">Recuperar</button>
                        </td>
                      </tr>
                    ))}
                    {!trashLoading && deletedPatients.length === 0 && (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">La papelera está vacía</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'patient-detail' && activePatient && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                <div className="md:hidden flex items-center mb-4">
                    <button onClick={() => { setView('dashboard'); setFormData(initialFormState); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /> Atrás</button>
                </div>
                <div className="flex flex-col gap-1 mb-4 text-sm">
                    <div className="flex items-center min-w-0">
                      <button onClick={() => { setView('dashboard'); setFormData(initialFormState); }} className="text-slate-500 hover:text-slate-800 whitespace-nowrap flex-shrink-0">Pacientes</button>
                      <ChevronRight className="w-4 h-4 mx-2 text-slate-300 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate max-w-[70vw] sm:max-w-none">{activePatient.apellidos}, {activePatient.nombres}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-slate-500">
                      {activePatient.dni && (<span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">DNI: {activePatient.dni}</span>)}
                      {activePatient.telefono && (<span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Tel: {activePatient.telefono}</span>)}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="hidden md:flex md:col-span-12 bg-slate-900 rounded-xl border border-slate-800 px-4 py-2 sticky top-16 z-30 mx-2 md:mx-4">
                        <div className="flex items-center gap-2 overflow-x-auto">
                            <button onClick={() => setActiveTab('general')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><User className="w-4 h-4" /><span>Datos Generales</span></button>
                            <button onClick={() => setActiveTab('evolution')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'evolution' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Wallet className="w-4 h-4" /><span>Evolución y Pagos</span></button>
                            <button onClick={() => setActiveTab('initial')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'initial' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Activity className="w-4 h-4" /><span>Odontograma Ingreso</span></button>
                            <button onClick={() => setActiveTab('progress')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'progress' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CheckCircle2 className="w-4 h-4" /><span>Historial Avances</span></button>
                            <button onClick={() => setActiveTab('attachments')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'attachments' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ImageIcon className="w-4 h-4" /><span>Anexos (Placas)</span></button>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (activeTab === 'general') return exportGeneralExcel();
                              if (activeTab === 'evolution') return exportEvolutionExcel();
                              if (activeTab === 'initial') return exportOdontogramExcel();
                              if (activeTab === 'progress') return exportProgressExcel();
                            }}
                            disabled={!['general','evolution','initial','progress'].includes(activeTab)}
                            className={`bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold ${!['general','evolution','initial','progress'].includes(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Exportar Excel
                          </button>
                          <button
                            onClick={() => {
                              if (activeTab === 'general') { const d = buildGeneralPDF(); d.save('datos_generales.pdf'); return; }
                              if (activeTab === 'evolution') { const d = buildEvolutionPDF(); d.save('evolucion_y_pagos.pdf'); return; }
                              if (activeTab === 'initial') { const d = buildOdontogramPDF(); d.save('odontograma_ingreso.pdf'); return; }
                              if (activeTab === 'progress') { const d = buildProgressPDF(); d.save('historial_avances.pdf'); return; }
                            }}
                            disabled={!['general','evolution','initial','progress'].includes(activeTab)}
                            className={`bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold ${!['general','evolution','initial','progress'].includes(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Exportar PDF
                          </button>
                          <button
                            onClick={() => {
                              if (['general','evolution','initial','progress'].includes(activeTab)) {
                                const context = activeTab === 'general' ? 'general' : activeTab === 'evolution' ? 'evolution' : activeTab === 'initial' ? 'odontogram' : 'progress';
                                setEmailModal({ open: true, to: '', context });
                              }
                            }}
                            disabled={!['general','evolution','initial','progress'].includes(activeTab)}
                            className={`bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold ${!['general','evolution','initial','progress'].includes(activeTab) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Enviar por correo
                          </button>
                          <button
                            onClick={() => handleDeletePatient(activePatient.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-bold"
                          >
                            Eliminar Paciente
                          </button>
                        </div>
                    </div>
                    <div className="md:hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-row md:flex-col gap-2 sticky top-16 md:top-24 z-30 overflow-x-auto md:overflow-visible scrollbar-hide w-full">
                        <div className="hidden md:block mb-4 px-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menú Principal</p></div>
                        <button onClick={() => setActiveTab('general')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><User className="w-4 h-4" /><span>Datos Generales</span></button>
                        <button onClick={() => setActiveTab('evolution')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'evolution' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Wallet className="w-4 h-4" /><span>Evolución y Pagos</span></button>
                        <button onClick={() => setActiveTab('initial')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'initial' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Activity className="w-4 h-4" /><span>Odontograma Ingreso</span></button>
                        <button onClick={() => setActiveTab('progress')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'progress' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CheckCircle2 className="w-4 h-4" /><span>Historial Avances</span></button>
                        <button onClick={() => setActiveTab('attachments')} className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'attachments' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white shadow-sm border-teal-200 dark:border-teal-800 border' : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ImageIcon className="w-4 h-4" /><span>Anexos (Placas)</span></button>
                        <div className="hidden md:block flex-grow min-h-[50px]"></div>
                        <button onClick={() => handleDeletePatient(activePatient.id)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 mt-auto md:mt-4"><Trash2 className="w-4 h-4" /><span className="hidden md:inline">Eliminar Paciente</span></button>
                    </div>
                    

                    <div className={`md:col-span-12 lg:col-span-12 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 md:p-8 min-h-[600px] mx-2 md:mx-4 ${activeTab === 'general' ? 'bg-teal-100 dark:bg-teal-900/15' : activeTab === 'evolution' ? 'bg-amber-100 dark:bg-amber-900/15' : activeTab === 'initial' ? 'bg-slate-100 dark:bg-slate-900' : activeTab === 'attachments' ? 'bg-indigo-100 dark:bg-indigo-900/15' : 'bg-white dark:bg-slate-900'}` }>
                        {activeTab === 'general' && (
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-6 border-b pb-4">
                                  <h2 className="text-xl font-bold flex items-center text-slate-800 dark:text-white"><FileText className="w-5 h-5 mr-2 text-teal-600" /> Ficha de Anamnesis</h2>
                                  <div className="flex items-center gap-2"></div>
                                </div>
                                <form onSubmit={handleUpdateGeneralInfo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-4">
                                        <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded flex items-center"><User className="w-4 h-4 mr-2" /> Datos de Filiación</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombres y Apellidos</label><div className="flex gap-2"><input className="w-1/2 p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Nombres" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} /><input className="w-1/2 p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Apellidos" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} /></div></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sexo</label><select className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">DNI</label><div className="relative"><input className="w-full p-2.5 pr-10 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} maxLength={8} /><button type="button" onClick={() => searchDNI(formData.dni)} disabled={isSearchingDNI} className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400" title="Buscar en RENIEC">{isSearchingDNI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button></div></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                 <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha Nacimiento</label><input type="date" className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.fechaNacimiento} onChange={handleDOBChange} /></div>
                                                 <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Edad</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none bg-slate-100" value={formData.edad} readOnly placeholder="Auto" /></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lugar Nacimiento</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.lugarNacimiento} onChange={e => setFormData({...formData, lugarNacimiento: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lugar Procedencia</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.lugarProcedencia} onChange={e => setFormData({...formData, lugarProcedencia: e.target.value})} /></div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded flex items-center"><MapPin className="w-4 h-4 mr-2" /> Ubicación y Contacto</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Domicilio</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.domicilio} onChange={e => setFormData({...formData, domicilio: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label><input type="email" className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
                                                <div className="flex items-center gap-2"><input type="checkbox" checked={!!formData.whatsappConsent} onChange={e => setFormData({ ...formData, whatsappConsent: e.target.checked })} /><span className="text-sm">Consentimiento WhatsApp</span></div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Estado y Ocupación</h3>
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
                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded flex items-center"><Heart className="w-4 h-4 mr-2" /> Salud y Referencias</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Médico Tratante</label><input className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" value={formData.medicoTratante || ''} onChange={e => setFormData({...formData, medicoTratante: e.target.value})} /></div>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-white uppercase">Contacto de Emergencia</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaNombre || ''} onChange={e => setFormData({...formData, emergenciaNombre: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Parentesco</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaParentesco || ''} onChange={e => setFormData({...formData, emergenciaParentesco: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Domicilio</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaDomicilio || ''} onChange={e => setFormData({...formData, emergenciaDomicilio: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Teléfono</label><input className="w-full p-2.5 border border-slate-300 rounded" value={formData.emergenciaTelefono || ''} onChange={e => setFormData({...formData, emergenciaTelefono: e.target.value})} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded">Antecedentes y Hábitos</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hábitos</label><input className="w-full p-2.5 border rounded" value={examForm.habitos} onChange={e => setExamForm({ ...examForm, habitos: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Familiares</label><input className="w-full p-2.5 border rounded" value={examForm.antecedentesFamiliares} onChange={e => setExamForm({ ...examForm, antecedentesFamiliares: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Farmacológicos (medicación actual)</label><input className="w-full p-2.5 border rounded" value={examForm.farmacologicos} onChange={e => setExamForm({ ...examForm, farmacologicos: e.target.value })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">No farmacológicos / hipersensibilidad</label><input className="w-full p-2.5 border rounded" value={examForm.noFarmacologicos} onChange={e => setExamForm({ ...examForm, noFarmacologicos: e.target.value })} /></div>
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Otros</label><input className="w-full p-2.5 border rounded" value={examForm.otrosAntecedentes} onChange={e => setExamForm({ ...examForm, otrosAntecedentes: e.target.value })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded">Examen Físico</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 uppercase mb-1">General</label><textarea className="w-full p-2.5 border rounded" rows={3} value={examForm.examenFisicoGeneral} onChange={e => setExamForm({ ...examForm, examenFisicoGeneral: e.target.value })}></textarea></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cabeza</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cabeza} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cabeza: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cuello</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cuello} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cuello: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cara</label><input className="w-full p-2.5 border rounded" value={examForm.examenFisicoRegional.cara} onChange={e => setExamForm({ ...examForm, examenFisicoRegional: { ...examForm.examenFisicoRegional, cara: e.target.value } })} /></div>
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Examen extraoral</label><input className="w-full p-2.5 border rounded" value={examForm.examenExtraoral} onChange={e => setExamForm({ ...examForm, examenExtraoral: e.target.value })} /></div>
                                            </div>

                                            <h3 className="font-semibold text-sm text-teal-700 dark:text-white uppercase tracking-wider bg-teal-50 dark:bg-teal-900/25 p-2 rounded">Examen Intraoral</h3>
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
                                  <h2 className="text-xl font-bold flex items-center text-slate-800 dark:text-white"><Wallet className="w-5 h-5 mr-2 text-teal-600" /> Evolución y Pagos</h2>
                                  <div className="flex items-center gap-2"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                        <h3 className="font-semibold text-slate-700 dark:text-white mb-3 flex items-center"><StethoscopeIcon className="w-4 h-4 mr-2" /> Registrar Visita</h3>
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input type="date" className="w-full p-2 border rounded" value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo</label><input type="number" step="0.01" className="w-full p-2 border rounded" value={visitForm.cost} onChange={e => setVisitForm({...visitForm, cost: e.target.value})} /></div>
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label><input className="w-full p-2 border rounded" value={visitForm.description} onChange={e => setVisitForm({...visitForm, description: e.target.value})} placeholder="Motivo o tratamiento" /></div>
                                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold">Agregar Visita</button>
                                        </form>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                        <h3 className="font-semibold text-slate-700 dark:text-white mb-3 flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Registrar Pago</h3>
                                        <form onSubmit={handleAddPayment} className="space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input type="date" className="w-full p-2 border rounded" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto</label><input type="number" step="0.01" className="w-full p-2 border rounded" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label><input className="w-full p-2 border rounded" value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} placeholder="Pago a cuenta" /></div>
                                            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-bold">Registrar Pago</button>
                                        </form>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                        <h3 className="font-semibold text-slate-700 dark:text-white">Historial Económico</h3>
                                        <div className="text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span>Total: S/ {totals.cost.toFixed(2)}</span>
                                            <span>Pagado: S/ {totals.paid.toFixed(2)}</span>
                                            <span className={totals.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>Saldo: S/ {totals.balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {(!activePatient.treatments || activePatient.treatments.length === 0) ? (
                                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center text-slate-500 dark:text-slate-300 text-sm">Sin registros económicos.</div>
                                        ) : (
                                            activePatient.treatments.map(t => (
                                                <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 gap-3 md:gap-0">
                                                    <div className="text-sm w-full md:w-auto">
                                                        <div className="font-medium text-slate-800 dark:text-white">{t.type === 'visit' ? 'Visita' : 'Pago'} · {t.date}</div>
                                                        <div className="text-slate-500 dark:text-white mt-1 md:mt-0 break-words">{t.description}</div>
                                                    </div>
                                                    <div className="flex items-center justify-between w-full md:w-auto md:gap-4 border-t md:border-t-0 border-slate-200 pt-2 md:pt-0 mt-2 md:mt-0">
                                                        {t.type === 'visit' ? (
                                                            <span className="text-slate-800 dark:text-white font-bold">S/ {Number(t.cost || 0).toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-green-700 font-bold">S/ {Number(t.payment || 0).toFixed(2)}</span>
                                                        )}
                                                        <button onClick={() => handleDeleteTreatment(t.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded text-xs uppercase font-bold">Eliminar</button>
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
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                                  <h2 className="text-xl font-bold flex items-center text-slate-800"><Activity className="w-5 h-5 mr-2 text-teal-600" /> Odontograma de Ingreso</h2>
                                  <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto"></div>
                                </div>
                                <RealisticOdontogram data={activePatient.odontogram_initial || {}} onSave={handleSaveOdontogramInitial} />
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Avance</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button onClick={handleStartNewProgress} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Nuevo Avance</button>
                                    </div>
                                </div>

                                {!isCreatingProgress && (
                                    <div className="grid gap-4">
                                        {(!activePatient.progress_records || activePatient.progress_records.length === 0) ? (
                                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 dark:text-white font-medium">No hay avances registrados.</p>
                                            </div>
                                        ) : (
                                            activePatient.progress_records.map(record => (
                                                <div
                                                    key={record.id}
                                                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0"
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
                                                    <div className="flex items-start gap-4 w-full md:w-auto">
                                                        <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg text-teal-700 dark:text-white font-bold text-center min-w-[80px] flex-shrink-0">
                                                            <div className="text-xs uppercase tracking-wider mb-1">FECHA</div>
                                                            <div className="text-lg">{record.date}</div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-slate-800 dark:text-white mb-1 truncate">{record.title || 'Registro de Avance'}</h4>
                                                            <p className="text-slate-600 dark:text-white text-sm line-clamp-2 break-words">{record.notes || 'Sin notas adicionales.'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProgress(record.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        <ChevronRight className="text-slate-300" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {isCreatingProgress && selectedProgress && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                          <button className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm" onClick={() => { setIsCreatingProgress(false); setSelectedProgress(null); }}>Atrás</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-12">
                                                <label className="block text-xs font-bold text-slate-500 dark:text-white mb-1 uppercase">Título</label>
                                                <input type="text" placeholder="Ej: Control de caries, resinas, extracciones" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.title} onChange={(e) => setProgressForm({...progressForm, title: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-white mb-1 uppercase">Fecha del avance</label>
                                                    <input type="date" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.date} onChange={(e) => setProgressForm({...progressForm, date: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-white mb-1 uppercase">Adjuntar fotos/TAC/Placas</label>
                                                    <button onClick={handleAddAttachmentToProgress} className="w-full p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm transition-colors"><Camera className="w-4 h-4 mr-2"/> Agregar Foto</button>
                                                </div>
                                                <div className="md:col-span-12">
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-white mb-1 uppercase">Notas Clínicas</label>
                                                    <input type="text" placeholder="Describa el estado o cambios realizados..." className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={progressForm.notes} onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})} />
                                                </div>
                                            </div>
                                            <input ref={progressFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleProgressFilesSelected} />
                                            {progressForm.attachments && progressForm.attachments.length > 0 && (
                                                <div className="md:col-span-12 mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <h4 className="text-xs font-bold text-slate-500 dark:text-white uppercase mb-2">Fotos adjuntas a este avance:</h4>
                                                    <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
                                                        {progressForm.attachments.map((att) => (
                                                            <div key={att.id} className="relative aspect-square bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 overflow-hidden">
                                                                {att.url ? <img src={att.url} alt={att.name} className="w-full h-full object-cover" /> : <FileImage className="absolute inset-0 m-auto w-8 h-8 text-slate-400" />}
                                                                <button onClick={() => handleRemoveProgressAttachment(att.id)} className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 text-red-600 rounded-full p-1 border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="md:col-span-12 flex items-center gap-2">
                                                <button onClick={() => handleSaveProgress(progressOdontogram)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Guardar Avance</button>
                                                {selectedProgress?.id !== 'new' && (
                                                  <button onClick={() => handleDeleteProgress(selectedProgress.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm font-bold">Eliminar Avance</button>
                                                )}
                                            </div>
                                            <div className="md:col-span-12 min-w-0">
                                            <RealisticOdontogram key={selectedProgress.id} data={selectedProgress.odontogramData} onSave={(data) => handleSaveProgress(data)} onChange={(d) => setProgressOdontogram(d)} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'attachments' && (
                            <div className="w-full mx-auto animate-in fade-in duration-300">
                                <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b pb-4 dark:border-slate-700">Galería de Anexos</h2>
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-700 dark:text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-teal-600"/> Historial previo</h3>
                                    </div>
                                    {(() => {
                                      const prev = (activePatient.general_attachments || []).filter(att => att.origin === 'initial');
                                      if (!prev.length) {
                                        return (
                                          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-800">
                                            <p className="text-slate-400 dark:text-white text-sm">Sin fotos previas vinculadas.</p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          {prev.map((att, i) => (
                                            <div key={i} className="aspect-square bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setImagePreview(att)}>
                                                {att.url ? <img src={att.url} alt={att.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-slate-300" />}
                                              </div>
                                              <button onClick={() => handleRemoveGeneralAttachment(att.id)} className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 text-red-600 rounded-full p-1 border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <X className="w-3 h-3" />
                                              </button>
                                              <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 p-2 text-xs text-center truncate border-t border-slate-100 dark:border-slate-700 dark:text-white">{att.name}</div>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                </div>
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-700 dark:text-white flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-teal-600"/> Placas y Fotos Generales</h3>
                                        <button onClick={handleAddGeneralAttachment} className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 flex items-center transition-colors"><Upload className="w-4 h-4 mr-2"/> Subir Archivo</button>
                                    </div>
                                    <input ref={generalFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGeneralFilesSelected} />
                                    {(() => {
                                      const general = (activePatient.general_attachments || []).filter(att => att.origin !== 'initial');
                                      if (!general.length) {
                                        return (
                                          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-800">
                                            <p className="text-slate-400 dark:text-white text-sm">No hay anexos generales cargados.</p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          {general.map((att, i) => (
                                            <div key={i} className="aspect-square bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setImagePreview(att)}>
                                                {att.url ? <img src={att.url} alt={att.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-slate-300" />}
                                              </div>
                                              <button onClick={() => handleRemoveGeneralAttachment(att.id)} className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 text-red-600 rounded-full p-1 border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <X className="w-3 h-3" />
                                              </button>
                                              <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 p-2 text-xs text-center truncate border-t border-slate-100 dark:border-slate-700 dark:text-white">{att.name}</div>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 flex items-center mb-4"><History className="w-5 h-5 mr-2 text-teal-600"/> Historial de Fotos por Avance</h3>
                                    {(!activePatient.progress_records || activePatient.progress_records.every(r => !r.attachments || r.attachments.length === 0)) ? (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-800">
                                            <p className="text-slate-400 dark:text-white text-sm">No hay fotos vinculadas a los avances clínicos.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {activePatient.progress_records.filter(r => r.attachments && r.attachments.length > 0).map((record) => (
                                                <div key={record.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                                    <div className="flex items-center mb-3 pb-2 border-b border-slate-100">
                                                        <div className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white text-xs font-bold px-2 py-1 rounded mr-2">{record.date}</div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Anexos Avance: {record.title || 'Sin Título'}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        {record.attachments.map((att, idx) => (
                                                            <div key={idx} className="aspect-square bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setImagePreview(att)}>
                                                                    {att.url ? (
                                                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <ImageIcon className="w-10 h-10 text-slate-300" />
                                                                    )}
                                                                </div>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 p-2 text-xs text-center truncate border-t border-slate-100 dark:border-slate-700 dark:text-white">{att.name}</div>
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
      
      {view==='dashboard' && (
        <>
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
    </MainLayout>
  );
}
