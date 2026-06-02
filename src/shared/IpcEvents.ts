/*
 * Nexcord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export const enum IpcEvents {
    INIT_FILE_WATCHERS = "NexcordInitFileWatchers",

    OPEN_QUICKCSS = "NexcordOpenQuickCss",
    GET_QUICK_CSS = "NexcordGetQuickCss",
    SET_QUICK_CSS = "NexcordSetQuickCss",
    QUICK_CSS_UPDATE = "NexcordQuickCssUpdate",

    GET_SETTINGS = "NexcordGetSettings",
    SET_SETTINGS = "NexcordSetSettings",

    GET_THEMES_LIST = "NexcordGetThemesList",
    GET_THEME_DATA = "NexcordGetThemeData",
    GET_THEME_SYSTEM_VALUES = "NexcordGetThemeSystemValues",
    THEME_UPDATE = "NexcordThemeUpdate",

    OPEN_EXTERNAL = "NexcordOpenExternal",
    OPEN_THEMES_FOLDER = "NexcordOpenThemesFolder",
    OPEN_SETTINGS_FOLDER = "NexcordOpenSettingsFolder",

    GET_UPDATES = "NexcordGetUpdates",
    GET_REPO = "NexcordGetRepo",
    UPDATE = "NexcordUpdate",
    BUILD = "NexcordBuild",

    OPEN_MONACO_EDITOR = "NexcordOpenMonacoEditor",
    GET_MONACO_THEME = "NexcordGetMonacoTheme",

    GET_PLUGIN_IPC_METHOD_MAP = "NexcordGetPluginIpcMethodMap",

    CSP_IS_DOMAIN_ALLOWED = "NexcordCspIsDomainAllowed",
    CSP_REMOVE_OVERRIDE = "NexcordCspRemoveOverride",
    CSP_REQUEST_ADD_OVERRIDE = "NexcordCspRequestAddOverride",

    GET_RENDERER_CSS = "NexcordGetRendererCss",
    RENDERER_CSS_UPDATE = "NexcordRendererCssUpdate",
    PRELOAD_GET_RENDERER_JS = "NexcordPreloadGetRendererJs",

    SUPPORTS_WINDOWS_MATERIAL = "NexcordSupportsWindowsMaterial",
}
