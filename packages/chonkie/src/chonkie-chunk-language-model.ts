import {
  LanguageModelV1,
  LanguageModelV1CallWarning,
  LanguageModelV1CallOptions,
  LanguageModelV1CallResult,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import {
  ParseResult,
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  fetchWithRetry,
  generateId,
  loadApiKey,
  postJsonToApi,
  postToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import {
  ChonkieChunkerSettings,
  ChonkieModelId,
  ChonkieSettingsSchemas,
} from './chonkie-chunk-settings';
import { mapChunkingPromptToChonkieFormat } from './map-chunking-prompt';
import { ChonkieErrorData, validateChonkieResponse } from './chonkie-error';

// Define the expected response structure based on openapi.json schemas
// Using a generic Chunk type for simplicity, specific types can be added if needed
const ChonkieChunkSchema = z.object({
  text: z.string(),
  start_index: z.number().int(),
  end_index: z.number().int(),
  token_count: z.number().int().optional(), // Optional based on different chunker responses
  // Add other potential fields like level, sentences, embedding, nodes based on specific chunker schemas if needed
  // For now, keeping it minimal
});

const ChonkieResponseSchema = z.array(ChonkieChunkSchema);

export class ChonkieChunkLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly defaultObjectGenerationMode = undefined; // Chonkie doesn't generate objects in the AI SDK sense

  readonly modelId: ChonkieModelId;
  readonly settings: ChonkieChunkerSettings;
  readonly providerSettings: {
    provider: string;
    baseURL: string;
    headers: () => Record<string, string | undefined>;
    generateId: () => string;
    fetch?: typeof fetch;
  };

  constructor(
    modelId: ChonkieModelId,
    settings: ChonkieChunkerSettings,
    providerSettings: {
      provider: string;
      baseURL: string;
      headers: () => Record<string, string | undefined>;
      generateId: () => string;
      fetch?: typeof fetch;
    },
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.providerSettings = providerSettings;
  }

  private get baseHeaders() {
    return this.providerSettings.headers();
  }

  private get URL() {
    return `${this.providerSettings.baseURL}/v1/chunk/${this.modelId}`;
  }

  // Chonkie doesn't stream responses in the typical LLM sense.
  // We implement doStream to fulfill the interface, but it will behave like doGenerate.
  async doStream(
    options: LanguageModelV1CallOptions,
  ): Promise<LanguageModelV1CallResult & { stream: ReadableStream<LanguageModelV1StreamPart> }> {
    const result = await this.doGenerate(options);

    // Create a simple stream that sends the complete result in one chunk
    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      start(controller) {
        // Send finish event with all data
        controller.enqueue({
          type: 'finish',
          finishReason: result.finishReason,
          logprobs: undefined, // Not applicable
          usage: result.usage,
          providerMetadata: result.providerMetadata,
        });
        controller.close();
      },
    });


    return { ...result, stream };
  }


  async doGenerate(
    options: LanguageModelV1CallOptions,
  ): Promise<LanguageModelV1CallResult> {
    const { mode, prompt, abortSignal, headers, maxRetries, fetch } = options;

    // Validate settings against the specific schema for the modelId
    const settingsSchema = ChonkieSettingsSchemas[this.modelId];
    const validatedSettings = settingsSchema.parse(this.settings);

    // Map the AI SDK prompt to the text/data expected by Chonkie
    const { text } = mapChunkingPromptToChonkieFormat(prompt);

    // Prepare FormData
    const formData = new FormData();
    formData.append('text', text);

    // Append settings to FormData
    for (const [key, value] of Object.entries(validatedSettings)) {
      if (value !== undefined) {
        // FormData expects string values
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    // Add return_type=chunks explicitly as required by our parsing logic
    formData.append('return_type', 'chunks');


    const response = await postToApi({
      url: this.URL,
      headers: combineHeaders(this.baseHeaders, headers),
      body: {
        format: 'form-data', // Specify FormData format
        content: formData,
      },
      fetch: fetch ?? this.providerSettings.fetch,
      maxRetries,
      abortSignal,
      errorSchema: ChonkieErrorData, // Use the defined error schema
      responseSchema: ChonkieResponseSchema, // Use the defined success schema
      validateResponse: validateChonkieResponse, // Custom validation if needed
    });

    // Extract chunks from the validated response
    const chunks = response.value; // Assuming response.value holds the array of chunks

    // We need to return a LanguageModelV1CallResult.
    // Since Chonkie returns chunks, not a single text response or tool calls,
    // we'll store the raw chunks in providerMetadata.
    // The 'text' field could be empty, a summary, or potentially the first chunk's text,
    // depending on what's most useful downstream. Let's keep it empty for now.
    const warnings: LanguageModelV1CallWarning[] = [];
    if (response.warnings) {
        warnings.push(...response.warnings);
    }


    return {
      text: '', // No single text response
      toolCalls: undefined, // No tool calls
      finishReason: 'stop', // Chunking finished successfully
      usage: {
        // Chonkie API doesn't seem to return token usage for the operation itself
        promptTokens: 0, // Placeholder
        completionTokens: 0, // Placeholder
        totalTokens: 0, // Placeholder
      },
      providerMetadata: {
        provider: this.providerSettings.provider,
        chunks: chunks, // Store the actual chunk data here
      },
      warnings,
    };
  }
}
