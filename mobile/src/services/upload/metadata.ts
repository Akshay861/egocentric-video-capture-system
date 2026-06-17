import type { NetworkType } from '../../types/upload';

export function mergeUploadMetadata(
  existingMetadataJson: string | null,
  networkType: NetworkType
): string {
  const base = existingMetadataJson ? safeParseJson(existingMetadataJson) : {};

  return JSON.stringify({
    ...base,
    networkTypeAtUpload: networkType,
    uploadedAt: new Date().toISOString(),
  });
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
