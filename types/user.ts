export type Role = 'viewer' | 'analyst' | 'planner' | 'admin';

export type Permission =
  | 'view_dashboard'
  | 'adjust_sliders'
  | 'save_presets'
  | 'export_csv'
  | 'export_pdf'
  | 'view_pii'
  | 'run_ingestion'
  | 'manage_presets'
  | 'view_audit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['view_dashboard'],
  analyst: [
    'view_dashboard',
    'adjust_sliders',
    'save_presets',
    'export_csv',
    'export_pdf',
    'view_pii',
  ],
  planner: [
    'view_dashboard',
    'adjust_sliders',
    'save_presets',
    'export_csv',
    'export_pdf',
    'view_pii',
    'manage_presets',
    'view_audit',
  ],
  admin: [
    'view_dashboard',
    'adjust_sliders',
    'save_presets',
    'export_csv',
    'export_pdf',
    'view_pii',
    'run_ingestion',
    'manage_presets',
    'view_audit',
  ],
};
