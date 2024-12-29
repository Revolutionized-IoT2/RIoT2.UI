import type { RuleType } from '@/models/enums';

export interface IRuleDefination {
    id: string;
    systemUniqueId: string; //this is related io-object in a system
    name: string;
    description: string;
    type: RuleType;
}