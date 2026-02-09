import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { readFileSync, writeFileSync } from "node:fs";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    writeFileSync(process.env.RESTRICTED_PATH, "", {flag: "a+"});
});

// Restrict user when they get the onlooker role
const restrict = (member) => {
    console.log(`Restricting ${member.user.globalName}`)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
    member.roles.add(role);
}

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (newMember.roles.cache.has(process.env.ONLOOKER_ROLE_ID) && !newMember.roles.cache.has(process.env.RESTRICTED_ROLE_ID)) {
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

client.login(process.env.TOKEN);