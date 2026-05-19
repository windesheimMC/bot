import { Command } from '../command.js';
import { hasRole } from '../util.js';

export class VerifyCommand extends Command {
    static name = "verify";

    static run(client, args, author_member) {
        if (hasRole(author_member, process.env.ALLOWED_TO_TALK_ROLE)) {
            return "dontreply";
        }

        return "Attempting to verify you";
    }
}