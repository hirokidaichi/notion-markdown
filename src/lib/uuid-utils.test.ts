import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  isValidNotionId,
  normalizeNotionId,
  validateAndNormalizeNotionId,
} from "./uuid-utils.ts";

Deno.test("validateAndNormalizeNotionId - standard UUID format", () => {
  const testCases = [
    "123e4567-e89b-12d3-a456-426614174000",
    "550e8400-e29b-41d4-a716-446655440000",
    "00000000-0000-0000-0000-000000000000",
    "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
  ];

  testCases.forEach((uuid) => {
    const result = validateAndNormalizeNotionId(uuid);
    assertEquals(result.isValid, true);
    assertEquals(result.normalizedId, uuid.toLowerCase());
    assertEquals(result.error, undefined);
  });
});

Deno.test("validateAndNormalizeNotionId - compact UUID format", () => {
  const testCases = [
    {
      input: "123e4567e89b12d3a456426614174000",
      expected: "123e4567-e89b-12d3-a456-426614174000",
    },
    {
      input: "550e8400e29b41d4a716446655440000",
      expected: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      input: "00000000000000000000000000000000",
      expected: "00000000-0000-0000-0000-000000000000",
    },
    {
      input: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      expected: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = validateAndNormalizeNotionId(input);
    assertEquals(result.isValid, true);
    assertEquals(result.normalizedId, expected);
    assertEquals(result.error, undefined);
  });
});

Deno.test("validateAndNormalizeNotionId - Notion URL formats", () => {
  const testCases = [
    {
      input: "https://www.notion.so/workspace/123e4567e89b12d3a456426614174000",
      expected: "123e4567-e89b-12d3-a456-426614174000",
    },
    {
      input:
        "https://notion.so/myworkspace/550e8400-e29b-41d4-a716-446655440000",
      expected: "550e8400-e29b-41d4-a716-446655440000",
    },
    {
      input: "notion.so/test/123e4567e89b12d3a456426614174000?v=123",
      expected: "123e4567-e89b-12d3-a456-426614174000",
    },
    {
      input:
        "https://www.notion.so/123e4567-e89b-12d3-a456-426614174000#section",
      expected: "123e4567-e89b-12d3-a456-426614174000",
    },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = validateAndNormalizeNotionId(input);
    assertEquals(result.isValid, true);
    assertEquals(result.normalizedId, expected);
    assertEquals(result.error, undefined);
  });
});

Deno.test("validateAndNormalizeNotionId - invalid formats", () => {
  const testCases = [
    "",
    "   ",
    "not-a-uuid",
    "123e4567-e89b-12d3-a456", // too short
    "123e4567-e89b-12d3-a456-426614174000-extra", // too long
    "123g4567-e89b-12d3-a456-426614174000", // invalid character
    "123e4567e89b12d3a456426614174", // compact but too short
    "123e4567e89b12d3a456426614174000g", // compact but invalid character
    "https://example.com/123e4567e89b12d3a456426614174000", // wrong domain
  ];

  testCases.forEach((input) => {
    const result = validateAndNormalizeNotionId(input);
    assertEquals(result.isValid, false);
    assertEquals(result.normalizedId, undefined);
    assertEquals(typeof result.error, "string");
  });
});

Deno.test("validateAndNormalizeNotionId - edge cases", () => {
  // Test null and undefined
  const nullResult = validateAndNormalizeNotionId(null as unknown as string);
  assertEquals(nullResult.isValid, false);
  assertEquals(nullResult.error, "Input must be a non-empty string");

  const undefinedResult = validateAndNormalizeNotionId(undefined as unknown as string);
  assertEquals(undefinedResult.isValid, false);
  assertEquals(undefinedResult.error, "Input must be a non-empty string");

  // Test with whitespace
  const whitespaceResult = validateAndNormalizeNotionId(
    "  123e4567-e89b-12d3-a456-426614174000  ",
  );
  assertEquals(whitespaceResult.isValid, true);
  assertEquals(
    whitespaceResult.normalizedId,
    "123e4567-e89b-12d3-a456-426614174000",
  );
});

Deno.test("isValidNotionId - convenience function", () => {
  assertEquals(isValidNotionId("123e4567-e89b-12d3-a456-426614174000"), true);
  assertEquals(isValidNotionId("123e4567e89b12d3a456426614174000"), true);
  assertEquals(
    isValidNotionId(
      "https://notion.so/workspace/123e4567e89b12d3a456426614174000",
    ),
    true,
  );
  assertEquals(isValidNotionId("invalid-uuid"), false);
  assertEquals(isValidNotionId(""), false);
});

Deno.test("normalizeNotionId - convenience function", () => {
  assertEquals(
    normalizeNotionId("123e4567-e89b-12d3-a456-426614174000"),
    "123e4567-e89b-12d3-a456-426614174000",
  );
  assertEquals(
    normalizeNotionId("123e4567e89b12d3a456426614174000"),
    "123e4567-e89b-12d3-a456-426614174000",
  );
  assertEquals(
    normalizeNotionId(
      "https://notion.so/workspace/123e4567e89b12d3a456426614174000",
    ),
    "123e4567-e89b-12d3-a456-426614174000",
  );

  // Test that it throws on invalid input
  assertThrows(
    () => normalizeNotionId("invalid-uuid"),
    Error,
    "Invalid UUID format",
  );
});

Deno.test("validateAndNormalizeNotionId - case insensitive", () => {
  const upperCase = "123E4567-E89B-12D3-A456-426614174000";
  const lowerCase = "123e4567-e89b-12d3-a456-426614174000";
  const mixedCase = "123E4567-e89b-12D3-a456-426614174000";

  [upperCase, lowerCase, mixedCase].forEach((input) => {
    const result = validateAndNormalizeNotionId(input);
    assertEquals(result.isValid, true);
    assertEquals(result.normalizedId, lowerCase);
  });
});
