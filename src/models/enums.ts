import { Variable } from './rules/variable';
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

export enum RuleType {
    trigger = 0,
    function = 1,
    condition = 2,
    output = 3
}


export enum TriggerEvent {
    notDefined = 0,
    buttonSingleClick = 1,
    buttonDoubleClick = 2,
    buttonLongClick = 3,
    risingEdge = 4,
    fallingEdge = 5,
    analog = 6
}

export enum NotificationType {
    success = 0,
    error = 1,
    warn = 2,
}

export enum OutputOperation {
    toggle = 1, // invert current output valur
    setOn = 2, //write true to output 
    setOff = 3, // write false to output
    write = 4, // write received data to output
    pulseDown = 5,
    pulseUp = 6,
    Variable = 7
}

export enum FlowOperator {
    continue = 0,
    stop = 1,
    jump = 2
}

export enum ConditionType {
    ifElse = 0,
    switch = 1
}

export enum DeviceState {
    unknown = 0,
    stopped = 1,
    initialized = 2,
    running = 3,
    error = 4
}