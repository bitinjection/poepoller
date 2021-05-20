import * as pkg from 'pg';
const { Pool } = pkg;

import got from 'got';
// import promptSync from 'prompt-sync';


// @ts-ignore
import findFractions from './fractionfinder.js';

interface CurrencyLookup {
    [key: string]: string;
};

const lookupTable: CurrencyLookup = {
    "alt": "Orb of Alteration",
    "fusing": "Orb of Fusing",
    "alch": "Orb of Alchemy",
    "chaos": "Chaos Orb",
    "gcp": "Gemcutter's Prism",
    "exalted": "Exalted Orb",
    "chrome": "Chromatic Orb",
    "jewellers": "Jeweller's Orb",
    "engineers": "Engineer's Orb",
    "infused-engineers-orb": "Infused Engineer's Orb",
    "chance": "Orb of Chance",
    "chisel": "Cartographer's Chisel",
    "scour": "Orb of Scouring",
    "blessed": "Blessed Orb",
    "regret": "Orb of Regret",
    "regal": "Regal Orb",
    "divine": "Divine Orb",
    "vaal": "Vaal Orb",
    "annul": "Orb of Annulment",
    "orb-of-binding": "Orb of Binding",
    "ancient-orb": "Ancient Orb",
    "orb-of-horizons": "Orb of Horizons",
    "harbingers-orb": "Harbinger's Orb",
    "wisdom": "Scroll of Wisdom",
    "portal": "Portal Scroll",
    "scrap": "Armourer's Scrap",
    "whetstone": "Blacksmith's Whetstone",
    "bauble": "Glassblower's Bauble",
    "transmute": "Orb of Transmutation",
    "aug": "Orb of Augmentation",
    "mirror": "Mirror of Kalandra",
    "eternal": "Eternal Orb",
    "p": "Perandus Coin",
    "rogues-marker": "Rogue's Marker",
    "silver": "Silver Coin",
    "crusaders-exalted-orb": "Crusader's Exalted Orb",
    "redeemers-exalted-orb": "Redeemer's Exalted Orb",
    "hunters-exalted-orb": "Hunter's Exalted Orb",
    "warlords-exalted-orb": "Warlord's Exalted Orb",
    "awakeners-orb": "Awakener's Orb",
    "mavens-orb": "Maven's Orb",
    "facetors": "Facetor's Lens",
    "prime-regrading-lens": "Prime Regrading Lens",
    "secondary-regrading-lens": "Secondary Regrading Lens",
    "tempering-orb": "Tempering Orb",
    "tailoring-orb": "Tailoring Orb",
    "stacked-deck": "Stacked Deck",
    "ritual-vessel": "Ritual Vessel",
    "apprentice-sextant": "Simple Sextant",
    "journeyman-sextant": "Prime Sextant",
    "master-sextant": "Awakened Sextant",
    "elevated-sextant": "Elevated Sextant",
    "orb-of-unmaking": "Orb of Unmaking",
    "blessing-xoph": "Blessing of Xoph",
    "blessing-tul": "Blessing of Tul",
    "blessing-esh": "Blessing of Esh",
    "blessing-uul-netol": "Blessing of Uul-Netol",
    "blessing-chayula": "Blessing of Chayula",
    "veiled-chaos-orb": "Veiled Chaos Orb"
};

// const prompt = promptSync();

// @ts-ignore
// const promptForFractions = () => {
    // const price = prompt('Enter price: ');
    // const epsilon = prompt('Enter range: ', '0.1');
// 
    // const results = findFractions(parseFloat(price), parseFloat(epsilon));

    // const ascending = (a: any, b: any) => a.price > b.price ? 1 : -1;
    // const descending = (a: any, b: any) => a.price < b.price ? 1 : -1;

    // results.sort(descending);
// };

// promptForFractions();
 
// @ts-ignore
const whatever = async () => {

    const pool = new Pool();

    let nextId = '1162786582-1169231486-1127456780-1263840706-1212587722';

    const baseUrl = 'http://www.pathofexile.com/api/public-stash-tabs';

    setInterval(async () => {
        const url = nextId !== '' ? `${baseUrl}?id=${nextId}` : baseUrl;
        const response = await got(url, { responseType: "json" });

        const getRateLimits = (headers: any) => {
            const key = 'x-rate-limit-ip';
            const limitString = headers[key];
            const [ requests, timeframe, throttle] = limitString.split(':');

            const limits = { requests, timeframe, throttle };

            return limits;
        };

        const { requests, timeframe } = getRateLimits(response.headers);

        // Double the limit to hopefully just avoid dealing with throttling for now
        // @ts-ignore
        const nextRequestDelay = requests / timeframe * 2;

        const stashes: any = response.body;

        nextId = stashes.next_change_id;

        const updateLastStashQuery = `UPDATE last_stash SET request_id = $1 WHERE id = 1`;
        pool.query(updateLastStashQuery, [ nextId ]);

        const populatedStashes = stashes.stashes
            .filter((stash: any) => stash.items.length > 0);

        const isItemForSell = (item: any) =>
                item.note
                && item.extended.category === 'currency';
                // && stash.public;

        const hasCurrencyForSale = (stash: any) => {
            return stash.items.filter((item: any) =>
                isItemForSell(item)
                && stash.public).length > 0
        };

        const forSaleStashes = populatedStashes.filter(hasCurrencyForSale);
        const filteredStashes = forSaleStashes.map((stash: any) => {
            const filteredItems = stash.items.filter((item: any) => isItemForSell(item));
            stash.items = filteredItems;
            return stash;
        });


        filteredStashes.forEach(async (stash: any) => {
            const insertLeague = `INSERT INTO league (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`;
            const leagueValues = [ stash.league ]

            await pool.query(insertLeague, leagueValues);

            const insertStash = `INSERT INTO stash (stash_id, account) VALUES ($1, $2) ON CONFLICT (stash_id) DO NOTHING`;
            const stashValues = [ stash.id, stash.accountName ];

            await pool.query(insertStash, stashValues);
            const leagueIdResult = await pool.query(`SELECT league_id FROM league WHERE "name" = $1`, [ stash.league ]);
            const stashIdResult = await pool.query(`SELECT stash_identity FROM stash WHERE stash_id = $1`, [ stash.id ]);

            if (leagueIdResult.rowCount !== 1 || stashIdResult.rowCount !== 1) return;

            const leagueId = leagueIdResult.rows[0].league_id;
            const stashIdentity = stashIdResult.rows[0].stash_identity;

            // Delete existing stash information if we get an updated version of this stash
            await pool.query(`DELETE FROM stash_currency WHERE stash_id = $1`, [ stashIdentity ]);



            stash.items.forEach(async (item: any) => {
                const insertCurrency = `INSERT INTO currency (fullname, shortname, icon_url) VALUES ($1, $2, $3) ON CONFLICT (shortname) DO NOTHING`;
                const currencyValues = [ item.baseType, item.baseType, item.icon ];

                await pool.query(insertCurrency, currencyValues);

                const noteParts = item.note.split(' ');
                if (noteParts.length === 3) {
                    const fraction: string = noteParts[1];
                    const askingCurrencyShortname: string = noteParts[2];

                    const isFraction = (fraction.indexOf('/') !== -1);

                    const askCurrencyAmount = isFraction ? fraction.split('/')[0] : fraction;
                    const offerCurrencyAmount = isFraction ? fraction.split('/')[1] : 1;

                    const askFullname: string | undefined = lookupTable[askingCurrencyShortname];

                    if (askFullname) {
                        const askCurrencyIdResult = await pool.query(`SELECT currency_id FROM currency WHERE fullname = $1`, [ askFullname]);
                        const currencyIdResult = await pool.query(`SELECT currency_id FROM currency WHERE fullname = $1`, [ item.baseType ]); 

                        if (askCurrencyIdResult.rowCount === 1
                            && currencyIdResult.rowCount === 1) {
                            const askCurrencyId = askCurrencyIdResult.rows[0].currency_id;
                            const currencyId = currencyIdResult.rows[0].currency_id;

                            const insertStashCurrencyQuery = `INSERT INTO stash_currency
                            (currency_id, stash_id, league_id, note, amount_offered, ask_currency_id, ask_currency_amount, creation_time)
                            VALUES
                            ($1, $2, $3, $4, $5, $6, $7, $8)`;
                            const insertStashCurrencyValues = [ currencyId, stashIdentity, leagueId, item.note, offerCurrencyAmount, askCurrencyId, askCurrencyAmount, +(new Date())];

                            pool.query(insertStashCurrencyQuery, insertStashCurrencyValues);
                        }
                    }
                }

            });
        });

    }, 1000)
}


whatever();
