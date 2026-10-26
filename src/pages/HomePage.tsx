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

/** Même vitrine que sur https://hopitalgeneraldeyaounde.cm/espace-personnel. */
const ESPACE_PERSONNEL_URL = 'https://hopitalgeneraldeyaounde.cm/espace-personnel';

/**
 * Les services annoncés sur la vitrine. Ceux qui ont déjà leur écran dans le
 * portail pointent dessus ; les autres restent affichés avec « Bientôt », pour
 * que l'employé ne cherche pas une fonction qu'on ne lui a pas annoncée.
 */
const portalServices = [
  { id: 'fiches-de-paie', icon: '💰', label: 'Fiches de paie', desc: 'Consulte et télécharge tes bulletins de salaire' },
  { id: 'conges-absences', icon: '🏖️', label: 'Congés & Absences', desc: 'Demande et suis tes congés en ligne', to: '/leaves' },
  { id: 'dossier-administratif', icon: '📋', label: 'Dossier administratif', desc: 'Accède à ton dossier personnel complet', to: '/profile' },
  { id: 'formation-continue', icon: '🎓', label: 'Formation continue', desc: 'Inscris-toi aux formations disponibles' },
  { id: 'evaluations', icon: '📊', label: 'Évaluations', desc: 'Consulte tes évaluations de performance' },
  { id: 'informations-rh', icon: '📢', label: 'Informations RH', desc: 'Reste informé des actualités du personnel' },
];

/** Chaque carte renvoie sur son ancre dans la page vitrine. */
const publications = [
  { id: 'reglement-interieur', icon: '📜', label: 'Règlement intérieur', desc: 'Code de conduite, discipline et règles de fonctionnement' },
  { id: 'convention-collective', icon: '🤝', label: 'Convention collective', desc: 'Droits, obligations et conditions de travail du personnel' },
  { id: 'nouvelles-reformes', icon: '🔄', label: 'Nouvelles réformes', desc: 'Dernières réformes et mises à jour réglementaires' },
  { id: 'personnel-en-retraite', icon: '👴', label: 'Personnel en retraite', desc: 'Informations et droits pour le personnel retraité' },
  { id: 'circulaires-notes', icon: '📋', label: 'Circulaires & Notes', desc: 'Communications officielles de la Direction Générale' },
  { id: 'formations-stages', icon: '🎓', label: 'Formations & Stages', desc: 'Opportunités de développement professionnel' },
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

      <h2 className="text-base font-bold text-gray-900 mt-8 mb-1">Votre espace RH</h2>
      <p className="text-xs text-gray-500 mb-3">Un portail complet, sécurisé et disponible 24h/24</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {portalServices.map((service) =>
          service.to ? (
            <Link
              key={service.id}
              to={service.to}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition hover:border-[#1e3a5f]/30 hover:shadow active:scale-[0.98]"
            >
              <span className="text-xl block" aria-hidden>{service.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{service.label}</span>
              <span className="text-xs text-gray-500 block mt-1 leading-snug">{service.desc}</span>
            </Link>
          ) : (
            <div
              key={service.id}
              className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4"
              aria-disabled="true"
              title="Pas encore disponible sur le web"
            >
              <span className="text-xl block opacity-40" aria-hidden>{service.icon}</span>
              <span className="text-sm font-semibold text-gray-400">{service.label}</span>
              <span className="text-xs text-gray-400 block mt-1 leading-snug">{service.desc}</span>
              <span className="mt-2 inline-block text-[10px] uppercase tracking-wide text-gray-400 bg-gray-200/70 rounded-full px-2 py-0.5">
                Bientôt
              </span>
            </div>
          )
        )}
      </div>

      <h2 className="text-base font-bold text-gray-900 mt-8 mb-1">📚 Publications & Documents officiels</h2>
      <p className="text-xs text-gray-500 mb-3">
        Règlements, conventions, circulaires et informations importantes pour le personnel
      </p>

      <div className="grid gap-2">
        {publications.map((doc) => (
          <a
            key={doc.id}
            href={`${ESPACE_PERSONNEL_URL}#${doc.id}`}
            target="_blank"
            rel="noreferrer"
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3 transition hover:border-[#1e3a5f]/30 hover:shadow"
          >
            <span className="text-xl shrink-0" aria-hidden>{doc.icon}</span>
            <span className="min-w-0">
              <span className="text-sm font-semibold text-gray-800 block">{doc.label}</span>
              <span className="text-xs text-gray-500 block leading-snug">{doc.desc}</span>
            </span>
            <span className="ml-auto self-center text-gray-300 text-sm shrink-0" aria-hidden>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
