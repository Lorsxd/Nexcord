import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

const sourceImage = "C:\\Users\\Lors\\.gemini\\antigravity\\brain\\c423f4c4-4f34-42d5-aac0-de3b31afc181\\media__1780392497352.jpg";

async function run() {
    try {
        console.log("Resim yükleniyor:", sourceImage);
        const image = await Jimp.read(sourceImage);

        // Assets klasörünü oluştur
        const assetsDir = path.resolve("src/assets");
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        // 1. Electron Builder için 512x512 PNG icon oluştur
        console.log("512x512 PNG icon oluşturuluyor...");
        const electronIcon = image.clone().resize({ w: 512, h: 512 });
        await electronIcon.write(path.join(assetsDir, "icon.png"));
        console.log("512x512 PNG icon başarıyla oluşturuldu: src/assets/icon.png");

        // 2. Tarayıcı uzantısı için 128x128 PNG icon oluştur
        console.log("128x128 PNG icon oluşturuluyor...");
        const browserIcon = image.clone().resize({ w: 128, h: 128 });
        await browserIcon.write(path.resolve("browser/icon.png"));
        console.log("128x128 PNG icon başarıyla oluşturuldu: browser/icon.png");

        console.log("Tüm logo dönüşümleri başarıyla tamamlandı!");
    } catch (error) {
        console.error("Hata oluştu:", error);
    }
}

run();
