fx_version 'cerulean'
game 'gta5'
author 'Mrlion (@lostedmrlion)'
description 'Discord Civilian roles to ESX multicharacter group synchronization'
version '1.0.0'

shared_script 'config.lua'
client_scripts {
    '@ox_lib/init.lua',
    'client.lua'
}
server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server.lua'
}

dependencies {
    'es_extended',
    'oxmysql',
    'ox_lib'
}
