import { apiClient } from './client';

export interface CensusCampaignInfo {
  id: number;
  name: string;
  description: string | null;
  ends_at: string | null;
}

export interface CensusCurrentDependent {
  id: number;
  relationship: string;
  first_name: string | null;
  last_name: string;
  birth_date: string | null;
  birth_place: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface CensusCurrentDiploma {
  id: number;
  type: string;
  title: string;
  institution: string;
  year_obtained: number;
}

export type CensusSubmissionStatus =
  | 'submitted'
  | 'career_validated'
  | 'career_rejected'
  | 'solde_validated'
  | 'solde_rejected'
  | 'validated'
  | 'rejected';

export interface CensusCurrentResponse {
  campaign: CensusCampaignInfo | null;
  message?: string;
  submission_status?: CensusSubmissionStatus | null;
  stage_label?: string | null;
  rejection_reason?: string | null;
  current_data?: {
    personal: {
      photo_url: string | null;
      matricule_fonction_publique: string | null;
      first_name: string | null;
      last_name: string | null;
      gender: string | null;
      birth_date: string | null;
      marital_status: string | null;
      children_under_6: number | null;
      total_children: number | null;
      id_card_number: string | null;
      recruitment_date: string | null;
      service_start_date: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
      city: string | null;
      bank_name: string | null;
      bank_account_number: string | null;
      cnps_number: string | null;
    };
    salary_classification: {
      classification_type: 'cameroon' | 'numeric';
      current_category_number: string | null;
      current_echelon_number: string | null;
      current_indice: number | null;
      category_options: Record<string, string>;
      echelon_options_by_category: Record<string, Record<string, string>>;
      grid_rows: { category: string; echelon: string; indice: number }[];
    };
    organizational: {
      current_department: string | null;
      current_service: string | null;
      current_job_title: string | null;
      current_trade_body: string | null;
      current_qualification: string | null;
      current_personnel_type: string | null;
      current_administrative_status: string | null;
    };
    dependents: CensusCurrentDependent[];
    diplomas: CensusCurrentDiploma[];
  };
}

export async function fetchCurrentCensus(): Promise<CensusCurrentResponse> {
  const { data } = await apiClient.get<CensusCurrentResponse>('/employee/census/current');
  return data;
}

export interface CensusDraftDependent {
  existing_id: number | null;
  relationship: 'spouse' | 'child' | 'father' | 'mother';
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  address: string;
  removed: boolean;
  documents: {
    photo?: File | null;
    id_card?: File | null;
    birth_certificate?: File | null;
    marriage_certificate?: File | null;
  };
}

export interface CensusDraftDiploma {
  existing_id: number | null;
  type: 'recruitment_diploma' | 'highest_diploma' | 'training';
  title: string;
  institution: string;
  year_obtained: string;
  removed: boolean;
  document?: File | null;
}

export interface CensusDraft {
  personal: {
    matricule_fonction_publique: string;
    category_number: string;
    echelon_number: string;
    first_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    marital_status: string;
    children_under_6: string;
    total_children: string;
    id_card_number: string;
    recruitment_date: string;
    service_start_date: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    bank_name: string;
    bank_account_number: string;
    cnps_number: string;
  };
  photo: File | null;
  organizational: {
    declared_department: string;
    declared_service: string;
    declared_job_title: string;
    declared_trade_body: string;
    declared_qualification: string;
    declared_personnel_type: string;
    declared_administrative_status: string;
  };
  dependents: CensusDraftDependent[];
  diplomas: CensusDraftDiploma[];
}

export function buildInitialDraft(current: CensusCurrentResponse): CensusDraft {
  const data = current.current_data;

  return {
    personal: {
      matricule_fonction_publique: data?.personal.matricule_fonction_publique ?? '',
      category_number: data?.salary_classification.current_category_number ?? '',
      echelon_number: data?.salary_classification.current_echelon_number ?? '',
      first_name: data?.personal.first_name ?? '',
      last_name: data?.personal.last_name ?? '',
      gender: data?.personal.gender ?? '',
      birth_date: data?.personal.birth_date ?? '',
      marital_status: data?.personal.marital_status ?? '',
      children_under_6: data?.personal.children_under_6 != null ? String(data.personal.children_under_6) : '',
      total_children: data?.personal.total_children != null ? String(data.personal.total_children) : '',
      id_card_number: data?.personal.id_card_number ?? '',
      recruitment_date: data?.personal.recruitment_date ?? '',
      service_start_date: data?.personal.service_start_date ?? '',
      phone: data?.personal.phone ?? '',
      email: data?.personal.email ?? '',
      address: data?.personal.address ?? '',
      city: data?.personal.city ?? '',
      bank_name: data?.personal.bank_name ?? '',
      bank_account_number: data?.personal.bank_account_number ?? '',
      cnps_number: data?.personal.cnps_number ?? '',
    },
    photo: null,
    organizational: {
      declared_department: data?.organizational.current_department ?? '',
      declared_service: data?.organizational.current_service ?? '',
      declared_job_title: data?.organizational.current_job_title ?? '',
      declared_trade_body: data?.organizational.current_trade_body ?? '',
      declared_qualification: data?.organizational.current_qualification ?? '',
      declared_personnel_type: data?.organizational.current_personnel_type ?? '',
      declared_administrative_status: data?.organizational.current_administrative_status ?? '',
    },
    dependents: (data?.dependents ?? []).map((d) => ({
      existing_id: d.id,
      relationship: (d.relationship as CensusDraftDependent['relationship']) ?? 'child',
      first_name: d.first_name ?? '',
      last_name: d.last_name,
      birth_date: d.birth_date ?? '',
      birth_place: d.birth_place ?? '',
      gender: (d.gender as 'M' | 'F') ?? 'M',
      phone: d.phone ?? '',
      email: d.email ?? '',
      address: d.address ?? '',
      removed: false,
      documents: {},
    })),
    diplomas: (data?.diplomas ?? []).map((d) => ({
      existing_id: d.id,
      type: d.type as CensusDraftDiploma['type'],
      title: d.title,
      institution: d.institution,
      year_obtained: String(d.year_obtained),
      removed: false,
      document: null,
    })),
  };
}

export async function submitCensus(campaignId: number, draft: CensusDraft): Promise<void> {
  const formData = new FormData();

  formData.append('personal[matricule_fonction_publique]', draft.personal.matricule_fonction_publique ?? '');
  formData.append('personal[category_number]', draft.personal.category_number ?? '');
  formData.append('personal[echelon_number]', draft.personal.echelon_number ?? '');
  formData.append('personal[first_name]', draft.personal.first_name ?? '');
  formData.append('personal[last_name]', draft.personal.last_name ?? '');
  formData.append('personal[gender]', draft.personal.gender ?? '');
  formData.append('personal[birth_date]', draft.personal.birth_date ?? '');
  formData.append('personal[marital_status]', draft.personal.marital_status ?? '');
  formData.append('personal[children_under_6]', draft.personal.children_under_6 ?? '');
  formData.append('personal[total_children]', draft.personal.total_children ?? '');
  formData.append('personal[id_card_number]', draft.personal.id_card_number ?? '');
  formData.append('personal[recruitment_date]', draft.personal.recruitment_date ?? '');
  formData.append('personal[service_start_date]', draft.personal.service_start_date ?? '');
  formData.append('personal[phone]', draft.personal.phone ?? '');
  formData.append('personal[email]', draft.personal.email ?? '');
  formData.append('personal[address]', draft.personal.address ?? '');
  formData.append('personal[city]', draft.personal.city ?? '');
  formData.append('personal[bank_name]', draft.personal.bank_name ?? '');
  formData.append('personal[bank_account_number]', draft.personal.bank_account_number ?? '');
  formData.append('personal[cnps_number]', draft.personal.cnps_number ?? '');

  if (draft.photo) formData.append('photo', draft.photo);

  formData.append('organizational[declared_department]', draft.organizational.declared_department ?? '');
  formData.append('organizational[declared_service]', draft.organizational.declared_service ?? '');
  formData.append('organizational[declared_job_title]', draft.organizational.declared_job_title ?? '');
  formData.append('organizational[declared_trade_body]', draft.organizational.declared_trade_body ?? '');
  formData.append('organizational[declared_qualification]', draft.organizational.declared_qualification ?? '');
  formData.append('organizational[declared_personnel_type]', draft.organizational.declared_personnel_type ?? '');
  formData.append('organizational[declared_administrative_status]', draft.organizational.declared_administrative_status ?? '');

  draft.dependents
    .filter((d) => !d.removed)
    .forEach((dependent, index) => {
      if (dependent.existing_id) {
        formData.append(`dependents[${index}][existing_id]`, String(dependent.existing_id));
      }
      formData.append(`dependents[${index}][relationship]`, dependent.relationship);
      formData.append(`dependents[${index}][first_name]`, dependent.first_name ?? '');
      formData.append(`dependents[${index}][last_name]`, dependent.last_name);
      formData.append(`dependents[${index}][birth_date]`, dependent.birth_date);
      formData.append(`dependents[${index}][birth_place]`, dependent.birth_place ?? '');
      formData.append(`dependents[${index}][gender]`, dependent.gender);
      formData.append(`dependents[${index}][phone]`, dependent.phone ?? '');
      formData.append(`dependents[${index}][email]`, dependent.email ?? '');
      formData.append(`dependents[${index}][address]`, dependent.address ?? '');

      (['photo', 'id_card', 'birth_certificate', 'marriage_certificate'] as const).forEach((key) => {
        const file = dependent.documents?.[key];
        if (file) formData.append(`dependents[${index}][${key}]`, file);
      });
    });

  draft.diplomas
    .filter((d) => !d.removed)
    .forEach((diploma, index) => {
      if (diploma.existing_id) {
        formData.append(`diplomas[${index}][existing_id]`, String(diploma.existing_id));
      }
      formData.append(`diplomas[${index}][type]`, diploma.type);
      formData.append(`diplomas[${index}][title]`, diploma.title);
      formData.append(`diplomas[${index}][institution]`, diploma.institution);
      formData.append(`diplomas[${index}][year_obtained]`, diploma.year_obtained);
      if (diploma.document) formData.append(`diplomas[${index}][document]`, diploma.document);
    });

  await apiClient.post(`/employee/census/${campaignId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}