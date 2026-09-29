# certisign-mcp

Read-only MCP server for the Certisign Portal de Assinaturas API (v2).

## Tools

- `get_document` — document status by ID
- `get_document_details` — participants, steps, keys
- `get_flow_actions` — flow actions per participant
- `get_signature_evidences` — signature evidences by signer key
- `get_package` — signed document package
- `list_documents` — list documents by status (paginated)

## Setup

```bash
npm install
```

```json
{
  "mcpServers": {
    "certisign": {
      "command": "node",
      "args": ["/path/to/certisign-mcp/index.js"],
      "env": {
        "CERTISIGN_TOKEN": "<your token>",
        "CERTISIGN_BASE_URL": "https://api.portaldeassinaturas.com.br/api/v2"
      }
    }
  }
}
```

`CERTISIGN_BASE_URL` defaults to the sandbox (`api-sbx`).
