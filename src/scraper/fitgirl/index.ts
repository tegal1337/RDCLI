import got from 'got';
import {load} from 'cheerio';
import type {PopularGame,GameDetails,EntryData} from '../../interfaces/index';
import { downloadTorrent } from '../../tools/torrentDownloader';
import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';
import { checkIfDirectoryExists } from '../../utils';
export class Fitgirl{
    private baseUrl = 'https://fitgirl-repacks.site';
    private client = new WebTorrent();
    async getPopularGames(): Promise<PopularGame[]> {
        try {
            const response = await got(this.baseUrl).text();
            const $ = load(response);
            let elements: PopularGame[] = [];

            $('.widget-grid-view-image').each((index, element) => {
                const title = $(element).find('a').attr('title') ?? '';
                const link = $(element).find('a').attr('href') ?? '';
                const imgSrc = $(element).find('img').attr('src') ?? '';

                elements.push({
                    title,
                    link,
                    imgSrc
                });
            });

            return elements;
        } catch (error) {
            console.error('Error fetching popular games:', error);
            return []; 
        }
    }

    async getData(url : string) {
        const response = await got(url).text();
        const $ = load(response);
        const gameDetails: GameDetails = {
            title: '',
            version: '',
            genres: '',
            downloadLinks: [],
            magnetLinks: [],
            imgSrc: ''
        };
    
        const titleElement = $('h3').first();
        const titleText = titleElement.text().trim();
        gameDetails.title = titleText.replace(/#[0-9]+/, '').trim();
        gameDetails.version = titleElement.find('span').text().trim();
        const imageSrc = $('.entry-content').find('img').attr('src');
        gameDetails.imgSrc = imageSrc;
    
        $('p').each((index, element) => {
            const text = $(element).text();
            if (text.includes('Genres/Tags')) {
                gameDetails.genres = $(element).find('strong').first().text().trim();
            }
        });
    
        $('#post-27817 > div > ul:nth-child(6) a').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('http')) {
                gameDetails.downloadLinks.push({url: href });
            }
        });
        
        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('magnet')) {
                gameDetails.magnetLinks.push(href);
            }
        });
        return gameDetails;
        
    }

    async searchGame(gameName: string) {
        try {
    
        const response = await got(`${this.baseUrl}/?s=${gameName}`).text();
        const $ = load(response);
        const entries: EntryData[] = [];
    
        $('header.entry-header').each((index, element) => {
            const category = $(element).find('.cat-links a').text().trim();
            const titleElement = $(element).find('h1.entry-title a');
            const title = titleElement.text().trim();
            const postUrl = titleElement.attr('href') || '';
            const date = $(element).find('time.entry-date').attr('datetime') || '';
            const imageSrc = $(element).find('img').attr('src') || '';
            entries.push({
                category,
                title,
                url: postUrl,
                date,
                imgSrc: imageSrc
            });
        });

        const resultData = entries.filter(entry => entry.category === 'Lossless Repack');
        return resultData;
                
    } catch (error) {
            console.log(error);
    }
    }

    async downloadGame(magnetLink: string, downloadPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(downloadPath)) {
                fs.mkdirSync(downloadPath, { recursive: true });
            }

            const progressBar = new cliProgress.SingleBar({
                format: 'Downloading [{bar}] {percentage}% | {value}/{total} MB',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            }, cliProgress.Presets.shades_classic);

            this.client.add(magnetLink, { path: downloadPath }, (torrent) => {
                console.log('Client is downloading:', torrent.infoHash);

                progressBar.start(torrent.length / (1024 * 1024), 0);

                torrent.on('download', (bytes) => {
                    const downloaded = torrent.downloaded / (1024 * 1024);
                    progressBar.update(downloaded);
                });

                torrent.on('done', () => {
                    console.log('✅ Download finished');
                    progressBar.stop();

                    torrent.files.forEach(file => {
                        const filePath = path.join(downloadPath, file.path);
                        checkIfDirectoryExists(path.dirname(filePath));
                        const stream = file.createReadStream();
                        const writeStream = fs.createWriteStream(filePath);

                        stream.pipe(writeStream);
                        console.log(`Downloading file: ${file.name}`);
                    });

                    this.client.destroy();
                    resolve();
                });

                torrent.on('error', (err) => {
                    console.error('❌ Torrent error:', err);
                    progressBar.stop();
                    this.client.destroy();
                    reject(err);
                });
            });
        });
    }
}