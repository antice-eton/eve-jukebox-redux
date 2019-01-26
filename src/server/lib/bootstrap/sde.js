var http = require('http');
var fs   = require('fs');
var path = require('path');
var axios = require('axios');
var appConfig = require('../../config.js');
var mkdirp = require('mkdirp');
var decompress = require('decompress');
// var models = require('../../models.js');
var yaml = require('js-yaml');
var utils = require('../../utils.js');
var logger = require('../../utils.js').get_logger();

function chunk_array(arr, chunkSize) {
    const chunks = [];

    for (var i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }

    return chunks;
}

async function chunked_insert(table, items, chunkSize) {
    const chunks = chunk_array(items, chunkSize);
    const knex = utils.get_orm();

    var remaining = items.length;

    for (var i = 0; i < chunks.length; i++) {
        await knex(table).insert(chunks[i]);
        remaining = remaining - chunks[i].length;
        logger.debug('[SDE] ' + remaining + ' ' + table + ' remaining...');
    }
}

async function process_stations() {

    logger.info('[SDE] Creating stations...');

    const stationDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/staStations.yaml'));
    const stations = [];

    for (let i = 0; i < stationDoc.length; i++) {
        const station = stationDoc[i];

        stations.push({
            station_id: station.stationID,
            system_id: station.solarSystemID,
            region_id: station.regionID,
            constellation_id: station.constellationID,
            type_id: station.stationTypeID,
            name: station.stationName,
            owner: station.corporationID
        });
    }

    await chunked_insert('eve_stations', stations, 82);
}

async function process_systems(systems) {
    logger.info('[SDE] Creating systems...');
    await chunked_insert('eve_systems', systems, 111);
}

async function process_names() {
    logger.info('[SDE] Creating unique names...');
    const nameDoc = yaml.safeLoad(fs.readFileSync(path.resolve('sde','sde','bsd','invUniqueNames.yaml')));
    await chunked_insert('eve_names', nameDoc, 333);
}

async function process_factions() {
    logger.info('[SDE] Creating factions...');

    const factionsDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/chrFactions.yaml'));
    const factions = [];

    for (let i = 0; i < factionsDoc.length; i++) {
        const faction = factionsDoc[i];
        factions.push({
            corporation_id: faction.corporationID,
            faction_id: faction.factionID,
            name: faction.factionName,
            militia_corporation_id: faction.militiaCorporationId,
            description: faction.description
        });
    }

    await chunked_insert('eve_factions', factions, 123);
}

async function process_npc_corporations() {

    logger.info('[SDE] Creating NPC corporations...');

    const corporationsDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/crpNPCCorporations.yaml'));
    const corporations = [];
    const knex = utils.get_orm();

    for (let i = 0; i < corporationsDoc.length; i++) {
        const corp = corporationsDoc[i];
        if (corp.corporationID === 1000001) {
            continue; // Some strange internal game corp that is not used
        }

        const invName = await knex.select('itemName').from('eve_names').where({
            itemID: corp.corporationID
        }).first();

        if (!invName) {
            console.error('Corporation has no name:', corp);
            throw new Error('No name for corporation id:' + corp.corporationID);
        }

        corporations.push({
            corporation_id: corp.corporationID,
            faction_id: corp.factionID,
            name: invName.itemName
        });
    }

    await chunked_insert('eve_corporations', corporations, 82);
}

async function download_sde(targetPath, url) {
    // Download the SDE zip file
    const downloadPath = path.resolve(targetPath, 'download');

    if (!fs.existsSync(downloadPath)) {
        mkdirp.sync(downloadPath);
    }

    if (!url) {
        url = 'https://cdn1.eveonline.com/data/sde/tranquility/sde-20181214-TRANQUILITY.zip';
    }

    logger.info('[SDE] Downloading SDE package:  ' + url);

    const downloadStream = fs.createWriteStream(path.resolve(downloadPath, 'sde.zip'));

    var total = 0;
    var percent = 0;

/*
    downloadStream.on('data', (chunk) => {
        total = total + chunk.length;
        console.log('[ESC] Total:', total + 'b');
    });
    */

    const request_config = {
        url: url,
        responseType: 'stream'
    };

    const res = await axios(request_config);

    res.data.pipe(downloadStream);
    res.data.on('data', (chunk) => {
        total = total + chunk.length;
        percent = (parseFloat(total) / parseFloat(res.headers['content-length'])) * 100;
    });

    const reportInterval = setInterval(() => {
        logger.debug('[SDE] Total downloaded: ' + total + 'b -- ' + percent + '%');
    }, 1000);

    return new Promise((resolve, reject) => {
        res.data.on('end', () => {
            clearInterval(reportInterval);
            resolve();
        });

        res.data.on('error', () => {
            clearInterval(reportInterval);
            reject();
        });
    });
}

async function extract_sde(sdeZipFile) {
    logger.info('[SDE] Extracting the SDE zip file:' + sdeZipFile);
    return decompress(sdeZipFile, 'sde');
}

async function prepare_sde() {

    const knex = utils.get_orm();

    logger.info('[SDE] Checking SDE ... ');

    var totalStations = await knex('eve_stations').count('id').first();
    totalStations = totalStations['count(`id`)'];

    // Postgres could return a string
    if (totalStations === 0 || totalStations === "0") {
        logger.info('[SDE] Station count is zero. I assume SDE is not in the database.');
        logger.info('[SDE] Wiping existing SDE DB');

        await knex('eve_names').truncate();
        await knex('eve_stations').truncate();
        await knex('eve_regions').truncate();
        await knex('eve_constellations').truncate();
        await knex('eve_systems').truncate();

        const targetPath = 'sde';
        const downloadPath = path.resolve(targetPath, 'download', 'sde.zip');

        if (!fs.existsSync(downloadPath)) {
            logger.warn('[SDE] Could not find SDE zip file');
            await download_sde(targetPath);
            await extract_sde(downloadPath);
            logger.info('[SDE] SDE Downloaded and extracted');
        }

        await process_names();

        logger.info('[SDE] Prepare K-Space universe data');

        var folder = 'sde/sde/fsd/universe/eve';

        var folderContents = fs.readdirSync(path.resolve(folder)).filter((rname) => {
            const rdir = path.resolve(folder, rname);

            if (fs.lstatSync(rdir).isDirectory()) {
                return true;
            } else {
                return false;
            }
        }).map((rname) => {
            return path.resolve(folder, rname);
        });

        var total_systems = [];

        for (let i = 0; i < folderContents.length; i++) {
            var region_systems = await process_region(folderContents[i]);
            total_systems = total_systems.concat(region_systems);
        }

        logger.info('[SDE] Prepare W-Space universe data');

        folder = 'sde/sde/fsd/universe/wormhole';

        folderContents = fs.readdirSync(path.resolve(folder)).filter((rname) => {
            const rdir = path.resolve(folder, rname);

            if (fs.lstatSync(rdir).isDirectory()) {
                return true;
            } else {
                return false;
            }
        }).map((rname) => {
            return path.resolve(folder, rname);
        });

        for (let i = 0; i < folderContents.length; i++) {
            var region_systems = await process_region(folderContents[i]);
            total_systems = total_systems.concat(region_systems);
        }

        await process_systems(total_systems);
        await process_stations();
        await process_factions();
        await process_npc_corporations();

        /*
        var remaining_systems = total_systems.length;

        const system_chunk_size = 111; // sqlite3 max

        for (var i = 0; i < total_systems.length; i++) {
            await knex('eve_systems').insert(total_systems[i]);
            remaining_systems--;
            logger.debug('[SDE] Created system: ' + total_systems[i].name + ' -- ' + remaining_systems + ' remaining');
        }


        logger.info('[SDE] Creating stations...');

        const stationDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/staStations.yaml'));

        for (let i = 0; i < stationDoc.length; i++) {
            const station = stationDoc[i];

            await knex('eve_stations').insert({
                station_id: station.stationID,
                system_id: station.solarSystemID,
                region_id: station.regionID,
                constellation_id: station.constellationID,
                type_id: station.stationTypeID,
                name: station.stationName,
                owner: station.corporationID
            });
        }

        logger.info('[SDE] Creating factions...');

        const factionsDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/chrFactions.yaml'));

        for (let i = 0; i < factionsDoc.length; i++) {
            const faction = factionsDoc[i];

            await knex('eve_factions').insert({
                corporation_id: faction.corporationID,
                faction_id: faction.factionID,
                name: faction.factionName,
                militia_corporation_id: faction.militiaCorporationId,
                description: faction.description
            });
        }

        logger.info('[SDE] Creating corporations...');

        const corporationsDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/crpNPCCorporations.yaml'));

        for (let i = 0; i < corporationsDoc.length; i++) {
            const corp = corporationsDoc[i];
            if (corp.corporationID === 1000001) {
                continue; // Some strange internal game corp that is not used
            }

            const invName = await knex.select('itemName').from('eve_names').where({
                itemID: corp.corporationID
            }).first();

            if (!invName) {
                console.error('Corporation has no name:', corp);
                throw new Error('No name for corporation id:' + corp.corporationID);
            }

            await knex('eve_corporations').insert({
                corporation_id: corp.corporationID,
                faction_id: corp.factionID,
                name: invName.itemName
            });
        }
        */

        logger.info('[SDE] SDE Prepared.');
    }
}

async function process_region(folder) {

    const orm = utils.get_orm();

    const name = path.basename(folder);

    const regionDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folder, 'region.staticdata')));

    const invName = await orm.select('itemName').from('eve_names').where({
        itemID: regionDoc.regionID
    }).first();

    const region = {
        region_id: regionDoc.regionID,
        name: invName.itemName
    };

    await orm('eve_regions').insert(region);

    const folderContents = fs.readdirSync(path.resolve(folder)).filter((cname) => {
        const cdir = path.resolve(folder, cname);
        if (fs.lstatSync(cdir).isDirectory()) {
            return true;
        } else {
            return false;
        }
    }).map((cname) => {
        return path.resolve(folder, cname);
    });

    var region_systems = [];

    for (let i = 0; i < folderContents.length; i++) {

        const new_systems = await process_constellation(folderContents[i], region);
        region_systems = region_systems.concat(new_systems);


        // await process_constellation(folderContents[i], region);
    }

    /*

    var remaining_systems = region_systems.length;

    for (var i = 0; i < region_systems.length; i++) {
        await orm('eve_systems').insert(region_systems[i]);
        remaining_systems--;
        logger.debug('[SDE] Creating system: ' + region_systems[i].name + ' -- ' + remaining_systems + ' remaining');
    }

    //logger.debug('[SDE] Creating ' + region_systems.length + ' systems for "' + region.name + '"');
    //await orm('eve_systems').insert(region_systems);
    */
    return region_systems;
}

async function process_constellation(folder, region) {

    const orm = utils.get_orm();

    folder = path.resolve(folder);
    const name = path.basename(folder);

    const constellationDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folder, 'constellation.staticdata')));

    const invName = await orm('eve_names').select('itemName').where({
        itemID: constellationDoc.constellationID
    }).first();

    /*
    const invName = await models.EveName.findOne({
        where: {
            itemID: constellationDoc.constellationID
        }
    });
    */

    const constellation = {
        constellation_id: constellationDoc.constellationID,
        name: invName.itemName,
        region_id: region.region_id
    };

    await orm('eve_constellations').insert(constellation);

    /*
    const constellation = await region.createConstellation({
        constellation_id: constellationDoc.constellationID,
        name: invName.itemName,
        region_id: region.region_id
    });
    */

    const folderContents = fs.readdirSync(folder).filter((sname) => {
        sdir = path.resolve(folder, sname);

        if (fs.lstatSync(sdir).isDirectory()) {
            return true;
        } else {
            return false;
        }
    }).map((sname) => {
        return path.resolve(folder, sname);
    });

    const systems = [];

    for (let i = 0; i < folderContents.length; i++) {

        const systemDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folderContents[i], 'solarsystem.staticdata')));

        const invName = await orm('eve_names').select('itemName').where({
            itemID: systemDoc.solarSystemID
        }).first();

        /*
        const invName = await models.EveName.findOne({
            where: {
                itemID: systemDoc.solarSystemID
            }
        });
        */

        systems.push({
            name: invName.itemName,
            system_id: systemDoc.solarSystemID,
            constellation_id: constellation .constellation_id,
            security_status: Math.round(systemDoc.security * 10) / 10,
            security_class: systemDoc.securityClass,
            star_id: systemDoc.star.id,
        })
    }

    return systems;


//    const newSystems = await models.EveSystem.bulkCreate(systems, { individualHooks: true });

//    await constellation.addSystems(newSystems);

    //return constellation[0];
}

module.exports = prepare_sde;
