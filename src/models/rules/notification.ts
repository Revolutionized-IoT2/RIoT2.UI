import { NotificationType } from "@/models/enums";


export default  class notification {

    text: string = "";
    title: string = "";
    notificationType: NotificationType = NotificationType.success;
}