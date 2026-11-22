# CIV Sync – Lion Police Roleplay

Synchronizes Discord CIV roles to ESX `users.group` only on existing CIV characters. Characters with `user`, admin, or other non-CIV groups are never promoted or modified by automatic synchronization. Discord role events and reconciliation update eligible offline/online characters, with notifications after real changes.

## Bot

- The existing `/claimciv` command and `src/config/claimciv.ts` are deliberately **untouched**. `/claimciv` retains its existing `lion_utilities` confirmation workflow.
- CIV role priority (highest first): `civ_exp` = Civilian Experienced, `civ` = Verified Civilian, `civ_beg` = Civilian Begginer. This order is shared with `/claimciv`, whose command logic and in-game confirmation remain unchanged.
- `guildMemberUpdate`, `guildMemberAdd`, `guildMemberRemove` and a periodic reconciliation run synchronization. The bot needs `GuildMembers` intent, already present in `src/app.ts`; enable Server Members Intent in the Discord Developer Portal.
- Add to bot `.env`:

```env
CIVSYNC_GUILD_ID=1286329202723000431
GAMESERVER_CIVSYNC_RESOURCE=lion_civsync
GAMESERVER_CIVSYNC_API_KEY=<same-long-random-secret-as-server-cfg>
```

Existing `IP` and `GAMESERVER_PORT` settings are also used. The bot must be able to reach the resource HTTP endpoint at `http://IP:PORT/lion_civsync/sync`. Do not expose it without a firewall/restricted network access.

## FiveM

1. Deploy the separate ZIP `lion_civsync_corrected.zip` as `lion_civsync` in FiveM resources. The FiveM folder was deliberately removed from this bot repository and is provided separately.
2. Back up the database. The ZIP includes `schema.sql`; the FiveM resource also creates its three tables on first boot if they do not exist.
3. Add to `server.cfg`:

```cfg
set lion_civsync_api_key "<same-long-random-secret-as-bot-env>"
ensure lion_civsync
```

Make sure `es_extended`, `oxmysql` and `ox_lib` are started first. Do not commit secrets to GitHub.

### Safeguards

- Only existing `civ`, `civ_exp`, or `civ_beg` groups are eligible. `user` can only be a **target** when a player loses all CIV Discord roles. Existing `user`, admin, police, and any other non-CIV character are never changed. Both online in-memory group and database group must be CIV before a character is updated.
- The resource stores Discord/license links and last known role. A first-time link requires the player to connect to the FiveM server with a valid Discord identifier; the bot then reconciles the linked account on its next pass.
- **No automatic sync runs from the existing `/claimciv` call**. That command retains its confirmation behavior. Discord role changes and reconciliation handle the separate all-character synchronization.
- On role removal, only eligible CIV characters revert to `user`. If a CIV Discord role is later re-added, characters already in `user` stay unchanged until manually claimed with `/claimciv`. DM notifications are sent only if at least one character actually changes.
- `license`/ESX identifier conventions assume standard ESX multichar `charN:license:...` identifiers. Test on the dev server before production.

## Deployment safety

The bot requires the FiveM `/linked` endpoint to return `syncPolicy: civ-characters-only-v1`. The corrected FiveM resource returns this marker. Older resources without it are **not trusted**, so the bot will not send automatic group updates until the resource has been updated. Deploy the corrected FiveM resource before restarting the bot.
