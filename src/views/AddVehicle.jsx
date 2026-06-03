import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { ArrowLeft, Upload, X, Save, ImagePlus, AlertCircle, ChevronDown } from 'lucide-react';

const MARKES = ['Mercedes-Benz', 'MAN', 'Iveco', 'Oshkosh', 'Liebherr', 'Caterpillar', 'Άλλο'];
const CATEGORIES = [
  'Πολιτικά', 'Ρυμουλκά', 'Ανατρεπόμενα', 'Πυροσβεστικά',
  'Steyr', 'Καναδέζα GDT290', 'Καναδέζα GD290', 'JEEP', 'URAL',
  'M100', 'M104', 'TRAILOR Βαρκών', 'Λεωφορείο', 'Άλλο',
];
const STATUSES = ['Με ζημιά', 'Χωρίς ζημιά'];

function FormField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ label, required, value, onChange, placeholder, options, error }) {
  return (
    <FormField label={label} required={required} error={error}>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`form-select appearance-none pr-9 ${!value ? 'text-slate-400' : 'text-slate-800'} ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </FormField>
  );
}

export default function AddVehicle({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    plate_number: '',
    name: '',
    marka: '',
    category: '',
    kilometers: '',
    status: '',
    description: '',
    next_service_date: '',
    next_service_kilometers: '',
  });
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.plate_number.trim()) errs.plate_number = 'Απαιτείται πινακίδα';
    if (!form.name.trim()) errs.name = 'Απαιτείται όνομα';
    if (form.kilometers && isNaN(Number(form.kilometers.replace(/\./g, '')))) {
      errs.kilometers = 'Τα χιλιόμετρα πρέπει να είναι αριθμός';
    }
    return errs;
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }

  function removeImage(index) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadImage(file, vehicleId, index) {
    const ext = file.name.split('.').pop();
    const path = `${vehicleId}/${Date.now()}_${index}.${ext}`;
    const { error } = await supabase.storage
      .from('vehicle-images')
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('vehicle-images').getPublicUrl(path);
    return { url: publicUrlData.publicUrl, path };
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const km = form.kilometers ? parseInt(form.kilometers.replace(/\./g, ''), 10) : 0;

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          plate_number: form.plate_number.trim().toUpperCase(),
          name: form.name.trim(),
          marka: form.marka,
          category: form.category,
          kilometers: km,
          status: form.status,
          description: form.description.trim(),
          next_service_date: form.next_service_date || null,
          next_service_kilometers: form.next_service_kilometers ? parseInt(form.next_service_kilometers.replace(/\./g, ''), 10) : null,
        })
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map((file, i) => uploadImage(file, vehicle.id, i))
        );
        const imageRows = uploads.map((u, i) => ({
          vehicle_id: vehicle.id,
          image_url: u.url,
          storage_path: u.path,
          is_default_photo: i === 0,
        }));
        const { error: imgError } = await supabase.from('vehicle_images').insert(imageRows);
        if (imgError) throw imgError;
      }

      onSaved();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="btn-secondary">
          <ArrowLeft size={16} />
          Πίσω
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Νέο Όχημα</h1>
          <p className="text-slate-500 text-sm mt-0.5">Συμπληρώστε τα στοιχεία του οχήματος</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">
          Βασικά Στοιχεία
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Πινακίδα" required error={errors.plate_number}>
            <input
              type="text"
              value={form.plate_number}
              onChange={e => setField('plate_number', e.target.value)}
              placeholder="π.χ. ΑΑΑ-1234"
              className={`form-input font-mono uppercase ${errors.plate_number ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </FormField>

          <FormField label="Όνομα Οχήματος" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="π.χ. Βυτιοφόρο 1"
              className={`form-input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Μάρκα"
            value={form.marka}
            onChange={v => setField('marka', v)}
            placeholder="Επιλογή μάρκας"
            options={MARKES}
          />
          <SelectField
            label="Κατηγορία"
            value={form.category}
            onChange={v => setField('category', v)}
            placeholder="Επιλογή κατηγορίας"
            options={CATEGORIES}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Χιλιόμετρα" error={errors.kilometers}>
            <input
              type="text"
              value={form.kilometers}
              onChange={e => setField('kilometers', e.target.value)}
              placeholder="π.χ. 125000"
              className={`form-input ${errors.kilometers ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
          </FormField>

          <SelectField
            label="Κατάσταση"
            value={form.status}
            onChange={v => setField('status', v)}
            placeholder="Επιλογή κατάστασης"
            options={STATUSES}
          />
        </div>

        <FormField label="Περιγραφή">
          <textarea
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Σημειώσεις, λεπτομέρειες ζημιών, κτλ."
            rows={4}
            className="form-input resize-none"
          />
        </FormField>

        <h2 className="text-base font-semibold text-slate-800 pt-4 pb-2 border-t border-slate-100 mt-6">
          Επόμενη Συντήρηση
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ημερομηνία Συντήρησης">
            <input
              type="date"
              value={form.next_service_date}
              onChange={e => setField('next_service_date', e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="Χιλιόμετρα Συντήρησης">
            <input
              type="text"
              value={form.next_service_kilometers}
              onChange={e => setField('next_service_kilometers', e.target.value)}
              placeholder="π.χ. 150000"
              className="form-input"
            />
          </FormField>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">
          Φωτογραφίες
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {imagePreviews.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <ImagePlus size={36} className="mx-auto text-slate-300 group-hover:text-blue-400 mb-3 transition-colors" />
            <p className="text-slate-500 text-sm font-medium">Κλικ για επιλογή φωτογραφιών</p>
            <p className="text-slate-400 text-xs mt-1">PNG, JPG, WEBP — πολλαπλές επιλογές</p>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5 font-medium">
                      Κύρια
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <Upload size={20} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>
            <p className="text-slate-400 text-xs">{imagePreviews.length} φωτογραφία(ες) — η πρώτη ορίζεται ως κύρια</p>
          </div>
        )}
      </div>

      {errors.submit && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-3 pb-8">
        <button onClick={onCancel} className="btn-secondary" disabled={saving}>
          Ακύρωση
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[120px]">
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Save size={16} />
              Αποθήκευση
            </>
          )}
        </button>
      </div>
    </div>
  );
}
