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