import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DbExecutor } from "@/db";
import { settings } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { createClaudeDocumentProvider } from "./claude";
import { createDeepSeekDocumentProvider } from "./deepseek";

const settingKey = "quotation_document_provider";
const providerId = z.enum(["deepseek", "claude"]);
const updateInput = z.strictObject({ provider: providerId });
type ProviderId = z.infer<typeof providerId>;

function providerConfigs() {
  return {
    deepseek: {
      label: "DeepSeek",
      model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash",
      key: process.env.DEEPSEEK_API_KEY?.trim(),
      create: createDeepSeekDocumentProvider,
    },
    claude: {
      label: "Claude",
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6",
      key: process.env.ANTHROPIC_API_KEY?.trim(),
      create: createClaudeDocumentProvider,
    },
  } satisfies Record<ProviderId, object>;
}

async function readActiveProvider(db: DbExecutor): Promise<ProviderId> {
  const [row] = await db.select({ value: settings.value }).from(settings)
    .where(eq(settings.key, settingKey)).limit(1);
  return providerId.safeParse(row?.value).data ?? "deepseek";
}

export async function getDocumentProviderSettings() {
  const active = await readActiveProvider(await getDb());
  const configs = providerConfigs();
  return {
    active,
    enabled: process.env.AI_QUOTATION_ENABLED === "true",
    providers: providerId.options.map((id) => ({
      id,
      label: configs[id].label,
      model: configs[id].model,
      configured: Boolean(configs[id].key),
    })),
  };
}

export async function configuredDocumentProvider(db?: DbExecutor) {
  if (process.env.AI_QUOTATION_ENABLED !== "true") return null;
  const active = await readActiveProvider(db ?? await getDb());
  const config = providerConfigs()[active];
  return config.key ? config.create(config.key, config.model) : null;
}

export async function selectDocumentProvider(actor: SessionUser, input: unknown) {
  const { provider } = updateInput.parse(input);
  if (!providerConfigs()[provider].key)
    throw new ApiError(400, "provider_not_configured", "Добавьте серверный ключ выбранного провайдера");
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.insert(settings).values({ key: settingKey, value: provider })
      .onConflictDoUpdate({ target: settings.key, set: { value: provider, updatedAt: new Date() } });
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "quotation.provider_changed",
      entity: "settings",
      data: { provider },
    });
    return { provider };
  });
}
