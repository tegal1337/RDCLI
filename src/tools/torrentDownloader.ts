import { load } from 'cheerio';
import got from 'got';
import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';
import { checkIfDirectoryExists } from '../utils';

const client = new WebTorrent();

export async function downloadTorrent(magnetlink: string, downloadPath: string) {
    const client = new WebTorrent();

    // Check if the directory exists; if not, create it
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
    }

    const progressBar = new cliProgress.SingleBar({
        format: 'Downloading [{bar}] {percentage}% | {value}/{total} MB',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    client.add(magnetlink, { path: downloadPath }, torrent => {
        console.log('Client is downloading:', torrent.infoHash);

        progressBar.start(torrent.length / (1024 * 1024), 0);

        torrent.on('download', (bytes) => {
            const downloaded = torrent.downloaded / (1024 * 1024);
            progressBar.update(downloaded);
        });

        torrent.on('done', () => {
            console.log('Download finished');
            progressBar.stop();

            torrent.files.forEach(file => {
                const filePath = path.join(downloadPath, file.path);
                const fileDir = path.dirname(filePath);

                // Check and create directory for each file
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                const stream = file.createReadStream();
                const writeStream = fs.createWriteStream(filePath);

                stream.pipe(writeStream);
                console.log(`Downloading file: ${file.name}`);
            });

            client.destroy();
        });

        torrent.on('error', (err) => {
            console.error('Torrent error:', err);
            progressBar.stop();
            client.destroy();
        });
    });
}
