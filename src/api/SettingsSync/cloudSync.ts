/*
 * Nexcord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { PlainSettings, Settings } from "@api/Settings";
import { localStorage } from "@utils/localStorage";
import { Logger } from "@utils/Logger";
import { relaunch } from "@utils/native";

import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

import { deauthorizeCloud, getUserId } from "./cloudSetup";
import { exportSettings, importSettings } from "./offline";

const logger = new Logger("SettingsSync:Cloud", "#39b7e0");

const SYNC_DIRECTION_KEY = "Nexcord_cloudSyncDirection";
const SETTINGS_DIRTY_KEY = "Nexcord_settingsDirty";
export const getCloudSyncDirection = () => localStorage.getItem(SYNC_DIRECTION_KEY) || "both";
export const setCloudSyncDirection = (direction: "push" | "pull" | "both" | "manual") => localStorage.setItem(SYNC_DIRECTION_KEY, direction);
export const areLocalSettingsDirty = () => localStorage.getItem(SETTINGS_DIRTY_KEY) === "true";
export const markLocalSettingsDirty = () => localStorage.setItem(SETTINGS_DIRTY_KEY, "true");
export const markLocalSettingsClean = () => localStorage.removeItem(SETTINGS_DIRTY_KEY);

export function shouldCloudSync(direction: "push" | "pull") {
    const localDirection = getCloudSyncDirection();

    return localDirection === direction || localDirection === "both";
}

export async function putCloudSettings(manual?: boolean) {
    const settings = await exportSettings({ minify: true });

    try {
        const userId = getUserId();
        const docRef = doc(db, "users", userId);
        
        const timestamp = Date.now();
        await setDoc(docRef, {
            settings: settings,
            updatedAt: timestamp
        }, { merge: true });

        PlainSettings.cloud.settingsSyncVersion = timestamp;
        NexcordNative.settings.set(PlainSettings);

        logger.info("Settings uploaded to Firebase successfully");

        if (manual) {
            showNotification({
                title: "Cloud Settings",
                body: "Synchronized settings to Firebase!",
                noPersist: true,
            });
        }

        markLocalSettingsClean();
    } catch (e: any) {
        logger.error("Failed to sync up with Firebase", e);
        showNotification({
            title: "Cloud Settings",
            body: `Could not synchronize settings to Firebase (${e.toString()}).`,
            color: "var(--red-360)"
        });
    }
}

export async function getCloudSettings(shouldNotify = true, force = false) {
    try {
        const userId = getUserId();
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            logger.info("No settings on Firebase");
            if (shouldNotify)
                showNotification({
                    title: "Cloud Settings",
                    body: "There are no settings in Firebase.",
                    noPersist: true
                });
            return false;
        }

        const data = docSnap.data();
        const written = data.updatedAt || 0;
        const localWritten = Settings.cloud.settingsSyncVersion;

        if (!force && written <= localWritten) {
            logger.info("Settings up to date");
            if (shouldNotify)
                showNotification({
                    title: "Cloud Settings",
                    body: "Your settings are up to date.",
                    noPersist: true
                });
            return false;
        }

        const settings = data.settings;
        if (!settings) {
            logger.error("Failed to find settings in Firebase document");
            return false;
        }

        await importSettings(settings);

        PlainSettings.cloud.settingsSyncVersion = written;
        NexcordNative.settings.set(PlainSettings);

        logger.info("Settings loaded from Firebase successfully");
        if (shouldNotify)
            showNotification({
                title: "Cloud Settings",
                body: "Your settings have been updated! Click here to restart to fully apply changes!",
                color: "var(--green-360)",
                onClick: IS_WEB ? () => location.reload() : relaunch,
                noPersist: true
            });

        markLocalSettingsClean();

        return true;
    } catch (e: any) {
        logger.error("Failed to sync down from Firebase", e);
        showNotification({
            title: "Cloud Settings",
            body: `Could not synchronize settings from Firebase (${e.toString()}).`,
            color: "var(--red-360)"
        });

        return false;
    }
}

export async function deleteCloudSettings() {
    try {
        const userId = getUserId();
        const docRef = doc(db, "users", userId);
        await deleteDoc(docRef);

        logger.info("Settings deleted from Firebase successfully");
        showNotification({
            title: "Cloud Settings",
            body: "Settings deleted from Firebase!",
            color: "var(--green-360)"
        });
    } catch (e: any) {
        logger.error("Failed to delete from Firebase", e);
        showNotification({
            title: "Cloud Settings",
            body: `Could not delete settings (${e.toString()}).`,
            color: "var(--red-360)"
        });
    }
}

export async function eraseAllCloudData() {
    try {
        const userId = getUserId();
        const docRef = doc(db, "users", userId);
        await deleteDoc(docRef);

        Settings.cloud.authenticated = false;
        await deauthorizeCloud();

        showNotification({
            title: "Cloud Integrations",
            body: "Successfully erased all data from Firebase.",
            color: "var(--green-360)"
        });
    } catch (e: any) {
        logger.error("Failed to erase data from Firebase", e);
        showNotification({
            title: "Cloud Integrations",
            body: `Could not erase all data (${e.toString()}), please check your connection.`,
            color: "var(--red-360)"
        });
    }
}
