import { useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentCensus,
  submitCensus,
  buildInitialDraft,
} from '../api/census';
import type { CensusDraft, CensusCurrentResponse, CensusDraftDependent, CensusDraftDiploma } from '../api/census';
import { extractApiError } from '../api/client';
import PhotoCaptureInput from '../components/PhotoCaptureInput';
import DateInput from '../components/DateInput';
import { isoToFr } from '../lib/dates';
import { computeCascade } from '../lib/organization';

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

type Step = 'edit' | 'review';

const toOptions = (list: { id: number; name: string }[]) =>
  list.map((x) => ({ value: String(x.id), label: x.name }));

const nameOf = (list: { id: number; name: string }[] | undefined, id: string) =>
  (id && list?.find((x) => String(x.id) === id)?.name) || '';

export default function CensusPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState<CensusCurrentResponse | null>(null);
  const [draft, setDraft] = useState<CensusDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('edit');

  const [editingDependentIndex, setEditingDependentIndex] = useState<number | null | 'new'>(null);
  const [editingDiplomaIndex, setEditingDiplomaIndex] = useState<number | null | 'new'>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    try {
      const data = await fetchCurrentCensus();
      setCurrent(data);
      if (data.campaign) setDraft(buildInitialDraft(data));
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const salaryClassification = current?.current_data?.salary_classification;

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

    if (activeDependents.some((d) => !d.existing_id && !d.documents.birth_certificate)) {
      alert("Un acte de naissance est requis pour chaque nouvel ayant droit.");
      return;
    }
    if (activeDiplomas.some((d) => !d.existing_id && !d.document)) {
      alert('Un document justificatif est requis pour chaque nouveau diplôme.');
      return;
    }

    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmSubmit() {
    if (!current?.campaign || !draft) return;

    setIsSubmitting(true);
    try {
      await submitCensus(current.campaign.id, draft);
      alert('Votre recensement a été soumis pour validation.');
      setStep('edit');
      load();
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!current?.campaign) {
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

  const echelonOptions = draft.personal.category_number
    ? salaryClassification.echelon_options_by_category[draft.personal.category_number] ?? {}
    : {};

  if (step === 'review') {
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
          <RecapRow label="Matricule Fonction Publique" value={draft.personal.matricule_fonction_publique} />
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

        <Section title="Banque & CNPS">
          <RecapRow label="Banque" value={draft.personal.bank_name} />
          <RecapRow label="N° de compte" value={draft.personal.bank_account_number} />
          <RecapRow label="N° CNPS" value={draft.personal.cnps_number} />
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
            onClick={() => setStep('edit')}
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 rounded-lg py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            ← Retour pour corriger
          </button>
          <button
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Envoi...' : 'Confirmer et Soumettre'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          ⚠️ Ne rechargez pas cette page avant d'avoir soumis, vous perdriez vos modifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-lg font-bold text-[#1e3a5f]">{current.campaign.name}</h1>
      {current.campaign.description && <p className="text-sm text-gray-500 mt-1 mb-4">{current.campaign.description}</p>}

      {wasRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm text-red-800">❌ {current.stage_label}</p>
          {current.rejection_reason && <p className="text-sm text-red-700 mt-1">{current.rejection_reason}</p>}
          <p className="text-xs text-red-600 mt-1 italic">Corrigez ci-dessous et resoumettez.</p>
        </div>
      )}

      <Section title="Photo">
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

      <Section title="Informations Personnelles">
        <div className="space-y-3">
          <Field label="Matricule Fonction Publique" value={draft.personal.matricule_fonction_publique} onChange={(v) => updatePersonal('matricule_fonction_publique', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nom" value={draft.personal.last_name} onChange={(v) => updatePersonal('last_name', v)} />
            <Field label="Prénom" value={draft.personal.first_name} onChange={(v) => updatePersonal('first_name', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Sexe"
              value={draft.personal.gender}
              onChange={(v) => updatePersonal('gender', v)}
              options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
            />
            <DateInput label="Date de naissance" value={draft.personal.birth_date} onChange={(v) => updatePersonal('birth_date', v)} />
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
            />
            <Field label="N° Carte d'identité" value={draft.personal.id_card_number} onChange={(v) => updatePersonal('id_card_number', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Enfants < 6 ans" value={draft.personal.children_under_6} onChange={(v) => updatePersonal('children_under_6', v)} type="number" />
            <Field label="Total enfants" value={draft.personal.total_children} onChange={(v) => updatePersonal('total_children', v)} type="number" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DateInput label="Date de recrutement" value={draft.personal.recruitment_date} onChange={(v) => updatePersonal('recruitment_date', v)} />
            <DateInput label="Date de prise de service" value={draft.personal.service_start_date} onChange={(v) => updatePersonal('service_start_date', v)} />
          </div>
          <Field label="Téléphone" value={draft.personal.phone} onChange={(v) => updatePersonal('phone', v)} />
          <Field label="Email" value={draft.personal.email} onChange={(v) => updatePersonal('email', v)} />
          <Field label="Adresse" value={draft.personal.address} onChange={(v) => updatePersonal('address', v)} />
          <Field label="Ville" value={draft.personal.city} onChange={(v) => updatePersonal('city', v)} />
        </div>
      </Section>

      <Section title="Classification Salariale">
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
          />
          <SelectField
            label="Échelon"
            value={draft.personal.echelon_number}
            onChange={(v) => updatePersonal('echelon_number', v)}
            options={Object.entries(echelonOptions).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-800">
          Indice : <span className="font-bold">{indicePreview ?? '—'}</span>
        </div>
      </Section>

      <Section title="Informations Bancaires & CNPS">
        <div className="space-y-3">
          <Field label="Nom de la banque" value={draft.personal.bank_name} onChange={(v) => updatePersonal('bank_name', v)} />
          <Field label="Numéro de compte" value={draft.personal.bank_account_number} onChange={(v) => updatePersonal('bank_account_number', v)} />
          <Field label="Numéro CNPS" value={draft.personal.cnps_number} onChange={(v) => updatePersonal('cnps_number', v)} />
        </div>
      </Section>

      <Section title="Affectation Organisationnelle">
        <p className="text-xs text-gray-500 mb-3">
          Choisissez votre branche, puis chaque liste se filtre selon le niveau précédent. Les RH vérifient
          ces informations avant la validation finale.
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

        {cascade && orgOptions && (
          <div className="space-y-3">
            <SelectField
              label="Direction"
              value={draft.organizational.direction_id}
              onChange={setDirection}
              options={toOptions(cascade.directions)}
            />

            {draft.organizational.branch_type === 'medical' ? (
              <SelectField
                label="Département"
                value={draft.organizational.department_id}
                onChange={setDepartment}
                options={toOptions(cascade.departments)}
              />
            ) : (
              <SelectField
                label="Sous-direction"
                value={draft.organizational.sub_direction_id}
                onChange={setSubDirection}
                options={toOptions(cascade.subDirections)}
                disabled={!draft.organizational.direction_id && !draft.organizational.sub_direction_id}
                hint="Choisissez d'abord la direction"
              />
            )}

            <SelectField
              label="Service"
              value={draft.organizational.service_id}
              onChange={setService}
              options={toOptions(cascade.services)}
              disabled={
                !draft.organizational.service_id &&
                !(draft.organizational.branch_type === 'medical'
                  ? draft.organizational.department_id
                  : draft.organizational.sub_direction_id)
              }
              hint={
                draft.organizational.branch_type === 'medical'
                  ? "Choisissez d'abord le département"
                  : "Choisissez d'abord la sous-direction"
              }
            />

            {draft.organizational.service_id && (
              <SelectField
                label="Secteur / Unité (optionnel)"
                value={draft.organizational.sector_id}
                onChange={(v) => patchOrganizational({ sector_id: v })}
                options={toOptions(cascade.sectors)}
              />
            )}

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <SelectField
                label="Corps de métier"
                value={draft.organizational.trade_body_id}
                onChange={setTradeBody}
                options={toOptions(orgOptions.trade_bodies)}
              />
              <SelectField
                label="Qualification"
                value={draft.organizational.qualification_id}
                onChange={(v) => patchOrganizational({ qualification_id: v })}
                options={toOptions(cascade.qualifications)}
                disabled={!draft.organizational.trade_body_id && !draft.organizational.qualification_id}
                hint="Choisissez d'abord le corps de métier"
              />
              <SelectField
                label="Poste hiérarchique"
                value={draft.organizational.job_title_id}
                onChange={(v) => patchOrganizational({ job_title_id: v })}
                options={orgOptions.job_titles.map((j) => ({
                  value: String(j.id),
                  label: j.hierarchy_level != null ? `${j.name} (Niveau ${j.hierarchy_level})` : j.name,
                }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Type de personnel"
                  value={draft.organizational.personnel_type}
                  onChange={(v) => patchOrganizational({ personnel_type: v })}
                  options={orgOptions.personnel_types}
                />
                <SelectField
                  label="Statut administratif"
                  value={draft.organizational.administrative_status}
                  onChange={(v) => patchOrganizational({ administrative_status: v })}
                  options={orgOptions.administrative_statuses}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Ayants Droit"
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

      <button
        onClick={handleGoToReview}
        className="w-full bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 mt-2"
      >
        Vérifier et Soumettre
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">
        ⚠️ Ne rechargez pas cette page avant d'avoir soumis, vous perdriez vos modifications.
      </p>

      {editingDependentIndex !== null && (
        <DependentModal
          initial={editingDependentIndex === 'new' ? EMPTY_DEPENDENT : draft.dependents[editingDependentIndex]}
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

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[#1e3a5f]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
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

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
      />
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">{disabled && hint ? hint : '—'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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
  onCancel,
  onSave,
}: {
  initial: CensusDraftDependent;
  onCancel: () => void;
  onSave: (item: CensusDraftDependent) => void;
}) {
  const [item, setItem] = useState<CensusDraftDependent>(initial);

  function handleSave() {
    if (!item.last_name.trim() || !item.birth_date.trim()) {
      alert('Le nom et la date de naissance sont obligatoires.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.birth_date.trim())) {
      alert('Date de naissance invalide. Format attendu : JJ-MM-AAAA.');
      return;
    }
    if (!item.existing_id && !item.documents.birth_certificate) {
      alert("L'acte de naissance est obligatoire pour un nouvel ayant droit.");
      return;
    }
    if (item.relationship === 'spouse' && !item.existing_id && !item.documents.marriage_certificate) {
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
          label={`Acte de naissance ${item.existing_id ? '(joindre si changement)' : '*'}`}
          file={item.documents.birth_certificate ?? null}
          onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, birth_certificate: f } }))}
        />
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

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input type="file" accept="application/pdf,image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="w-full text-xs" />
      {file && <p className="text-xs text-green-700 mt-1">✅ {file.name}</p>}
    </div>
  );
}