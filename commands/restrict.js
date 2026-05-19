import { Command } from '../command.js';
import { hasRole } from '../util.js';
import { is_exempt } from './exempt.js';
import { readFileSync, writeFileSync } from "node:fs";

export const restrict = (member, client) => {
    console.log(`Restricting ${member.user.globalName}`)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
    member.roles.add(role);
}

export const unrestrict = (member, client) => {
    console.log(`Unrestricting ${member.user.globalName}`)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const role = guild.roles.cache.get(process.env.RESTRICTED_ROLE_ID);
    member.roles.remove(role);
}

export class RestrictCommand extends Command {
    static name = "restrict";

    static run(client, args) {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const user_exists = guild.members.cache.has(args[0].replace("<@", "").replace(">", ""));

        if (!user_exists) {
            return "User not found!";
        }
        const member = guild.members.cache.get(args[0].replace("<@", "").replace(">", ""));

        if (hasRole(member, process.env.RESTRICTED_ROLE_ID)) {
            return "They are already restricted.";
        }

        restrict(member, client);

        this.addToRestrictedFile(member.user.id);

        let addional_info = this.checkAndRemoveExemption(member);

        return `Restriced ${member.user.globalName}!${addional_info}`;
    }

    static checkAndRemoveExemption(member) {
        if (is_exempt(member)) {
            let exemped_users = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
            if (exemped_users.includes(member.user.id)) {
                const index = exemped_users.indexOf(member.user.id)
                exemped_users.splice(index, 1);
            }
            writeFileSync(process.env.EXEMPTED_PATH, exemped_users.toString().replace("[","").replace("]",""));
            return " They have also been removed from exemption list."
        }
        return ""
    }

    static addToRestrictedFile(userId) {
        let restricted_users = readFileSync(process.env.RESTRICTED_PATH).toString().split(",");
        if (!(restricted_users.includes(userId))) restricted_users.push(userId);
        writeFileSync(process.env.RESTRICTED_PATH, restricted_users.toString().replace("[","").replace("]",""));
    }
}
