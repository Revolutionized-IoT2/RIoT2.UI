export const Constants = {
    // Anonymous; read same-origin, through the UI image's /api proxy (design 7.5).
    urlSecurityInfo: "/api/security/info",
    urlGetDashboardConfigurationWithHistory: "/api/dashboard/configuration?history=true",
    urlGetReportHistory: "/api/dashboard/report/{id}/history",
    urlGetDashboardStates: "/api/dashboard/reports",
    urlGetNodes: "/api/nodes",
    urlGetReportTemplates: "/api/nodes/report/templates",
    urlGetCommandTemplates: "/api/nodes/command/templates",
    urlGetReportOrCommandState: "/api/nodes/{type}/{id}/state",
    urlGetNodeConfiguration: "/api/nodes/{id}/configuration",
    urlGetNodeDevicesStatus: "/api/nodes/{id}/devices/status",
    urlSaveNodeConfiguration: "/api/nodes/configuration",
    urlGetVariableTemplates: "/api/nodes/variable/templates",
    urlGetVariables: "/api/nodes/variables",
    urlSaveVariable: "/api/nodes/variable/save",
    urlDeleteVariable: "/api/v2/variables/{id}",
    urlGetNodeDeviceTemplates: "/api/nodes/{id}/device/templates",
    urlCheckPlugin: "/api/nodes/checkplugin",
    urlValidateCron: "/api/nodes/validatecron",
    // Commands with a delivery status and the outbox (design 7.1).
    urlCommands: "/api/v2/commands",
    urlCommandDelivery: "/api/v2/commands/{id}",
    urlOutboxSummary: "/api/v2/outbox/summary",
    // The system health page (I46).
    urlSystemHealth: "/api/v2/system/health",
    // Configuration sync per node (design 7.2).
    urlNodesSync: "/api/v2/nodes/sync",
    urlConnectors: "/api/v2/connectors",
    urlApplyNodeConfiguration: "/api/v2/nodes/{id}/configuration/apply",

    urlDeleteNodeById: "/api/v2/nodes/{id}",
    urlGetNodesOnline: "/api/nodes/online",
    urlSaveDashboard: "/api/dashboard/configuration",

    urlGetMatterStatus: "/api/matter/status",
    urlGetMatterConfiguration: "/api/matter/configuration",
    urlSaveMatterConfiguration: "/api/matter/configuration",
    urlGetMatterQr: "/api/matter/qr",
    urlOpenMatterCommissioning: "/api/v2/matter/commissioning/open",
    urlRefreshMatterDevices: "/api/v2/matter/devices/refresh",
    urlResetMatter: "/api/v2/matter/reset",

    urlGetBackups: "/api/v2/backups",
    urlCreateBackup: "/api/v2/backup",
    urlRestoreBackup: "/api/v2/restore",
    urlRestoreSavedBackup: "/api/v2/backups/{name}/restore",
    urlDownloadBackup: "/api/v2/backups/{name}",

    topicReport: "riot2/node/+/report",
    topicCommand: "riot2/node/{id}/command",
    topicConfigure: "riot2/node/{id}/configuration",
    topicOnline: "riot2/node/{id}/online",
    topicOrchestratorOnline: "riot2/orchestrator/online",
    //https://github.com/json-editor/json-editor
    nodeConfigurationSchema: {
        type: "object",
        title: "Node configuration",
        properties: {
            name: {
                title: "Node name",
                type: "string"
            },
            id: {
                title: "Node Id",
                description: "Id must be same as defined in node's configuration",
                type: "string"
            },
            deviceConfigurations: {
                title: "Node devices",
                type: "array",
                items: []
             }
        }
    }
} as const;