// The model behind the agent. Kept behind a tiny interface so tests can use a scripted fake.

import Anthropic from "@anthropic-ai/sdk";

export interface LLM {
  create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
}

export class AnthropicLLM implements LLM {
  private client: Anthropic;

  constructor(apiKey?: string) {
    // Reads ANTHROPIC_API_KEY from the environment when apiKey is not given.
    this.client = new Anthropic(apiKey ? { apiKey, maxRetries: 3 } : { maxRetries: 3 });
  }

  create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> {
    return this.client.messages.create(params);
  }
}
