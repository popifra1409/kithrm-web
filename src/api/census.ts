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

export interface CensusCurrentResponse {
    campaign: CensusCampaignInfo | null;
    submission_status?: 'submitted' | 'validated' | 'rejected' | null;
    rejection_reason?: string | null;
    current_data?: {
        personal: { phone: string | null; email: string | null; address: string | null; city: string | null };
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
    personal: { phone: string; email: string; address: string; city: string };
    dependents: CensusDraftDependent[];
    diplomas: CensusDraftDiploma[];
}

export function buildInitialDraft(current: CensusCurrentResponse): CensusDraft {
    const data = current.current_data;

    return {
        personal: {
            phone: data?.personal.phone ?? '',
            email: data?.personal.email ?? '',
            address: data?.personal.address ?? '',
            city: data?.personal.city ?? '',
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

    formData.append('personal[phone]', draft.personal.phone ?? '');
    formData.append('personal[email]', draft.personal.email ?? '');
    formData.append('personal[address]', draft.personal.address ?? '');
    formData.append('personal[city]', draft.personal.city ?? '');

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