import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const quickLinks = [
  { to: '/profile', label: 'Ma carrière', icon: '🪪' },
  { to: '/dependents', label: 'Ayants droit', icon: '👨‍👩‍👧' },
  { to: '/diplomas', label: 'Diplômes', icon: '🎓' },
  { to: '/leaves', label: 'Congés', icon: '🏖️' },
  { to: '/census', label: 'Recensement', icon: '📋' },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Une photo dont le fichier a disparu renvoie une erreur : on retombe sur les initiales. */
function Avatar({ name, photo }: { name: string; photo: string | null }) {
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt=""
        onError={() => setFailed(true)}
        className="w-12 h-12 rounded-full object-cover shrink-0 bg-gray-100"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-semibold shrink-0">
      {initialsOf(name) || '?'}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const employee = user?.employee;
  const displayName = employee?.full_name || user?.name || '';

  const rows = [
    { label: 'Matricule', value: employee?.matricule },
    { label: 'Poste', value: employee?.job_title },
    { label: 'Département', value: employee?.department },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Bonjour,</p>
            <h1 className="text-xl font-bold text-[#1e3a5f] truncate">{displayName}</h1>
          </div>
          <Avatar name={displayName} photo={employee?.photo ?? null} />
        </div>

        <dl className="mt-4 divide-y divide-gray-100 rounded-xl bg-gray-50 px-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500 shrink-0">{row.label}</dt>
              <dd className={`text-sm font-semibold text-right ${row.value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                {row.value ?? 'Non renseigné'}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="text-base font-bold text-gray-900 mt-6 mb-3">Accès rapide</h2>

      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2 text-center transition hover:border-[#1e3a5f]/30 hover:shadow active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden>{item.icon}</span>
            <span className="text-sm font-semibold text-gray-800">{item.label}</span>
          </Link>
        ))}

        <div
          className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-5 flex flex-col items-center gap-1.5 text-center"
          aria-disabled="true"
          title="Pas encore disponible sur le web"
        >
          <span className="text-2xl opacity-40" aria-hidden>🗓️</span>
          <span className="text-sm font-semibold text-gray-400">Absences</span>
          <span className="text-[10px] uppercase tracking-wide text-gray-400 bg-gray-200/70 rounded-full px-2 py-0.5">
            Bientôt
          </span>
        </div>
      </div>
    </div>
  );
}
