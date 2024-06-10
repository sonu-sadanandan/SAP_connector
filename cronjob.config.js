module.exports = {
    apps: [{
        name : "SAP_connector",
        script: "./index.js",
        instances: 1,
        exec_mode: 'fork',
        cron_restart: "0 8 * * *",
        autorestart: false
    }]
}