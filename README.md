# node-service-systemd

[![NPM Version](http://img.shields.io/npm/v/service-systemd.svg?style=flat)](https://www.npmjs.org/package/service-systemd)
[![NPM Downloads](https://img.shields.io/npm/dm/service-systemd.svg?style=flat)](https://www.npmjs.org/package/service-systemd)

[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MRV4AM2CA9F78 "Donate using Paypal")

Setup node script as systemd service, using forever; create also logrotate script

Tested on Debian 8, Ubuntu 14


## Npm Installation

Install globally, need [forever](http://github.com/foreverjs/forever) installed globally too
    
```
$ npm i -g forever service-systemd
```

## Run

- Need root grants, else

```
ERROR: Supercow powers needed... (run as root or sudo user)
```

- Prepare service configuration file in json format, example in service-template.json

```
{
    "name": "my-node-service",
    "description": "an amazing service",
    "path": "/node/my-node-service/",
    "script": "main.js",
    "args": "-debug",
    "pid": "/var/run/my-node-service.pid",
    "log": "/var/log/my-node-service/log",
    "error": "/var/log/my-node-service/error",
    "wrap.bin": "/usr/bin/forever",
    "logrotate": "logrotate",
    "logrotate.rotate": "10",
    "logrotate.frequency": "daily",
    "user": "www-data",
    "group": "www-data"
}

```

- Install service

```
$ sudo node-systemd add service-template.json

parsing ...
writing script start/stop files, logrotate.d ...
> chmod a+x /usr/local/bin/systemd-my-node-service*
writing systemd file ...
/etc/systemd/system/my-node-service.service
installing ...
> systemctl enable my-node-service.service;systemctl daemon-reload
done
    
```

- Uninstall service

```
$ sudo node-systemd rm my-node-service

root@mini:/home/mini# node-systemd rm my-node-service
mode rm
removing ...
> systemctl disable my-node-service.service
remove /etc/systemd/system/my-node-service.service
remove /usr/local/bin/systemd-my-node-service-start
remove /usr/local/bin/systemd-my-node-service-stop
remove /etc/logrotate.d/my-node-service
done

```

## Use as service

```
$ sudo service my-node-service start
```
```
$ sudo service my-node-service status
● my-node-service.service - an amazing service
   Loaded: loaded (/etc/systemd/system/my-node-service.service; enabled)
   Active: active (running) since Thu 2015-08-13 06:58:07 CEST; 2s ago
  Process: 974 ExecStop=/usr/local/bin/systemd-my-node-service-stop (code=exited, status=0/SUCCESS)
  Process: 1001 ExecStart=/usr/local/bin/systemd-my-node-service-start (code=exited, status=0/SUCCESS)
 Main PID: 1012 (nodejs)
   CGroup: /system.slice/my-node-service.service
           ├─1007 /usr/bin/nodejs /usr/lib/node_modules/forever/bin/monitor m...
           └─1012 /usr/bin/nodejs /node/my-node-service/main.js -debug

Aug 13 06:58:06 mini systemd-my-node-service-start[1001]: info:    Forever pr...
Aug 13 06:58:07 mini systemd[1]: my-node-service.service: Supervising proce...s.
Hint: Some lines were ellipsized, use -l to show in full
```    
```
$ sudo service my-node-service stop
```    
```
$ service my-node-service restart   
```


### Todo
- add crontab alternative logorotate script
- check settings data
- check paths
- rollback on install error
- check if systemd is in

## License

The MIT License (MIT)

Copyright (c) 2015 Simone Sanfratello

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
