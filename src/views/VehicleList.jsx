import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Search, Plus, Truck, Filter, ChevronDown, AlertCircle, CheckCircle, Gauge } from 'lucide-react';

const CATEGORIES = [
  'Όλες',
  'Πολιτικά',
  'Ρυμουλκά',
  'Ανατρεπόμενα',
  'Πυροσβεστικά',
  'Steyr',
  'Καναδέζα GDT290',
  'Καναδέζα GD290',
  'JEEP',
  'URAL',
  'M100',
  'M104',
  'TRAILOR Βαρκών',
  'Λεωφορείο',
  'Άλλο',
];

const STATUSES = ['Όλα', 'Με ζημιά', 'Χωρίς ζημιά'];

function StatusBadge({ status }) {
  if (!status) return null;
  if (status === 'Με ζημιά') {
    return (
      <span className="status-badge-damaged">
        <AlertCircle size={11} />
        {status}
      </span>
    );
  }
  return (
    <span className="status-badge-good">
      <CheckCircle size={11} />
      {status}
    </span>
  );
}

function VehicleCard({ vehicle, onClick }) {
  const defaultImage = vehicle.vehicle_images?.find(i => i.is_default_photo) || vehicle.vehicle_images?.[0];

  return (
    <button
      onClick={() => onClick(vehicle.id)}
      className="card text-left hover:shadow-md hover:border-blue-200 transition-all duration-200 group overflow-hidden flex flex-col"
    >
      <div className="relative bg-slate-100 aspect-video overflow-hidden">
        {defaultImage?.image_url ? (
          <img
            src={defaultImage.image_url}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Truck size={48} className="text-slate-300" />
          </div>
        )}
        {vehicle.status && (
          <div className="absolute top-2 right-2">
            <StatusBadge status={vehicle.status} />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">
            {vehicle.name}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">{vehicle.plate_number}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {vehicle.marka && (
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
              {vehicle.marka}
            </span>
          )}
          {vehicle.category && (
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
              {vehicle.category}
            </span>
          )}
        </div>
        {vehicle.kilometers > 0 && (
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
            <Gauge size={12} />
            {vehicle.kilometers.toLocaleString('el-GR')} km
          </div>
        )}
      </div>
    </button>
  );
}

export default function VehicleList({ onViewVehicle, onAddVehicle }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Όλες');
  const [statusFilter, setStatusFilter] = useState('Όλα');

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*)')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }

  const filtered = vehicles.filter(v => {
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
      v.marka?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'Όλες' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'Όλα' || v.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Οχήματα</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {vehicles.length} {vehicles.length === 1 ? 'όχημα' : 'οχήματα'} συνολικά
          </p>
        </div>
        <button onClick={onAddVehicle} className="btn-primary">
          <Plus size={18} />
          Νέο Όχημα
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Αναζήτηση (όνομα, πινακίδα, μάρκα...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="form-select pl-8 pr-8 py-2.5 min-w-[160px] appearance-none"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-select pr-8 py-2.5 min-w-[130px] appearance-none"
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-red-600 border-red-200">
          <AlertCircle size={24} className="mx-auto mb-2" />
          <p className="font-medium">Σφάλμα φόρτωσης</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button onClick={fetchVehicles} className="btn-secondary mt-4 mx-auto">
            Δοκιμή ξανά
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Truck size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-700 font-semibold text-lg">
            {vehicles.length === 0 ? 'Δεν υπάρχουν οχήματα' : 'Δεν βρέθηκαν αποτελέσματα'}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {vehicles.length === 0
              ? 'Προσθέστε το πρώτο όχημα για να ξεκινήσετε.'
              : 'Δοκιμάστε διαφορετικά κριτήρια αναζήτησης.'}
          </p>
          {vehicles.length === 0 && (
            <button onClick={onAddVehicle} className="btn-primary mt-5 mx-auto">
              <Plus size={16} />
              Προσθήκη Οχήματος
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onClick={onViewVehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
