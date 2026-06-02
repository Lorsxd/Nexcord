/*
 * Nexcord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import type { DiscordInstall } from "@main/installer";
import { Margins } from "@utils/margins";
import { useAwaiter } from "@utils/react";
import { Forms, React, useState } from "@webpack/common";

type InstallStatus = "idle" | "working" | "ok" | "error";

interface InstallState {
    status: InstallStatus;
    message?: string;
}

function InstallCard({ install, onDone }: { install: DiscordInstall; onDone(): void; }) {
    const [state, setState] = useState<InstallState>({ status: "idle" });

    async function doInstall() {
        setState({ status: "working" });
        const res = await NexcordNative.installer.install(install.path);
        if (res.ok) {
            setState({ status: "ok", message: "Nexcord enjekte edildi! Uygulamak için Discord'u yeniden başlatın." });
        } else {
            setState({ status: "error", message: res.error ?? "Bilinmeyen hata" });
        }
        onDone();
    }

    async function doUninstall() {
        setState({ status: "working" });
        const res = await NexcordNative.installer.uninstall(install.path);
        if (res.ok) {
            setState({ status: "ok", message: "Nexcord kaldırıldı. Uygulamak için Discord'u yeniden başlatın." });
        } else {
            setState({ status: "error", message: res.error ?? "Bilinmeyen hata" });
        }
        onDone();
    }

    const isWorking = state.status === "working";

    const cardVariant =
        state.status === "ok" ? "success" :
            state.status === "error" ? "danger" :
                install.patched ? "success" : "primary";

    return (
        <Card
            variant={cardVariant}
            style={{ marginBottom: 12, padding: "12px 16px" }}
        >
            <Flex flexDirection="row" style={{ alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <Forms.FormTitle tag="h5" style={{ margin: 0 }}>
                        {install.name}
                        {install.patched && (
                            <span style={{
                                marginLeft: 8,
                                fontSize: "0.75em",
                                background: "var(--green-360)",
                                color: "#fff",
                                borderRadius: 4,
                                padding: "1px 6px",
                                verticalAlign: "middle"
                            }}>Yüklü</span>
                        )}
                    </Forms.FormTitle>
                    <Forms.FormText style={{ fontSize: "0.8em", color: "var(--text-muted)", marginTop: 2 }}>
                        {install.path}
                    </Forms.FormText>
                    {install.version !== "unknown" && (
                        <Forms.FormText style={{ fontSize: "0.75em", color: "var(--text-muted)" }}>
                            v{install.version}
                        </Forms.FormText>
                    )}
                    {state.message && (
                        <Forms.FormText style={{
                            marginTop: 6,
                            color: state.status === "ok" ? "var(--green-360)" : "var(--red-400)",
                            fontWeight: 600
                        }}>
                            {state.message}
                        </Forms.FormText>
                    )}
                </div>

                <Flex flexDirection="row" style={{ gap: 8, flexShrink: 0 }}>
                    <Button
                        size={Button.Sizes.SMALL}
                        color={Button.Colors.GREEN}
                        disabled={isWorking}
                        onClick={doInstall}
                    >
                        {isWorking ? "Çalışıyor…" : "Yükle"}
                    </Button>
                    <Button
                        size={Button.Sizes.SMALL}
                        color={Button.Colors.RED}
                        disabled={isWorking}
                        onClick={doUninstall}
                    >
                        {isWorking ? "Çalışıyor…" : "Kaldır"}
                    </Button>
                </Flex>
            </Flex>
        </Card>
    );
}

function InstallerTab() {
    const [refreshKey, setRefreshKey] = React.useState(0);

    const [installs, err, pending] = useAwaiter(
        () => NexcordNative.installer.getInstalls(),
        { fallbackValue: [], deps: [refreshKey] }
    );

    function refresh() {
        setRefreshKey(k => k + 1);
    }

    return (
        <SettingsTab title="Discord Yükleyici">
            <Forms.FormSection>
                <Forms.FormTitle tag="h5">Tespit Edilen Discord Kurulumları</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom16}>
                    Nexcord yüklemek veya kaldırmak için aşağıdan bir Discord kurulumu seçin. Yükledikten sonra Discord'u yeniden başlatın.
                </Forms.FormText>

                {pending && (
                    <Forms.FormText>Discord kurulumları taranıyor…</Forms.FormText>
                )}

                {!pending && err && (
                    <Forms.FormText style={{ color: "var(--red-400)" }}>
                        Tarama başarısız: {String(err)}
                    </Forms.FormText>
                )}

                {!pending && !err && installs.length === 0 && (
                    <Card variant="danger" style={{ padding: "12px 16px" }}>
                        <Forms.FormTitle tag="h5">Discord kurulumu bulunamadı</Forms.FormTitle>
                        <Forms.FormText>
                            Discord'un kurulu olduğundan emin olun ve yenile butonuna basın.
                        </Forms.FormText>
                    </Card>
                )}

                {!pending && installs.map(install => (
                    <InstallCard
                        key={install.path}
                        install={install}
                        onDone={refresh}
                    />
                ))}

                <Button
                    className={Margins.top16}
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.PRIMARY}
                    onClick={refresh}
                    disabled={pending}
                >
                    {pending ? "Taranıyor…" : "Yenile"}
                </Button>
            </Forms.FormSection>
        </SettingsTab>
    );
}

export default wrapTab(InstallerTab, "Discord Yükleyici");
