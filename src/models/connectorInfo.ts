import type PackageManifest from './packageManifest';

/** A connector's `/health` report (design 7.3 phase 2, connector SDK 1.21.0). */
export interface ConnectorHealth {
    status: 'ok' | 'degraded' | 'unhealthy' | string;
    mqtt: boolean;
    sink: boolean;
    queue: number;
    spool: {
        enabled: boolean;
        messages: number;
        bytes: number;
        maxBytes: number;
    };
}

/**
 * An online connector (GET /api/v2/connectors, design 7.3 phase 3): its presence, and its health when it
 * announced a URL (`RIOT2_CONNECTOR_URL`).
 */
export interface ConnectorInfo {
    id: string;
    name: string;
    nodeBaseUrl?: string | null;
    manifest?: PackageManifest | null;
    health?: ConnectorHealth | null;
    healthError?: string | null;
}
