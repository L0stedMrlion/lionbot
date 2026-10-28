import 'dotenv/config';
import { Client, IntentsBitField, Partials } from 'discord.js';
import { initializeServerStats } from './services/serverStats';
import { initializeCounting } from './services/counting';
import { checkDatabaseConnection } from './startup/database';

const client = new Client({
  partials: [Partials.Message, Partials.Channel],
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildPresences,
  ],
});

if (process.env.TOKEN) {
  client.token = process.env.TOKEN;
}

checkDatabaseConnection();
initializeServerStats(client);
initializeCounting(client);
initializeMediaPing(client);

export default client;
