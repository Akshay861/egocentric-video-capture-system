import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import type { AuthSession, LoginInput } from '../../types/auth';
import { clearSession, loadSession, saveSession } from './sessionStorage';

const WORKER_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function normalizeIdentifier(identifier: string, type: LoginInput['identifierType']): string {
  const trimmed = identifier.trim();

  if (type === 'email') {
    return trimmed.toLowerCase();
  }

  return trimmed.replace(/\s+/g, '');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string): boolean {
  return /^\+?[0-9]{8,15}$/.test(value.replace(/\s+/g, ''));
}

function createWorkerId(identifier: string): string {
  return uuidv5(identifier, WORKER_ID_NAMESPACE);
}

export function validateLoginInput(input: LoginInput): string | null {
  const normalized = normalizeIdentifier(input.identifier, input.identifierType);

  if (!normalized) {
    return 'Please enter your email or phone number.';
  }

  if (input.identifierType === 'email' && !isValidEmail(normalized)) {
    return 'Please enter a valid email address.';
  }

  if (input.identifierType === 'phone' && !isValidPhone(normalized)) {
    return 'Please enter a valid phone number.';
  }

  return null;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const validationError = validateLoginInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const normalized = normalizeIdentifier(input.identifier, input.identifierType);
  const session: AuthSession = {
    token: uuidv4(),
    workerId: createWorkerId(normalized),
    identifier: normalized,
    identifierType: input.identifierType,
    loggedInAt: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
}

export async function restoreSession(): Promise<AuthSession | null> {
  return loadSession();
}

export async function logout(): Promise<void> {
  await clearSession();
}
