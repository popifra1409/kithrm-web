import { apiClient } from './client';

export interface Diploma {
    id: number;
    type: 'recruitment_diploma' | 'highest_diploma' | 'training';
    type_label: string;
    title: string;
    institution: string;
    year_obtained: number;
    validation_status: 'pending' | 'validated' | 'rejected';
    validation_status_label: string;
    rejection_reason: string | null;
    document_url: string | null;
}

export interface NewDiplomaPayload {
    type: 'recruitment_diploma' | 'highest_diploma' | 'training';
    title: string;
    institution: string;
    year_obtained: number;
    documentFile: File;
}

export async function fetchDiplomas(): Promise<Diploma[]> {
    const { data } = await apiClient.get<{ diplomas: Diploma[] }>('/employee/diplomas');
    return data.diplomas;
}

export async function createDiploma(payload: NewDiplomaPayload): Promise<Diploma> {
    const formData = new FormData();
    formData.append('type', payload.type);
    formData.append('title', payload.title);
    formData.append('institution', payload.institution);
    formData.append('year_obtained', String(payload.year_obtained));
    formData.append('document', payload.documentFile);

    const { data } = await apiClient.post<{ diploma: Diploma }>('/employee/diplomas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.diploma;
}

export async function deleteDiploma(id: number): Promise<void> {
    await apiClient.delete(`/employee/diplomas/${id}`);
}