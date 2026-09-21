import { apiClient } from './client';

export interface Dependent {
    id: number;
    relationship: string;
    relationship_label: string;
    full_name: string;
    birth_date: string | null;
    age: number | null;
    gender: string | null;
    validation_status: 'pending' | 'validated' | 'rejected';
    validation_status_label: string;
    rejection_reason: string | null;
    photo_url: string | null;
}

export interface NewDependentPayload {
    relationship: 'spouse' | 'child' | 'father' | 'mother';
    first_name?: string;
    last_name: string;
    birth_date: string;
    birth_place?: string;
    gender: 'M' | 'F';
    phone?: string;
    email?: string;
    address?: string;
    photoFile?: File;
    idCardFile?: File;
    birthCertificateFile: File;
    marriageCertificateFile?: File;
}

export async function fetchDependents(): Promise<Dependent[]> {
    const { data } = await apiClient.get<{ dependents: Dependent[] }>('/employee/dependents');
    return data.dependents;
}

export async function createDependent(payload: NewDependentPayload): Promise<Dependent> {
    const formData = new FormData();
    formData.append('relationship', payload.relationship);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    formData.append('last_name', payload.last_name);
    formData.append('birth_date', payload.birth_date);
    if (payload.birth_place) formData.append('birth_place', payload.birth_place);
    formData.append('gender', payload.gender);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.email) formData.append('email', payload.email);
    if (payload.address) formData.append('address', payload.address);
    if (payload.photoFile) formData.append('photo', payload.photoFile);
    if (payload.idCardFile) formData.append('id_card_path', payload.idCardFile);
    formData.append('birth_certificate_path', payload.birthCertificateFile);
    if (payload.marriageCertificateFile) formData.append('marriage_certificate_path', payload.marriageCertificateFile);

    const { data } = await apiClient.post<{ dependent: Dependent }>('/employee/dependents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.dependent;
}

export async function deleteDependent(id: number): Promise<void> {
    await apiClient.delete(`/employee/dependents/${id}`);
}