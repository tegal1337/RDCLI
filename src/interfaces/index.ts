export interface PopularGame {
    title: string;
    link: string;
    imgSrc: string;
}

export interface fitgirlClasses {
    title: string;
    link: string;
    imgSrc: string;
}

export interface DownloadLink {
    text: string;
    url: string;
}

export interface GameDetails {
    imgSrc: string | undefined;
    title: string;
    version: string;
    genres: string;
    downloadLinks: any[];
    magnetLinks: string[];
}

export interface EntryData {
    category: string;
    title: string;
    url: string;
    date: string;
    imgSrc: string;
}