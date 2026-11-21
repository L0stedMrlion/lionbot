# CIV Sync – Lion Police Roleplay

Synchronizes Discord civilian roles to ESX `users.group` for all characters on the same license. Discord role events also update offline characters; online characters receive an `ox_lib` notification. A later login applies any previously stored role and delivers queued notifications.

## Bot

- The existing `/claimciv` command and `src/config/claimciv.ts` are deliberately **untouched**. `/claimciv` retains its existing `lion_utilities` confirmation workflow.
- Automatic synchronization uses the **same role matching order** as the current `/claimciv` command (the first matching role in `claimCivRoleGroups` wins). If a user has more than one CIV role, review the role ordering in the existing config.
- `guildMemberUpdate`, `guildMemberAdd`, `guildMemberRemove` and a periodic reconciliation run synchronization. The bot needs `GuildMembers` intent, already present in `src/app.ts`; enable Server Members Intent in the Discord Developer Portal.
- Add to bot `.env`:

```env
CIVSYNC_GUILD_ID=1286329202723000431
GAMESERVER_CIVSYNC_RESOURCE=lion_civsync
GAMESERVER_CIVSYNC_API_KEY=<same-long-random-secret-as-server-cfg>
```

Existing `IP` and `GAMESERVER_PORT` settings are also used. The bot must be able to reach the resource HTTP endpoint at `http://IP:PORT/lion_civsync/sync`. Do not expose it without a firewall/restricted network access.

## FiveM

1. Copy `fivem/lion_civsync` to the server's resource directory as `lion_civsync`.
2. Back up the database. `fivem/lion_civsync/schema.sql` is provided; the resource creates its three tables on first boot if they do not exist.
3. Add to `server.cfg`:

```cfg
set lion_civsync_api_key "<same-long-random-secret-as-bot-env>"
ensure lion_civsync
```

Make sure `es_extended`, `oxmysql` and `ox_lib` are started first. Do not commit secrets to GitHub.

### Safeguards

- `user`, `civ`, `civ_exp`, `civ_beg` are the only managed groups. Other ESX groups (e.g., admin) are untouched.
- The resource stores Discord/license links and last known role. A first-time link requires the player to connect to the FiveM server with a valid Discord identifier; the bot then reconciles the linked account on its next pass.
- **No automatic sync runs from the existing `/claimciv` call**. That command retains its confirmation behavior. Discord role changes and reconciliation handle the separate all-character synchronization.
- On role removal, linked managed characters revert to `user`, with online/queued in-game notifications and an attempted DM.
- `license`/ESX identifier conventions assume standard ESX multichar `charN:license:...` identifiers. Test on the dev server before production.
