import {
  loadApiKey,
  withoutTrailingSlash,
  generateId,
} from '@ai-sdk/provider-utils';
import { ChonkieChunkLanguageModel } from './chonkie-chunk-language-model';
import {
  ChonkieChunkerSettings,
  ChonkieModelId,
} from './chonkie-chunk-settings';

export interface ChonkieProvider {
  (
    modelId: ChonkieModelId,
    settings?: ChonkieChunkerSettings,
  ): ChonkieChunkLanguageModel;

  // Explicit method for clarity, though functionally same as the main export
  chunk(
    modelId: ChonkieModelId,
    settings?: ChonkieChunkerSettings,
  ): ChonkieChunkLanguageModel;
}

export interface ChonkieProviderSettings {
  /**
   * Base URL for the Chonkie API.
   * @default 'https://api.chonkie.ai'
   */
  baseURL?: string;

  /**
   * Chonkie API key.
   * @default process.env.CHONKIE_API_KEY
   */
  apiKey?: string;

  /**
   * Custom headers to include in API requests.
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation.
   */
  fetch?: typeof fetch;

   /**
    * Custom id generator.
    * @default nanoid
    */
   generateId?: () => string;
}

/**
 * Creates a Chonkie provider instance for chunking text.
 */
export function createChonkie(
  options: ChonkieProviderSettings = {},
): ChonkieProvider {
  const createChunkingModel = (
    modelId: ChonkieModelId,
    settings: ChonkieChunkerSettings = {},
  ) => {
    // Validate modelId against known types (basic check)
    const knownModelIds: ChonkieModelId[] = [
      'token', 'sentence', 'recursive', 'semantic', 'sdpm', 'late', 'code', 'neural', 'slumber'
    ];
    if (!knownModelIds.includes(modelId)) {
        console.warn(`Unknown Chonkie modelId: ${modelId}. Using it directly as endpoint path.`);
    }

    return new ChonkieChunkLanguageModel(modelId, settings, {
      provider: 'chonkie.chunk',
      baseURL:
        withoutTrailingSlash(options.baseURL) ?? 'https://api.chonkie.ai',
      headers: () => ({
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'CHONKIE_API_KEY',
          description: 'Chonkie',
        })}`,
        ...options.headers,
      }),
      generateId: options.generateId ?? generateId,
      fetch: options.fetch,
    });
  }

  const provider = function (
    modelId: ChonkieModelId,
    settings?: ChonkieChunkerSettings,
  ) {
    if (new.target) {
      throw new Error(
        'The Chonkie model factory function cannot be called with the new keyword.',
      );
    }
    return createChunkingModel(modelId, settings);
  };

  provider.chunk = createChunkingModel;

  return provider as ChonkieProvider;
}

/**
 * Default Chonkie provider instance.
 */
export const chonkie = createChonkie();
