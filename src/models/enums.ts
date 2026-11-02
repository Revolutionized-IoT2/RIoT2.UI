import type * as Contract from './generated/contracts';

export enum ValueType {
    Boolean = 0,
    Text = 1,
    Number = 2,
    Entity = 3,
    TextArray = 4
}

export enum ComponentType {
    button = 0,
    chart_line = 1,
    chart_bar = 2,
    chart_doughnut = 3,
    chart_pie= 4,
    numericValue = 5,
    image = 6,
    timeline = 7,
    slideButton = 8,
    state = 9,
    switch = 10
}

export enum ChartType {
    line = 0,
    bar = 1,
    doughnut = 2,
    pie = 3
}

export enum ComponentSize {
    small = 3,
    half = 6,
    large = 9,
    full = 12
}

export enum DeviceState {
    unknown = 0,
    stopped = 1,
    initialized = 2,
    running = 3,
    error = 4
}

export enum NodeType {
    unknown = 0,
    device = 1,
    dashboard = 2,
    workflow = 3
}

/** How a device parameter is edited (`parameterDefinitions[].type`, Core 1.16.0). */
export enum DeviceParameterType {
    text = 0,
    number = 1,
    integer = 2,
    boolean = 3
}

// The enums above keep the UI's member names; their values must be the contract's
// (src/models/generated/contracts.ts). A mismatch fails the type check here.
type SameValues<A extends number, B extends number> = [`${A}`] extends [`${B}`] ? ([`${B}`] extends [`${A}`] ? true : false) : false;
type Assert<T extends true> = T;
export type EnumsMatchTheContract = [
    Assert<SameValues<ValueType, Contract.ValueType>>,
    Assert<SameValues<ComponentType, Contract.DashboardComponentType>>,
    Assert<SameValues<ComponentSize, Contract.DashboardComponentSize>>,
    Assert<SameValues<DeviceState, Contract.DeviceState>>,
    Assert<SameValues<NodeType, Contract.NodeType>>,
    Assert<SameValues<DeviceParameterType, Contract.DeviceParameterType>>,
];
