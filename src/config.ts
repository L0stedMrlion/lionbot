export const config = {
  db: {
    host: process.env.IP || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  discord: {
    token: process.env.TOKEN,
    devUserIds: ['710549603216261141'],
    guilds: {
      main: '1286329202723000431',
    },
    channels: {
      stats: '1429495007584194704',
      online: '1429495249855840538',
      duty_times: '1460019305448996894',
      ems_fd: '1493138137575325787',
      twitchPing: '1296897838692700304',
    },
    roles: {
      hireAllowed: '1486821536957730967',
      civilianRecruitment: '1478009779531022358',
      claimCivRequired: '1375531258871939153',
      twitchPingRequired: '1287347387706118185',
      twitchPingTarget: '1296897948348715071',
    },
    allowedUserIds: {
      civilianNabor: [
        '710549603216261141',
        '769892516152999957',
        '735501561819824218',
        '432501487361327114',
      ],
    },
  },
  googleSheets: {
    spreadsheetId: process.env.SPREADSHEET_ID,
    badgeSheetName: '⭐ Čísla odznaků',
    mainSheetName: '👮 Struktura LSPD',
  },
  gameServer: {
    ip: process.env.IP || 'localhost',
    port: process.env.GAMESERVER_PORT || '30120',
    resourceName: process.env.GAMESERVER_RESOURCE_NAME || 'lion_utilities',
    apiKey: process.env.GAMESERVER_API_KEY,
  },
};
