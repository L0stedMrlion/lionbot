import 'dotenv/config';
import { Client, IntentsBitField } from 'discord.js';
import { CommandKit } from 'commandkit';
import path from 'path';
import { config } from './config';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

new CommandKit({
  client,
  commandsPath: path.join(__dirname, 'commands'),
  eventsPath: path.join(__dirname, 'events'),
  devGuildIds: [],
  devUserIds: config.discord.devUserIds,
  skipBuiltInValidations: true,
  bulkRegister: true,
});

client
  .login(config.discord.token)
  .then(() => {
    console.log('✅ Discord bot logged in');
  })
  .catch((err) => {
    console.error('❌ Discord login failed:', err);
  });
