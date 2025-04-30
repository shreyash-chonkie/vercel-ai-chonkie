import { z } from 'zod';

// Define Zod schemas for each chunker request type based on openapi.json
// Note: We only include configurable parameters here. 'text' will be handled separately.

const TokenChunkerSettingsSchema = z.object({
  tokenizer: z.string().default('gpt2'),
  chunk_size: z.number().int().positive().default(512),
  chunk_overlap: z.number().int().nonnegative().default(0),
  // return_type is handled internally by the provider
});
export type ChonkieTokenChunkerSettings = z.infer<
  typeof TokenChunkerSettingsSchema
>;

const SentenceChunkerSettingsSchema = z.object({
  tokenizer_or_token_counter: z.string().default('gpt2'),
  chunk_size: z.number().int().positive().default(512),
  chunk_overlap: z.number().int().nonnegative().default(0),
  min_sentences_per_chunk: z.number().int().positive().default(1),
  min_characters_per_sentence: z.number().int().positive().default(1),
  approximate: z.boolean().default(true),
  delim: z.union([z.string(), z.array(z.string())]).default(['\n', '.', '!', '?']),
  include_delim: z.enum(['prev', 'next', 'both', 'none']).default('prev'),
  // return_type is handled internally
});
export type ChonkieSentenceChunkerSettings = z.infer<
  typeof SentenceChunkerSettingsSchema
>;

const RecursiveChunkerSettingsSchema = z.object({
  tokenizer_or_token_counter: z.string().default('gpt2'),
  chunk_size: z.number().int().positive().default(512),
  recipe: z.string().default('default'),
  lang: z.string().default('en'),
  min_characters_per_chunk: z.number().int().positive().default(1),
  // return_type is handled internally
});
export type ChonkieRecursiveChunkerSettings = z.infer<
  typeof RecursiveChunkerSettingsSchema
>;

const SemanticChunkerSettingsSchema = z.object({
  embedding_model: z.string().default('minishlab/potion-base-8M'),
  threshold: z.union([z.literal('auto'), z.number(), z.string()]).default('auto'), // string for percentile e.g. "95%"
  chunk_size: z.number().int().positive().default(512),
  similarity_window: z.number().int().positive().default(1),
  min_sentences: z.number().int().positive().default(1),
  min_chunk_size: z.number().int().positive().default(2),
  min_characters_per_sentence: z.number().int().positive().default(12),
  threshold_step: z.number().positive().default(0.01),
  delim: z.union([z.string(), z.array(z.string())]).default(['.', '!', '?', '\n']),
  include_delim: z.enum(['prev', 'next', 'both', 'none']).default('prev'),
  // return_type is handled internally
});
export type ChonkieSemanticChunkerSettings = z.infer<
  typeof SemanticChunkerSettingsSchema
>;

const SDPMChunkerSettingsSchema = z.object({
  embedding_model: z.string().default('minishlab/potion-base-8M'),
  threshold: z.union([z.literal('auto'), z.number(), z.string()]).default('auto'),
  mode: z.enum(['window', 'cumulative']).default('window'),
  chunk_size: z.number().int().positive().default(512),
  similarity_window: z.number().int().positive().default(1),
  min_sentences: z.number().int().positive().default(1),
  min_characters_per_sentence: z.number().int().positive().default(12),
  threshold_step: z.number().positive().default(0.01),
  delim: z.union([z.string(), z.array(z.string())]).default(['.', '!', '?', '\n']),
  skip_window: z.number().int().positive().default(1),
  // return_type is handled internally
});
export type ChonkieSDPMChunkerSettings = z.infer<typeof SDPMChunkerSettingsSchema>;

const LateChunkerSettingsSchema = z.object({
  embedding_model: z.string().default('sentence-transformers/all-minilm-l6-v2'),
  chunk_size: z.number().int().positive().default(512),
  recipe: z.string().default('default'),
  lang: z.string().default('en'),
  min_characters_per_chunk: z.number().int().positive().default(24), // Note: API calls this min_characters_per_sentence, but schema name is min_characters_per_chunk
});
export type ChonkieLateChunkerSettings = z.infer<
  typeof LateChunkerSettingsSchema
>;

// CodeChunker settings might need language specification, etc.
// Assuming basic settings for now.
const CodeChunkerSettingsSchema = z.object({
  // Add relevant settings from openapi.json if needed, e.g., language, include_nodes
  chunk_size: z.number().int().positive().default(512), // Assuming a default, check API docs
  // return_type is handled internally
});
export type ChonkieCodeChunkerSettings = z.infer<
  typeof CodeChunkerSettingsSchema
>;

// NeuralChunker settings
const NeuralChunkerSettingsSchema = z.object({
  // Add relevant settings from openapi.json if needed
  chunk_size: z.number().int().positive().default(512), // Assuming a default
  // return_type is handled internally
});
export type ChonkieNeuralChunkerSettings = z.infer<
  typeof NeuralChunkerSettingsSchema
>;

// SlumberChunker settings
const SlumberChunkerSettingsSchema = z.object({
  // Add relevant settings from openapi.json if needed, e.g., genie_config
  chunk_size: z.number().int().positive().default(512), // Assuming a default
  // return_type is handled internally
});
export type ChonkieSlumberChunkerSettings = z.infer<
  typeof SlumberChunkerSettingsSchema
>;

// Union of all possible settings
export type ChonkieChunkerSettings =
  | ChonkieTokenChunkerSettings
  | ChonkieSentenceChunkerSettings
  | ChonkieRecursiveChunkerSettings
  | ChonkieSemanticChunkerSettings
  | ChonkieSDPMChunkerSettings
  | ChonkieLateChunkerSettings
  | ChonkieCodeChunkerSettings
  | ChonkieNeuralChunkerSettings
  | ChonkieSlumberChunkerSettings;

// Define Model IDs based on the API endpoints
export type ChonkieModelId =
  | 'token'
  | 'sentence'
  | 'recursive'
  | 'semantic'
  | 'sdpm'
  | 'late'
  | 'code'
  | 'neural'
  | 'slumber';

// Map Model IDs to their respective settings schemas for validation
export const ChonkieSettingsSchemas: Record<
  ChonkieModelId,
  z.ZodType<any>
> = {
  token: TokenChunkerSettingsSchema,
  sentence: SentenceChunkerSettingsSchema,
  recursive: RecursiveChunkerSettingsSchema,
  semantic: SemanticChunkerSettingsSchema,
  sdpm: SDPMChunkerSettingsSchema,
  late: LateChunkerSettingsSchema,
  code: CodeChunkerSettingsSchema, // Add specific schema if needed
  neural: NeuralChunkerSettingsSchema, // Add specific schema if needed
  slumber: SlumberChunkerSettingsSchema, // Add specific schema if needed
};
