; =====================================================================
; Nexcord Lightweight Installer — Standalone, no Electron runtime
; Injects patcher.js into Discord client(s)
; =====================================================================

!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!include "FileFunc.nsh"
!include "MUI2.nsh"

Name "Nexcord Kurulumu"
OutFile "..\dist\NexcordInstaller.exe"
Unicode true
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Nexcord"
AutoCloseWindow true

!define PRODUCT_NAME "Nexcord"
!define PRODUCT_VERSION "1.14.15"

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
Var ResDir
Var RB_Install
Var RB_Uninstall
Var ActionType
Var CB_Y
Var CB_Y_Str


; ── MUI Settings ─────────────────────────────────────────────────────
!define MUI_ICON "icon.ico"
!define MUI_ABORTWARNING

; ── Pages ────────────────────────────────────────────────────────────
Page custom DiscordSelectPage DiscordSelectPageLeave
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Turkish"

; ── Helper: Find latest app-*\resources ──────────────────────────────
Function FindResources
    Exch $0               ; $0 = Discord base dir
    Push $1
    Push $2
    Push $3

    StrCpy $3 ""          ; best match

    FindFirst $1 $2 "$0\app-*"
    loop:
        StrCmp $2 "" done
        StrCpy $3 $2      ; keep last = latest
        FindNext $1 $2
        Goto loop
    done:
    FindClose $1

    ${If} $3 == ""
        StrCpy $0 ""
    ${Else}
        StrCpy $0 "$0\$3\resources"
        IfFileExists "$0\app.asar" found_asar
        IfFileExists "$0\_app.asar" found_asar
            StrCpy $0 ""
            Goto done_asar
        found_asar:
            ; Keep path
        done_asar:
    ${EndIf}

    Pop $3
    Pop $2
    Pop $1
    Exch $0
FunctionEnd

; ── Helper: Inject ───────────────────────────────────────────────────
Function InjectNexcord
    Exch $0               ; $0 = resources path
    Push $1

    ; Clean up old app folder injection if it exists
    RMDir /r "$0\app"

    ; 1. If _app.asar does not exist and app.asar is a file, rename app.asar to _app.asar
    IfFileExists "$0\_app.asar" asar_backed_up
        IfFileExists "$0\app.asar\*.*" asar_backed_up
            Rename "$0\app.asar" "$0\_app.asar"
    asar_backed_up:

    ; 2. Create app.asar directory
    CreateDirectory "$0\app.asar"

    ; Copy patcher files
    CopyFiles /SILENT "$INSTDIR\patcher.js" "$0\app.asar\patcher.js"
    CopyFiles /SILENT "$INSTDIR\preload.js" "$0\app.asar\preload.js"
    CopyFiles /SILENT "$INSTDIR\renderer.js" "$0\app.asar\renderer.js"
    CopyFiles /SILENT "$INSTDIR\renderer.css" "$0\app.asar\renderer.css"

    ; package.json
    FileOpen $1 "$0\app.asar\package.json" w
    FileWrite $1 '{"name":"discord","main":"index.js","_nexcord":true}'
    FileClose $1

    ; index.js
    FileOpen $1 "$0\app.asar\index.js" w
    FileWrite $1 'require("./patcher.js");'
    FileClose $1

    Pop $1
    Pop $0
FunctionEnd

; ── Helper: Uninstall ────────────────────────────────────────────────
Function UninstallNexcord
    Exch $0               ; $0 = resources path
    Push $1

    DetailPrint "Uninstalling Nexcord from $0..."

    ; Clean up old app folder injection if it exists
    RMDir /r "$0\app"

    ; Check if app.asar is a directory (meaning it's our injection directory)
    IfFileExists "$0\app.asar\*.*" 0 app_asar_dir_done
        RMDir /r "$0\app.asar"
    app_asar_dir_done:

    ; Restore _app.asar to app.asar if _app.asar exists and app.asar doesn't exist
    IfFileExists "$0\_app.asar" 0 asar_restore_done
        IfFileExists "$0\app.asar" asar_restore_done
            Rename "$0\_app.asar" "$0\app.asar"
            DetailPrint "  -> Restored original app.asar"
    asar_restore_done:

    Pop $1
    Pop $0
FunctionEnd

; ── Discord Selection Page ───────────────────────────────────────────
Function DiscordSelectPage
    nsDialogs::Create 1018
    Pop $SelectPage
    ${If} $SelectPage == error
        Abort
    ${EndIf}

    ; Initialize checkbox variables to empty
    StrCpy $CB_Stable ""
    StrCpy $CB_PTB ""
    StrCpy $CB_Canary ""
    StrCpy $CB_Dev ""

    ; ── Action selection ──
    ${NSD_CreateLabel} 0 0 100% 12u "Select action to perform:"
    Pop $0
    CreateFont $1 "Segoe UI" 10 700
    SendMessage $0 ${WM_SETFONT} $1 1

    ${NSD_CreateRadioButton} 10u 14u 100u 14u "Install Nexcord"
    Pop $RB_Install
    ${NSD_Check} $RB_Install

    ${NSD_CreateRadioButton} 120u 14u 120u 14u "Uninstall Nexcord"
    Pop $RB_Uninstall

    ; ── Client selection label ──
    ${NSD_CreateLabel} 0 34u 100% 12u "Select Discord client(s):"
    Pop $0
    SendMessage $0 ${WM_SETFONT} $1 1

    ; Start dynamic Y positioning for checkboxes
    StrCpy $CB_Y 48

    ; ── Stable ──
    IfFileExists "$LOCALAPPDATA\Discord\Update.exe" 0 stable_next
        StrCpy $0 "u"
        StrCpy $CB_Y_Str "$CB_Y$0"
        ${NSD_CreateCheckbox} 10u $CB_Y_Str 100% 14u "Discord Stable"
        Pop $CB_Stable
        ${NSD_Check} $CB_Stable
        IntOp $CB_Y $CB_Y + 18
    stable_next:

    ; ── PTB ──
    IfFileExists "$LOCALAPPDATA\DiscordPTB\Update.exe" 0 ptb_next
        StrCpy $0 "u"
        StrCpy $CB_Y_Str "$CB_Y$0"
        ${NSD_CreateCheckbox} 10u $CB_Y_Str 100% 14u "Discord PTB (Public Test Build)"
        Pop $CB_PTB
        ${NSD_Check} $CB_PTB
        IntOp $CB_Y $CB_Y + 18
    ptb_next:

    ; ── Canary ──
    IfFileExists "$LOCALAPPDATA\DiscordCanary\Update.exe" 0 canary_next
        StrCpy $0 "u"
        StrCpy $CB_Y_Str "$CB_Y$0"
        ${NSD_CreateCheckbox} 10u $CB_Y_Str 100% 14u "Discord Canary"
        Pop $CB_Canary
        ${NSD_Check} $CB_Canary
        IntOp $CB_Y $CB_Y + 18
    canary_next:

    ; ── Development ──
    IfFileExists "$LOCALAPPDATA\DiscordDevelopment\Update.exe" 0 dev_next
        StrCpy $0 "u"
        StrCpy $CB_Y_Str "$CB_Y$0"
        ${NSD_CreateCheckbox} 10u $CB_Y_Str 100% 14u "Discord Development"
        Pop $CB_Dev
        ${NSD_Check} $CB_Dev
        IntOp $CB_Y $CB_Y + 18
    dev_next:

    nsDialogs::Show
FunctionEnd

Function DiscordSelectPageLeave
    ; Check action type
    ${NSD_GetState} $RB_Uninstall $ActionType

    ; Read checkboxes (only if they were created)
    StrCpy $InjectStable 0
    ${If} $CB_Stable != ""
        ${NSD_GetState} $CB_Stable $InjectStable
    ${EndIf}

    StrCpy $InjectPTB 0
    ${If} $CB_PTB != ""
        ${NSD_GetState} $CB_PTB $InjectPTB
    ${EndIf}

    StrCpy $InjectCanary 0
    ${If} $CB_Canary != ""
        ${NSD_GetState} $CB_Canary $InjectCanary
    ${EndIf}

    StrCpy $InjectDev 0
    ${If} $CB_Dev != ""
        ${NSD_GetState} $CB_Dev $InjectDev
    ${EndIf}
FunctionEnd

; ── Install Section ──────────────────────────────────────────────────
Section "Install"
    SetOutPath $INSTDIR

    ; If we are installing, extract the files
    ${If} $ActionType != ${BST_CHECKED}
        File "..\dist\patcher.js"
        File "..\dist\preload.js"
        File "..\dist\renderer.js"
        File "..\dist\renderer.css"
    ${EndIf}

    ; Stable
    ${If} $InjectStable == ${BST_CHECKED}
        DetailPrint "Closing Discord Stable..."
        nsExec::Exec 'taskkill /F /IM Discord.exe'
        Push "$LOCALAPPDATA\Discord"
        Call FindResources
        Pop $ResDir
        ${If} $ResDir != ""
            ${If} $ActionType == ${BST_CHECKED}
                Push $ResDir
                Call UninstallNexcord
            ${Else}
                DetailPrint "Injecting into Discord Stable..."
                Push $ResDir
                Call InjectNexcord
                DetailPrint "  -> OK: $ResDir"
            ${EndIf}
        ${Else}
            DetailPrint "  -> Discord Stable resources not found, skipped."
        ${EndIf}
    ${EndIf}

    ; PTB
    ${If} $InjectPTB == ${BST_CHECKED}
        DetailPrint "Closing Discord PTB..."
        nsExec::Exec 'taskkill /F /IM DiscordPTB.exe'
        Push "$LOCALAPPDATA\DiscordPTB"
        Call FindResources
        Pop $ResDir
        ${If} $ResDir != ""
            ${If} $ActionType == ${BST_CHECKED}
                Push $ResDir
                Call UninstallNexcord
            ${Else}
                DetailPrint "Injecting into Discord PTB..."
                Push $ResDir
                Call InjectNexcord
                DetailPrint "  -> OK: $ResDir"
            ${EndIf}
        ${Else}
            DetailPrint "  -> Discord PTB resources not found, skipped."
        ${EndIf}
    ${EndIf}

    ; Canary
    ${If} $InjectCanary == ${BST_CHECKED}
        DetailPrint "Closing Discord Canary..."
        nsExec::Exec 'taskkill /F /IM DiscordCanary.exe'
        Push "$LOCALAPPDATA\DiscordCanary"
        Call FindResources
        Pop $ResDir
        ${If} $ResDir != ""
            ${If} $ActionType == ${BST_CHECKED}
                Push $ResDir
                Call UninstallNexcord
            ${Else}
                DetailPrint "Injecting into Discord Canary..."
                Push $ResDir
                Call InjectNexcord
                DetailPrint "  -> OK: $ResDir"
            ${EndIf}
        ${Else}
            DetailPrint "  -> Discord Canary resources not found, skipped."
        ${EndIf}
    ${EndIf}

    ; Dev
    ${If} $InjectDev == ${BST_CHECKED}
        DetailPrint "Closing Discord Development..."
        nsExec::Exec 'taskkill /F /IM DiscordDevelopment.exe'
        Push "$LOCALAPPDATA\DiscordDevelopment"
        Call FindResources
        Pop $ResDir
        ${If} $ResDir != ""
            ${If} $ActionType == ${BST_CHECKED}
                Push $ResDir
                Call UninstallNexcord
            ${Else}
                DetailPrint "Injecting into Discord Development..."
                Push $ResDir
                Call InjectNexcord
                DetailPrint "  -> OK: $ResDir"
            ${EndIf}
        ${Else}
            DetailPrint "  -> Discord Development resources not found, skipped."
        ${EndIf}
    ${EndIf}

    DetailPrint ""
    ${If} $ActionType == ${BST_CHECKED}
        DetailPrint "Nexcord uninstallation complete!"
    ${Else}
        DetailPrint "Nexcord ${PRODUCT_VERSION} installation complete!"
    ${EndIf}
SectionEnd
