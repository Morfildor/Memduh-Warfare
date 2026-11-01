// ---------------------------------------------------------------------------------------------
// POMPA TEAM CAMEOS
// To add a friend: put their finished pixel-art portrait (about 88x80) in public/assets/friends/ and add an entry
// below. `art` is a ready-made portrait that is drawn as is. A raw `photo` still works too: the game pixelates and
// posterises it into an arcade portrait by itself. Entries with neither get a mystery silhouette.
//   catchphrases: one is picked at random every time the friend appears
//   power: what the friend does when they crash into the game
//     strike  - screams their catchphrase and blasts every enemy on screen
//     shield  - gives Memduh a shield for 10 seconds
//     rapid   - rapid fire for 10 seconds
//     bombs   - refills all bombs and makes the next one huge
//     heal    - two glasses of tea back
//     anesthesia - every normal enemy on screen is put to sleep and falls down for a few seconds
//     hack    - every enemy on screen is glitched out and erased
//     slap    - rapid fire AND unlimited bombs for 10 seconds
// ---------------------------------------------------------------------------------------------
//     airdrop - a cargo plane flies over and drops a patso on a parachute (catch it mid-air for double tea)
export type FriendPower = 'strike' | 'shield' | 'rapid' | 'bombs' | 'heal' | 'anesthesia' | 'hack' | 'slap' | 'airdrop';

export interface Friend {
    id: string;
    /** shown above the catchphrase, in capitals */
    name: string;
    /** stylised portrait inside public/assets/friends/, e.g. 'ahmet.png' */
    art?: string;
    /** raw photo inside public/assets/friends/, pixelated by the game */
    photo?: string;
    catchphrases: string[];
    power: FriendPower;
}

export const FRIENDS: Friend[] = [
    {
        id: 'tunc', name: 'TUNÇ', art: 'tunc.png', power: 'hack',
        catchphrases: [
            'Alırım bi takla onur. Taklacı güvercin gibi adamsın.',
            'Ekmek arası salata var. Döner yok bu çölde. Sana yeter al!',
            'Dürüm ol abi. Yardımcı olur.',
        ],
    },
    {
        id: 'deniz', name: 'DENİZ', art: 'deniz.png', power: 'slap',
        catchphrases: [
            'Motivasyon şaplağı geliyor. Beline doğru *şap şap*',
            'Abi mayonezli balık kraker gönderiyorum.',
            'Abi 8deki buluşmaya 8de evden çıkınca geç kaldım. Al çikolata',
            'Ya şeyin sevgilisinin adı neydi?',
        ],
    },
    {
        id: 'melike', name: 'MELİKE', art: 'melike.png', power: 'anesthesia',
        catchphrases: [
            'Nöbetten yorgun argın geldim. Ama bu anı kaçırmam.',
            'Kahve içmedim. Kafam tuttu lan. Dağılın!',
        ],
    },
    {
        id: 'tugce', name: 'TUĞÇE', art: 'tugce.png', power: 'heal',
        catchphrases: [
            'Yalnız dahi anlamındaki de/da ayrı yazılır. Gerçi anlamıyorum arapça herşey.',
        ],
    },
    // fictional cameos from the dershane (rename freely)
    {
        id: 'kantinci', name: 'DERSHANE KANTİNCİSİ', art: 'kantinci.png', power: 'airdrop',
        catchphrases: [
            'Patso hazır abi! Uçakla yolluyorum, hesabı sonra yazarız.',
            'Üç patso bir mayonezli balık kraker geliyor',           
        ],
    },
    {
        id: 'servis', name: 'MINIBUS ŞOFÖRÜ CEMAL', art: 'servis.png', power: 'strike',
        catchphrases: [
            'Taklasız binin lan minibüse!',
            'Geçen yolda parende atan çocuklar siz misiniz?',
        ],
    },
    {
        id: 'mudur', name: 'DERSHANE MÜDÜRÜ', art: 'mudur.png', power: 'shield',
        catchphrases: [
            'Denemeyi kaçıracaksın Memduh! Üst sınıfa alacağım seni',
            'Veliyi çağırın. Kalkanı da al, evladım.',
        ],
    },
];

export const POWER_LABEL: Record<FriendPower, string> = {
    strike: 'TOPLU DARBE!',
    shield: 'DOST KALKANI!',
    rapid: 'HIZLI ATEŞ!',
    bombs: 'BOMBA YAĞMURU!',
    heal: 'İMLA DÜZELTİLDİ! +2 ÇAY',
    anesthesia: 'ANESTEZİ!',
    hack: 'HACK ATAĞI!',
    slap: 'BEL ŞAPLAĞI!',
    airdrop: 'HAVADAN PATSO!',
};
