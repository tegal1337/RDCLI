import { Fitgirl } from './scraper/fitgirl';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import terminalImage from 'terminal-image';
import got from 'got';
import banner from './utils/banner';

banner();
const fitgirl = new Fitgirl();

async function main() {
    const mainMenu = [
        { name: '🔍 Search for a game', value: 'search' },
        { name: '🔥 Check popular repacks', value: 'popular' },
        { name: '🚪 Exit', value: 'exit' }
    ];

    let keepRunning = true;

    while (keepRunning) {
        const { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: '🎮 What would you like to do?', 
            choices: mainMenu,
            loop: false,
        });

        switch (action) {
            case 'search':
                await searchGame();
                break;

            case 'popular':
                await checkPopularGames();
                break;

            case 'exit':
                console.log('👋 Goodbye!');
                keepRunning = false;
                break;

            default:
                console.log('❓ Unknown action');
                break;
        }
    }
}

async function searchGame() {
    const { gameName } = await inquirer.prompt({
        type: 'input',
        name: 'gameName',
        message: '🔍 Enter the name of the game you want to search for:',
    });

    const results: any = await fitgirl.searchGame(gameName);

    if (results.length === 0) {
        console.log('⚠️ No results found.');
        return;
    }

    const { selectedGame } = await inquirer.prompt({
        type: 'list',
        name: 'selectedGame',
        message: '🎯 Select a game to view details or download:',
        choices: results.map(result => ({
            name: `${result.title}`,
            value: result.url
        })),
        loop: false, 
    });

    await showGameDetails(selectedGame);
}

async function checkPopularGames() {
    console.log('🔥 Fetching popular games...');
    const popularGames = await fitgirl.getPopularGames();

    if (!popularGames || popularGames.length === 0) {
        console.log('⚠️ No popular games found.');
        return;
    }

    const { selectedGame } = await inquirer.prompt({
        type: 'list',
        name: 'selectedGame',
        message: '🎯 Select a game to view details or download:',
        choices: popularGames.map(game => ({
            name: game.title,
            value: game.link
        })),
        loop: false, 
    });

    await showGameDetails(selectedGame);
}

async function showGameDetails(selectedGame: string) {
    const gameDetails = await fitgirl.getData(selectedGame);

    const table = new Table({
        head: ['📋 Field', 'ℹ️ Details'],
        colWidths: [20, 80],
    });

    console.clear();

    const imageUrl = gameDetails?.imgSrc;
    if (imageUrl) {
        try {
            const cleanImageUrl = imageUrl.split('?')[0];
            const body = await got(cleanImageUrl).buffer();
          
            table.push(
                ['Image', await terminalImage.buffer(body, {width: 20, height: 15, preserveAspectRatio: false})],
                ['Title', gameDetails.title],
                ['Version', gameDetails.version],
                ['Genres', gameDetails.genres],
                ['Magnet Links', gameDetails.magnetLinks.join('\n')]
            );
        
        } catch (err) {
            console.error('❌ Error displaying image:', err.message);
        }
    } else {
        table.push(
            ['Title', gameDetails.title],
            ['Version', gameDetails.version],
            ['Genres', gameDetails.genres],
            ['Magnet Links', gameDetails.magnetLinks.join('\n')]
        );
    }

    console.log(table.toString());

    const { downloadChoice } = await inquirer.prompt({
        type: 'confirm',
        name: 'downloadChoice',
        message: '⬇️ Would you like to download this game via torrent?',
    });

    if (downloadChoice) {
        const { downloadPath } = await inquirer.prompt({
            type: 'input',
            name: 'downloadPath',
            message: '📁 Enter the download path:',
            default: './downloads',
        });

        console.log('🚀 Starting download...');
        await startDownload(gameDetails.magnetLinks[0], downloadPath);
        console.log('✅ Download completed or stopped.');
    } else {
        console.clear();
        const { nextAction } = await inquirer.prompt({
            type: 'list',
            name: 'nextAction',
            message: '🔙 Would you like to return to the menu or exit?',
            choices: [
                { name: '🔙 Back to Menu', value: 'menu' },
                { name: '🚪 Exit', value: 'exit' }
            ],
            loop: false,
        });

        if (nextAction === 'exit') {
            console.log('👋 Goodbye!');
            process.exit(1);
        }
    }
}

async function startDownload(magnetLink: string, downloadPath: string) {
    try {
        await fitgirl.downloadGame(magnetLink, downloadPath);
        console.log('✅ Download completed.');
    } catch (err) {
        console.error('❌ Download error:', err.message);
        console.error(err);
    }
}

// Start the CLI
main();
