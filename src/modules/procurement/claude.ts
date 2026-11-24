import { parseProductFile } from "@/modules/catalog/import-export";
import { ApiError } from "@/server/api-error";
import { extractDocxText, type MaterialDocumentProvider } from "./documents";
import { extractionPrompt, parseExtraction } from "./extraction-result";

type DocumentInput = Parameters<MaterialDocumentProvider["extract"]>[0];

async function contentBlock(input: DocumentInput) {
  const { mime, bytes } = input;
  if (mime === "application/pdf" || mime === "image/jpeg" || mime === "image/png") {
    return {
      type: mime === "application/pdf" ? "document" : "image",
      source: { type: "base64", media_type: mime, data: Buffer.from(bytes).toString("base64") },
    };
  }
  const ext = input.filename.split(".").pop()?.toLowerCase();
  let text: string;
  if (ext === "docx") {
    text = extractDocxText(Buffer.from(bytes));
  } else if (ext === "csv") {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } else if (ext === "xlsx") {
    const file = new File([new Uint8Array(bytes)], "materials.xlsx", { type: mime });
    text = JSON.stringify(await parseProductFile(file));
  } else {
    throw new Error("unsupported_file");
  }
  if (!text.trim() || text.length > 240000) throw new Error("document_size");
  return { type: "text", text };
}

export function createClaudeDocumentProvider(key: string, model: string): MaterialDocumentProvider {
  return {
    name: "claude",
    async extract(input, signal) {
      const timeout = AbortSignal.timeout(150000);
      const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
      try {
        abort.throwIfAborted();
        const content = await contentBlock(input);
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          redirect: "error",
          signal: abort,
          body: JSON.stringify({
            model,
            max_tokens: 12000,
            system: extractionPrompt,
            messages: [{
              role: "user",
              content: [content, { type: "text", text: "Extract the complete material list as JSON." }],
            }],
          }),
        });
        if (!response.ok) throw new Error("completion_failed");
        const data = await response.json();
        if (data.stop_reason !== "end_turn" || !Array.isArray(data.content))
          throw new Error("incomplete");
        const text = data.content
          .filter((block: { type?: string; text?: string }) => block?.type === "text")
          .map((block: { text: string }) => block.text)
          .join("");
        return parseExtraction(text);
      } catch {
        throw new ApiError(
          503,
          "ai_extraction_failed",
          "Не удалось распознать список. Менеджер проверит файл вручную.",
        );
      }
    },
  };
}
