module.exports = {
  data: {
    name: "ping",
    description: "Pong!",
  },

  run: ({ interaction, client, handler }) => {
    interaction.reply(`:ping_pong: Pong! ${client.ws.ping}ms`);
  },

  options: {
    devOnly: false,
    userPermissions: ["Administrator", "AddReactions"],
    botPermissions: ["Administrator", "AddReactions"],
    deleted: false,
  },
};
