import type { NetworkType } from '../../types/upload';

export function mergeUploadMetadata(
  existingMetadataJson: string | null,
  networkType: NetworkType,
  uploadDetails: {
    s3Key: string;
    etag: string | null;
    uploadedAt: string;
  }
): string {
  const base = existingMetadataJson ? safeParseJson(existingMetadataJson) : {};

  return JSON.stringify({
    ...base,
    networkTypeAtUpload: networkType,
    s3Key: uploadDetails.s3Key,
    s3Etag: uploadDetails.etag,
    uploadedAt: uploadDetails.uploadedAt,
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
