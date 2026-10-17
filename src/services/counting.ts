import {
  Client,
  ContainerBuilder,
  Events,
  Message,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  type PartialMessage,
} from 'discord.js';
import type { RowDataPacket } from 'mysql2';
import db from '../utils/db';
import {
  COUNTING_CHANNEL_ID,
  COUNTING_MODES,
  COUNTING_VARIATION,
  type CountingMode,
} from '../config/counting';

type Phase = 'active' | 'complete' | 'cooldown';

export interface CountingState {
  channel_id: string;
  mode: CountingMode;
  target: number;
  current_value: number;
  progress: number;
  last_user_id: string | null;
  last_message_id: string | null;
  last_deleted: number;
  phase: Phase;
}

let state: CountingState | null = null;
let chain: Promise<void> = Promise.resolve();
let initialized = false;
const countingMessages = new Set<string>();

function queue(action: () => Promise<void>) {
  chain = chain.then(action).catch((error) => console.error('[Counting]', error));
}

function chooseMode(previous?: CountingMode): CountingMode {
  const choices = (Object.keys(COUNTING_MODES) as CountingMode[]).filter(
    (mode) => mode !== previous,
  );
  return choices[Math.floor(Math.random() * choices.length)];
}

function createState(previous?: CountingState): CountingState {
  const mode = chooseMode(previous?.mode);
  const base = COUNTING_MODES[mode].maxCount;
  const min = Math.max(1, base - COUNTING_VARIATION);
  const max = base + COUNTING_VARIATION;
  const options = Array.from({ length: max - min + 1 }, (_, index) => min + index)
    .filter((value) => mode !== 'prime' || isPrime(value));
  if (!options.length) throw new Error('No prime targets in the configured range');
  const target = options[Math.floor(Math.random() * options.length)];
  return {
    channel_id: COUNTING_CHANNEL_ID,
    mode,
    target,
    current_value: 0,
    progress: 0,
    last_user_id: null,
    last_message_id: null,
    last_deleted: 0,
    phase: 'active',
  };
}

function isPrime(value: number) {
  if (value < 2) return false;
  for (let i = 2; i * i <= value; i++) {
    if (value % i === 0) return false;
  }
  return true;
}

function parseCountingExpression(text: string): number | null {
  if (!text || text.length > 120) return null;
  let index = 0;
  const skipSpaces = () => {
    while (index < text.length && /\s/.test(text[index])) index++;
  };
  const factor = (): number | null => {
    skipSpaces();
    if (text[index] === '+' || text[index] === '-') {
      const sign = text[index++];
      const value = factor();
      return value === null ? null : sign === '-' ? -value : value;
    }
    if (text[index] === '(') {
      index++;
      const value = sum();
      skipSpaces();
      if (text[index] !== ')') return null;
      index++;
      return value;
    }
    const start = index;
    while (index < text.length && text[index] >= '0' && text[index] <= '9') index++;
    if (index === start) return null;
    const value = Number(text.slice(start, index));
    return Number.isSafeInteger(value) ? value : null;
  };
  const product = (): number | null => {
    let result = factor();
    if (result === null) return null;
    while (true) {
      skipSpaces();
      const operation = text[index];
      if (operation !== '*' && operation !== ':' && operation !== '/') return result;
      index++;
      const value = factor();
      if (value === null || ((operation === ':' || operation === '/') && value === 0)) return null;
      result = operation === '*' ? result * value : result / value;
      if (!Number.isFinite(result)) return null;
    }
  };
  const sum = (): number | null => {
    let result = product();
    if (result === null) return null;
    while (true) {
      skipSpaces();
      const operation = text[index];
      if (operation !== '+' && operation !== '-') return result;
      index++;
      const value = product();
      if (value === null) return null;
      result = operation === '+' ? result + value : result - value;
      if (!Number.isFinite(result)) return null;
    }
  };
  const value = sum();
  skipSpaces();
  return index === text.length && value !== null && Number.isSafeInteger(value) ? value : null;
}

function nthPrime(index: number) {
  let found = 0;
  for (let value = 2; ; value++) {
    if (isPrime(value) && ++found === index) return value;
  }
}

function toRoman(value: number) {
  const numerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
    [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
    [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  for (const [number, symbol] of numerals) {
    while (remaining >= number) {
      result += symbol;
      remaining -= number;
    }
  }
  return result;
}

function expectedValue(current: CountingState): number {
  const step = current.progress + 1;
  switch (current.mode) {
    case 'classic': return step;
    case 'double': return step * 2;
    case 'triple': return step * 3;
    case 'five': return step * 5;
    case 'countdown': return current.target - current.progress;
    case 'prime': return nthPrime(step);
    case 'roman': return step;
  }
}

function formatValue(mode: CountingMode, value: number) {
  return mode === 'roman' ? toRoman(value) : String(value);
}

function examples(current: CountingState) {
  const sequence = Array.from({ length: 9 }, (_, index) => {
    const entry = { ...current, progress: index };
    return formatValue(entry.mode, expectedValue(entry));
  });
  return [0, 3, 6].map((start) => `> ${sequence.slice(start, start + 3).join(' → ')}`).join('\n');
}

export function countingPanel(title: string, content: string, color = 0x5865f2) {
  return new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

async function send(client: Client, title: string, content: string, color: number) {
  const channel = await client.channels.fetch(COUNTING_CHANNEL_ID);
  if (!channel || !channel.isTextBased() || !('send' in channel)) {
    throw new Error('Counting channel is not a text channel');
  }
  const message = await channel.send({
    components: [countingPanel(title, content, color)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
  countingMessages.add(message.id);
  if (countingMessages.size > 100) {
    const oldest = countingMessages.values().next().value;
    if (oldest) countingMessages.delete(oldest);
  }
  return message;
}

async function persist(next: CountingState) {
  await db.execute(
    `UPDATE lion_counting_state SET mode = ?, target = ?, current_value = ?,
     progress = ?, last_user_id = ?, last_message_id = ?, last_deleted = ?,
     phase = ?, reset_at = NULL WHERE channel_id = ?`,
    [next.mode, next.target, next.current_value, next.progress, next.last_user_id,
      next.last_message_id, next.last_deleted, next.phase, COUNTING_CHANNEL_ID],
  );
  state = next;
}

async function saveNumber(next: CountingState) {
  await persist(next);
}

async function announceRound(client: Client, current: CountingState) {
  const mode = COUNTING_MODES[current.mode];
  const goal = current.mode === 'countdown'
    ? `Start at **${current.target}** and reach **0**.`
    : `Reach or pass **${current.target}**.`;
  const content = `**Mode:** ${mode.name}\n**Target:** ${current.target}\n**Rule:** ${mode.description}\n${goal}\n\n**Three counting examples**\n${examples(current)}\n\nTake turns sending the next number. A wrong number starts a new mode.`;
  await send(client, '🎯 New Counting Mode', content, 0x5865f2);
}

async function startNextRound(client: Client) {
  if (!state || state.phase === 'active') return;
  const next = createState(state);
  await persist(next);
  await announceRound(client, next);
}

async function failRound(client: Client, userId: string, value: string) {
  if (!state) return;
  const current = state;
  await persist({ ...current, phase: 'complete' });
  await send(client, '❌ Counting failed',
    `<@${userId}> entered \`${value}\` instead of **${formatValue(current.mode, expectedValue(current))}**.`,
    0xed4245).catch((error) => console.error('[Counting] Failure notification:', error));
  await startNextRound(client);
}

async function handleMessage(client: Client, message: Message) {
  if (message.channelId !== COUNTING_CHANNEL_ID) return;
  if (message.author.bot || message.webhookId) {
    if (message.author.id === client.user?.id && countingMessages.has(message.id)) return;
    await message.delete().catch(() => undefined);
    return;
  }
  if (!initialized || !state || state.phase !== 'active') {
    await message.delete().catch(() => undefined);
    return;
  }
  if (message.author.id === state.last_user_id) {
    await message.delete().catch(() => undefined);
    return;
  }
  const value = message.content.trim();
  const roman = state.mode === 'roman';
  const romanInput = roman && /^[IVXLCDM]+$/i.test(value);
  const mathInput = /[+*:\/()-]/.test(value);
  const numeric = !roman || mathInput ? parseCountingExpression(value) : null;
  if ((!romanInput && numeric === null) || message.attachments.size ||
      message.stickers.size || message.embeds.length) {
    await message.delete().catch(() => undefined);
    return;
  }
  const submitted = romanInput ? value.toUpperCase() : value;
  const correct = romanInput
    ? submitted === toRoman(expectedValue(state))
    : numeric === expectedValue(state);
  if (!correct) {
    await message.react('❌').catch(() => undefined);
    await failRound(client, message.author.id, numeric !== null && mathInput ? `${submitted} = ${numeric}` : submitted);
    return;
  }
  const nextNumber = expectedValue(state);
  const won = state.mode === 'countdown' ? nextNumber === 0 : nextNumber >= state.target;
  const next: CountingState = {
    ...state,
    current_value: nextNumber,
    progress: state.progress + 1,
    last_user_id: message.author.id,
    last_message_id: message.id,
    last_deleted: 0,
    phase: won ? 'complete' : 'active',
  };
  await saveNumber(next);
  await message.react('✅').catch(() => undefined);
  if (won) {
    await send(client, '🏆 Target reached',
      `<@${message.author.id}> completed **${COUNTING_MODES[next.mode].name}** with **${formatValue(next.mode, nextNumber)}**!`,
      0x57f287).catch((error) => console.error('[Counting] Win notification:', error));
    await startNextRound(client);
  }
}

async function handleDelete(client: Client, message: Message | PartialMessage) {
  if (!initialized || !state || state.phase !== 'active' ||
      message.channelId !== COUNTING_CHANNEL_ID ||
      message.id !== state.last_message_id || state.last_deleted) return;
  const userId = state.last_user_id;
  const value = formatValue(state.mode, state.current_value);
  await persist({ ...state, last_deleted: 1 });
  if (userId) await send(client, '⚠️ Last number deleted',
    `<@${userId}> deleted the last accepted number (**${value}**). Counting continues.`,
    0xfee75c);
}

async function setup(client: Client) {
  await db.query(
    `CREATE TABLE IF NOT EXISTS lion_counting_state (
      channel_id VARCHAR(32) PRIMARY KEY,
      round_number INT NOT NULL DEFAULT 0,
      mode VARCHAR(32) NOT NULL,
      target INT NOT NULL,
      current_value INT NOT NULL DEFAULT 0,
      progress INT NOT NULL DEFAULT 0,
      last_user_id VARCHAR(32) NULL,
      last_message_id VARCHAR(32) NULL,
      last_deleted TINYINT NOT NULL DEFAULT 0,
      phase VARCHAR(16) NOT NULL DEFAULT 'active',
      reset_at BIGINT NULL
    )`,
  );
  const [rows] = await db.query<(CountingState & RowDataPacket)[]>(
    'SELECT * FROM lion_counting_state WHERE channel_id = ?', [COUNTING_CHANNEL_ID],
  );
  if (rows.length) {
    const current = rows[0];
    state = {
      channel_id: current.channel_id,
      mode: current.mode,
      target: current.target,
      current_value: current.current_value,
      progress: current.progress,
      last_user_id: current.last_user_id,
      last_message_id: current.last_message_id,
      last_deleted: current.last_deleted,
      phase: current.phase,
    };
  } else {
    state = createState();
    await db.execute(
      `INSERT INTO lion_counting_state (channel_id, round_number, mode, target,
       current_value, progress, last_deleted, phase)
       VALUES (?, 0, ?, ?, 0, 0, 0, 'active')`,
      [COUNTING_CHANNEL_ID, state.mode, state.target],
    );
  }
  initialized = true;
  if (!rows.length) {
    await announceRound(client, state).catch((error) => console.error('[Counting] New mode:', error));
  } else if (state.phase !== 'active') {
    await startNextRound(client);
  }
  console.log('[Counting] Loaded mode', state.mode);
}

export function initializeCounting(client: Client) {
  client.on(Events.MessageCreate, (message) => queue(() => handleMessage(client, message)));
  client.on(Events.MessageDelete, (message) => queue(() => handleDelete(client, message)));
  client.on(Events.MessageBulkDelete, (messages) => {
    for (const message of messages.values()) queue(() => handleDelete(client, message));
  });
  client.once(Events.ClientReady, () => {
    queue(() => setup(client));
    const retry = setInterval(() => {
      if (initialized) return clearInterval(retry);
      queue(() => setup(client));
    }, 30000);
  });
}

export function getCountingState() {
  return state ? { ...state } : null;
}

export function getCountingNumbers() {
  if (!state) return null;
  return {
    last: state.progress ? formatValue(state.mode, state.current_value) : 'None yet',
    next: state.phase === 'active' ? formatValue(state.mode, expectedValue(state)) : 'Starting new mode',
  };
}

export async function resetCounting(client: Client) {
  return new Promise<boolean>((resolve) => {
    queue(async () => {
      if (!initialized || !state || state.phase !== 'active') return resolve(false);
      try {
        await persist({ ...state, phase: 'complete' });
        await startNextRound(client);
        resolve(true);
      } catch (error) {
        console.error('[Counting] Admin reset:', error);
        resolve(false);
      }
    });
  });
}
