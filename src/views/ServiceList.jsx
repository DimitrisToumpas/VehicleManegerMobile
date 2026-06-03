import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  ArrowLeft, Calendar, Gauge, AlertTriangle, CheckCircle, Clock,
  ChevronDown, Filter, Search
} from 'lucide-react';

const SERVICE_TYPES = [
  'Λάδι',
  'Φίλτρα',
  'Ελαστικά',
  'Φρένα',
  'Μπαταρία',
  'Ψύξη',
  'Συντήρηση Γενική',
  'Άλλο'
];

function ServiceStatus({ completed, completedAt }) {
  if (completed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle size={12} />
        Ολοκληρώθηκε
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock size={12} />
      Εκκρεμής
    </span>
  );
}

function ServiceRow({ service, vehicle, onEdit, onComplete }) {
  const daysUntilDue = service.service_date
    ? Math.ceil((new Date(service.service_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const kmUntilDue = service.service_kilometers && vehicle.kilometers
    ? service.service_kilometers - vehicle.kilometers
    : null;

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !service.completed;
  const isUrgent = (daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0) ||
                   (kmUntilDue !== null && kmUntilDue <= 5000 && kmUntilDue > 0) && !service.completed;

  return (
    <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50' : isUrgent ? 'bg-yellow-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{vehicle.name}</div>
        <div className="text-xs text-slate-500 font-mono">{vehicle.plate_number}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-700">{service.description}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 text-sm">
          {service.service_date && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              {new Date(service.service_date).toLocaleDateString('el-GR')}
            </div>
          )}
          {service.service_kilometers && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Gauge size={14} className="text-slate-400" />
              {service.service_kilometers.toLocaleString('el-GR')} km
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {isOverdue && !service.completed && (
          <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium">
            <AlertTriangle size={14} />
            Καθυστερημένη
          </div>
        )}
        {isUrgent && !service.completed && (
          <div className="flex items-center gap-1.5 text-yellow-700 text-xs font-medium">
            <AlertTriangle size={14} />
            {daysUntilDue !== null && daysUntilDue > 0 && `Σε ${daysUntilDue} μέρες`}
            {kmUntilDue !== null && kmUntilDue > 0 && `Σε ${(kmUntilDue / 1000).toFixed(0)}K km`}
          </div>
        )}
        {!isOverdue && !isUrgent && (
          <div className="text-slate-500 text-xs">
            {daysUntilDue !== null && `Σε ${daysUntilDue} μέρες`}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <ServiceStatus completed={service.completed} completedAt={service.completed_at} />
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        {!service.completed && (
          <button
            onClick={() => onComplete(service.id)}
            className="text-xs px-2.5 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors inline-block"
          >
            Ολοκλήρωση
          </button>
        )}
        <button
          onClick={() => onEdit(service.id)}
          className="text-xs px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors inline-block"
        >
          Επεξεργασία
        </button>
      </td>
    </tr>
  );
}

export default function ServiceList({ onBack }) {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, name, plate_number, kilometers');
    const vehicleMap = {};
    vehiclesData?.forEach(v => vehicleMap[v.id] = v);
    setVehicles(vehicleMap);

    const { data: servicesData } = await supabase
      .from('vehicle_services')
      .select('*')
      .order('service_date', { ascending: true });
    setServices(servicesData || []);
    setLoading(false);
  }

  async function handleComplete(serviceId) {
    const service = services.find(s => s.id === serviceId);
    const vehicle = vehicles[service.vehicle_id];
    await supabase
      .from('vehicle_services')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_kilometers: vehicle.kilometers,
      })
      .eq('id', serviceId);
    fetchData();
  }

  const filtered = services.filter(s => {
    const vehicle = vehicles[s.vehicle_id];
    if (!vehicle) return false;

    const matchesSearch = !search ||
      vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());

    if (filter === 'pending') return !s.completed && matchesSearch;
    if (filter === 'completed') return s.completed && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} />
          Πίσω
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Συντήρηση Οχημάτων</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {services.filter(s => !s.completed).length} εκκρεμής
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Αναζήτηση οχήματος ή συντήρησης..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="form-select pr-8 py-2.5 appearance-none min-w-[150px]"
          >
            <option value="pending">Εκκρεμής</option>
            <option value="completed">Ολοκληρώθηκε</option>
            <option value="all">Όλες</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-700 font-semibold text-lg">
            {services.length === 0 ? 'Δεν υπάρχουν καταχωρημένες συντηρήσεις' : 'Δεν βρέθηκαν αποτελέσματα'}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {services.length === 0
              ? 'Προσθέστε συντήρηση κατά τη δημιουργία ή επεξεργασία οχήματος.'
              : 'Δοκιμάστε διαφορετικά κριτήρια αναζήτησης.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Όχημα</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Τύπος Συντήρησης</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Ημερομηνία / Χιλιόμετρα</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Κατάσταση</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Ενέργεια</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Επιλογές</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(service => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  vehicle={vehicles[service.vehicle_id]}
                  onEdit={() => {}}
                  onComplete={handleComplete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
