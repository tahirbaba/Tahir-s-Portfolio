// Voice notes -> text. Optional: works with any OpenAI-compatible /audio/transcriptions endpoint
// (e.g. Groq or OpenAI Whisper). If not configured, the bot politely asks for a typed message.

import { config } from "./config.js";
import type { MediaFile } from "./whatsapp/client.js";

export interface Transcriber {
  enabled: boolean;
  transcribe(file: MediaFile): Promise<string>;
}

export class HttpTranscriber implements Transcriber {
  get enabled(): boolean {
    return Boolean(config.stt.url && config.stt.key);
  }

  async transcribe(file: MediaFile): Promise<string> {
    const form = new FormData();
    const ext = file.mimeType.includes("mpeg") ? "mp3" : "ogg";
    form.append("file", new Blob([new Uint8Array(file.data)], { type: file.mimeType }), `voice.${ext}`);
    form.append("model", config.stt.model);
    const res = await fetch(config.stt.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.stt.key}` },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const out = (await res.json()) as { text?: string };
    return (out.text ?? "").trim();
  }
}
