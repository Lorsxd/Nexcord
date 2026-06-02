; =====================================================================
; Nexcord Installer Script — Lightweight Vencord-style injection
; ~6 KB — directly writes the loader files, no external binary needed
; =====================================================================

!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"

; ── Variables ────────────────────────────────────────────────────────
Var CB_Stable
Var CB_PTB
Var CB_Canary
Var CB_Dev
Var InjectStable
Var InjectPTB
Var InjectCanary
Var InjectDev
Var SelectPage
Var FoundResDir

; ── Helper: find latest app-*\resources inside a Discord root ────────
; Push basedir  →  call  →  Pop result ("" if not found)
Function FindResources
    Exch $0               ; $0 = Discord base, e.g. $LOCALAPPDATA\Discord
    Push $1               ; find handle
    Push $2               ; current filename
    Push $3               ; best match so far

    StrCpy $3 ""

    FindFirst $1 $2 "$0\app-*.*"
    ${DoWhile} $1 != ""
        StrCpy $3 $2      ; keep overwriting — last one is the latest (sorted)
        ClearErrors
        FindNext $1 $2
        ${If} ${Errors}
            ${ExitDo}
        ${EndIf}
    ${Loop}
    FindClose $1

    ${If} $3 == ""
        StrCpy $0 ""
    ${Else}
        StrCpy $0 "$0\$3\resources"
        ${IfNot} ${FileExists} "$0\app.asar"
            StrCpy $0 ""
        ${EndIf}
    ${EndIf}

    Pop $3
    Pop $2
    Pop $1
    Exch $0
FunctionEnd

; ── Helper: inject Nexcord into a resources directory ────────────────
; Push resourcesPath  →  call
Function InjectNexcord
    Exch $0               ; $0 = resources path
    Push $1

    CreateDirectory "$0\app"

    ; Copy patcher.js from Nexcord's own install
    CopyFiles /SILENT "$INSTDIR\resources\patcher.js" "$0\app\patcher.js"

    ; package.json
    FileOpen $1 "$0\app\package.json" w
    FileWrite $1 '{"name":"discord","main":"index.js","_nexcord":true}'
    FileClose $1

    ; index.js — the tiny loader
    FileOpen $1 "$0\app\index.js" w
    FileWrite $1 'require("./patcher.js");'
    FileClose $1

    Pop $1
    Pop $0
FunctionEnd

; ── Custom page ──────────────────────────────────────────────────────
Function DiscordSelectPage
    nsDialogs::Create 1018
    Pop $SelectPage
    ${If} $SelectPage == error
        Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 24u "Select which Discord client(s) to inject Nexcord into:"
    Pop $0
    CreateFont $1 "Segoe UI" 10 700
    SendMessage $0 ${WM_SETFONT} $1 1

    ${NSD_CreateLabel} 0 28u 100% 16u "You can select multiple. Leave all unchecked to skip injection."
    Pop $0

    ; ── Stable ──
    ${NSD_CreateCheckbox} 10u 52u 100% 14u "Discord Stable"
    Pop $CB_Stable
    IfFileExists "$LOCALAPPDATA\Discord\Update.exe" 0 stable_off
        ${NSD_Check} $CB_Stable
        Goto stable_end
    stable_off:
        EnableWindow $CB_Stable 0
    stable_end:

    ; ── PTB ──
    ${NSD_CreateCheckbox} 10u 70u 100% 14u "Discord PTB (Public Test Build)"
    Pop $CB_PTB
    IfFileExists "$LOCALAPPDATA\DiscordPTB\Update.exe" 0 ptb_off
        ${NSD_Check} $CB_PTB
        Goto ptb_end
    ptb_off:
        EnableWindow $CB_PTB 0
    ptb_end:

    ; ── Canary ──
    ${NSD_CreateCheckbox} 10u 88u 100% 14u "Discord Canary"
    Pop $CB_Canary
    IfFileExists "$LOCALAPPDATA\DiscordCanary\Update.exe" 0 canary_off
        ${NSD_Check} $CB_Canary
        Goto canary_end
    canary_off:
        EnableWindow $CB_Canary 0
    canary_end:

    ; ── Development ──
    ${NSD_CreateCheckbox} 10u 106u 100% 14u "Discord Development"
    Pop $CB_Dev
    IfFileExists "$LOCALAPPDATA\DiscordDevelopment\Update.exe" 0 dev_off
        ${NSD_Check} $CB_Dev
        Goto dev_end
    dev_off:
        EnableWindow $CB_Dev 0
    dev_end:

    nsDialogs::Show
FunctionEnd

Function DiscordSelectPageLeave
    ${NSD_GetState} $CB_Stable  $InjectStable
    ${NSD_GetState} $CB_PTB     $InjectPTB
    ${NSD_GetState} $CB_Canary  $InjectCanary
    ${NSD_GetState} $CB_Dev     $InjectDev
FunctionEnd

; ── Post-install hook ────────────────────────────────────────────────
!macro customInstall
    ${If} $InjectStable == ${BST_CHECKED}
        Push "$LOCALAPPDATA\Discord"
        Call FindResources
        Pop $FoundResDir
        ${If} $FoundResDir != ""
            Push $FoundResDir
            Call InjectNexcord
        ${EndIf}
    ${EndIf}

    ${If} $InjectPTB == ${BST_CHECKED}
        Push "$LOCALAPPDATA\DiscordPTB"
        Call FindResources
        Pop $FoundResDir
        ${If} $FoundResDir != ""
            Push $FoundResDir
            Call InjectNexcord
        ${EndIf}
    ${EndIf}

    ${If} $InjectCanary == ${BST_CHECKED}
        Push "$LOCALAPPDATA\DiscordCanary"
        Call FindResources
        Pop $FoundResDir
        ${If} $FoundResDir != ""
            Push $FoundResDir
            Call InjectNexcord
        ${EndIf}
    ${EndIf}

    ${If} $InjectDev == ${BST_CHECKED}
        Push "$LOCALAPPDATA\DiscordDevelopment"
        Call FindResources
        Pop $FoundResDir
        ${If} $FoundResDir != ""
            Push $FoundResDir
            Call InjectNexcord
        ${EndIf}
    ${EndIf}
!macroend

; ── Uninstaller ──────────────────────────────────────────────────────
!macro customUnInstall
    ; Simply remove injected app/ folders — Discord will fall back to app.asar
    RMDir /r "$LOCALAPPDATA\Discord\app-*\resources\app"
    RMDir /r "$LOCALAPPDATA\DiscordPTB\app-*\resources\app"
    RMDir /r "$LOCALAPPDATA\DiscordCanary\app-*\resources\app"
    RMDir /r "$LOCALAPPDATA\DiscordDevelopment\app-*\resources\app"
!macroend

; ── Page registration ────────────────────────────────────────────────
!macro customWelcomePage
    Page custom DiscordSelectPage DiscordSelectPageLeave
!macroend
