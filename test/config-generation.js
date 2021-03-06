var test = require('tape'),
    fs = require('fs'),
    path = require('path'),
    loader = require('../lib/loader');

var fixture = JSON.parse(fs.readFileSync(__dirname + '/fixtures/requirejs-build.json'));

test('generating invalid module', function(t) {
    t.plan(1);

    var config = loader.object(fixture, __dirname);

    config.generate('non-existing', null, function(err) {
        t.equals(err, 'No config for module non-existing');
    });
});

test('generate requirejs module config', function(t) {
    t.plan(2);

    var config = loader.object(fixture, __dirname);

    config.generate('libs', null, function(err, config) {
        t.equals(config.optimize, fixture.default.optimize);
        t.looseEquals(config.include, fixture.modules.libs.include);
    });
});

test('module config should override default config', function(t) {
    t.plan(1);

    var config = loader.object(fixture, __dirname);

    config.generate('shared', null, function(err, config) {
        t.equals(config.optimize, fixture.modules.shared.optimize);
    });
});

test('path options should have its path resolved', function(t) {
    // Config in the default object should be outputed in the generated requirejs config
    t.plan(4);

    var config = loader.object(fixture, __dirname);

    config.generate('libs', null, function(err, config) {
        t.equals(config.optimize, fixture.default.optimize);
        t.equals(config.mainConfigFile, path.join(__dirname, fixture.default.mainConfigFile));
        t.equals(config.baseUrl, path.join(__dirname, fixture.default.baseUrl));

        // Paths starting with / shouldnt be resolved
        t.equals(config.binary, fixture.default.binary);
    });
});

test('excludeModules', function(t) {
    t.plan(5);

    // excludeModules config should not be part of RequireJS config
    var config = loader.object(fixture, __dirname);

    config.generate('shared', null, function(err, config) {
        t.equals(config.excludeModules, undefined);

        // excludeModules config should exclude other modules
        t.looseEquals(config.exclude, ['jquery', 'lodash']);
    });

    config.generate('excludeModulesFaulty', null, function(err) {
        t.equals(err, 'excludeModules must be an array');
    });

    config.generate('excludeNotArray', null, function(err) {
        t.equals(err, 'exclude must be an array');
    });

    config.generate('excludeMissingModule', null, function(err) {
        t.equals(err, 'Can not exclude unconfigured module missing-module');
    });
});

test('directory option', function(t) {
    // Should include all files in a given directory
    t.plan(6);

    var config = loader.object(fixture, __dirname + '/fixtures');

    config.generate('directory', null, function(err, config) {
        t.equals(config.directory, undefined);

        t.looseEquals(config.include,
                      ['directory/file1.js', 'directory/file2.js',
                       'directory/subdir/file3.js']);
    });

    config.generate('invalidDirectory', null, function(err) {
        t.ok(err.match(/Invalid directory/));
    });

    config.generate('missingDirectory', null, function(err) {
        t.ok(err.match(/No such directory/));
    });

    config.generate('fileAsDirectory', null, function(err) {
        t.ok(err.match(/is not a directory/));
    });

    config.generate('includeNotArray', null, function(err) {
        t.equals(err, 'include must be an array');
    });
});

test('invalid filters', function(t) {
    // Throw error when trying to use unknown filter
    t.plan(1);

    var config = loader.object(fixture, __dirname + '/fixtures');

    config.generate('instagram', 'foobar', function(err) {
        t.equals(err, 'Unknown filter foobar');
    });
});

test('inclusive filter', function(t) {
    // Create a filtered "submodule" that only includes files with a pattern
    t.plan(2);

    var config = loader.object(fixture, __dirname + '/fixtures');

    config.generate('instagram', 'mobile', function(err, config) {
        t.looseEquals(config.include, ['instagram/file1.mobile.js']);
    });

    config.generate('instagram', 'all', function(err, config) {
        t.looseEquals(config.include, ['instagram/file1.js',
                                       'instagram/file1.mobile.js',
                                       'instagram/file2.js']);
    });
});

test('exclusive filter', function(t) {
    // Create a filtered "submodule" that only includes files without a pattern
    t.plan(1);

    var config = loader.object(fixture, __dirname + '/fixtures');

    config.generate('instagram', 'desktop', function(err, config) {
        t.looseEquals(config.include, ['instagram/file1.js',
                                       'instagram/file2.js']);
    });
});

test('placeholder', function(t) {
    // It should be possible to generate placeholder for modules with all the
    // files stubbed out with empty functions
    t.plan(5);

    var config = loader.object(fixture, __dirname + '/fixtures');

    config.generatePlaceholder('instagram', 'desktop', function(err, config) {
        t.ok(config.rawText.hasOwnProperty('instagram/file1.js'));
        t.ok(config.rawText.hasOwnProperty('instagram/file2.js'));
        t.notOk(config.rawText.hasOwnProperty('instagram/file1.mobile.js'));
    });

    config.generatePlaceholder('rawTextFaulty', null, function(err) {
        t.equals(err, 'rawText must be an object');
    });

    // Except for invalid modules
    config.generatePlaceholder('invalidDirectory', null, function(err) {
        t.ok(err);
    });
});

test('get list of modules', function(t) {
    t.plan(1);

    var config = loader.object({
        modules: {
            test: {},
            test2: {}
        }
    }, __dirname + '/fixtures');

    t.looseEquals(config.getModules(), ['test', 'test2']);
});

test('get list of module filters', function(t) {
    t.plan(3);

    var config = loader.object(fixture, __dirname);

    t.looseEquals(config.getModuleFilters('instagram'),
                  ['desktop', 'mobile', 'all']);

    t.equals(config.getModuleFilters('libs'), null);

    t.throws(function() {
        config.getModuleFilters('missing');
    }, /Unknown module/);
});
