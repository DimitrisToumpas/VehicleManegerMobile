import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  ArrowLeft, Truck, Trash2, AlertCircle, CheckCircle, Gauge,
  Tag, Layers, Calendar, ChevronLeft, ChevronRight, Edit3, Save, X, ChevronDown,
  Wrench, Plus
} from 'lucide-react';

const MARKES = ['Mercedes-Benz', 'MAN', 'Iveco', 'Oshkosh', 'Liebherr', 'Caterpillar', 'Άλλο'];
const CATEGORIES = [
  'Πολιτικά', 'Ρυμουλκά', 'Ανατρεπόμενα', 'Πυροσβεστικά',
  'Steyr', 'Καναδέζα GDT290', 'Καναδέζα GD290', 'JEEP', 'URAL',
  'M100', 'M104', 'TRAILOR Βαρκών', 'Λεωφορείο', 'Άλλο',
];
const STATUSES = ['Με ζημιά', 'Χωρίς ζημιά'];

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-slate-800 text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
        <Truck size={64} className="text-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden group">
        <img
          src={images[activeIndex].image_url}
          alt=""
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActiveIndex(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-white w-4' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddServiceModal({ vehicleId, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: '',
    service_date: '',
    service_kilometers: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const SERVICE_TYPES = [
    'Λάδι', 'Φίλτρα', 'Ελαστικά', 'Φρένα', 'Μπαταρία', 'Ψύξη', 'Συντήρηση Γενική', 'Άλλο'
  ];

  async function handleSave() {
    if (!form.description.trim()) {
      setError('Επιλέξτε τύπο συντήρησης');
      return;
    }
    if (!form.service_date && !form.service_kilometers) {
      setError('Καθορίστε τουλάχιστον ημερομηνία ή χιλιόμετρα');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('vehicle_services').insert({
      vehicle_id: vehicleId,
      description: form.description,
      service_date: form.service_date || null,
      service_kilometers: form.service_kilometers ? parseInt(form.service_kilometers.replace(/\./g, ''), 10) : null,
      notes: form.notes,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Προσθήκη Συντήρησης</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Τύπος *</label>
            <div className="relative">
              <select
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="form-select appearance-none pr-8"
              >
                <option value="">Επιλογή τύπου</option>
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Ημερομηνία</label>
            <input
              type="date"
              value={form.service_date}
              onChange={e => setForm({...form, service_date: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Χιλιόμετρα</label>
            <input
              type="text"
              value={form.service_kilometers}
              onChange={e => setForm({...form, service_kilometers: e.target.value})}
              placeholder="π.χ. 150000"
              className="form-input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Σημειώσεις</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
              rows={2}
              className="form-input resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>Ακύρωση</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={15} />Αποθήκευση</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState({
    plate_number: vehicle.plate_number,
    name: vehicle.name,
    marka: vehicle.marka || '',
    category: vehicle.category || '',
    kilometers: vehicle.kilometers?.toString() || '',
    status: vehicle.status || '',
    description: vehicle.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.plate_number.trim() || !form.name.trim()) {
      setError('Πινακίδα και Όνομα είναι υποχρεωτικά');
      return;
    }
    const km = form.kilometers ? parseInt(form.kilometers.replace(/\./g, ''), 10) : 0;
    if (form.kilometers && isNaN(km)) {
      setError('Τα χιλιόμετρα πρέπει να είναι αριθμός');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from('vehicles')
      .update({
        plate_number: form.plate_number.trim().toUpperCase(),
        name: form.name.trim(),
        marka: form.marka,
        category: form.category,
        kilometers: km,
        status: form.status,
        description: form.description.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicle.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Επεξεργασία Οχήματος</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Πινακίδα *</label>
              <input value={form.plate_number} onChange={e => setField('plate_number', e.target.value)} className="form-input font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Όνομα *</label>
              <input value={form.name} onChange={e => setField('name', e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Μάρκα</label>
              <div className="relative">
                <select value={form.marka} onChange={e => setField('marka', e.target.value)} className="form-select appearance-none pr-8">
                  <option value="">—</option>
                  {MARKES.map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Κατηγορία</label>
              <div className="relative">
                <select value={form.category} onChange={e => setField('category', e.target.value)} className="form-select appearance-none pr-8">
                  <option value="">—</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Χιλιόμετρα</label>
              <input value={form.kilometers} onChange={e => setField('kilometers', e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Κατάσταση</label>
              <div className="relative">
                <select value={form.status} onChange={e => setField('status', e.target.value)} className="form-select appearance-none pr-8">
                  <option value="">—</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">Περιγραφή</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} className="form-input resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>Ακύρωση</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={15} />Αποθήκευση</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetail({ vehicleId, onBack, onDeleted }) {
  const [vehicle, setVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicle();
    fetchServices();
  }, [vehicleId]);

  async function fetchVehicle() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*)')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error) setError(error.message);
    else setVehicle(data);
    setLoading(false);
  }

  async function fetchServices() {
    const { data } = await supabase
      .from('vehicle_services')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: true });
    setServices(data || []);
  }

  async function handleDelete() {
    setDeleting(true);
    if (vehicle.vehicle_images?.length > 0) {
      const paths = vehicle.vehicle_images.map(i => i.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('vehicle-images').remove(paths);
      }
    }
    await supabase.from('vehicles').delete().eq('id', vehicleId);
    setDeleting(false);
    onDeleted();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="card p-10 text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-medium">Το όχημα δεν βρέθηκε</p>
        <button onClick={onBack} className="btn-secondary mt-4 mx-auto">
          <ArrowLeft size={16} />Επιστροφή
        </button>
      </div>
    );
  }

  const formattedDate = new Date(vehicle.created_at).toLocaleDateString('el-GR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const images = vehicle.vehicle_images || [];
  const sortedImages = [...images].sort((a, b) => b.is_default_photo - a.is_default_photo);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} />
          Πίσω στη λίστα
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEdit(true)} className="btn-secondary">
            <Edit3 size={15} />
            Επεξεργασία
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
            <Trash2 size={15} />
            Διαγραφή
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card overflow-hidden">
            <ImageGallery images={sortedImages} />
          </div>
          {vehicle.description && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Περιγραφή</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{vehicle.description}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-900">{vehicle.name}</h1>
              <p className="text-slate-400 font-mono text-sm mt-0.5">{vehicle.plate_number}</p>
            </div>
            {vehicle.status && (
              <div className="mb-4">
                {vehicle.status === 'Με ζημιά' ? (
                  <span className="status-badge-damaged text-sm px-3 py-1">
                    <AlertCircle size={14} />
                    {vehicle.status}
                  </span>
                ) : (
                  <span className="status-badge-good text-sm px-3 py-1">
                    <CheckCircle size={14} />
                    {vehicle.status}
                  </span>
                )}
              </div>
            )}
            <div className="divide-y divide-slate-100">
              <InfoRow icon={Tag} label="Μάρκα" value={vehicle.marka} />
              <InfoRow icon={Layers} label="Κατηγορία" value={vehicle.category} />
              <InfoRow
                icon={Gauge}
                label="Χιλιόμετρα"
                value={vehicle.kilometers > 0 ? `${vehicle.kilometers.toLocaleString('el-GR')} km` : null}
              />
              <InfoRow icon={Calendar} label="Καταχώρηση" value={formattedDate} />
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs text-slate-400 font-medium mb-2">
              {sortedImages.length} φωτογραφία(ες)
            </p>
            {sortedImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {sortedImages.map((img, i) => (
                  <div key={i} className="aspect-square rounded-md overflow-hidden bg-slate-100">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Δεν υπάρχουν φωτογραφίες</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Wrench size={18} />
          Ιστορικό Συντήρησης
        </h2>
        {services.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Δεν υπάρχουν καταχωρημένες συντηρήσεις</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {services.map(service => (
              <div key={service.id} className={`py-3 ${!service.completed ? 'bg-yellow-50 px-3 rounded mb-2' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{service.description}</p>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                      {service.service_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(service.service_date).toLocaleDateString('el-GR')}
                        </span>
                      )}
                      {service.service_kilometers && (
                        <span className="flex items-center gap-1">
                          <Gauge size={12} />
                          {service.service_kilometers.toLocaleString('el-GR')} km
                        </span>
                      )}
                    </div>
                    {service.notes && <p className="text-xs text-slate-600 mt-1 italic">{service.notes}</p>}
                  </div>
                  {service.completed ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      Ολοκληρώθηκε
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Εκκρεμής</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddService(true)}
          className="btn-secondary mt-4 w-full justify-center"
        >
          <Plus size={16} />
          Προσθήκη Συντήρησης
        </button>
      </div>

      {showAddService && (
        <AddServiceModal
          vehicleId={vehicleId}
          onClose={() => setShowAddService(false)}
          onSaved={() => { fetchServices(); setShowAddService(false); }}
        />
      )}

      {showEdit && (
        <EditModal
          vehicle={vehicle}
          onClose={() => setShowEdit(false)}
          onSaved={fetchVehicle}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Διαγραφή Οχήματος;</h3>
              <p className="text-slate-500 text-sm mt-1">
                Το όχημα <strong>{vehicle.name}</strong> ({vehicle.plate_number}) θα διαγραφεί μόνιμα μαζί με όλες τις φωτογραφίες.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1" disabled={deleting}>
                Ακύρωση
              </button>
              <button onClick={handleDelete} className="btn-danger flex-1" disabled={deleting}>
                {deleting ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto" /> : 'Διαγραφή'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
