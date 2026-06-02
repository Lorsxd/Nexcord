/*
 * Nexcord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { showNotification } from "@api/Notifications";
import { Settings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { relaunch } from "@utils/native";
import { ConfirmModal,OAuth2AuthorizeModal, openModal, UserStore } from "@webpack/common";

export const logger = new Logger("SettingsSync:CloudSetup", "#39b7e0");

export const getCloudUrl = () => new URL(Settings.cloud.url);
const getCloudUrlOrigin = () => getCloudUrl().origin;

export async function checkCloudUrlCsp() {
    if (IS_WEB) return true;

    const { host } = getCloudUrl();
    if (host === "api.nexcord.dev") return true;

    if (await NexcordNative.csp.isDomainAllowed(Settings.cloud.url, ["connect-src"])) {
        return true;
    }

    const res = await NexcordNative.csp.requestAddOverride(Settings.cloud.url, ["connect-src"], "Cloud Sync");
    if (res === "ok") {
        openModal(props => (
            <ConfirmModal
                {...props}
                title="Cloud Integration enabled"
                subtitle={`${host} has been added to the whitelist. Please restart the app for the changes to take effect.`}
                confirmText="Restart now"
                cancelText="Later!"
                variant="primary"
                onConfirm={relaunch}
            />
        ));
    }
    return false;
}

export const getUserId = () => {
    const id = UserStore.getCurrentUser()?.id;
    if (!id) throw new Error("User not yet logged in");
    return id;
};

export async function getAuthorization() {
    const secrets = await DataStore.get<Record<string, string>>("Nexcord_cloudSecret") ?? {};

    const origin = getCloudUrlOrigin();

    // we need to migrate from the old format here
    if (secrets[origin]) {
        await DataStore.update<Record<string, string>>("Nexcord_cloudSecret", secrets => {
            secrets ??= {};
            // use the current user ID
            secrets[`${origin}:${getUserId()}`] = secrets[origin];
            delete secrets[origin];
            return secrets;
        });

        // since this doesn't update the original object, we'll early return the existing authorization
        return secrets[origin];
    }

    return secrets[`${origin}:${getUserId()}`];
}

async function setAuthorization(secret: string) {
    await DataStore.update<Record<string, string>>("Nexcord_cloudSecret", secrets => {
        secrets ??= {};
        secrets[`${getCloudUrlOrigin()}:${getUserId()}`] = secret;
        return secrets;
    });
}

export async function deauthorizeCloud() {
    await DataStore.update<Record<string, string>>("Nexcord_cloudSecret", secrets => {
        secrets ??= {};
        delete secrets[`${getCloudUrlOrigin()}:${getUserId()}`];
        return secrets;
    });
}

export async function authorizeCloud() {
    try {
        await setAuthorization("firebase_session");
        Settings.cloud.authenticated = true;
        showNotification({
            title: "Cloud Integration",
            body: "Firebase Cloud Sync enabled!"
        });
    } catch (e: any) {
        logger.error("Failed to authorize", e);
        showNotification({
            title: "Cloud Integration",
            body: `Setup failed (${e.toString()}).`
        });
        Settings.cloud.authenticated = false;
    }
}

export async function getCloudAuth() {
    const secret = await getAuthorization();

    return window.btoa(`${secret}:${getUserId()}`);
}
