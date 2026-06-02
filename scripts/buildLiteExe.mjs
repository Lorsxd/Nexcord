import { execFileSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

function findMakensis() {
    // 1. Check if in PATH
    try {
        execFileSync("makensis", ["-VERSION"], { stdio: "ignore" });
        return "makensis";
    } catch {}

    // 2. Check localappdata electron-builder cache
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
        const nsisCacheDir = join(localAppData, "electron-builder", "Cache", "nsis");
        if (existsSync(nsisCacheDir)) {
            // Find recursively
            const findExe = (dir) => {
                try {
                    const files = readdirSync(dir);
                    for (const file of files) {
                        const fullPath = join(dir, file);
                        if (statSync(fullPath).isDirectory()) {
                            const found = findExe(fullPath);
                            if (found) return found;
                        } else if (file.toLowerCase() === "makensis.exe") {
                            return fullPath;
                        }
                    }
                } catch {}
                return null;
            };
            const found = findExe(nsisCacheDir);
            if (found) return found;
        }
    }

    return null;
}

const makensis = findMakensis();
if (!makensis) {
    console.error("Error: makensis.exe not found in PATH or electron-builder Cache.");
    console.error("Please make sure NSIS is installed, or run 'pnpm buildExe' once to let electron-builder download it.");
    process.exit(1);
}

console.log(`Using makensis: ${makensis}`);
try {
    execFileSync(makensis, [join(BASE_DIR, "build", "standalone-installer.nsi")], {
        stdio: "inherit",
        cwd: BASE_DIR
    });
    console.log("Lightweight Installer built successfully!");
} catch (err) {
    console.error("Failed to build installer:", err.message);
    process.exit(1);
}
