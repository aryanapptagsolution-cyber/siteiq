import { apiClient } from './client';
import { User } from '@/types/user';

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { user: User; token: string; }

// Demo users — works fully offline without a backend
const MOCK_USERS: Record<string, LoginResponse> = {
    'admin@siteiq.com': {
        token: 'mock-jwt-admin-token',
        user: { id: 'u1', name: 'Mike Torres', email: 'admin@siteiq.com', role: 'admin', avatarInitials: 'MT' },
    },
    'planner@siteiq.com': {
        token: 'mock-jwt-planner-token',
        user: { id: 'u2', name: 'John Doe', email: 'planner@siteiq.com', role: 'planner', avatarInitials: 'JD' },
    },
    'analyst@siteiq.com': {
        token: 'mock-jwt-analyst-token',
        user: { id: 'u3', name: 'Sarah Chen', email: 'analyst@siteiq.com', role: 'analyst', avatarInitials: 'SC' },
    },
    'viewer@siteiq.com': {
        token: 'mock-jwt-viewer-token',
        user: { id: 'u4', name: 'Jessica Park', email: 'viewer@siteiq.com', role: 'viewer', avatarInitials: 'JP' },
    },
};

const MOCK_PASSWORD = 'demo1234';

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        // Try the real API first
        try {
            const res = await apiClient.post<LoginResponse>('/auth/login', data);
            return res.data;
        } catch {
            // Fall back to mock credentials when API is unreachable
            const mock = MOCK_USERS[data.email.toLowerCase()];
            if (mock && data.password === MOCK_PASSWORD) {
                return mock;
            }
            throw new Error('Invalid credentials');
        }
    },
};
