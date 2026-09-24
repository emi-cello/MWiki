require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");
const { Octokit } = require("@octokit/rest");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const github = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

client.once("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    try {

        if (message.channel.id !== process.env.CHANNEL_ID) return;
        if (message.author.bot) return;

        const content = message.content.trim();

        const versionMatch =
            content.match(/v\d+\.\d+(?:\.\d+)?/i) ||
            content.match(/\d+\.\d+\.\d+/);

        if (!versionMatch) {
            console.log("No version found in message.");
            return;
        }

        const version = versionMatch[0].replace(/^v/i, "");

        const markdown = `# Version ${version}

${content}

---

Imported automatically from Discord.
`;

        const path = `docs/versions/V${version}.md`;

        await github.repos.createOrUpdateFileContents({
            owner: process.env.REPO_OWNER,
            repo: process.env.REPO_NAME,
            path,
            message: `Add release notes V${version}`,
            content: Buffer.from(markdown).toString("base64")
        });

        console.log(`Created ${path}`);

    } catch (err) {
        console.error(err);
    }
});

const fs = require("fs");
const path = require("path");

client.on("messageCreate", async (message) => {

    if (!message.content.startsWith("?m")) return;

    const args = message.content.split(" ");
    const query = args[1];

    const versionsDir = path.join(
        __dirname,
        "..",
        "docs",
        "versions"
    );
//?m help
if (query === "help" || !query) {

    const helpEmbed = new EmbedBuilder()
        .setColor("#c1b4f9")
        .setTitle("📚 MoonWiki Help")
        .setDescription("Available MoonWiki Commands")
        .addFields(
            {
                name: "`?m help`",
                value: "Show this help menu"
            },
            {
                name: "`?m list`",
                value: "Show all available versions"
            },
            {
                name: "`?m latest`",
                value: "Show the newest release note"
            },
            {
                name: "`?m V1.0.0`",
                value: "Show a specific version"
            }
        )
        .setFooter({
            text: "MoonWiki"
        })
        .setTimestamp();

    return message.reply({
        embeds: [helpEmbed]
    });
}

    // ?m list
    if (query === "list") {

    const files = fs.readdirSync(versionsDir)
        .filter(f => /^V.*\.md$/i.test(f))
        .sort()
        .reverse();

    if (files.length === 0) {
        return message.reply("No versions found.");
    }

    const list = files
        .map(f => `• ${f.replace(".md", "")}`)
        .join("\n");

    const listEmbed = new EmbedBuilder()
        .setColor("#c1b4f9")
        .setTitle("📋 Available Versions")
        .setDescription(list)
        .setFooter({
            text: `${files.length} versions available`
        })
        .setTimestamp();

    return message.reply({
        embeds: [listEmbed]
    });
}


    // ?m latest
if (query === "latest") {

    const files = fs.readdirSync(versionsDir)
        .filter(f => /^V.*\.md$/i.test(f))
        .sort()
        .reverse();

    if (files.length === 0) {
        return message.reply("No versions found.");
    }

    const latestFile = files[0];

    const content = fs.readFileSync(
        path.join(versionsDir, latestFile),
        "utf8"
    );

    const latestEmbed = new EmbedBuilder()
        .setColor("#c1b4f9")
        .setTitle(`📄 ${latestFile.replace(".md", "")}`)
        .setDescription(
            content.length > 4000
                ? content.slice(0, 3997) + "..."
                : content
        )
        .setFooter({
            text: "Latest Release Note"
        })
        .setTimestamp();

    return message.reply({
        embeds: [latestEmbed]
    });
}

    // ?m V1.0.0
    const filename = `${query}.md`;

    const fullPath = path.join(
        versionsDir,
        filename
    );

    if (!fs.existsSync(fullPath)) {
        return message.reply(
            `❌ Version ${query} not found. Try \`?m list\``
        );
    }

    const content = fs.readFileSync(
        fullPath,
        "utf8"
    );

    const versionEmbed = new EmbedBuilder()
    .setColor("#c1b4f9")
    .setTitle(`📄 ${query}`)
    .setDescription(
        content.length > 4000
            ? content.slice(0, 3997) + "..."
            : content
    )
    .setFooter({
        text: "MoonWiki Release Notes"
    })
    .setTimestamp();

return message.reply({
    embeds: [versionEmbed]
});
});

client.login(process.env.DISCORD_TOKEN);