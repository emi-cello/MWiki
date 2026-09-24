require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
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

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    try {

        if (message.channel.id !== process.env.CHANNEL_ID) return;
        if (message.author.bot) return;

        const content = message.content.trim();

        const versionMatch =
            content.match(/(\d+\.\d+\.\d+)/) ||
            content.match(/Version\s+(\d+\.\d+\.\d+)/i);

        if (!versionMatch) {
            console.log("No version found in message.");
            return;
        }

        const version = versionMatch[1];

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

client.login(process.env.DISCORD_TOKEN);