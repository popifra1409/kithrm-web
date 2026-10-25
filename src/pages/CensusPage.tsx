import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCurrentCensus,
  submitCensus,
  buildInitialDraft,
} from '../api/census';
import type { CensusDraft, CensusCurrentResponse, CensusDraftDependent, CensusDraftDiploma } from '../api/census';
import { extractApiError, isNetworkError } from '../api/client';
import PhotoCaptureInput from '../components/PhotoCaptureInput';
import DateInput from '../components/DateInput';
import { isoToFr } from '../lib/dates';
import { computeCascade } from '../lib/organization';
import { clearCensusDraft, loadCensusDraft, saveCensusDraft } from '../lib/censusDraftStore';
import type { DraftStage } from '../lib/censusDraftStore';
import { useConnection } from '../lib/connection';
import { useAuth } from '../context/AuthContext';

const RELATIONSHIP_LABELS: Record<string, string> = {
  spouse: 'Conjoint(e)',
  child: 'Enfant',
  father: 'Père',
  mother: 'Mère',
};

const DIPLOMA_TYPE_LABELS: Record<string, string> = {
  recruitment_diploma: 'Diplôme de Recrutement',
  highest_diploma: 'Diplôme le Plus Élevé',
  training: 'Formation',
};

const EMPTY_DEPENDENT: CensusDraftDependent = {
  existing_id: null,
  relationship: 'child',
  first_name: '',
  last_name: '',
  birth_date: '',
  birth_place: '',
  gender: 'M',
  phone: '',
  email: '',
  address: '',
  removed: false,
  documents: {},
};

const EMPTY_DIPLOMA: CensusDraftDiploma = {
  existing_id: null,
  type: 'training',
  title: '',
  institution: '',
  year_obtained: '',
  removed: false,
  document: null,
};

/**
 * Un père ou une mère se justifie par l'acte de naissance DE L'EMPLOYÉ : la même
 * pièce couvre les deux parents, et un parent déjà au dossier en tient lieu pour
 * l'autre. Le serveur applique la même règle et tranche au final
 * (CensusController::submit) — le web ne fait que retirer une saisie inutile.
 */
const PARENT_RELATIONS = ['father', 'mother'];

/**
 * Une pièce de 0 octet (photo reprise trop tôt, PDF tronqué) est effacée par le
 * serveur comme si rien n'avait été joint : elle ne doit jamais compter comme fournie.
 */
function isAttached(file?: File | null): boolean {
  return !!file && file.size > 0;
}

/** L'ayant droit tel que l'employé le lit sur sa ligne, pour nommer la pièce manquante. */
function dependentWho(d: CensusDraftDependent): string {
  const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim();

  return name !== '' ? `${RELATIONSHIP_LABELS[d.relationship]} « ${name} »` : RELATIONSHIP_LABELS[d.relationship];
}

function hasFamilyAct(dependents: CensusDraftDependent[]): boolean {
  return dependents.some(
    (d) =>
      !d.removed &&
      PARENT_RELATIONS.includes(d.relationship) &&
      // Le serveur ne réutilise que l'acte réellement au dossier (birth_certificate_path),
      // signalé par has_birth_certificate. Une ligne existante sans pièce enregistrée ne
      // couvrirait rien : le prétendre valable ferait échouer la soumission plus loin.
      (isAttached(d.documents.birth_certificate) || !!d.has_birth_certificate),
  );
}

type Stage = DraftStage | 'review';

/**
 * Le formulaire complet tient sur une quinzaine d'écrans : il est découpé en étapes
 * thématiques, mais la navigation reste libre (aucun champ ne bloque « Continuer »)
 * pour que l'employé repasse où il veut sans être retenu.
 */
const FORM_STAGES: { key: Stage; label: string }[] = [
  { key: 'identity', label: 'Identité' },
  { key: 'pay', label: 'Solde & contrat' },
  { key: 'org', label: 'Affectation' },
  { key: 'family', label: 'Entourage' },
];

/**
 * À quelle étape se trouve chacun des champs que les RH peuvent renvoyer.
 * Les clés viennent du catalogue serveur (CensusSubmission::correctableFields()).
 */
const FIELD_STAGES: Record<string, DraftStage> = {
  matricule_fonction_publique: 'identity',
  last_name: 'identity',
  first_name: 'identity',
  gender: 'identity',
  birth_date: 'identity',
  marital_status: 'identity',
  id_card_number: 'identity',
  children_under_6: 'identity',
  total_children: 'identity',
  recruitment_date: 'identity',
  service_start_date: 'identity',
  phone: 'identity',
  email: 'identity',
  address: 'identity',
  city: 'identity',
  photo: 'identity',
  category_number: 'pay',
  echelon_number: 'pay',
  contract_number: 'pay',
  contract_document: 'pay',
  service_start_document: 'pay',
  bank_name: 'pay',
  bank_account_number: 'pay',
  cnps_number: 'pay',
  declared_branch_type: 'org',
  declared_direction_id: 'org',
  declared_department_id: 'org',
  declared_sub_direction_id: 'org',
  declared_service_id: 'org',
  declared_sector_id: 'org',
  declared_trade_body_id: 'org',
  declared_qualification_id: 'org',
  declared_job_title_id: 'org',
  declared_personnel_type: 'org',
  declared_administrative_status: 'org',
  dependents: 'family',
  diplomas: 'family',
};

/** Étape de la première correction demandée : c'est là que l'agent ouvre le formulaire. */
function firstFlaggedStage(fields: { key: string }[] | undefined): DraftStage | null {
  for (const field of fields ?? []) {
    const stage = FIELD_STAGES[field.key];
    if (stage) return stage;
  }
  return null;
}

const toOptions = (list: { id: number; name: string }[]) =>
  list.map((x) => ({ value: String(x.id), label: x.name }));

const nameOf = (list: { id: number; name: string }[] | undefined, id: string) =>
  (id && list?.find((x) => String(x.id) === id)?.name) || '';

export default function CensusPage() {
  const { online } = useConnection();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<CensusCurrentResponse | null>(null);
  const [draft, setDraft] = useState<CensusDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>('identity');
  const [stageBeforeReview, setStageBeforeReview] = useState<DraftStage>('identity');
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [draftSavedOffline, setDraftSavedOffline] = useState(false);
  const [bankAckFor, setBankAckFor] = useState<string | null>(null);

  // Brouillon tel que renvoyé par le serveur : sert à savoir si l'agent a vraiment modifié quelque chose.
  const pristineRef = useRef<CensusDraft | null>(null);

  const [editingDependentIndex, setEditingDependentIndex] = useState<number | null | 'new'>(null);
  const [editingDiplomaIndex, setEditingDiplomaIndex] = useState<number | null | 'new'>(null);

  useEffect(() => {
    load();
  }, []);

  // Le récapitulatif n'est jamais mémorisé : c'est l'étape d'où l'employé est parti
  // qu'il retrouvera s'il ferme l'onglet ou se déconnecte.
  const editStage: DraftStage = stage === 'review' ? stageBeforeReview : stage;

  /**
   * Copie immédiate du brouillon sur l'appareil, étape comprise : une déconnexion,
   * une coupure réseau ou un poste éteint ne doit faire perdre aucune saisie visible.
   */
  const persistDraft = useCallback(
    async (stageToSave: DraftStage) => {
      const campaign = current?.campaign;
      if (!campaign || !draft || !user) return;

      await saveCensusDraft({
        campaignId: campaign.id,
        campaignName: campaign.name,
        userId: user.id,
        stage: stageToSave,
        savedAt: new Date().toISOString(),
        draft,
      });
      setDraftSavedOffline(true);
    },
    [current?.campaign, draft, user]
  );

  // Toute modification est recopiée sur l'appareil (photos comprises) ; le court
  // délai sert uniquement à ne pas écrire à chaque frappe au clavier.
  useEffect(() => {
    if (stage === 'review' || !draft) return;
    if (JSON.stringify(draft) === JSON.stringify(pristineRef.current)) return;

    const timer = setTimeout(() => {
      void persistDraft(stage);
    }, 400);
    return () => clearTimeout(timer);
  }, [persistDraft, draft, stage]);

  // L'onglet est fermé en pleine saisie : la dernière écriture part aussitôt.
  useEffect(() => {
    const flush = () => void persistDraft(editStage);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [persistDraft, editStage]);

  async function load() {
    setIsLoading(true);
    setDraftSavedOffline(false);
    try {
      const data = await fetchCurrentCensus();
      setCurrent(data);
      if (!data.campaign) return;

      const fresh = buildInitialDraft(data);
      pristineRef.current = fresh;

      const stored = await loadCensusDraft();
      // Une correction demandée prime sur l'étape mémorisée : l'agent tombe direct
      // sur le premier champ que les RH lui reprochent.
      const flaggedStage = firstFlaggedStage(data.rejection_fields);

      // Un brouillon qui ne vient pas de cet employé ou de cette campagne n'est ni
      // affiché ni écrasé : son propriétaire le retrouvera à sa prochaine connexion.
      if (stored && stored.campaignId === data.campaign.id && stored.userId === user?.id) {
        const changed = JSON.stringify(stored.draft) !== JSON.stringify(fresh);
        setDraft(changed ? stored.draft : fresh);
        if (changed) setRestoredAt(stored.savedAt);
        setStage(flaggedStage ?? stored.stage);
      } else {
        setDraft(fresh);
        if (flaggedStage) setStage(flaggedStage);
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setDraftSavedOffline(Boolean(await loadCensusDraft()));
      } else {
        alert(extractApiError(error).message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const salaryClassification = current?.current_data?.salary_classification;

  // Champs renvoyés par les RH : surlignés et listés, mais jamais bloquants.
  const flaggedFields = useMemo(
    () => new Set((current?.rejection_fields ?? []).map((f) => f.key)),
    [current?.rejection_fields]
  );

  // Les étapes qui contiennent au moins une correction demandée, pour le repère rouge.
  const flaggedStages = useMemo(() => {
    const stages = new Set<DraftStage>();
    for (const field of current?.rejection_fields ?? []) {
      const stage = FIELD_STAGES[field.key];
      if (stage) stages.add(stage);
    }
    return stages;
  }, [current?.rejection_fields]);

  /**
   * Coordonnées bancaires/CNPS différentes de la fiche : le serveur refusera la
   * soumission tant que l'avertissement sur le virement du salaire n'a pas été acté.
   */
  const bankChanges = useMemo(() => {
    const recorded = current?.current_data?.personal;
    if (!draft || !recorded) return [];

    const candidates: { key: 'bank_name' | 'bank_account_number' | 'cnps_number'; label: string }[] = [
      { key: 'bank_name', label: 'nom de la banque' },
      { key: 'bank_account_number', label: 'numéro de compte' },
      { key: 'cnps_number', label: 'numéro CNPS' },
    ];

    return candidates.filter(({ key }) => {
      const submitted = draft.personal[key].trim();
      return submitted !== '' && submitted !== (recorded[key] ?? '').trim();
    });
  }, [draft?.personal.bank_name, draft?.personal.bank_account_number, draft?.personal.cnps_number, current?.current_data]);

  // La reconnaissance porte sur le jeu exact de champs modifiés : toute nouvelle
  // modification des coordonnées invalide l'accord précédent.
  const bankChangesSignature = bankChanges.map((c) => c.key).join(',');
  const bankChangeAck = bankAckFor === bankChangesSignature;

  const indicePreview = useMemo(() => {
    if (!salaryClassification || !draft) return null;
    const { category_number, echelon_number } = draft.personal;
    if (!category_number || !echelon_number) return null;

    const row = salaryClassification.grid_rows.find(
      (r) => r.category === category_number && r.echelon === echelon_number
    );
    return row?.indice ?? null;
  }, [salaryClassification, draft?.personal.category_number, draft?.personal.echelon_number]);

  const orgOptions = current?.current_data?.organization_options;

  // Listes filtrées de la cascade (voir lib/organization.ts)
  const cascade = useMemo(
    () => (orgOptions && draft ? computeCascade(orgOptions, draft.organizational) : null),
    [orgOptions, draft?.organizational]
  );

  function updatePersonal(field: keyof CensusDraft['personal'], value: string) {
    setDraft((d) => (d ? { ...d, personal: { ...d.personal, [field]: value } } : d));
  }

  function patchOrganizational(patch: Partial<CensusDraft['organizational']>) {
    setDraft((d) => (d ? { ...d, organizational: { ...d.organizational, ...patch } } : d));
  }

  function patchContract(patch: Partial<CensusDraft['contract']>) {
    setDraft((d) => (d ? { ...d, contract: { ...d.contract, ...patch } } : d));
  }

  // Chaque changement remet à vide les niveaux situés en dessous.
  const setBranch = (v: string) =>
    patchOrganizational({ branch_type: v, direction_id: '', department_id: '', sub_direction_id: '', service_id: '', sector_id: '' });
  const setDirection = (v: string) =>
    patchOrganizational({ direction_id: v, department_id: '', sub_direction_id: '', service_id: '', sector_id: '' });
  // Choisir un département remplit sa direction si elle est connue.
  const setDepartment = (v: string) => {
    const department = orgOptions?.departments.find((d) => String(d.id) === v);
    patchOrganizational({
      department_id: v,
      direction_id: department?.direction_id ? String(department.direction_id) : draft?.organizational.direction_id ?? '',
      service_id: '',
      sector_id: '',
    });
  };
  const setSubDirection = (v: string) => patchOrganizational({ sub_direction_id: v, service_id: '', sector_id: '' });
  const setService = (v: string) => patchOrganizational({ service_id: v, sector_id: '' });
  const setTradeBody = (v: string) => patchOrganizational({ trade_body_id: v, qualification_id: '' });

  function toggleRemoveDependent(index: number) {
    setDraft((d) =>
      d
        ? { ...d, dependents: d.dependents.map((dep, i) => (i === index ? { ...dep, removed: !dep.removed } : dep)) }
        : d
    );
  }

  function toggleRemoveDiploma(index: number) {
    setDraft((d) =>
      d ? { ...d, diplomas: d.diplomas.map((dip, i) => (i === index ? { ...dip, removed: !dip.removed } : dip)) } : d
    );
  }

  function saveDependent(item: CensusDraftDependent) {
    setDraft((d) => {
      if (!d) return d;
      if (editingDependentIndex === 'new') {
        return { ...d, dependents: [...d.dependents, item] };
      }
      return { ...d, dependents: d.dependents.map((dep, i) => (i === editingDependentIndex ? item : dep)) };
    });
    setEditingDependentIndex(null);
  }

  function saveDiploma(item: CensusDraftDiploma) {
    setDraft((d) => {
      if (!d) return d;
      if (editingDiplomaIndex === 'new') {
        return { ...d, diplomas: [...d.diplomas, item] };
      }
      return { ...d, diplomas: d.diplomas.map((dip, i) => (i === editingDiplomaIndex ? item : dip)) };
    });
    setEditingDiplomaIndex(null);
  }

  function handleGoToReview() {
    if (!draft) return;

    const activeDependents = draft.dependents.filter((d) => !d.removed);
    const activeDiplomas = draft.diplomas.filter((d) => !d.removed);
    const familyActAvailable = hasFamilyAct(activeDependents);

    const missingAct = activeDependents.find(
      (d) =>
        !d.existing_id &&
        !isAttached(d.documents.birth_certificate) &&
        !(PARENT_RELATIONS.includes(d.relationship) && familyActAvailable),
    );
    if (missingAct) {
      setStage('family');
      alert(
        PARENT_RELATIONS.includes(missingAct.relationship)
          ? `Pour déclarer ${dependentWho(missingAct)}, joins TON acte de naissance : c'est lui qui prouve la filiation. Une seule pièce suffit pour le père et la mère.`
          : `${dependentWho(missingAct)} : son acte de naissance n'est pas joint. Ouvre sa ligne et sélectionne le fichier — une pièce vide ou trop lourde est écartée par le serveur sans que le formulaire le sache.`,
      );
      return;
    }
    if (activeDiplomas.some((d) => !d.existing_id && !isAttached(d.document))) {
      alert('Un document justificatif est requis pour chaque nouveau diplôme.');
      return;
    }

    if (bankChanges.length > 0 && !bankChangeAck) {
      setStage('pay');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert(
        `Tu as modifié ${bankChanges.map((c) => c.label).join(', ')}. Coche la reconnaissance de l'avertissement dans la section « Informations Bancaires & CNPS » avant de vérifier et soumettre.`
      );
      return;
    }

    setStageBeforeReview(editStage);
    setStage('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Changement d'étape : la saisie en cours est d'abord écrite sur l'appareil, sans
   * attendre le minuteur. La navigation reste libre, aucun champ ne bloque.
   */
  async function goTo(next: Stage) {
    await persistDraft(next === 'review' ? editStage : next);

    if (next === 'review') {
      handleGoToReview();
      return;
    }
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmSubmit() {
    if (!current?.campaign || !draft) return;

    if (!online) {
      alert(
        'Connexion internet introuvable : rien ne peut être envoyé pour le moment. Ton brouillon est enregistré sur cet appareil, tu pourras soumettre dès que le réseau revient.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCensus(current.campaign.id, draft, bankChangeAck);
      await clearCensusDraft();
      pristineRef.current = null;
      setRestoredAt(null);
      setDraftSavedOffline(false);
      setBankAckFor(null);
      alert('Votre recensement a été soumis pour validation.');
      setStage('identity');
      load();
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function discardRestoredDraft() {
    await clearCensusDraft();
    setRestoredAt(null);
    setDraftSavedOffline(false);
    setStage('identity');
    if (pristineRef.current) setDraft(pristineRef.current);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!current?.campaign) {
    if (draftSavedOffline) {
      return (
        <div className="max-w-md mx-auto p-8 text-center">
          <p className="text-4xl mb-3">📶</p>
          <h1 className="text-lg font-bold text-[#1e3a5f]">Connexion internet nécessaire</h1>
          <p className="text-sm text-gray-600 mt-2">
            Impossible d'ouvrir la campagne de recensement sans réseau. Ton brouillon est
            enregistré sur cet appareil et rien n'est perdu.
          </p>
          <button
            onClick={load}
            className="mt-5 w-full bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return (
      <div className="p-10 text-center text-gray-500">
        <p className="text-4xl mb-3">📋</p>
        <p>{current?.message ?? "Aucune campagne de recensement n'est actuellement ouverte."}</p>
      </div>
    );
  }

  if (
    current.submission_status === 'submitted' ||
    current.submission_status === 'career_validated' ||
    current.submission_status === 'solde_validated'
  ) {
    return (
      <div className="p-10 text-center">
        <p className="text-4xl mb-3">⏳</p>
        <p className="font-bold text-gray-900">Recensement soumis</p>
        <p className="text-sm text-gray-500 mt-1">{current.stage_label}</p>
      </div>
    );
  }

  if (current.submission_status === 'validated') {
    return (
      <div className="p-10 text-center">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-bold text-gray-900">Recensement validé</p>
        <p className="text-sm text-gray-500 mt-1">Vos informations ont été mises à jour.</p>
      </div>
    );
  }

  if (!draft || !salaryClassification) return null;

  const wasRejected =
    current.submission_status === 'career_rejected' ||
    current.submission_status === 'solde_rejected' ||
    current.submission_status === 'rejected';

  // Annulé par les RH : rien n'est rejeté, les RH redonnent simplement la main.
  const wasCanceled = current.submission_status === 'canceled';

  const echelonOptions = draft.personal.category_number
    ? salaryClassification.echelon_options_by_category[draft.personal.category_number] ?? {}
    : {};

  if (stage === 'review') {
    const activeDependents = draft.dependents.filter((d) => !d.removed);
    const activeDiplomas = draft.diplomas.filter((d) => !d.removed);

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <h1 className="text-lg font-bold text-[#1e3a5f] mb-1">Récapitulatif</h1>
        <p className="text-sm text-gray-500 mb-4">
          Vérifiez attentivement vos informations avant de soumettre définitivement.
        </p>

        {draft.photo && (
          <div className="flex justify-center mb-4">
            <img src={URL.createObjectURL(draft.photo)} alt="" className="w-20 h-20 rounded-full object-cover border" />
          </div>
        )}

        <Section title="Informations Personnelles">
          <RecapRow label="Matricule Fonction Publique" value={draft.personal.matricule_fonction_publique.trim()} />
          <RecapRow label="Nom" value={draft.personal.last_name} />
          <RecapRow label="Prénom" value={draft.personal.first_name} />
          <RecapRow label="Sexe" value={draft.personal.gender} />
          <RecapRow label="Date de naissance" value={isoToFr(draft.personal.birth_date)} />
          <RecapRow label="Statut marital" value={draft.personal.marital_status} />
          <RecapRow label="Enfants < 6 ans" value={draft.personal.children_under_6} />
          <RecapRow label="Total enfants" value={draft.personal.total_children} />
          <RecapRow label="N° Carte d'identité" value={draft.personal.id_card_number} />
          <RecapRow label="Date de recrutement" value={isoToFr(draft.personal.recruitment_date)} />
          <RecapRow label="Date de prise de service" value={isoToFr(draft.personal.service_start_date)} />
          <RecapRow label="Téléphone" value={draft.personal.phone} />
          <RecapRow label="Email" value={draft.personal.email} />
          <RecapRow label="Adresse" value={draft.personal.address} />
          <RecapRow label="Ville" value={draft.personal.city} />
        </Section>

        <Section title="Classification Salariale">
          <RecapRow label="Catégorie" value={draft.personal.category_number} />
          <RecapRow label="Échelon" value={draft.personal.echelon_number} />
          <RecapRow label="Indice (calculé)" value={indicePreview != null ? String(indicePreview) : ''} />
        </Section>

        <Section title="Contrat de travail & prise de service">
          <RecapRow label="Numéro de contrat" value={draft.contract.contract_number.trim()} />
          <RecapRow label="Type de contrat" value={current.current_data?.contract.contract_type ?? ''} />
          <RecapRow label="Contrat joint" value={draft.contract.contract_document?.name ?? ''} />
          <RecapRow label="Prise de service jointe" value={draft.contract.service_start_document?.name ?? ''} />
        </Section>

        <Section title="Banque & CNPS">
          <RecapRow label="Banque" value={draft.personal.bank_name} />
          <RecapRow label="N° de compte" value={draft.personal.bank_account_number} />
          <RecapRow label="N° CNPS" value={draft.personal.cnps_number} />
          {bankChanges.length > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              ⚠️ Changement déclaré : {bankChanges.map((c) => c.label).join(', ')}. Avertissement sur le virement acté
              — une demande de modification des informations bancaires doit accompagner le dossier.
            </p>
          )}
        </Section>

        <Section title="Affectation Organisationnelle">
          <RecapRow label="Branche" value={draft.organizational.branch_type === 'administrative' ? 'Administrative' : 'Médicale'} />
          <RecapRow label="Direction" value={nameOf(orgOptions?.directions, draft.organizational.direction_id)} />
          {draft.organizational.branch_type === 'administrative' ? (
            <RecapRow label="Sous-direction" value={nameOf(orgOptions?.sub_directions, draft.organizational.sub_direction_id)} />
          ) : (
            <RecapRow label="Département" value={nameOf(orgOptions?.departments, draft.organizational.department_id)} />
          )}
          <RecapRow label="Service" value={nameOf(orgOptions?.services, draft.organizational.service_id)} />
          <RecapRow label="Secteur / Unité" value={nameOf(orgOptions?.sectors, draft.organizational.sector_id)} />
          <RecapRow label="Corps de métier" value={nameOf(orgOptions?.trade_bodies, draft.organizational.trade_body_id)} />
          <RecapRow label="Qualification" value={nameOf(orgOptions?.qualifications, draft.organizational.qualification_id)} />
          <RecapRow label="Poste hiérarchique" value={nameOf(orgOptions?.job_titles, draft.organizational.job_title_id)} />
          <RecapRow
            label="Type de personnel"
            value={orgOptions?.personnel_types.find((t) => t.value === draft.organizational.personnel_type)?.label ?? ''}
          />
          <RecapRow
            label="Statut administratif"
            value={orgOptions?.administrative_statuses.find((s) => s.value === draft.organizational.administrative_status)?.label ?? ''}
          />
        </Section>

        <Section title={`Ayants Droit (${activeDependents.length})`}>
          {activeDependents.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun.</p>
          ) : (
            <div className="space-y-2">
              {activeDependents.map((dep, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {dep.last_name} {dep.first_name} {dep.existing_id ? '' : '· nouveau'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {RELATIONSHIP_LABELS[dep.relationship]} · né(e) le {isoToFr(dep.birth_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Diplômes & Formations (${activeDiplomas.length})`}>
          {activeDiplomas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun.</p>
          ) : (
            <div className="space-y-2">
              {activeDiplomas.map((dip, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {dip.title} {dip.existing_id ? '' : '· nouveau'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {DIPLOMA_TYPE_LABELS[dip.type]} · {dip.institution} ({dip.year_obtained})
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => goTo(stageBeforeReview)}
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 rounded-lg py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            ← Retour pour corriger
          </button>
          <button
            onClick={handleConfirmSubmit}
            disabled={isSubmitting || !online}
            className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Envoi...' : online ? 'Confirmer et Soumettre' : 'Hors ligne — envoi impossible'}
          </button>
        </div>
        {!online && (
          <p className="text-xs text-red-600 text-center mt-2">
            Le réseau est revenu ? Le bouton se réactive tout seul. Ton brouillon reste sur cet appareil.
          </p>
        )}
        <p className="text-xs text-gray-400 text-center mt-3">
          ✏️ Ton brouillon est enregistré sur cet appareil à chaque modification : tu peux fermer la page
          ou perdre la connexion, rien n'est perdu.
        </p>
      </div>
    );
  }

  const stageIndex = FORM_STAGES.findIndex((s) => s.key === stage);
  const prevStage = stageIndex > 0 ? FORM_STAGES[stageIndex - 1].key : null;
  const nextStage = stageIndex < FORM_STAGES.length - 1 ? FORM_STAGES[stageIndex + 1] : null;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-lg font-bold text-[#1e3a5f]">{current.campaign.name}</h1>
      {current.campaign.description && <p className="text-sm text-gray-500 mt-1 mb-4">{current.campaign.description}</p>}

      {wasRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm text-red-800">❌ {current.stage_label}</p>
          {current.rejection_reason && <p className="text-sm text-red-700 mt-1">{current.rejection_reason}</p>}
          {(current.rejection_fields ?? []).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-red-700">Champs à corriger (clique pour y aller) :</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {current.rejection_fields!.map((field) => (
                  <li key={field.key}>
                    <button
                      type="button"
                      onClick={() => goTo(FIELD_STAGES[field.key] ?? 'identity')}
                      className="text-[11px] font-semibold text-red-700 bg-white border border-red-200 rounded-full px-2.5 py-1 hover:bg-red-100"
                    >
                      {field.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-red-600 mt-2 italic">
            Les champs concernés sont surlignés en rouge ci-dessous. Corrigez-les et resoumettez.
          </p>
        </div>
      )}

      {wasCanceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm text-amber-800">↩️ {current.stage_label ?? 'Recensement annulé par les RH'}</p>
          {current.cancellation_reason && <p className="text-sm text-amber-700 mt-1">{current.cancellation_reason}</p>}
          <p className="text-xs text-amber-600 mt-1 italic">Vérifiez vos informations ci-dessous et resoumettez.</p>
        </div>
      )}

      {restoredAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm text-blue-800">📝 Brouillon retrouvé sur cet appareil</p>
            <p className="text-xs text-blue-700 mt-1">
              Enregistré le {new Date(restoredAt).toLocaleString('fr-FR')}. Tes saisies ont été
              conservées et tu peux continuer directement.
            </p>
          </div>
          <button
            onClick={discardRestoredDraft}
            className="text-xs font-semibold text-blue-800 border border-blue-300 rounded-lg px-3 py-2 hover:bg-blue-100 shrink-0"
          >
            Repartir des données du serveur
          </button>
        </div>
      )}

      <StageNav stage={stage} onPick={goTo} flaggedStages={flaggedStages} />

      <Section title="Photo" showIf={stage === 'identity'} flagged={flaggedFields.has('photo')}>
        <PhotoCaptureInput
          label="Photo de profil"
          file={draft.photo}
          onChange={(f) => setDraft((d) => (d ? { ...d, photo: f } : d))}
        />
        {!draft.photo && current.current_data?.personal.photo_url && (
          <div className="mt-3 flex items-center gap-2">
            <img src={current.current_data.personal.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            <span className="text-xs text-gray-500">Photo actuelle (laissez vide pour la conserver)</span>
          </div>
        )}
      </Section>

      <Section
        title="Informations Personnelles"
        showIf={stage === 'identity'}
        flagged={
          flaggedFields.has('matricule_fonction_publique') ||
          flaggedFields.has('last_name') ||
          flaggedFields.has('first_name') ||
          flaggedFields.has('gender') ||
          flaggedFields.has('birth_date') ||
          flaggedFields.has('marital_status') ||
          flaggedFields.has('id_card_number') ||
          flaggedFields.has('children_under_6') ||
          flaggedFields.has('total_children') ||
          flaggedFields.has('recruitment_date') ||
          flaggedFields.has('service_start_date') ||
          flaggedFields.has('phone') ||
          flaggedFields.has('email') ||
          flaggedFields.has('address') ||
          flaggedFields.has('city')
        }
      >
        <div className="space-y-3">
          <Field
            label="Matricule Fonction Publique"
            value={draft.personal.matricule_fonction_publique}
            onChange={(v) => updatePersonal('matricule_fonction_publique', v)}
            onBlur={() => updatePersonal('matricule_fonction_publique', draft.personal.matricule_fonction_publique.trim())}
            flagged={flaggedFields.has('matricule_fonction_publique')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nom" value={draft.personal.last_name} onChange={(v) => updatePersonal('last_name', v)} flagged={flaggedFields.has('last_name')} />
            <Field label="Prénom" value={draft.personal.first_name} onChange={(v) => updatePersonal('first_name', v)} flagged={flaggedFields.has('first_name')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Sexe"
              value={draft.personal.gender}
              onChange={(v) => updatePersonal('gender', v)}
              options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
              flagged={flaggedFields.has('gender')}
            />
            <DateInput
              label="Date de naissance"
              value={draft.personal.birth_date}
              onChange={(v) => updatePersonal('birth_date', v)}
              flagged={flaggedFields.has('birth_date')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Statut marital"
              value={draft.personal.marital_status}
              onChange={(v) => updatePersonal('marital_status', v)}
              options={[
                { value: 'single', label: 'Célibataire' },
                { value: 'married', label: 'Marié(e)' },
                { value: 'divorced', label: 'Divorcé(e)' },
                { value: 'widowed', label: 'Veuf/Veuve' },
              ]}
              flagged={flaggedFields.has('marital_status')}
            />
            <Field
              label="N° Carte d'identité"
              value={draft.personal.id_card_number}
              onChange={(v) => updatePersonal('id_card_number', v)}
              flagged={flaggedFields.has('id_card_number')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Enfants < 6 ans" value={draft.personal.children_under_6} onChange={(v) => updatePersonal('children_under_6', v)} type="number" flagged={flaggedFields.has('children_under_6')} />
            <Field label="Total enfants" value={draft.personal.total_children} onChange={(v) => updatePersonal('total_children', v)} type="number" flagged={flaggedFields.has('total_children')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DateInput
              label="Date de recrutement"
              value={draft.personal.recruitment_date}
              onChange={(v) => updatePersonal('recruitment_date', v)}
              flagged={flaggedFields.has('recruitment_date')}
            />
            <DateInput
              label="Date de prise de service"
              value={draft.personal.service_start_date}
              onChange={(v) => updatePersonal('service_start_date', v)}
              flagged={flaggedFields.has('service_start_date')}
            />
          </div>
          <Field label="Téléphone" value={draft.personal.phone} onChange={(v) => updatePersonal('phone', v)} flagged={flaggedFields.has('phone')} />
          <Field label="Email" value={draft.personal.email} onChange={(v) => updatePersonal('email', v)} flagged={flaggedFields.has('email')} />
          <Field label="Adresse" value={draft.personal.address} onChange={(v) => updatePersonal('address', v)} flagged={flaggedFields.has('address')} />
          <Field label="Ville" value={draft.personal.city} onChange={(v) => updatePersonal('city', v)} flagged={flaggedFields.has('city')} />
        </div>
      </Section>

      <Section
        title="Classification Salariale"
        showIf={stage === 'pay'}
        flagged={flaggedFields.has('category_number') || flaggedFields.has('echelon_number')}
      >
        <p className="text-xs text-gray-500 mb-3">
          {salaryClassification.classification_type === 'cameroon'
            ? 'Nomenclature camerounaise (fonctionnaires).'
            : 'Classification numérique (contractuels).'}{' '}
          L'indice se calcule automatiquement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <SelectField
            label="Catégorie"
            value={draft.personal.category_number}
            onChange={(v) => {
              updatePersonal('category_number', v);
              updatePersonal('echelon_number', '');
            }}
            options={Object.entries(salaryClassification.category_options).map(([value, label]) => ({ value, label }))}
            flagged={flaggedFields.has('category_number')}
          />
          <SelectField
            label="Échelon"
            value={draft.personal.echelon_number}
            onChange={(v) => updatePersonal('echelon_number', v)}
            options={Object.entries(echelonOptions).map(([value, label]) => ({ value, label }))}
            flagged={flaggedFields.has('echelon_number')}
          />
        </div>
        <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-800">
          Indice : <span className="font-bold">{indicePreview ?? '—'}</span>
        </div>
      </Section>

      <Section
        title="Contrat de travail & prise de service"
        showIf={stage === 'pay'}
        flagged={
          flaggedFields.has('contract_number') ||
          flaggedFields.has('contract_document') ||
          flaggedFields.has('service_start_document')
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Numéro de contrat"
              value={draft.contract.contract_number}
              onChange={(v) => patchContract({ contract_number: v })}
              onBlur={() => patchContract({ contract_number: draft.contract.contract_number.trim() })}
              placeholder="Ex: CT-2024-001"
              flagged={flaggedFields.has('contract_number')}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type de contrat</label>
              <p className="text-sm text-gray-700 py-2">
                {current.current_data?.contract.contract_type ?? '—'}
                <span className="block text-xs text-gray-400">Fixé par les RH</span>
              </p>
            </div>
          </div>

          <FileField
            label="Contrat de travail (PDF ou image)"
            file={draft.contract.contract_document}
            onChange={(f) => patchContract({ contract_document: f })}
            flagged={flaggedFields.has('contract_document')}
          />
          {!draft.contract.contract_document && current.current_data?.contract.contract_document_url && (
            <DocumentLink label="📄 Contrat déjà enregistré (joignez un fichier pour le remplacer)" url={current.current_data.contract.contract_document_url} />
          )}

          <FileField
            label="Document de prise de service (PDF ou image)"
            file={draft.contract.service_start_document}
            onChange={(f) => patchContract({ service_start_document: f })}
            flagged={flaggedFields.has('service_start_document')}
          />
          {!draft.contract.service_start_document && current.current_data?.contract.service_start_document_url && (
            <DocumentLink label="📄 Prise de service déjà enregistrée (joignez un fichier pour la remplacer)" url={current.current_data.contract.service_start_document_url} />
          )}

          <p className="text-xs text-gray-400">
            Champs facultatifs : sans numéro ni document, la soumission passe quand même et les RH vous la
            réclameront à la vérification.
          </p>
        </div>
      </Section>

      <Section
        title="Informations Bancaires & CNPS"
        showIf={stage === 'pay'}
        flagged={
          flaggedFields.has('bank_name') ||
          flaggedFields.has('bank_account_number') ||
          flaggedFields.has('cnps_number')
        }
      >
        <div className="space-y-3">
          <Field
            label="Nom de la banque"
            value={draft.personal.bank_name}
            onChange={(v) => updatePersonal('bank_name', v)}
            flagged={flaggedFields.has('bank_name')}
          />
          <Field
            label="Numéro de compte"
            value={draft.personal.bank_account_number}
            onChange={(v) => updatePersonal('bank_account_number', v)}
            flagged={flaggedFields.has('bank_account_number')}
          />
          <Field
            label="Numéro CNPS"
            value={draft.personal.cnps_number}
            onChange={(v) => updatePersonal('cnps_number', v)}
            flagged={flaggedFields.has('cnps_number')}
          />

          {bankChanges.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-bold text-amber-900">⚠️ Tu modifies tes coordonnées de paiement</p>
              <p className="text-xs text-amber-800 mt-1">
                {bankChanges
                  .map((c) => `${c.label} → ${current.current_data?.personal[c.key]?.trim() || 'aucune valeur enregistrée'}`)
                  .join(' · ')}
              </p>
              <p className="text-xs text-amber-800 mt-2">
                Si ces informations ne sont pas celles que la GRH a dans son dossier, <strong>ton salaire ne sera pas
                viré</strong> tant que la différence n'est pas régularisée. Un changement avéré doit être accompagné
                d'une <strong>demande de modification des informations bancaires adressée au Directeur Général</strong>
                (avec un RIB à ton nom joint) : sans ce document, la valeur déjà enregistrée reste la référence.
              </p>
              <label className="flex items-start gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={bankChangeAck}
                  onChange={(e) => setBankAckFor(e.target.checked ? bankChangesSignature : null)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-amber-900">
                  J'ai lu cet avertissement et je prépare la demande adressée au Directeur Général.
                </span>
              </label>
              {!bankChangeAck && (
                <p className="text-[11px] font-semibold text-red-700 mt-1">
                  Cette case est obligatoire pour pouvoir soumettre.
                </p>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Affectation Organisationnelle"
        showIf={stage === 'org'}
        flagged={
          flaggedFields.has('declared_branch_type') ||
          flaggedFields.has('declared_direction_id') ||
          flaggedFields.has('declared_department_id') ||
          flaggedFields.has('declared_sub_direction_id') ||
          flaggedFields.has('declared_service_id') ||
          flaggedFields.has('declared_sector_id') ||
          flaggedFields.has('declared_trade_body_id') ||
          flaggedFields.has('declared_qualification_id') ||
          flaggedFields.has('declared_job_title_id') ||
          flaggedFields.has('declared_personnel_type') ||
          flaggedFields.has('declared_administrative_status')
        }
      >
        <p className="text-xs text-gray-500 mb-3">
          Chaque niveau facultatif (direction, département/sous-direction, unité) ne fait que restreindre la liste
          suivante. Vérifiez bien l'ordre : Direction → Département ou Sous-direction → Service → Unité / Secteur.
          Les RH vérifient ces informations avant la validation finale.
        </p>

        <div className="flex gap-2 mb-4">
          {(['medical', 'administrative'] as const).map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => setBranch(b)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${draft.organizational.branch_type === b
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              {b === 'medical' ? '🏥 Branche Médicale' : '📋 Branche Administrative'}
            </button>
          ))}
        </div>

        {flaggedFields.has('declared_branch_type') && (
          <div className="-mt-2 mb-3">
            <CorrectionNote />
          </div>
        )}

        {cascade && orgOptions && (
          <div className="space-y-3">
            <SelectField
              label="Direction"
              value={draft.organizational.direction_id}
              onChange={setDirection}
              options={toOptions(cascade.directions)}
              hint="Facultatif : restreint les listes suivantes"
              flagged={flaggedFields.has('declared_direction_id')}
            />

            {draft.organizational.branch_type === 'medical' ? (
              <SelectField
                label="Département"
                value={draft.organizational.department_id}
                onChange={setDepartment}
                options={toOptions(cascade.departments)}
                hint="Facultatif : restreint la liste des services"
                flagged={flaggedFields.has('declared_department_id')}
              />
            ) : (
              <SelectField
                label="Sous-direction"
                value={draft.organizational.sub_direction_id}
                onChange={setSubDirection}
                options={toOptions(cascade.subDirections)}
                hint="Facultatif : restreint la liste des services"
                flagged={flaggedFields.has('declared_sub_direction_id')}
              />
            )}

            <SelectField
              label="Service"
              value={draft.organizational.service_id}
              onChange={setService}
              options={toOptions(cascade.services)}
              flagged={flaggedFields.has('declared_service_id')}
            />

            <SelectField
              label="Unité / Secteur"
              value={draft.organizational.sector_id}
              onChange={(v) => patchOrganizational({ sector_id: v })}
              options={toOptions(cascade.sectors)}
              disabled={!draft.organizational.service_id}
              flagged={flaggedFields.has('declared_sector_id')}
              hint={!draft.organizational.service_id
                ? "Choisissez d'abord un service"
                : cascade.sectors.length === 0
                  ? 'Aucune unité / secteur rattachée à ce service'
                  : 'Facultatif : unité ou secteur rattaché au service'}
            />

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <SelectField
                label="Corps de métier"
                value={draft.organizational.trade_body_id}
                onChange={setTradeBody}
                options={toOptions(orgOptions.trade_bodies)}
                flagged={flaggedFields.has('declared_trade_body_id')}
              />
              <SelectField
                label="Qualification"
                value={draft.organizational.qualification_id}
                onChange={(v) => patchOrganizational({ qualification_id: v })}
                options={toOptions(cascade.qualifications)}
                disabled={!draft.organizational.trade_body_id && !draft.organizational.qualification_id}
                hint="Choisissez d'abord le corps de métier"
                flagged={flaggedFields.has('declared_qualification_id')}
              />
              <SelectField
                label="Poste hiérarchique"
                value={draft.organizational.job_title_id}
                onChange={(v) => patchOrganizational({ job_title_id: v })}
                options={orgOptions.job_titles.map((j) => ({
                  value: String(j.id),
                  label: j.hierarchy_level != null ? `${j.name} (Niveau ${j.hierarchy_level})` : j.name,
                }))}
                flagged={flaggedFields.has('declared_job_title_id')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Type de personnel"
                  value={draft.organizational.personnel_type}
                  onChange={(v) => patchOrganizational({ personnel_type: v })}
                  options={orgOptions.personnel_types}
                  flagged={flaggedFields.has('declared_personnel_type')}
                />
                <SelectField
                  label="Statut administratif"
                  value={draft.organizational.administrative_status}
                  onChange={(v) => patchOrganizational({ administrative_status: v })}
                  options={orgOptions.administrative_statuses}
                  flagged={flaggedFields.has('declared_administrative_status')}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Ayants Droit"
        showIf={stage === 'family'}
        flagged={flaggedFields.has('dependents')}
        action={
          <button onClick={() => setEditingDependentIndex('new')} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
            + Ajouter
          </button>
        }
      >
        {draft.dependents.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun ayant droit déclaré.</p>
        ) : (
          <div className="space-y-2">
            {draft.dependents.map((dep, index) => (
              <div key={index} className={`bg-gray-50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${dep.removed ? 'opacity-50' : ''}`}>
                <div>
                  <p className={`text-sm font-semibold ${dep.removed ? 'line-through' : ''} text-gray-900`}>
                    {dep.last_name} {dep.first_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {RELATIONSHIP_LABELS[dep.relationship]} {dep.existing_id ? '' : '· nouveau'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!dep.removed && (
                    <button onClick={() => setEditingDependentIndex(index)} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => toggleRemoveDependent(index)}
                    className={`text-xs font-semibold hover:underline ${dep.removed ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {dep.removed ? 'Rétablir' : 'Retirer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Diplômes & Formations"
        showIf={stage === 'family'}
        flagged={flaggedFields.has('diplomas')}
        action={
          <button onClick={() => setEditingDiplomaIndex('new')} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
            + Ajouter
          </button>
        }
      >
        {draft.diplomas.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun diplôme/formation déclaré.</p>
        ) : (
          <div className="space-y-2">
            {draft.diplomas.map((dip, index) => (
              <div key={index} className={`bg-gray-50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${dip.removed ? 'opacity-50' : ''}`}>
                <div>
                  <p className={`text-sm font-semibold ${dip.removed ? 'line-through' : ''} text-gray-900`}>{dip.title}</p>
                  <p className="text-xs text-gray-500">
                    {DIPLOMA_TYPE_LABELS[dip.type]} · {dip.institution} ({dip.year_obtained}) {dip.existing_id ? '' : '· nouveau'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!dip.removed && (
                    <button onClick={() => setEditingDiplomaIndex(index)} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => toggleRemoveDiploma(index)}
                    className={`text-xs font-semibold hover:underline ${dip.removed ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {dip.removed ? 'Rétablir' : 'Retirer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <button
          onClick={() => prevStage && goTo(prevStage)}
          disabled={!prevStage}
          className="flex-1 border border-gray-300 rounded-lg py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Précédent
        </button>
        <button
          onClick={() => goTo(nextStage ? nextStage.key : 'review')}
          className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90"
        >
          {nextStage ? `${nextStage.label} →` : 'Vérifier et Soumettre'}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">
        ✏️ Tes saisies sont enregistrées sur cet appareil à chaque modification : tu peux fermer la page ou perdre
        la connexion, rien n'est perdu.
      </p>

      {editingDependentIndex !== null && (
        <DependentModal
          initial={editingDependentIndex === 'new' ? EMPTY_DEPENDENT : draft.dependents[editingDependentIndex]}
          familyActAvailable={hasFamilyAct(draft.dependents.filter((d) => !d.removed))}
          onCancel={() => setEditingDependentIndex(null)}
          onSave={saveDependent}
        />
      )}

      {editingDiplomaIndex !== null && (
        <DiplomaModal
          initial={editingDiplomaIndex === 'new' ? EMPTY_DIPLOMA : draft.diplomas[editingDiplomaIndex]}
          onCancel={() => setEditingDiplomaIndex(null)}
          onSave={saveDiploma}
        />
      )}
    </div>
  );
}

function Section({
  title,
  action,
  showIf = true,
  flagged = false,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  showIf?: boolean;
  flagged?: boolean;
  children: React.ReactNode;
}) {
  if (!showIf) return null;

  return (
    <div
      className={`rounded-xl border p-5 mb-4 ${flagged ? 'border-red-300 bg-red-50/40' : 'bg-white border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#1e3a5f] flex items-center gap-2">
          {title}
          {flagged && (
            <span className="text-[10px] font-bold text-red-700 bg-white border border-red-200 rounded-full px-2 py-0.5">
              à corriger
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * Barre des étapes. Toutes les étapes sont cliquables : aucune saisie ne bloque
 * le passage à la suivante, l'employé garde la main sur son ordre de remplissage.
 * Une étape marquée d'un point rouge contient au moins un champ renvoyé par les RH.
 */
function StageNav({
  stage,
  onPick,
  flaggedStages,
}: {
  stage: Stage;
  onPick: (s: Stage) => void;
  flaggedStages: Set<DraftStage>;
}) {
  const stages: { key: Stage; label: string }[] = [...FORM_STAGES, { key: 'review', label: 'Récapitulatif' }];
  const currentIndex = stages.findIndex((s) => s.key === stage);

  return (
    <nav className="bg-white rounded-xl border border-gray-200 p-2 mb-4">
      <ol className="flex items-stretch gap-1 overflow-x-auto">
        {stages.map((s, i) => {
          const isCurrent = s.key === stage;
          const isDone = i < currentIndex;
          const isFlagged = s.key !== 'review' && flaggedStages.has(s.key);
          return (
            <li key={s.key} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onPick(s.key)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-full rounded-lg px-1.5 py-2 text-[11px] font-semibold leading-tight ${
                  isCurrent ? 'bg-[#1e3a5f] text-white' : 'text-gray-600 hover:bg-gray-100'
                } ${isFlagged && !isCurrent ? 'border border-red-300' : ''}`}
              >
                <span className={isCurrent ? 'text-white' : isFlagged ? 'text-red-600' : isDone ? 'text-green-600' : 'text-gray-400'}>
                  {isFlagged ? '●' : isDone ? '✓' : i + 1}
                </span>{' '}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

const FIELD_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';
const FLAGGED_CLASS =
  'w-full rounded-lg border-2 border-red-500 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

/** Rappel du motif du renvoi, posé sous chaque champ que les RH ont marqué. */
function CorrectionNote() {
  return <p className="text-[11px] font-semibold text-red-600 mt-1">↩️ À corriger — demandé par les RH</p>;
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  flagged = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  flagged?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={flagged ? FLAGGED_CLASS : FIELD_CLASS}
      />
      {flagged && <CorrectionNote />}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  hint,
  flagged = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
  flagged?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          flagged
            ? 'w-full rounded-lg border-2 border-red-500 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400'
            : `${FIELD_CLASS} bg-white disabled:bg-gray-100 disabled:text-gray-400`
        }
      >
        <option value="">{disabled && hint ? hint : '—'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {flagged ? (
        <CorrectionNote />
      ) : (
        !disabled &&
        hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DependentModal({
  initial,
  familyActAvailable,
  onCancel,
  onSave,
}: {
  initial: CensusDraftDependent;
  familyActAvailable: boolean;
  onCancel: () => void;
  onSave: (item: CensusDraftDependent) => void;
}) {
  const [item, setItem] = useState<CensusDraftDependent>(initial);
  const isParent = PARENT_RELATIONS.includes(item.relationship);
  // Un parent n'a pas besoin de sa propre pièce si l'acte familial est déjà là.
  const actCovered = isParent && familyActAvailable && !isAttached(item.documents.birth_certificate);
  const actTitle = isParent ? "Acte de naissance de l'employé" : "Acte de naissance de l'ayant droit";
  let actSuffix = '*';
  if (item.existing_id) {
    actSuffix = '(joindre si changement)';
  } else if (actCovered) {
    actSuffix = '(facultatif — déjà fourni)';
  }

  function handleSave() {
    if (!item.last_name.trim() || !item.birth_date.trim()) {
      alert('Le nom et la date de naissance sont obligatoires.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.birth_date.trim())) {
      alert('Date de naissance invalide. Format attendu : JJ-MM-AAAA.');
      return;
    }
    if (!item.existing_id && !isAttached(item.documents.birth_certificate) && !(isParent && familyActAvailable)) {
      alert(
        isParent
          ? "Pour déclarer un parent, joins TON acte de naissance : c'est lui qui prouve la filiation."
          : `Pour ${dependentWho(item)}, l'acte de naissance est obligatoire. Vérifie que le fichier n'est pas vide (0 octet) : reprends la photo au besoin.`,
      );
      return;
    }
    if (item.relationship === 'spouse' && !item.existing_id && !isAttached(item.documents.marriage_certificate)) {
      alert("L'acte de mariage est obligatoire pour un(e) conjoint(e).");
      return;
    }
    onSave(item);
  }

  return (
    <Modal title="Ayant Droit">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Lien de parenté</label>
          <div className="flex flex-wrap gap-2">
            {(['spouse', 'child', 'father', 'mother'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setItem((p) => ({ ...p, relationship: r }))}
                className={`px-2.5 py-1 rounded-full text-xs border ${item.relationship === r ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
              >
                {RELATIONSHIP_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <Field label="Nom *" value={item.last_name} onChange={(v) => setItem((p) => ({ ...p, last_name: v }))} />
        <Field label="Prénom(s)" value={item.first_name} onChange={(v) => setItem((p) => ({ ...p, first_name: v }))} />
        <DateInput label="Date de naissance *" value={item.birth_date} onChange={(v) => setItem((p) => ({ ...p, birth_date: v }))} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Sexe</label>
          <div className="flex gap-2">
            <button onClick={() => setItem((p) => ({ ...p, gender: 'M' }))} className={`px-2.5 py-1 rounded-full text-xs border ${item.gender === 'M' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300'}`}>Masculin</button>
            <button onClick={() => setItem((p) => ({ ...p, gender: 'F' }))} className={`px-2.5 py-1 rounded-full text-xs border ${item.gender === 'F' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300'}`}>Féminin</button>
          </div>
        </div>

        <PhotoCaptureInput
          label="Photo"
          file={item.documents.photo ?? null}
          onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, photo: f } }))}
        />

        <FileField
          label={`${actTitle} ${actSuffix}`}
          file={item.documents.birth_certificate ?? null}
          onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, birth_certificate: f } }))}
        />
        {isParent && (
          <p className="text-xs text-gray-500 -mt-1">
            {actCovered
              ? '✅ La pièce qui prouve la filiation est déjà au dossier pour un autre parent : elle servira pour cette déclaration, inutile de la renvoyer.'
              : "C'est TON acte de naissance qui prouve la filiation avec ce parent — la même pièce sert pour le père et la mère."}
          </p>
        )}
        {item.relationship === 'spouse' && (
          <FileField
            label={`Acte de mariage ${item.existing_id ? '(joindre si changement)' : '*'}`}
            file={item.documents.marriage_certificate ?? null}
            onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, marriage_certificate: f } }))}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700">Annuler</button>
          <button onClick={handleSave} className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold">Enregistrer</button>
        </div>
      </div>
    </Modal>
  );
}

function DiplomaModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: CensusDraftDiploma;
  onCancel: () => void;
  onSave: (item: CensusDraftDiploma) => void;
}) {
  const [item, setItem] = useState<CensusDraftDiploma>(initial);

  function handleSave() {
    const year = parseInt(item.year_obtained.trim(), 10);
    if (!item.title.trim() || !item.institution.trim()) {
      alert("L'intitulé et l'établissement sont obligatoires.");
      return;
    }
    if (!year || year < 1950 || year > new Date().getFullYear()) {
      alert('Année invalide.');
      return;
    }
    if (!item.existing_id && !item.document) {
      alert('Un document justificatif est obligatoire pour un nouveau diplôme.');
      return;
    }
    onSave(item);
  }

  return (
    <Modal title="Diplôme / Formation">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
          <div className="flex flex-col gap-2">
            {(['recruitment_diploma', 'highest_diploma', 'training'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setItem((p) => ({ ...p, type: t }))}
                className={`px-3 py-1.5 rounded-lg text-sm text-left border ${item.type === t ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
              >
                {DIPLOMA_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <Field label="Intitulé *" value={item.title} onChange={(v) => setItem((p) => ({ ...p, title: v }))} />
        <Field label="Établissement *" value={item.institution} onChange={(v) => setItem((p) => ({ ...p, institution: v }))} />
        <Field label="Année *" value={item.year_obtained} onChange={(v) => setItem((p) => ({ ...p, year_obtained: v }))} type="number" />

        <FileField
          label={`Document justificatif ${item.existing_id ? '(joindre si changement)' : '*'}`}
          file={item.document ?? null}
          onChange={(f) => setItem((p) => ({ ...p, document: f }))}
        />

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700">Annuler</button>
          <button onClick={handleSave} className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold">Enregistrer</button>
        </div>
      </div>
    </Modal>
  );
}

function DocumentLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block text-xs text-[#1e3a5f] hover:underline">
      {label}
    </a>
  );
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileField({
  label,
  file,
  onChange,
  flagged = false,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  flagged?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;

          // Un fichier de 0 octet est traité comme si rien n'avait été joint : le
          // serveur l'ignore et le formulaire aurait affiché une pièce « fournie ».
          if (picked && picked.size === 0) {
            alert(
              `« ${picked.name} » est vide : l'appareil photo ou l'application ne l'a pas enregistré. ` +
                'Reprends la photo, ou choisis un autre fichier.'
            );
            e.target.value = '';
            return;
          }

          onChange(picked);
        }}
        className={`w-full text-xs ${flagged ? 'rounded-lg border-2 border-red-500 bg-white p-2' : ''}`}
      />
      {file && file.size === 0 && (
        <p className="text-xs text-red-700 mt-1">⚠️ {file.name} est vide : sélectionne-le à nouveau.</p>
      )}
      {file && file.size > 0 && (
        <p className="text-xs text-green-700 mt-1">
          ✅ {file.name} · {fileSizeLabel(file.size)}
        </p>
      )}
      {flagged && <CorrectionNote />}
    </div>
  );
}