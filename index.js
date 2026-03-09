import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { readFileSync, writeFileSync } from "node:fs";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]});
let bot_id = 0

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    bot_id = readyClient.user.id
    writeFileSync(process.env.RESTRICTED_PATH, "", {flag: "a+"});
    writeFileSync(process.env.EXEMPTED_PATH, "", {flag: "a+"});
});

// Restrict user when they get the onlooker or the ex-studebt role
const restrict = (member) => {
    console.log(`Restricting ${member.user.globalName}`)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
    member.roles.add(role);
}

const hasRole = (member, role_id) => member.roles.cache.has(role_id);

const is_exempt = (member) => {
    let exempted = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
    return member.user.id in exempted
}

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
        restrict(newMember);

        let restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
        if (!(newMember.user.id in restricted_users)) restricted_users.push(newMember.user.id);
        writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));
    }
});

client.on(Events.GuildMemberAdd, (member) => {
    const restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
    if (member.user.id in restricted_users) {
        restrict(member);
    }
})

// Listen for commands
const runCommand = (fullCommand) => {
    const args = fullCommand.split(" ")
    const command = args[0]
    args.shift()

    switch (command) {
        case "restrict":
            const guild = client.guilds.cache.get(process.env.GUILD_ID)
            const user_exists = guild.members.cache.has(args[0].replace("<@", "").replace(">", ""))
            if (!user_exists) {
                return "User no found!";
            }
            const member = guild.members.cache.get(args[0].replace("<@", "").replace(">", ""))
            
            restrict(member);

            let restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
            if (!(member.user.id in restricted_users)) restricted_users.push(member.user.id);
            writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));

            return `Restriced ${member.user.globalName}`;
        default:
            return "Invalid command!"
    }
}

client.on(Events.MessageCreate, (content, _) => {
    const prefix = `<@${bot_id}>`

    if (content.content.startsWith(prefix)) {
        runCommand(content.content.substring(prefix.length).trim())
    }
})

client.login(process.env.TOKEN);