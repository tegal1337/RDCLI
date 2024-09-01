
import fs from 'fs';
function createFolder(folderName) {
    const folderPath = new URL('.', import.meta.url).pathname;
       if (!fs.existsSync(folderPath)) {
           fs.mkdirSync(folderPath);
           console.log(`Folder "${folderName}" created.`);
       }
       return folderPath;
   }

export { createFolder }