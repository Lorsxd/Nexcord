/*
 * Nexcord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app } from "electron";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import { join } from "path";

export interface DiscordInstall {
    /** Human-readable name, e.g. "Discord" or "Discord PTB" */
    name: string;
    /** Path to the Discord application root (where app.asar lives) */
    path: string;
    /** Whether Nexcord is currently injected */
    patched: boolean;
    /** Discord version string, e.g. "1.0.9007" */
    version: string;
}

/** Candidates: [display name, executable name] */
const DISCORD_VARIANTS: Array<[string, string]> = [
    ["Discord", "discord"],
    ["Discord PTB", "discordptb"],
    ["Discord Canary", "discordcanary"],
    ["Discord Development", "discorddevelopment"],
];

/** Windows-only: Looks under %LocalAppData%\<exeName>\app-x.y.z\resources */
function findWindowsInstalls(): DiscordInstall[] {
    const localAppData = process.env.LOCALAPPDATA ?? "";
    if (!localAppData) return [];

    const results: DiscordInstall[] = [];

    for (const [displayName, exeName] of DISCORD_VARIANTS) {
        const baseDir = join(localAppData, exeName.charAt(0).toUpperCase() + exeName.slice(1));
        if (!existsSync(baseDir)) continue;

        // Find the latest "app-x.y.z" folder
        let appDirs: string[];
        try {
            appDirs = readdirSync(baseDir).filter(d => d.startsWith("app-"));
        } catch {
            continue;
        }

        appDirs.sort().reverse(); // latest version first

        for (const appDir of appDirs) {
            const resourcesPath = join(baseDir, appDir, "resources");
            if (!existsSync(resourcesPath)) continue;

            const install = buildInstallEntry(displayName, resourcesPath, appDir.replace("app-", ""));
            if (install) results.push(install);
            break; // only latest version per variant
        }
    }

    return results;
}

/** Linux/macOS flat installs (e.g. /opt/discord, /usr/share/discord, etc.) */
function findUnixInstalls(): DiscordInstall[] {
    const candidates: Array<[string, string[]]> = [
        ["Discord", ["/opt/discord/resources", "/usr/share/discord/resources", "/usr/lib/discord/resources"]],
        ["Discord PTB", ["/opt/discord-ptb/resources", "/usr/share/discord-ptb/resources"]],
        ["Discord Canary", ["/opt/discord-canary/resources", "/usr/share/discord-canary/resources"]],
    ];

    const results: DiscordInstall[] = [];
    for (const [displayName, paths] of candidates) {
        for (const resourcesPath of paths) {
            if (!existsSync(resourcesPath)) continue;
            const install = buildInstallEntry(displayName, resourcesPath, "unknown");
            if (install) { results.push(install); break; }
        }
    }
    return results;
}

function buildInstallEntry(name: string, resourcesPath: string, version: string): DiscordInstall | null {
    // Must have app.asar
    if (!existsSync(join(resourcesPath, "app.asar"))) return null;

    const appFolder = join(resourcesPath, "app");
    let patched = false;

    if (existsSync(appFolder)) {
        try {
            const pkg = JSON.parse(readFileSync(join(appFolder, "package.json"), "utf-8"));
            patched = pkg?._nexcord === true;
        } catch { /* not patched */ }
    }

    return { name, path: resourcesPath, patched, version };
}

/**
 * Returns all detected Discord installations on this machine.
 */
export function getDiscordInstalls(): DiscordInstall[] {
    if (process.platform === "win32") return findWindowsInstalls();
    return findUnixInstalls();
}

/** Path to the Nexcord patcher JS that should be injected */
function getPatcherPath() {
    // In packaged mode __dirname is the resources dir of Nexcord's own app.
    // The patcher.js is built there alongside the main bundle.
    return join(__dirname, "patcher.js");
}

/**
 * Injects Nexcord into the given Discord installation.
 * Creates/replaces the `app` folder inside resources with a minimal loader.
 */
export function installToDiscord(resourcesPath: string): { ok: true } | { ok: false; error: string } {
    try {
        const appFolder = join(resourcesPath, "app");
        mkdirSync(appFolder, { recursive: true });

        // Determine real asar name
        const asarName = existsSync(join(resourcesPath, "_app.asar")) ? "_app.asar" : "app.asar";

        // Read Discord's own package.json to find the real entry point
        const discordPkg = JSON.parse(readFileSync(join(resourcesPath, `${asarName}/package.json`), "utf-8"));
        const discordMain: string = discordPkg.main ?? "index.js";

        // Write a package.json that makes Electron load our loader
        const pkg = {
            name: "discord",
            main: "index.js",
            _nexcord: true,
        };
        writeFileSync(join(appFolder, "package.json"), JSON.stringify(pkg, null, 2));

        // Write the index.js loader which requires the built patcher.js
        const patcherSrc = getPatcherPath().replace(/\\/g, "/");
        const indexJs = `
// Nexcord injector — auto-generated, do not edit
require("${patcherSrc}");
`.trimStart();
        writeFileSync(join(appFolder, "index.js"), indexJs);

        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: String(e?.message ?? e) };
    }
}

/**
 * Removes the Nexcord injection from the given Discord installation.
 */
export function uninstallFromDiscord(resourcesPath: string): { ok: true } | { ok: false; error: string } {
    try {
        const appFolder = join(resourcesPath, "app");
        if (existsSync(appFolder)) {
            rmSync(appFolder, { recursive: true, force: true });
        }
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: String(e?.message ?? e) };
    }
}
