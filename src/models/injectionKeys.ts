import type { ReportTemplate } from './reportTemplate';
import type { InjectionKey, Ref, ref } from "vue";
import type AppError from "./appError";
import type { Emitter, EventType } from "mitt";
import type CommandTemplate from './commandTemplate';
import VariableTemplate from './variableTemplate';

export const InjectionKeys = {
    errorHandler: Symbol() as InjectionKey<(err: AppError) => void>,
    emitter: Symbol() as InjectionKey<Emitter<Record<EventType, unknown>>>,
    reportTemplates: Symbol() as InjectionKey<Ref<ReportTemplate[]>>,
    commandTemplates: Symbol() as InjectionKey<Ref<CommandTemplate[]>>,
    variableTemplates: Symbol() as InjectionKey<Ref<VariableTemplate[]>>,
    templateDataUpdated: Symbol() as InjectionKey<() => void>
} as const;