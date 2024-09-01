import fs from 'fs';
import path from 'path';

function checkIfDirectoryExists(filePath) {
    if (fs.existsSync(filePath)) {
        return true;
    }
    fs.mkdirSync(filePath, { recursive: true });
    return true;
}

export { checkIfDirectoryExists };
