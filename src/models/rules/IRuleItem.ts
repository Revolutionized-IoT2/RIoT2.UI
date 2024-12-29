import type { RuleType } from '@/models/enums';
import type { IRuleDefination } from './IRuleDefination';

export interface IRuleItem {
    id: number;
    name: string;
    ruleType: RuleType;
    description: string;
}