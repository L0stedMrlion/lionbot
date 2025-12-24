import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from 'commandkit';

export const data: CommandData = {
  name: 'ping',
  description: 'Pong!',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

export function run({ interaction, client, handler }: SlashCommandProps) {
  interaction.reply(`:ping_pong: Pong! ${client.ws.ping}ms`);
}

export const options: CommandOptions = {
  devOnly: false,
  userPermissions: ['Administrator', 'AddReactions'],
  botPermissions: ['Administrator', 'AddReactions'],
  deleted: false,
};
