export interface UuidValidationResult {
  isValid: boolean;
  normalizedId?: string;
  error?: string;
}

export function validateAndNormalizeNotionId(
  input: string,
): UuidValidationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      error: "Input must be a non-empty string",
    };
  }

  const trimmedInput = input.trim();

  // Try to extract UUID from Notion URL
  // Handle both workspace/uuid and direct uuid patterns
  const urlMatch = trimmedInput.match(
    /(?:https?:\/\/)?(?:www\.)?notion\.so\/(?:[^\/]*\/)?([a-f0-9-]+)(?:\?|#|$)/i,
  );
  if (urlMatch) {
    return validateAndNormalizeNotionId(urlMatch[1]);
  }

  // Remove any remaining query parameters or fragments
  const cleanInput = trimmedInput.split("?")[0].split("#")[0];

  // Check if it's already a properly formatted UUID (with hyphens)
  const standardUuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (standardUuidRegex.test(cleanInput)) {
    return {
      isValid: true,
      normalizedId: cleanInput.toLowerCase(),
    };
  }

  // Check if it's a UUID without hyphens (32 hex characters)
  const compactUuidRegex = /^[0-9a-f]{32}$/i;
  if (compactUuidRegex.test(cleanInput)) {
    // Convert to standard UUID format with hyphens
    const normalizedId = [
      cleanInput.slice(0, 8),
      cleanInput.slice(8, 12),
      cleanInput.slice(12, 16),
      cleanInput.slice(16, 20),
      cleanInput.slice(20, 32),
    ].join("-").toLowerCase();

    return {
      isValid: true,
      normalizedId,
    };
  }

  return {
    isValid: false,
    error:
      "Invalid UUID format. Expected standard UUID, compact UUID, or Notion URL",
  };
}

export function isValidNotionId(input: string): boolean {
  return validateAndNormalizeNotionId(input).isValid;
}

export function normalizeNotionId(input: string): string {
  const result = validateAndNormalizeNotionId(input);
  if (!result.isValid) {
    throw new Error(result.error || "Invalid UUID format");
  }
  return result.normalizedId!;
}
