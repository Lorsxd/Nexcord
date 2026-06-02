# <img src="browser/icon.png" align="left" width="48" height="48" style="margin-right: 10px;"> Nexcord

Nexcord is a modern, privacy-friendly, and highly customizable client modification for Discord's desktop application. Built on web technologies and optimized for speed, Nexcord allows you to tailor your Discord experience exactly how you want it.

Featuring a built-in **Firebase Cloud Sync** integration, Nexcord automatically back up your settings, active plugins, and custom CSS securely to your own cloud veritabanı, sync'ing them across all your devices seamlessly.

---

## ✨ Features

* **Easy to Install**: Package into a single executable or inject directly into Discord with a single command.
* **100+ Built-in Plugins**: Wide range of customizable tools to enhance your daily Discord usability.
* **Firebase Cloud Sync**: Securely sync your themes, custom CSS, and settings across different devices using your own Firebase project.
* **Performance Focused**: Extremely lightweight and optimized, ensuring zero lag even with many active plugins.
* **Privacy Friendly**: Telemetry and Discord crash reporting/analytics are blocked out-of-the-box.
* **Custom CSS & Themes**: Built-in CSS editor with full support to import BetterDiscord themes and custom styling.

---

## 🚀 Installation

### 💻 Option 1: Fast Desktop Installer (.exe)
Visit the **[Releases](https://github.com/Lorsxd/Nexcord/releases)** page and download the latest `Nexcord Setup.exe` file. Double-click it to install Nexcord automatically on your Windows system.

### 🛠️ Option 2: Installation via Git (Developer Setup)
If you want to run Nexcord from the source code or develop your own plugins, follow these quick steps:

#### 📋 Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (Version 18 or above)
* [Git](https://git-scm.com/)
* **pnpm** (Package manager, run `npm i -g pnpm` to install)
* Discord desktop client

#### 💻 Commands
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Lorsxd/Nexcord.git
   cd Nexcord
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the Application**:
   ```bash
   pnpm buildStandalone
   ```

4. **Inject to Discord**:
   ```bash
   pnpm inject
   ```
   *Note: Close Discord completely (from system tray too) and restart it. You will see the **Nexcord Settings** tab in your Discord settings.*

5. **Uninstall (Uninject)**:
   ```bash
   pnpm uninject
   ```

---

## 🛡️ Disclaimer

Discord is a trademark of Discord Inc. and is solely mentioned for descriptive purposes. 
Using client modifications violates Discord's Terms of Service. However, Nexcord is built to be safe and privacy-friendly, with no known bans associated with using normal UI customizations. Use responsibly.
