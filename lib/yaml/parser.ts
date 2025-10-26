/**
 * YAML parsing utilities with Zod validation
 */

import * as yaml from 'js-yaml';
import { z } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Parse YAML string and validate against Zod schema
 * @param yamlString - Raw YAML string content
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or errors
 */
export function parseYAML<T>(
  yamlString: string,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    // Use safe loading to prevent code execution
    const parsed = yaml.load(yamlString);

    // Validate with Zod schema
    const validated = schema.safeParse(parsed);

    if (validated.success) {
      return { success: true, data: validated.data };
    } else {
      // Transform Zod errors into user-friendly messages
      const errorMessage = validated.error.message || 'Validation error';
      return {
        success: false,
        errors: [errorMessage],
      };
    }
  } catch (error) {
    // Handle YAML parsing errors
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
    };
  }
}

/**
 * Parse YAML file content (for client-side or Node.js usage)
 * @param fileContent - File content as string
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or errors
 */
export function parseYAMLFile<T>(
  fileContent: string,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  return parseYAML(fileContent, schema);
}
