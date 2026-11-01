import type * as Contract from './generated/contracts';

export default class ConfigurationCommand implements Contract.ConfigurationCommand {
    apiBaseUrl!: string;
}
