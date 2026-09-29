#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.CERTISIGN_BASE_URL || "https://api-sbx.portaldeassinaturas.com.br/api/v2";
const TOKEN = process.env.CERTISIGN_TOKEN;
if (!TOKEN) {
  console.error("CERTISIGN_TOKEN não definido");
  process.exit(1);
}

async function call(method, path) {
  if (method !== "GET") throw new Error("MCP somente leitura");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { token: TOKEN, Accept: "application/json" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text;
}

const ok = (text) => ({ content: [{ type: "text", text: text || "OK" }] });
const wrap = (fn) => async (args) => {
  try { return ok(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: e.message }] }; }
};
const json = z.record(z.any());

const server = new McpServer({ name: "certisign", version: "1.0.0" });

// --- Consulta ---
server.tool("get_document", "Status de um documento pelo ID", { id: z.number() },
  wrap(({ id }) => call("GET", `/document/${id}`)));

server.tool("get_document_details", "Detalhes completos de um documento (participantes, etapas, chaves)", { id: z.number() },
  wrap(({ id }) => call("GET", `/Document/Details/${id}`)));

server.tool("get_flow_actions", "Status da assinatura: ações do fluxo por participante", { id: z.number() },
  wrap(({ id }) => call("GET", `/Document/FlowActions/${id}`)));

server.tool("get_signature_evidences", "Evidências da assinatura eletrônica pela chave do signatário (ex.: 1940-134E-96ED-F1C5)", { key: z.string() },
  wrap(({ key }) => call("GET", `/Signature/evidences?key=${encodeURIComponent(key)}`)));

server.tool("get_package", "Baixa o pacote do documento assinado (retorna base64/JSON da API)",
  {
    key: z.string().describe("Chave do documento (ex.: 7CEBBF58FC28BDA8)"),
    includeOriginal: z.boolean().default(false),
    includeManifest: z.boolean().default(true),
    zipped: z.boolean().default(true),
  },
  wrap(({ key, includeOriginal, includeManifest, zipped }) =>
    call("GET", `/document/package?key=${encodeURIComponent(key)}&includeOriginal=${includeOriginal}&includeManifest=${includeManifest}&zipped=${zipped}`)));

server.tool("list_documents",
  "Lista documentos da conta por status (document/listByStatus). status: 0 = todos; 2 e 3 dividem o total (provável 2=pendente, 3=concluído — não documentado); identifier filtra por texto (vazio = todos). Paginar com offset/max.",
  {
    status: z.number().default(2),
    identifier: z.string().default(""),
    dossierId: z.number().optional(),
    companyId: z.number().optional(),
    offset: z.number().default(0),
    max: z.number().default(20),
  },
  wrap((a) => {
    const q = new URLSearchParams(Object.entries(a).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return call("GET", `/document/listByStatus?${q}`);
  }));

await server.connect(new StdioServerTransport());
