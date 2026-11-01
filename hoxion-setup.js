
// HOXION: FAMILY AND GANGS — Discord setup
// Requires Node.js 18+ and discord.js v14

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

const token = process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !guildId) {
  console.error("BOT_TOKEN or GUILD_ID is missing.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const roles = [
  { name: "Moderator", color: "#D4AF37" },
  { name: "Management", color: "#E53935" },
  { name: "Head Staff", color: "#795548" },
  { name: "Staff", color: "#111111" },
  { name: "Trial Staff", color: "#2EAD55" },
  { name: "Faction Manage", color: "#F28C28" },
  { name: "Citizen", color: "#87CEFA" },
  { name: "Bot", color: "#90EE90" }
];

const categories = [
  ["⌑ GETTING STARTED", [["take-your-role", "text"]]],
  ["0 — STAFF DEPARTMENT", [["family-handler", "text", true]]],
  ["1 — INFORMATION CENTER",
    ["server-rules", "announcements", "regulation-updates",
     "family-benefits", "family-guidelines", "territory-control"]
      .map(n => [n, "text"])],
  ["2 — ROLEPLAY RESOURCES",
    ["screenshot-guide", "roleplay-guides"].map(n => [n, "text"])],
  ["3 — COMMUNITY AREA",
    ["general-chat", "media-gallery", "connections"].map(n => [n, "text"])],
  ["4 — FAMILY APPLICATION",
    ["family-creation", "family-suggestions"].map(n => [n, "text"])],
  ["5 — FAMILY SERVICES",
    ["role-requests", "cooldown-appeals", "faction-activity-logs",
     "cooldown-records", "faction-violations", "faction-event-trailers"]
      .map(n => [n, "text"])],
  ["6 — FAMILY RELATIONS",
    ["family-alliance", "family-relations", "family-reports"]
      .map(n => [n, "text"])],
  ["7 — VOICE CHANNELS",
    [["General Lounge", "voice"], ["Family Meeting", "voice"],
     ["Staff Meeting", "voice", true], ["Private Room", "voice", true]]]
];

client.once("ready", async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();

    const roleMap = {};

    for (const item of [...roles].reverse()) {
      let role = guild.roles.cache.find(r => r.name === item.name);

      if (!role) {
        role = await guild.roles.create({
          name: item.name,
          color: item.color
        });
      } else {
        await role.setColor(item.color);
      }

      roleMap[item.name] = role;
    }

    const staffNames = [
      "Moderator", "Management", "Head Staff", "Staff", "Trial Staff"
    ];

    const staffOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      ...staffNames.map(name => ({
        id: roleMap[name].id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }))
    ];

    for (const [categoryName, channelDefs] of categories) {
      let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory &&
             c.name === categoryName
      );

      if (!category) {
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory
        });
      }

      for (const [channelName, kind, staffOnly] of channelDefs) {
        const type = kind === "voice"
          ? ChannelType.GuildVoice
          : ChannelType.GuildText;

        const exists = guild.channels.cache.find(
          c => c.parentId === category.id &&
               c.name === channelName &&
               c.type === type
        );

        if (exists) continue;

        await guild.channels.create({
          name: channelName,
          type,
          parent: category.id,
          ...(staffOnly
            ? { permissionOverwrites: staffOverwrites }
            : {})
        });
      }
    }

    console.log("HOXION setup completed!");
  } catch (error) {
    console.error("Setup error:", error);
  } finally {
    client.destroy();
  }
});

client.login(token);
