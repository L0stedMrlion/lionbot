import 'dotenv/config';
import { Client, IntentsBitField } from 'discord.js';
import { initializeServerStats } from './services/serverStats';
import { checkDatabaseConnection } from './startup/database';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

if (process.env.TOKEN) {
  client.token = process.env.TOKEN;
}

checkDatabaseConnection();
initializeServerStats(client);

export default client;
