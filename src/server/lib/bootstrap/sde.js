var http = require('http');
var fs   = require('fs');
var path = require('path');
var axios = require('axios');
var appConfig = require('../../config.js');
var mkdirp = require('mkdirp');
var decompress = require('decompress');
var models = require('../../models.js');
var yaml = require('js-yaml');

var logger = require('../../utils.js').get_logger();

async function bootstrap_names() {
    logger.info('[SDE] Loading unique names');
    const nameDoc = yaml.safeLoad(fs.readFileSync(path.resolve('sde','sde','bsd','invUniqueNames.yaml')));

    logger.info('[SDE] Total names: ' + nameDoc.length);
    logger.info('[SDE] Bulk creating names to db');
    await models.EveName.bulkCreate(nameDoc);
    logger.info('[SDE] Ugh, done');

}

async function download_sde(targetPath, url) {

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
    logger.info('[SDE] Checking SDE ... ');

    var totalStations = await models.EveStation.count();


    if (totalStations === 0) {
        logger.info('[SDE] Station count is zero. I assume SDE is not in the database.');
        logger.info('[SDE] Wiping existing SDE DB');

        await models.EveName.destroy({
            where: {},
            truncate: false
        });

        await models.EveStation.destroy({
            where: {},
            truncate: false
        });

        await models.EveRegion.destroy({
            where: {},
            truncate: false
        });

        await models.EveConstellation.destroy({
            where: {},
            truncate: false
        });

        await models.EveSystem.destroy({
            where: {},
            truncate: false
        });

        const targetPath = 'sde';
        const downloadPath = path.resolve(targetPath, 'download', 'sde.zip');

        if (!fs.existsSync(downloadPath)) {
            logger.warn('[SDE] Could not find SDE zip file');
            await download_sde(targetPath);
            await extract_sde(downloadPath);
            logger.info('[SDE] SDE Downloaded and extracted');
        }

        await bootstrap_names();

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

        for (let i = 0; i < folderContents.length; i++) {
            await process_region(folderContents[i]);
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
            await process_region(folderContents[i]);
        }


        logger.info('[SDE] Creating stations...');

        const stationDoc = yaml.safeLoad(fs.readFileSync('sde/sde/bsd/staStations.yaml'));

        for (let i = 0; i < stationDoc.length; i++) {
            const station = stationDoc[i];
            await models.EveStation.create({
                station_id: station.stationID,
                system_id: station.solarSystemID,
                region_id: station.regionID,
                constellation_id: station.constellationID,
                type_id: station.stationTypeID,
                name: station.stationName,
                owner: station.corporationID
            });
        }

        logger.info('[SDE] SDE Prepared.');
    }
}

async function process_region(folder) {
    const name = path.basename(folder);

    const regionDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folder, 'region.staticdata')));

    const invName = await models.EveName.findOne({
        where: {
            itemID: regionDoc.regionID
        }
    });

    const region = await models.EveRegion.create({
        region_id: regionDoc.regionID,
        name: invName.itemName
    });

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

    var systems = [];

    for (let i = 0; i < folderContents.length; i++) {
        var constellation = await process_constellation(folderContents[i], region);
        region.addConstellation(constellation);
    }



    for (let i = 0; i < folderContents.length; i++) {

    }

    await models.EveSystem.bulkCreate(systems);
}

async function process_constellation(folder, region) {
    folder = path.resolve(folder);
    const name = path.basename(folder);

    const constellationDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folder, 'constellation.staticdata')));

    const invName = await models.EveName.findOne({
        where: {
            itemID: constellationDoc.constellationID
        }
    });

    const constellation = await region.createConstellation({
        constellation_id: constellationDoc.constellationID,
        name: invName.itemName,
        region_id: region.region_id
    });

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
        const invName = await models.EveName.findOne({
            where: {
                itemID: systemDoc.solarSystemID
            }
        });

        systems.push({
            name: invName.itemName,
            system_id: systemDoc.solarSystemID,
            constellation_id: constellation.constellation_id,
            security_status: systemDoc.security,
            security_class: systemDoc.securityClass,
            star_id: systemDoc.star.id,
        })
    }

    logger.debug('[SDE] Creating ' + systems.length + ' systems for "' + region.name + '"');
    const newSystems = await models.EveSystem.bulkCreate(systems, { individualHooks: true });

    await constellation.addSystems(newSystems);

    return constellation;
}

async function process_system(folder, constellation) {
    const name = path.basename(folder);

    logger.debug('[SDE] Processing system: ' + name);

    const systemDoc = yaml.safeLoad(fs.readFileSync(path.resolve(folder, 'solarsystem.staticdata')));

    const invName = await models.EveName.findOne({
        where: {
            itemID: systemDoc.solarSystemID
        }
    });

    const system = await constellation.createSystem({
        name: invName.itemName,
        system_id: systemDoc.solarSystemID,
        constellation_id: constellation.constellation_id,
        security_status: systemDoc.security,
        security_class: systemDoc.securityClass,
        star_id: systemDoc.star.id,
    });
}

module.exports = prepare_sde;
