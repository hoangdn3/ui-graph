import fs from "fs";
import path from "path";
import {execSync} from "child_process";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const ensureDir = (dir) => {
    const d = path.resolve(dir);
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    return d;
};

export const saveBase64AsFile = (base64, folder = "screens", filename = null) => {
    ensureDir(folder);
    const name = filename || `${Date.now()}.png`;
    const filePath = path.join(path.resolve(folder), name);
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    return filePath;
};

export const getScreenSize = () => {
    try {
        if (process.platform === 'darwin') {
            const result = execSync(
                `osascript -e 'tell application "Finder" to get bounds of window of desktop'`
            ).toString();
            const [x, y, width, height] = result.split(',').map(s => parseInt(s.trim(), 10));
            return { width, height };
        } else if (process.platform === 'win32') {
            const result = execSync(
                `powershell -command "Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Write-Output $screen.Width; Write-Output $screen.Height"`
            ).toString().trim().split('\n').map(s => parseInt(s.trim(), 10));
            console.log('PowerShell result:', result);
            return { width: result[0], height: result[1] };
        } else {
            const result = execSync(`xrandr | grep '*' | awk '{print $1}'`).toString();
            const [width, height] = result.split('x').map(Number);
            return { width, height };
        }
    } catch (e) {
        console.error("⚠️ Lấy screen size thất bại, fallback 1920x1080");
        return { width: 1920, height: 1080 };
    }
};
// Hàm tính overlap dựa vào bounding box
export const calcOverlapBox = (a, b) => {
    // Lấy toạ độ
    const ax1 = a.x;
    const ay1 = a.y;
    const ax2 = a.x + a.w;
    const ay2 = a.y + a.h;

    const bx1 = b.x;
    const by1 = b.y;
    const bx2 = b.x + b.w;
    const by2 = b.y + b.h;

    // Intersection
    const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
    const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
    const intersection = overlapX * overlapY;

    if (intersection <= 0) return 0;

    // Area của từng box
    const aArea = a.w * a.h;
    const bArea = b.w * b.h;

    // Union = A + B - Intersect
    const union = aArea + bArea - intersection;

    if (union <= 0) return 0;

    return intersection / union;
};
export const isBoxInside = (a, b, threshold = 0.95) => {
    const ax1 = a.x;
    const ay1 = a.y;
    const ax2 = a.x + a.w;
    const ay2 = a.y + a.h;

    const bx1 = b.x;
    const by1 = b.y;
    const bx2 = b.x + b.w;
    const by2 = b.y + b.h;

    // Calculate overlap
    const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
    const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
    const overlapArea = overlapX * overlapY;

    if (overlapArea <= 0) return "none";

    const areaA = a.w * a.h;
    const areaB = b.w * b.h;

    // A nằm trong B
    if (overlapArea / areaA >= threshold) {
        return "A_in_B";
    }

    // B nằm trong A
    if (overlapArea / areaB >= threshold) {
        return "B_in_A";
    }

    return "none";
}
