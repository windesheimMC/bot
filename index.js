import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
});

// Restrict user when they get the onlooker role
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (newMember.roles.cache.has(process.env.ONLOOKER_ROLE_ID) && !newMember.roles.cache.has(process.env.RESTRICTED_ROLE_ID)) {
        console.log(`Restricting ${newMember.user.globalName}`)
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
        newMember.roles.add(role);
    }
});

client.login(process.env.TOKEN);