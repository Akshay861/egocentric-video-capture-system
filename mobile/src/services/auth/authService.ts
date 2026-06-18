import type { AuthSession, LoginInput } from '../../types/auth';
import { createRandomId, createStableWorkerId } from '../../utils/ids';
import { userMessages } from '../../utils/userMessages';
import { clearSession, loadSession, saveSession } from './sessionStorage';

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

export function validateLoginInput(input: LoginInput): string | null {
  const normalized = normalizeIdentifier(input.identifier, input.identifierType);

  if (!normalized) {
    return userMessages.login.emptyIdentifier;
  }

  if (input.identifierType === 'email' && !isValidEmail(normalized)) {
    return userMessages.login.invalidEmail;
  }

  if (input.identifierType === 'phone' && !isValidPhone(normalized)) {
    return userMessages.login.invalidPhone;
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
    token: createRandomId(),
    workerId: createStableWorkerId(normalized),
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
