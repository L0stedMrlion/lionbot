local ESX = exports['es_extended']:getSharedObject()
local databaseReady = false
local syncLocks = {}

local function reply(response, status, payload)
    response.writeHead(status, { ['Content-Type'] = 'application/json; charset=utf-8' })
    response.send(json.encode(payload))
end

local function getDiscord(sourceId)
    local identifier = GetPlayerIdentifierByType(sourceId, 'discord')
    if not identifier then return nil end
    local discordId = identifier:match('^discord:(%d+)$')
    if not discordId or #discordId < 16 or #discordId > 22 then return nil end
    return discordId
end

local function getLicense(sourceId)
    local identifier = GetPlayerIdentifierByType(sourceId, 'license')
    if not identifier then return nil end
    local license = identifier:match('^license:([a-fA-F0-9]+)$')
    if not license or #license < 32 or #license > 64 then return nil end
    return license:lower()
end

local function ownsCharacter(identifier, license)
    if type(identifier) ~= 'string' then return false end
    if identifier == license or identifier == ('license:' .. license) then return true end
    local slot, raw = identifier:match('^' .. Config.CharacterPrefix .. '(%d+):(.+)$')
    return slot ~= nil and (raw == license or raw == ('license:' .. license))
end

local function getCharacters(license)
    local rows = MySQL.query.await(
        'SELECT identifier, `group` AS group_name FROM `users` WHERE identifier = ? OR identifier = ? OR identifier LIKE ? OR identifier LIKE ?',
        { license, 'license:' .. license, Config.CharacterPrefix .. '%:' .. license, Config.CharacterPrefix .. '%:license:' .. license }
    ) or {}
    local characters = {}
    for _, row in ipairs(rows) do
        if ownsCharacter(row.identifier, license) then
            characters[#characters + 1] = row
        end
    end
    return characters
end

local function findOnlinePlayers(license)
    local online = {}
    for _, playerId in ipairs(GetPlayers()) do
        local sourceId = tonumber(playerId)
        if sourceId and getLicense(sourceId) == license then
            local xPlayer = ESX.GetPlayerFromId(sourceId)
            if xPlayer then
                online[xPlayer.identifier] = { sourceId = sourceId, xPlayer = xPlayer }
            end
        end
    end
    return online
end

local function applyToLicense(license, targetGroup)
    local characters = getCharacters(license)
    local online = findOnlinePlayers(license)
    local affected, skipped = 0, 0
    local anyOnline = next(online) ~= nil
    for _, character in ipairs(characters) do
        local player = online[character.identifier]
        local currentGroup = player and player.xPlayer.getGroup() or character.group_name
        if not Config.ManagedGroups[currentGroup] then
            skipped = skipped + 1
        elseif currentGroup ~= targetGroup or character.group_name ~= targetGroup then
            if player and currentGroup ~= targetGroup then
                player.xPlayer.setGroup(targetGroup)
                TriggerClientEvent('lion_civsync:notification', player.sourceId, targetGroup)
            end
            if character.group_name ~= targetGroup then
                MySQL.update.await(
                    'UPDATE `users` SET `group` = ? WHERE identifier = ? AND `group` = ?',
                    { targetGroup, character.identifier, character.group_name }
                )
            end
            affected = affected + 1
        end
    end
    return affected, skipped, anyOnline
end

local function queueNotice(license, group)
    MySQL.update.await(
        'INSERT INTO lion_civsync_notices (license, group_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE group_name = VALUES(group_name), updated_at = CURRENT_TIMESTAMP',
        { license, group }
    )
end

local function deliverNotice(sourceId, license)
    local xPlayer = ESX.GetPlayerFromId(sourceId)
    if not xPlayer then return end
    local notice = MySQL.single.await('SELECT group_name FROM lion_civsync_notices WHERE license = ?', { license })
    if not notice then return end
    TriggerClientEvent('lion_civsync:notification', sourceId, notice.group_name)
    MySQL.update.await('DELETE FROM lion_civsync_notices WHERE license = ? AND group_name = ?', { license, notice.group_name })
end

local function linkPlayer(sourceId)
    local discordId = getDiscord(sourceId)
    local license = getLicense(sourceId)
    if not discordId or not license or not databaseReady then return end

    MySQL.update.await(
        'INSERT INTO lion_civsync_links (license, discord_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE discord_id = VALUES(discord_id), updated_at = CURRENT_TIMESTAMP',
        { license, discordId }
    )

    local state = MySQL.single.await('SELECT group_name FROM lion_civsync_roles WHERE discord_id = ?', { discordId })
    if not state or not Config.ManagedGroups[state.group_name] then return end
    local affected, _, online = applyToLicense(license, state.group_name)
    if affected > 0 and not online then queueNotice(license, state.group_name) end
    deliverNotice(sourceId, license)
end

local function safeLinkPlayer(sourceId)
    local success, err = pcall(linkPlayer, sourceId)
    if not success then print(('[lion_civsync] Failed to link player %s: %s'):format(sourceId, err)) end
end

local function processSync(data)
    local discordId = data.discordId
    local targetGroup = data.group
    if type(discordId) ~= 'string' or not discordId:match('^%d+$') or #discordId < 16 or #discordId > 22 then
        return 400, { status = 'error', message = 'Invalid Discord ID' }
    end
    if type(targetGroup) ~= 'string' or not Config.ManagedGroups[targetGroup] then
        return 400, { status = 'error', message = 'Invalid group' }
    end

    for _, playerId in ipairs(GetPlayers()) do
        local sourceId = tonumber(playerId)
        if sourceId and getDiscord(sourceId) == discordId then
            local license = getLicense(sourceId)
            if license then
                MySQL.update.await(
                    'INSERT INTO lion_civsync_links (license, discord_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE discord_id = VALUES(discord_id), updated_at = CURRENT_TIMESTAMP',
                    { license, discordId }
                )
            end
        end
    end

    local current = MySQL.single.await('SELECT group_name FROM lion_civsync_roles WHERE discord_id = ?', { discordId })
    MySQL.update.await(
        'INSERT INTO lion_civsync_roles (discord_id, group_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE group_name = VALUES(group_name), updated_at = CURRENT_TIMESTAMP',
        { discordId, targetGroup }
    )

    local links = MySQL.query.await('SELECT license FROM lion_civsync_links WHERE discord_id = ?', { discordId }) or {}
    local stateChanged = (current and current.group_name ~= targetGroup) or (not current and targetGroup ~= 'user')
    local affected, skipped = 0, 0
    for _, link in ipairs(links) do
        local updated, protected, online = applyToLicense(link.license, targetGroup)
        affected = affected + updated
        skipped = skipped + protected
        if not online and (stateChanged or updated > 0) then
            queueNotice(link.license, targetGroup)
        end
    end
    return 200, {
        status = 'ok',
        group = targetGroup,
        changed = stateChanged or false,
        affected = affected,
        skipped = skipped,
        linked = #links,
        pending = #links == 0
    }
end

CreateThread(function()
    local ok, err = pcall(function()
        MySQL.query.await([[
            CREATE TABLE IF NOT EXISTS lion_civsync_links (
                license VARCHAR(80) NOT NULL PRIMARY KEY,
                discord_id VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_discord_id (discord_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ]])
        MySQL.query.await([[
            CREATE TABLE IF NOT EXISTS lion_civsync_notices (
                license VARCHAR(80) NOT NULL PRIMARY KEY,
                group_name VARCHAR(64) NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ]])
        MySQL.query.await([[
            CREATE TABLE IF NOT EXISTS lion_civsync_roles (
                discord_id VARCHAR(32) NOT NULL PRIMARY KEY,
                group_name VARCHAR(64) NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ]])
    end)
    if not ok then
        print('[lion_civsync] Cannot initialize tables: ' .. tostring(err))
        return
    end
    databaseReady = true
    print('[lion_civsync] Database ready')
    for _, playerId in ipairs(GetPlayers()) do
        local sourceId = tonumber(playerId)
        if sourceId then safeLinkPlayer(sourceId) end
    end
end)

SetHttpHandler(function(request, response)
    if not databaseReady then
        reply(response, 503, { status = 'error', message = 'Database unavailable' })
        return
    end
    local expected = GetConvar('lion_civsync_api_key', '')
    local headers = request.headers or {}
    local received = headers['x-lion-civsync-key'] or headers['X-Lion-Civsync-Key']
    if #expected < 24 or received ~= expected then
        reply(response, 403, { status = 'error', message = 'Forbidden' })
        return
    end

    if request.method == 'GET' and request.path == '/linked' then
        local ok, rows = pcall(function()
            return MySQL.query.await('SELECT DISTINCT discord_id FROM lion_civsync_links') or {}
        end)
        if not ok then
            reply(response, 500, { status = 'error', message = 'Database error' })
            return
        end
        local ids = {}
        for _, row in ipairs(rows) do ids[#ids + 1] = row.discord_id end
        reply(response, 200, { linked = ids })
        return
    end

    if request.method == 'POST' and request.path == '/sync' then
        request.setDataHandler(function(raw)
            if type(raw) ~= 'string' or #raw > 8192 then
                reply(response, 413, { status = 'error', message = 'Invalid request body' })
                return
            end
            local decoded, data = pcall(json.decode, raw)
            if not decoded or type(data) ~= 'table' then
                reply(response, 400, { status = 'error', message = 'Invalid JSON' })
                return
            end
            local discordId = data.discordId
            if syncLocks[discordId] then
                reply(response, 409, { status = 'error', message = 'Synchronization already in progress' })
                return
            end
            if type(discordId) == 'string' then syncLocks[discordId] = true end
            local ok, status, result = pcall(processSync, data)
            if type(discordId) == 'string' then syncLocks[discordId] = nil end
            if not ok then
                print('[lion_civsync] Sync failed: ' .. tostring(status))
                reply(response, 500, { status = 'error', message = 'Synchronization failed' })
                return
            end
            reply(response, status, result)
        end)
        return
    end

    reply(response, 404, { status = 'error', message = 'Not found' })
end)

AddEventHandler('playerJoining', function()
    local sourceId = source
    SetTimeout(2000, function() safeLinkPlayer(sourceId) end)
end)

AddEventHandler('esx:playerLoaded', function(playerId)
    local sourceId = tonumber(playerId)
    if not sourceId then return end
    SetTimeout(1000, function() safeLinkPlayer(sourceId) end)
end)
