import { apiClient } from './client';

export interface LeaveType {
    id: number;
    name: string;
    code: string;
    description: string | null;
    requires_document: boolean;
}

export interface LeaveBalance {
    eligible: boolean;
    service_year?: number;
    entitlement?: number;
    used?: number;
    available?: number;
    next_eligibility_date?: string;
    message?: string;
}

export interface LeaveSummary {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    is_split: boolean;
    status: 'pending' | 'approved' | 'rejected';
    current_step: string | null;
    has_returned: boolean;
}

export interface LeaveStep {
    name: string;
    order: number;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    resolved_by: string | null;
    comments: string | null;
    acted_at: string | null;
}

export interface LeaveDetail extends LeaveSummary {
    start_date_2: string | null;
    end_date_2: string | null;
    reason: string;
    destination: string | null;
    address_during_leave: string | null;
    document_url: string | null;
    rejection_reason: string | null;
    replacement: string | null;
    steps: LeaveStep[];
}

export interface NewLeavePayload {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    is_split?: boolean;
    start_date_2?: string;
    end_date_2?: string;
    reason: string;
    destination?: string;
    address_during_leave?: string;
    children_under_6_at_request?: number;
    documentFile?: File;
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
    const { data } = await apiClient.get<{ leave_types: LeaveType[] }>('/employee/leave-types');
    return data.leave_types;
}

export async function fetchLeaveBalance(leaveTypeId: number): Promise<LeaveBalance> {
    const { data } = await apiClient.get<LeaveBalance>('/employee/leaves/balance', {
        params: { leave_type_id: leaveTypeId },
    });
    return data;
}

export async function fetchLeaves(): Promise<LeaveSummary[]> {
    const { data } = await apiClient.get<{ leaves: LeaveSummary[] }>('/employee/leaves');
    return data.leaves;
}

export async function fetchLeave(id: number): Promise<LeaveDetail> {
    const { data } = await apiClient.get<{ leave: LeaveDetail }>(`/employee/leaves/${id}`);
    return data.leave;
}

export async function createLeave(payload: NewLeavePayload): Promise<LeaveDetail> {
    const formData = new FormData();
    formData.append('leave_type_id', String(payload.leave_type_id));
    formData.append('start_date', payload.start_date);
    formData.append('end_date', payload.end_date);
    formData.append('reason', payload.reason);

    if (payload.is_split) {
        formData.append('is_split', '1');
        if (payload.start_date_2) formData.append('start_date_2', payload.start_date_2);
        if (payload.end_date_2) formData.append('end_date_2', payload.end_date_2);
    }

    if (payload.destination) formData.append('destination', payload.destination);
    if (payload.address_during_leave) formData.append('address_during_leave', payload.address_during_leave);
    if (payload.children_under_6_at_request !== undefined) {
        formData.append('children_under_6_at_request', String(payload.children_under_6_at_request));
    }
    if (payload.documentFile) formData.append('document', payload.documentFile);

    const { data } = await apiClient.post<{ leave: LeaveDetail }>('/employee/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.leave;
}