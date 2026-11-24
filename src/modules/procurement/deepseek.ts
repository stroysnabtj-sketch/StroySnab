import { extractionPrompt, parseExtraction } from "./extraction-result";
import { ApiError } from "@/server/api-error";
import type { MaterialDocumentProvider } from "./documents";

export function createDeepSeekDocumentProvider(
  key: string,
  model = "deepseek-flash",
): MaterialDocumentProvider {
  return {
    name: "deepseek",
    async extract(input, signal) {
      if (!key.trim())
        throw new ApiError(503, "ai_unavailable", "Автоматическая подготовка временно недоступна");
      const headers = { Authorization: `Bearer ${key.trim()}` };
      let fileId: string | undefined;
      const timeout = AbortSignal.timeout(150000);
      const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
      try {
        const ext = input.filename.split(".").pop()?.toLowerCase() ?? "bin";
        const form = new FormData();
        form.set("purpose", ["csv", "xlsx"].includes(ext) ? "user_data" : "text_recognition");
        form.set("expires_after[anchor]", "created_at");
        form.set("expires_after[seconds]", "3600");
        form.set(
          "file",
          new Blob([new Uint8Array(input.bytes)], { type: input.mime }),
          `materials.${ext}`,
        );
        const uploaded = await fetch("https://api.deepseek.com/files", {
          method: "POST",
          headers,
          body: form,
          signal: abort,
          redirect: "error",
        });
        if (!uploaded.ok) throw new Error("upload_failed");
        const file = await uploaded.json();
        if (typeof file.id !== "string" || !/^file-api-[A-Za-z0-9_-]{1,150}$/.test(file.id))
          throw new Error("upload_failed");
        fileId = file.id;
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          signal: abort,
          redirect: "error",
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: extractionPrompt },
              {
                role: "user",
                content: [
                  { type: "file", file_id: fileId },
                  { type: "text", text: "Extract the complete material list as JSON." },
                ],
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 12000,
            temperature: 0,
            thinking: { type: "disabled" },
          }),
        });
        if (!response.ok) throw new Error("completion_failed");
        const data = await response.json();
        const choice = data.choices?.[0];
        if (
          choice?.finish_reason !== "stop" ||
          typeof choice.message?.content !== "string" ||
          choice.message.content.length > 200000
        )
          throw new Error("incomplete");
        return parseExtraction(choice.message.content);
      } catch {
        throw new ApiError(
          503,
          "ai_extraction_failed",
          "Не удалось распознать список. Менеджер проверит файл вручную.",
        );
      } finally {
        if (fileId)
          await fetch(`https://api.deepseek.com/files/${fileId}`, {
            method: "DELETE",
            headers,
            signal: AbortSignal.timeout(10000),
            redirect: "error",
          }).catch(() => {});
      }
    },
  };
}
