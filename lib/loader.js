var fs = require('fs'),
    path = require('path'),
    findup = require('findup-sync'),
    validateDirectory = require('./validate').directory,
    Config = require('./config');

function loadObject(object, baseUrl) {
    if (typeof object !== 'object' || Array.isArray(object)) {
        throw new Error('Please supply valid config, path to config or directory to start searching up from');
    }

    // fs.statSync might throw an exception as well
    try {
        if (typeof baseUrl !== 'string' || !fs.statSync(baseUrl).isDirectory()) {
            throw new Error('Invalid baseUrl');
        }
    } catch (err) {
        throw new Error('Invalid baseUrl');
    }

    return new Config(object, baseUrl);
}

function loadFile(filepath) {
    var stats;

    try {
         stats = fs.statSync(filepath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error('No such file ' + filepath);
        } else {
            throw err;
        }
    }

    if (!stats.isFile()) {
        throw new Error(filepath + ' is not a file');
    }

    return loadObject(JSON.parse(fs.readFileSync(filepath)), path.dirname(filepath));
}

function loadFromDirectory(dirpath) {
    var stats;

    validateDirectory(dirpath);

    if (fs.existsSync(dirpath + '/requirejs-build.json')) {
        return loadFile(dirpath + '/requirejs-build.json');
    } else {
        var file = findup('requirejs-build.json', { cwd: dirpath });

        if (file === null) {
            throw new Error('Could not locate requirejs-build.json in ' + dirpath +
                            ' or any of its parent directories');
        }

        return loadFile(file);
    }
}

module.exports = {
    loadObject: loadObject,
    loadFile: loadFile,
    loadFromDirectory: loadFromDirectory
};