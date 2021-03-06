/* Get data from edimax smart plugs when we get an advertisement from
 * it.
 */

var http = require('http');

function postRequest (command, options, cb) {
    options.timeout = 20000;
    options.port = 10000;
    options.path = 'smartplug.cgi';
    options.method = 'POST';
    options.headers = {
            'Content-Type': 'application/xml',
            'Content-Length': command.length
        };
    options.username = 'admin';

    options.headers['Authorization'] =
        "Basic " + new Buffer(options.username + ":" + options.password).toString("base64");

    var data = '';
    var postReq = http.request(options, function (response) {
        var error;
        if (response.statusCode >= 300) {
            cb(undefined);
            return;
        }
        var contentLength = response.headers['content-length'];
        if (contentLength === undefined || parseInt(contentLength) === 0) {
            cb(undefined);
            return;
        }

        response.setEncoding('utf8');
        response.on('data', function (result) {
            data += result;
        });
        response.on('end', function () {
            cb(data);
        });
    }).on('error', function (error) {
        cb(undefined);
    }).on('timeout', function () {
        cb(undefined);
    });
    postReq.setTimeout(options.timeout);
    postReq.write(command);
    postReq.end();
}



function get_value (s, start, end) {
    var start_index = s.indexOf(start);
    var end_index = s.indexOf(end);
    return s.slice(start_index+start.length, end_index);
}

function getSwitchPower (options, cb) {
    var cmd = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="get"><NOW_POWER><Device.System.Power.NowPower/></NOW_POWER></CMD></SMARTPLUG>';

    postRequest(cmd, options, function (d) {
        if (d) {
            var start = '<Device.System.Power.NowPower>';
            var end = '</Device.System.Power.NowPower>';
            var power = parseFloat(get_value(d, start, end));

            cb(power);
        } else {
            cb(undefined);
        }
    });
};

function getSwitchEnergy (options, cb) {
    var cmd = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="get"><NOW_POWER><Device.System.Power.NowEnergy.Day/><Device.System.Power.NowEnergy.Week/><Device.System.Power.NowEnergy.Month/></NOW_POWER></CMD></SMARTPLUG>';

    postRequest(cmd, options, function (d) {
        if (d) {
            var day = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Day>', '</Device.System.Power.NowEnergy.Day>'))
            var week = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Week>', '</Device.System.Power.NowEnergy.Week>'));
            var month = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Month>', '</Device.System.Power.NowEnergy.Month>'));

            cb([day, week, month]);
        } else {
            cb(undefined);
        }
    });
};







var parse_advertisement = function (advertisement, cb) {

    if (advertisement.localName === 'sp2101w') {
        if (advertisement.manufacturerData) {
            // Need at least 3 bytes. Two for manufacturer identifier and
            // one for the service ID.

            if (Array.isArray(advertisement.manufacturerData)) {
                var edimax_ip = undefined;
                var edimax_pw = undefined;

                for (var i=0; i<advertisement.manufacturerData.length; i++) {
                    var b = advertisement.manufacturerData[i];

                    if (b.length >= 3) {
                        // Check that manufacturer ID and service byte are correct
                        var manufacturer_id = b.readUIntLE(0, 2);
                        var service_id = b.readUInt8(2);
                        if (manufacturer_id == 0x02E0 && service_id == 0x19) {
                            // OK! This looks like an IP address
                            // Parse it as a c string
                            var null_char_index = b.indexOf(0);
                            if (null_char_index > -1) {
                                edimax_ip = b.slice(3, null_char_index).toString();
                            }
                        }

                        if (manufacturer_id == 0x02E0 && service_id == 0x1a) {
                            // OK! This looks like a password
                            // Parse it as a c string
                            var null_char_index = b.indexOf(0);
                            if (null_char_index > -1) {
                                edimax_pw = b.slice(3, null_char_index).toString();
                            }
                        }
                    }
                }


                if (edimax_ip != undefined && edimax_pw != undefined) {
                    getSwitchPower({host: edimax_ip, password: edimax_pw}, function (power) {
                        if (power !== undefined) {
                            getSwitchEnergy({host: edimax_ip, password: edimax_pw}, function (energies) {
                                if (energies !== undefined) {
                                    var out = {
                                        device: 'edimax-sp2101w',
                                        power_watts: power,
                                        energy_day_kwh: energies[0],
                                        energy_week_kwh: energies[1],
                                        energy_month_kwh: energies[2]
                                    };

                                    var local = {
                                        ipaddress: edimax_ip,
                                        password:  edimax_pw,
                                    };

                                    cb(out, local);
                                    return;
                                }
                            });
                        }
                    });
                }

            }
        }
    }

    cb(null);
}


module.exports = {
    parseAdvertisement: parse_advertisement
};
