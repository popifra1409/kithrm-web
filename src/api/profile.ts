import { apiClient } from './client';

export interface EmployeeProfile {
    id: number;
    matricule: string;
    full_name: string;
    first_name: string | null;
    last_name: string;
    gender: string | null;
    birth_date: string | null;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    department: string | null;
    service: string | null;
    sector: string | null;
    trade_body: string | null;
    qualification: string | null;
    job_title: string | null;
    administrative_status: string | null;
    administrative_status_label: string | null;
    category_number: string | null;
    echelon_number: string | null;
    recruitment_date: string | null;
    is_active: boolean;
}

export interface UpdateProfilePayload {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
}

export async function fetchProfile(): Promise<EmployeeProfile> {
    const { data } = await apiClient.get<{ employee: EmployeeProfile }>('/employee/profile');
    return data.employee;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<EmployeeProfile> {
    const { data } = await apiClient.put<{ employee: EmployeeProfile }>('/employee/profile', payload);
    return data.employee;
}

export async function uploadProfilePhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const { data } = await apiClient.post<{ photo_url: string }>('/employee/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.photo_url;
}