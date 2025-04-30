import {
  InvalidResponseDataError,
  ParseResult,
  ResponseValidationError,
  safeParseJSON,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';

// Schema for the expected error structure based on openapi.json (ErrorRES)
export const ChonkieErrorDataSchema = z.object({
    message: z.string(),
    status: z.number().int().optional().default(500), // Default added based on schema
});

export type ChonkieErrorData = z.infer<typeof ChonkieErrorDataSchema>;

// Validator function (can be expanded if needed)
export function validateChonkieResponse({
  response,
  data,
}: {
  response: Response;
  data: unknown;
}): ParseResult<unknown> { // Return unknown as success type varies
  // Standard validation can go here if needed, e.g., checking specific headers
  // For now, just return success as the schema validation happens in postToApi
  return { success: true, value: data };
}

// Example of how you might use this in postToApi (already done in the model file)
// This file primarily defines the error schema.
