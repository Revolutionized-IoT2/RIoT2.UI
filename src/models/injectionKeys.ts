import type { ReportTemplate } from './rules/reportTemplate';
import type { InjectionKey, Ref, ref } from "vue";
import type AppError from "./appError";
import type { Emitter, EventType } from "mitt";
import type CommandTemplate from './commandTemplate';
import type FunctionTemplate from './rules/functionTemplate';
import VariableTemplate from './variableTemplate';

export const InjectionKeys = {
    errorHandler: Symbol() as InjectionKey<(err: AppError) => void>,
    emitter: Symbol() as InjectionKey<Emitter<Record<EventType, unknown>>>,
    reportTemplates: Symbol() as InjectionKey<Ref<ReportTemplate[]>>,
    functionTemplates: Symbol() as InjectionKey<Ref<FunctionTemplate[]>>,
    commandTemplates: Symbol() as InjectionKey<Ref<CommandTemplate[]>>,
    variableTemplates: Symbol() as InjectionKey<Ref<VariableTemplate[]>>
} as const;