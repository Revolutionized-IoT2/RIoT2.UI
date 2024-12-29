export interface IEvent {
    id: string;
    header: string;
    subHeader?: string;
    text: string;
    expandable: boolean;
    isExpanded: boolean;
    icon?: string;
    iconColor?: string;
    iconBgColor?: string;
    timeStamp: string;
}