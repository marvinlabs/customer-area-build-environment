module.exports = function (grunt) {
    var path = require("path");
    var wpca = require('grunt-wpca/lib/wpca');

    // Load configuration
    var configOptions = loadConfigurationFiles(grunt, {
        config: {
            src: "grunt/tasks/*"
        },
        pkg: grunt.file.readJSON("package.json")
    }, "grunt/config");

    // Some additional handy configuration info
    configOptions['addons'] = wpca.listAddons(configOptions.paths.plugins, configOptions.paths.addons_patterns);

    // Configure tasks
    require("load-grunt-config")(grunt, {
        configPath: path.join(process.cwd(), "grunt/tasks"),
        init: true,
        data: configOptions,
        jitGrunt: {
            staticMappings: {
                "makepot": "grunt-wp-i18n",
                "addtextdomain": "grunt-wp-i18n",
                "bump-only": "grunt-bump",
                "bump-commit": "grunt-bump",
                "replace": "grunt-text-replace",
                "gitcommit": "grunt-git",
                "sync-cuar-commons": "grunt-wpca"
            }
        }
    });

    // Register some default grunt tasks
    grunt.registerTask("default", ["watch"]);

    grunt.registerTask("prepare-languages", ["checktextdomain", "makepot", "potomo"]);
    grunt.registerTask("prepare-assets", ["less", "autoprefixer", "uglify"]);
    grunt.registerTask("prepare-archives", ["prepare-languages", "prepare-assets", "compress"]);

    grunt.registerTask("tx-push", ["checktextdomain:customer-area", "makepot:customer-area", "exec:txpush_s"]);
    grunt.registerTask("tx-pull", ["exec:txpull", "potomo:customer-area"]);

    // The task to prepare a new release
    // TODO make a new branch for the release
    grunt.registerTask("start-release", "Prepare release task", function (mode) {
        grunt.task.run(
            "checktextdomain",
            "sync_addon_libs",
            "checkpending",
            "version::" + mode,
            "tx-push",
            "dist");
    });

    // The task to make a new release
    // TODO Merge the release branch into master/dev
    grunt.registerTask("finish-release", "Release task", function (mode) {
        grunt.task.run(
            "gitcommit:post_release",
            "compress:build");
    });
};

/**
 * Load configuration files and store them in an associative array
 * @param grunt The grunt object
 * @param config The configuration object
 * @param path The path where configuration JSON files are stored
 * @returns {{}}
 */
function loadConfigurationFiles(grunt, config, path) {
    var glob = require("glob");
    glob.sync("*.json", {cwd: path}).forEach(function (filename) {
        var key = filename.replace(/\.json$/, "");
        config[key] = grunt.file.readJSON(path + "/" + filename);
    });

    return config;
}