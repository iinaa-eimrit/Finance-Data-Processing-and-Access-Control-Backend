import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Accepts 'VIEWER' | 'ANALYST' | 'ADMIN'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
