export const Constants = {
    urlGetDashboardConfigurationWithHistory: "/api/dashboard/configuration?history=true",
    urlGetReportHistory: "/api/dashboard/report/{id}/history",
    urlGetDashboardStates: "/api/dashboard/reports",
    urlGetNodes: "/api/nodes",
    urlGetReportTemplates: "/api/nodes/report/templates",
    urlGetCommandTemplates: "/api/nodes/command/templates",
    urlGetFunctionTemplates: "/api/nodes/function/templates",
    urlGetReportOrCommandState: "/api/nodes/{type}/{id}/state",
    urlGetNodeConfiguration: "/api/nodes/{id}/configuration",
    urlSaveNodeConfiguration: "/api/nodes/configuration",
    urlGetVariableTemplates: "/api/nodes/variable/templates",
    urlGetVariables: "/api/nodes/variables",
    urlSaveVariable: "/api/nodes/variable/save",
    urlDeleteVariable: "/api/nodes/variable/{id}/delete",
    urlGetDeviceTemplateById: "/api/nodes/device/{id}/template",
    urlSendCommand: "/api/nodes/command/{operation}",

    urlGetRules: "/api/rules",
    urlSaveRule: "/api/rules/save",
    urlGetRuleById: "/api/rules/{id}",
    urlRunFunction: "/api/rules/function/run",
    urlRuleSimulate: "/api/rules/simulate",
    urlRuleValidateById: "/api/rules/{id}/validate",
    urlRuleSetStateById: "/api/rules/{id}/state/{state}",
    urlDeleteRuleById: "/api/rules/{id}/delete",
    urlGetTags: "/api/rules/tags",
    urlDeleteNodeById: "/api/nodes/{id}/delete",
    urlGetNodesOnline: "/api/nodes/online",
    urlSaveDashboard: "/api/dashboard/configuration",

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