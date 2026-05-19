import '../command';
import '../util';
import { unrestrict } from './restrict';

export const is_exempt = (member) => {
    let exempted = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
    return exempted.includes(member.user.id)
}

export class ExemptCommand extends Command {
    static name = "restrict";

    static run(client, args) {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const user_exists = guild.members.cache.has(args[0].replace("<@", "").replace(">", ""));

        if (!user_exists) {
            return "User not found!";
        }
        const member = guild.members.cache.get(args[0].replace("<@", "").replace(">", ""));

        if (hasRole(member, process.env.RESTRICTED_ROLE_ID)) {
            unrestrict(member);
        }

        this.checkAndAddExemption(member.user.id);

        return `Exempted ${exempt_member.user.globalName}!`
    }

    static checkAndAddExemption(userId) {
        let exemped_users = readFileSync(process.env.EXEMPTED_PATH).toString().split(",");
        if (!exemped_users.includes(userId)) exemped_users.push(userId);
        writeFileSync(process.env.EXEMPTED_PATH, exemped_users.toString().replace("[","").replace("]",""));
    }
}