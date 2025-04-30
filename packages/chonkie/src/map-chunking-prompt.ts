import { LanguageModelV1Prompt } from '@ai-sdk/provider';

/**
 * Maps the AI SDK prompt structure to the simple text input expected by Chonkie.
 * Chonkie primarily operates on raw text. It extracts the text content.
 */
export function mapChunkingPromptToChonkieFormat(
  prompt: LanguageModelV1Prompt,
): { text: string } {
  let textContent = '';

  for (const message of prompt) {
    if (message.role === 'user' || message.role === 'system') {
      // Concatenate content parts, assuming they are text
      textContent += message.content
        .map(part => {
          if (part.type === 'text') {
            return part.text;
          }
          // Handle other types if necessary, e.g., log a warning or error
          console.warn(`Unsupported content part type: ${part.type} in Chonkie prompt mapping. Only text is supported.`);
          return '';
        })
        .join('');
    }
    // Ignore 'assistant' and 'tool' messages for chunking input
  }

  if (!textContent) {
    throw new Error('Chonkie provider requires text content in user or system messages.');
  }

  return { text: textContent };
}
