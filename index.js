import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { readFileSync, writeFileSync } from "node:fs";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});
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

const unrestrict = (member) => {
    console.log(`Unrestricting ${member.user.globalName}`)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
    member.roles.remove(role);
}

const hasRole = (member, role_id) => member.roles.cache.has(role_id);

const is_exempt = (member) => {
    let exempted = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
    return exempted.includes(member.user.id)
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
        if (!restricted_users.includes(newMember.user.id)) restricted_users.push(newMember.user.id);
        writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));
    }
});

client.on(Events.GuildMemberAdd, (member) => {
    const restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
    if (restricted_users.includes(member.user.id)) {
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
            const guild = client.guilds.cache.get(process.env.GUILD_ID);
            const user_exists = guild.members.cache.has(args[0].replace("<@", "").replace(">", ""));

            if (!user_exists) {
                return "User no found!";
            }
            const member = guild.members.cache.get(args[0].replace("<@", "").replace(">", ""))
            
            if (hasRole(member, process.env.RESTRICTED_ROLE_ID)) {
                return "They are already restricted."
            }

            restrict(member);

            let restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
            if (!(restricted_users.includes(member.user.id))) restricted_users.push(member.user.id);
            writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));

            let addional_info = ""
            if (is_exempt(member)) {
                let exemped_users = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
                if (exemped_users.includes(exempt_member.user.id)) {
                    const index = exemped_users.indexOf(exempt_member.user.id)
                    exemped_users.splice(index, 1);
                }
                writeFileSync(process.env.EXEMPTED_PATH, exemped_users.toString().replace("[","").replace("]",""));
                addional_info = " They have also been removed from exemption list."
            }

            return `Restriced ${member.user.globalName}!${addional_info}`;

        case "exempt":
            const guildExempt = client.guilds.cache.get(process.env.GUILD_ID)
            const user_existsExempt = guildExempt.members.cache.has(args[0].replace("<@", "").replace(">", ""))
            if (!user_existsExempt) {
                return "User no found!";
            }
            const exempt_member = guildExempt.members.cache.get(args[0].replace("<@", "").replace(">", ""))

            if (hasRole(exempt_member, process.env.RESTRICTED_ROLE_ID)) {
                unrestrict(exempt_member);
            }

            let exemped_users = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
            if (!exempt_member.includes(exempt_member.user.id)) exemped_users.push(exempt_member.user.id);
            writeFileSync(process.env.EXEMPTED_PATH, exemped_users.toString().replace("[","").replace("]",""));

            return `Exempted ${exempt_member.user.globalName}!`
            
        default:
            return "Invalid command!"
    }
}

client.on(Events.MessageCreate, (content, _) => {
    const prefix = `<@${bot_id}>`

    const guild = client.guilds.cache.get(process.env.GUILD_ID)
    const author_member = guild.members.cache.get(content.author.id)

    if (content.content.startsWith(prefix) && hasRole(author_member, process.env.MODERATOR_ROLE_ID)) {
        const reply = runCommand(content.content.substring(prefix.length).trim())
        content.reply(reply)
    }
})

client.login(process.env.TOKEN);