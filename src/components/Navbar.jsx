import { Truck, Plus, List, Wrench } from 'lucide-react';

export default function Navbar({ currentView, onNavigate }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('list')}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <span className="text-white font-semibold text-base leading-tight block">
                KiniseosManager
              </span>
              <span className="text-slate-400 text-xs">Διαχείριση Οχημάτων</span>
            </div>
          </button>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('list')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'list'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <List size={16} />
              <span className="hidden sm:inline">Λίστα</span>
            </button>
            <button
              onClick={() => onNavigate('services')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'services'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench size={16} />
              <span className="hidden sm:inline">Συντήρηση</span>
            </button>
            <button
              onClick={() => onNavigate('add')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'add'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Νέο Όχημα</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
