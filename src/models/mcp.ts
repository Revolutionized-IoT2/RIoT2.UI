/** The MCP server as the AI access page shows it (ADR 0018), from GET /api/v2/mcp/status. */
export interface McpStatus {
  /** RIOT2_MCP_ENABLED: whether /mcp is mapped. */
  enabled: boolean;
  /** /mcp on the orchestrator's URL; null while the server is off. */
  localUrl: string | null;
  remote: McpRemoteStatus;
  groups: McpGroupInfo[];
  tools: McpToolInfo[];
}

/** The remote listener: off unless RIOT2_MCP_AUTH is set. */
export interface McpRemoteStatus {
  enabled: boolean;
  /** none, cloudflare-access or oidc. */
  auth: string;
  port: number | null;
  publicUrl: string | null;
  /** The highest role a remote caller gets: Viewer, Operator or Admin. */
  maxRole: string;
  subjectsRestricted: boolean;
}

export interface McpGroupInfo {
  id: McpToolGroup;
  role: string;
}

export interface McpToolInfo {
  name: string;
  group: McpToolGroup;
  role: string;
  write: boolean;
}

export type McpToolGroup = 'read' | 'health' | 'commands' | 'variables' | 'workflows' | 'workflowControl' | 'admin';

/** The tool policy (StoredObjects/McpConfiguration); no MCP tool can change it. */
export interface McpConfiguration {
  localEnabled: boolean;
  remoteEnabled: boolean;
  groups: McpToolGroup[];
  allowedCommands: string[];
  writesPerMinute: number;
}

export type McpConfigurationSave = McpConfiguration;

/** One MCP tool call since the orchestrator started. */
export interface McpActivityEntry {
  time: string;
  listener: 'local' | 'remote';
  user: string;
  tool: string;
  target: string | null;
  /** ok, error, denied, limited or failed. */
  outcome: string;
  durationMs: number;
  error: string | null;
}
