import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { readFileSync, writeFileSync } from "node:fs";
import { hasRole } from './util.js';
import { RestrictCommand, restrict, unrestrict } from './commands/restrict.js';
import { ExemptCommand, is_exempt } from './commands/exempt.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});
let bot_id = 0

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    bot_id = readyClient.user.id
    writeFileSync(process.env.RESTRICTED_PATH, "", {flag: "a+"});
    writeFileSync(process.env.EXEMPTED_PATH, "", {flag: "a+"});
});

// Restrict user when they get the onlooker or the ex-studebt role

client.on(Events.GuildMemberUpdate, (_, newMember) => {
    if (
        (
            hasRole(newMember, process.env.ONLOOKER_ROLE_ID)
            || hasRole(newMember, process.env.EX_STUDENT_ROLE_ID)
        )
        && !hasRole(newMember, process.env.RESTRICTED_ROLE_ID)
        && !is_exempt(newMember)
    )
    {
        restrict(newMember, client);

        let restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
        if (!restricted_users.includes(newMember.user.id)) restricted_users.push(newMember.user.id);
        writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));
    }
});

client.on(Events.GuildMemberAdd, (member) => {
    const restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
    if (restricted_users.includes(member.user.id)) {
        restrict(member, client);
    }
})

const restrictedCommands = [RestrictCommand, ExemptCommand]
const publicCommands = []

// Listen for commands
const runCommand = (fullCommand, commands) => {
    const args = fullCommand.split(" ")
    const command = args[0]
    args.shift()

    let response = undefined

    commands.forEach(cmd => {
        if (command == cmd.name) {
            response = cmd.run(client, args);
        }
    });

    return !!response ? response : "Invalid command!"
}

client.on(Events.MessageCreate, (content, _) => {
    const prefix = `<@${bot_id}>`

    const guild = client.guilds.cache.get(process.env.GUILD_ID)
    const author_member = guild.members.cache.get(content.author.id)

    if (content.content.startsWith(prefix)) {
        let availableCommands = publicCommands;
        if (hasRole(author_member, process.env.MODERATOR_ROLE_ID)) {
            availableCommands = availableCommands.concat(restrictedCommands);
        } else if (!process.env.COMMAND_CHANNEL_IDS.split(",").includes(content.channel.id)) {
            return
        }

        const reply = runCommand(content.content.substring(prefix.length).trim(), availableCommands)
        content.reply(reply)
    }
})

client.login(process.env.TOKEN);