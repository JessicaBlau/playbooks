import { apiRequest } from './client';
import type { User } from '../types/domain';

export interface AuthResponse {
  token: string;
  user: User;
}

export function registerUser(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}
