#!/usr/bin/env node

// todo
// logrotate: add crontab script
// check settings data
// check paths
// rollback on error
// check if systemd is in

if (process.env.USER != 'root') {
    console.error('ERROR: Supercow powers needed... (run as root or sudo user)');
    process.exit(1);
}

// get args
var _mode = process.argv[2];

if (!_mode || ['add', 'remove', 'rm'].indexOf(_mode) == -1) {
    console.error('ERROR: use: node-systemd add [file.json] or node-systemd remove|rm [name]');
    process.exit(1);
}

var fs = require('fs');
var shell = require('child_process').exec;
if (_mode == 'add') {
    var path = require('path');
    var tools = require('a-toolbox');
    var cjson = require('cjson');
    var shelljs = require('shelljs');

    var _file = process.argv[3];
    var settings = cjson.load(_file);
    if (!settings) {
        console.error('ERROR: can\'t load settings file', _file);
        process.exit(1);
    }

    var _template =
        '[Unit]\n' +
        'Description={description}\n' +
        'Requires=network.target\n' +
        'After=network.target\n' +
        '\n' +
        '[Service]\n' +
        'Type=forking\n' +
        'WorkingDirectory={path}\n' +
        'ExecStart=/usr/local/bin/systemd-{name}-start\n' +
        'ExecStop=/usr/local/bin/systemd-{name}-stop\n' +
        'PIDFile={pid}\n' +
        '[Install]\n' +
        'WantedBy=multi-user.target\n' +
        '{user}{group}';

    var _start = '#!/bin/bash\n{wrap} start --pidFile {pid} --uid {name} --sourceDir {path} -l {log} -e {error} --append --minUptime 5000 --spinSleepTime 2000 {script} {args}\nexit 0';
    var _stop = '#!/bin/bash\n{wrap} stop {name}\nexit 0';

    var _logrotate = '{log}\n{error} {\n' +
        '  {logrotate.frequency}\n' +
        '  rotate {logrotate.rotate}\n' +
        '  create\n' +
        '  missingok\n' +
        '  notifempty\n' +
        '  compress\n' +
        '  sharedscripts\n' +
        '  postrotate\n{restart}\n' +
        '  endscript\n}';

    //var _cron = '';

    // check 
    
    if(!settings.name) {
        console.error('ERROR: missing name in file.json settings');
        process.exit(1);
    }
    if(!settings.description) {
        console.error('ERROR: missing description in file.json settings');
        process.exit(1);
    }
    if(!settings.path) {
        console.error('ERROR: missing path in file.json settings');
        process.exit(1);
    }
    if(!settings.script) {
        console.error('ERROR: missing script in file.json settings');
        process.exit(1);
    }
    if (!fs.existsSync(settings['wrap.bin']))
        console.warn('WARNING: wrap.bin not found');
    if (!fs.existsSync(settings.path))
        console.warn('WARNING: path not found');
    if (!fs.existsSync(settings.path + '/' + settings.script))
        console.warn('WARNING: script not found');

    console.log('parsing ...');

    var _settings = {
        name: settings.name,
        description: settings.description,
        path: settings.path,
        script: settings.script,
        args: settings.args || ' ',
        pid: settings.pid || '/var/run/' + settings.name + '.pid',
        log: settings.log || '/var/log/' + settings.name + '/log',
        error: settings.error || '/var/log/' + settings.name + '/error',
        wrap: settings['wrap.bin'],
        restart: 'service ' + settings.name + ' restart',
        user: settings.user ? 'User=' + settings.user + '\n' : '',
        group: settings.group ? 'User=' + settings.group + '\n' : ''
    };

    // replace vars
    var _init = tools.string.template(_template, _settings);

    shelljs.mkdir('-p', path.dirname(settings.log));
    shelljs.mkdir('-p', path.dirname(settings.error));

    console.log('writing script start/stop files, logrotate.d ...');
    _start = tools.string.template(_start, _settings);
    _stop = tools.string.template(_stop, _settings);
    _logrotate = tools.string.template(_logrotate, _settings);

    var _tasks = new tools.tasks(function () {
        var _service = settings.name + '.service';

        var _cmd = 'chmod a+x /usr/local/bin/systemd-' + settings.name + '*';
        console.log('>', _cmd);
        shelljs.exec(_cmd);

        console.log('writing systemd file ...');
        console.log('/etc/systemd/system/' + _service);
        fs.writeFile('/etc/systemd/system/' + _service, _init, function (err) {
            if (err) {
                console.error('ERROR: writing systemd service file', '/etc/systemd/system/' + _service);
                process.exit(1);
            }

            // init
            var _cmd = 'systemctl enable ' + _service + ';systemctl daemon-reload';
            console.log('installing ...');
            console.log('>', _cmd);
            shell(_cmd, function (err, stdout, stderr) {
                if (err) {
                    console.error('ERROR: exec systemd installing script >', _cmd);
                    process.exit(1);
                }
                console.info('done');
            });
            //});
        });
    });

    // start/stop script
    _tasks.todo('start');
    _tasks.todo('stop');

    fs.writeFile('/usr/local/bin/systemd-' + settings.name + '-start', _start, function (err) {
        if (err) {
            console.error('ERROR: writing script service start file', '/usr/local/bin/systemd-' + settings.name + '-start');
            process.exit(1);
        }
        _tasks.done('start');
    });
    fs.writeFile('/usr/local/bin/systemd-' + settings.name + '-stop', _stop, function (err) {
        if (err) {
            console.error('ERROR: writing script service stop file', '/usr/local/bin/systemd-' + settings.name + '-stop');
            process.exit(1);
        }
        _tasks.done('stop');
    });

    // logrotate
    if (settings.logrotate == 'logrotate') {
        _tasks.todo('logrotate');
        fs.writeFile('/etc/logrotate.d/' + settings.name, _logrotate, function (err) {
            if (err) {
                console.error('ERROR: writing logrotate script file', '/etc/logrotate.d/' + settings.name);
                process.exit(1);
            }
            _tasks.done('logrotate');
        });
    } else if (settings.logrotate == 'crontab') {
        _tasks.todo('logrotate');
        fs.writeFile('/etc/cron.d/' + settings.name, _crontab, function (err) {
            if (err) {
                console.error('ERROR: writing cron script file', '/etc/cron.d/' + settings.name);
                process.exit(1);
            }
            _tasks.done('crontab');
        });
    }

} else if (_mode == 'remove' || _mode == 'rm') {
    var _name = process.argv[3];
    
    var _cmd = 'systemctl disable ' + _name + '.service';
    console.log('removing ...');
    console.log('>', _cmd);
    shell(_cmd, function (err, stdout, stderr) {
        if (err) {
            console.error('ERROR: exec systemd installing script', _cmd);
            process.exit(1);
        }
        console.log('remove /etc/systemd/system/' + _name + '.service');
        fs.unlink('/etc/systemd/system/' + _name + '.service');
        console.log('remove /usr/local/bin/systemd-' + _name + '-start');
        fs.unlink('/usr/local/bin/systemd-' + _name + '-start');
        console.log('remove /usr/local/bin/systemd-' + _name + '-stop');
        fs.unlink('/usr/local/bin/systemd-' + _name + '-stop');
        console.log('remove /etc/logrotate.d/' + _name);
        fs.unlink('/etc/logrotate.d/' + _name);
        //console.log('remove /etc/cron.d/' + _name);
        //fs.unlink('/etc/cron.d/' + _name);
        console.info('done');
    });
    
}