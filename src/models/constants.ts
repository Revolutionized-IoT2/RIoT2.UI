export const Constants = {
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
    urlGetVariableValue: "/api/variable/{id}/value",
    urlSaveVariable: "/api/nodes/variable/save",
    urlDeleteVariable: "/api/nodes/variable/{id}/delete",
    urlGetNodeDeviceTemplates: "/api/nodes/{id}/device/templates",
    urlCheckPlugin: "/api/nodes/checkplugin",
    urlValidateCron: "/api/nodes/validatecron",
    urlExecuteCommand: "/api/command/execute",

    urlDeleteNodeById: "/api/nodes/{id}/delete",
    urlGetNodesOnline: "/api/nodes/online",
    urlSaveDashboard: "/api/dashboard/configuration",

    urlGetMatterStatus: "/api/matter/status",
    urlGetMatterConfiguration: "/api/matter/configuration",
    urlSaveMatterConfiguration: "/api/matter/configuration",
    urlGetMatterQr: "/api/matter/qr",
    urlOpenMatterCommissioning: "/api/matter/commissioning/open",
    urlRefreshMatterDevices: "/api/matter/devices/refresh",
    urlResetMatter: "/api/matter/reset",

    topicReport: "riot2/node/+/report",
    topicCommand: "riot2/node/{id}/command",
    topicConfigure: "riot2/node/{id}/configuration",
    topicOnline: "riot2/node/{id}/online",
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