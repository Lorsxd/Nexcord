; =====================================================================
; Nexcord Custom Installer Script
; Adds a Discord client selection page before installation
; =====================================================================

!include "MUI2.nsh"
!include "LogicLib.nsh"

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

; ── Custom page: Discord selection ──────────────────────────────────
Function DiscordSelectPage
    nsDialogs::Create 1018
    Pop $SelectPage

    ${If} $SelectPage == error
        Abort
    ${EndIf}

    ; Title label
    ${NSD_CreateLabel} 0 0 100% 24u "Select which Discord client(s) to inject Nexcord into:"
    Pop $0
    CreateFont $1 "Segoe UI" 10 700
    SendMessage $0 ${WM_SETFONT} $1 1

    ; Subtitle
    ${NSD_CreateLabel} 0 28u 100% 16u "You can select multiple. Leave all unchecked to skip injection."
    Pop $0

    ; Checkboxes
    ${NSD_CreateCheckbox} 10u 52u 100% 14u "Discord Stable"
    Pop $CB_Stable
    ${NSD_Check} $CB_Stable

    ${NSD_CreateCheckbox} 10u 70u 100% 14u "Discord PTB (Public Test Build)"
    Pop $CB_PTB

    ${NSD_CreateCheckbox} 10u 88u 100% 14u "Discord Canary"
    Pop $CB_Canary

    ${NSD_CreateCheckbox} 10u 106u 100% 14u "Discord Development"
    Pop $CB_Dev

    nsDialogs::Show
FunctionEnd

Function DiscordSelectPageLeave
    ${NSD_GetState} $CB_Stable  $InjectStable
    ${NSD_GetState} $CB_PTB     $InjectPTB
    ${NSD_GetState} $CB_Canary  $InjectCanary
    ${NSD_GetState} $CB_Dev     $InjectDev
FunctionEnd

; ── Hook: Run injection after install ────────────────────────────────
!macro customInstall
    ; Inject into selected Discord clients
    ${If} $InjectStable == ${BST_CHECKED}
        nsExec::ExecToLog '"$INSTDIR\resources\app\node_modules\.bin\node" "$INSTDIR\resources\app\scripts\runInstaller.mjs" -- --install --discord stable'
    ${EndIf}

    ${If} $InjectPTB == ${BST_CHECKED}
        nsExec::ExecToLog '"$INSTDIR\resources\app\node_modules\.bin\node" "$INSTDIR\resources\app\scripts\runInstaller.mjs" -- --install --discord ptb'
    ${EndIf}

    ${If} $InjectCanary == ${BST_CHECKED}
        nsExec::ExecToLog '"$INSTDIR\resources\app\node_modules\.bin\node" "$INSTDIR\resources\app\scripts\runInstaller.mjs" -- --install --discord canary'
    ${EndIf}

    ${If} $InjectDev == ${BST_CHECKED}
        nsExec::ExecToLog '"$INSTDIR\resources\app\node_modules\.bin\node" "$INSTDIR\resources\app\scripts\runInstaller.mjs" -- --install --discord dev'
    ${EndIf}
!macroend

; ── Register the custom page before the install page ─────────────────
!macro customWelcomePage
    Page custom DiscordSelectPage DiscordSelectPageLeave
!macroend
