import { apiClient } from './client';

export interface AppInfo {
    hospital_name: string;
    hospital_short_name: string;
    logo_url: string | null;
}

export async function fetchAppInfo(): Promise<AppInfo> {
    const { data } = await apiClient.get<AppInfo>('/app-info');
    return data;
}