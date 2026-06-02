/*
 * Nexcord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Command } from "@nexcord/discord-types";
export { ApplicationCommandInputType, ApplicationCommandOptionType, ApplicationCommandType } from "@nexcord/discord-types/enums";

export interface NexcordCommand extends Command {
    isNexcordCommand?: boolean;
}
