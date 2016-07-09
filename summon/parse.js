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

    console.log(options)

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

function getSwitchPower (options) {
    var cmd = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="get"><NOW_POWER><Device.System.Power.NowPower/></NOW_POWER></CMD></SMARTPLUG>';

    postRequest(cmd, options, function (d) {
        if (d) {
            var start = '<Device.System.Power.NowPower>';
            var end = '</Device.System.Power.NowPower>';
            var power = parseFloat(get_value(d, start, end));
            console.log(power);
            return power;
        } else {
            return undefined;
        }
    });
};

function getSwitchEnergy (options) {
    var cmd = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="get"><NOW_POWER><Device.System.Power.NowEnergy.Day/><Device.System.Power.NowEnergy.Week/><Device.System.Power.NowEnergy.Month/></NOW_POWER></CMD></SMARTPLUG>';

    postRequest(cmd, options, function (d) {
        if (d) {
            var day = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Day>', '</Device.System.Power.NowEnergy.Day>'))
            var week = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Week>', '</Device.System.Power.NowEnergy.Week>'));
            var month = parseFloat(get_value(d, '<Device.System.Power.NowEnergy.Month>', '</Device.System.Power.NowEnergy.Month>'));

            console.log(day);
            console.log(week);
            console.log(month);
            return [day, week, month];
        } else {
            return undefined;
        }
    });
};







var parse_advertisement = function (advertisement, cb) {

    if (advertisement.localName === 'sp2101w') {
        if (advertisement.manufacturerData) {
            // Need at least 3 bytes. Two for manufacturer identifier and
            // one for the service ID.

            if (Array.isArray(advertisement.manufacturerData)) {
                console.log('is array!!!! so cool are we there yet???')
                console.log(advertisement.manufacturerData)

                var edimax_ip = undefined;
                var edimax_pw = undefined;

                for (var i=0; i<advertisement.manufacturerData.length; i++) {
                    var b = advertisement.manufacturerData[i];
                    console.log(b)

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

                                console.log(edimax_ip);

                                // edimax_ip = ip;

                            }
                        }

                        if (manufacturer_id == 0x02E0 && service_id == 0x1a) {
                            // OK! This looks like a password
                            // Parse it as a c string
                            var null_char_index = b.indexOf(0);
                            if (null_char_index > -1) {
                                edimax_pw = b.slice(3, null_char_index).toString();

                                console.log(edimax_pw);

                                // edimax_ip = ip;

                            }


                            // if (advertisement.manufacturerData.length >= 14) {
                            //     var sensor_data = advertisement.manufacturerData.slice(3);

                            //     var pressure = sensor_data.readUIntLE(0,4)/10;
                            //     var humidity = sensor_data.readUIntLE(4,2)/100;
                            //     var temp     = sensor_data.readUIntLE(6,2)/100;
                            //     var light    = sensor_data.readUIntLE(8,2);
                            //     var accel    = sensor_data.readUIntLE(10,1);

                            //     var sequence_num = -1;
                            //     if (sensor_data.length >= 15) {
                            //         sequence_num = sensor_data.readUIntLE(11,4);
                            //     }

                            //     var imm_accel = ((accel & 0xF0) != 0);
                            //     var min_accel = ((accel & 0x0F) != 0);

                            //     var out = {
                            //         device: 'BLEES',
                            //         pressure_pascals: pressure,
                            //         humidity_percent: humidity,
                            //         temperature_celcius: temp,
                            //         light_lux: light,
                            //         acceleration_advertisement: imm_accel,
                            //         acceleration_interval: min_accel,
                            //         sequence_number: sequence_num,
                            //     };

                            //     cb(out);
                            //     return;
                            // }
                        }
                    }
                }


                if (edimax_ip != undefined && edimax_pw != undefined) {
                    console.log('ready to control an edimax!')

                    var power = getSwitchPower({host: edimax_ip, password: edimax_pw});
                    var energies = getSwitchEnergy({host: edimax_ip, password: edimax_pw});

                    if (power !== undefined && energies !== undefined) {
                        var out = {
                            device: 'edimax-sp2101w',
                            power_watts: power,
                            energy_day_kwh: energies[0],
                            energy_week_kwh: energies[1],
                            energy_month_kwh: energies[2]
                        };

                        cb(out);
                        return;
                    }

                    console.log(power)
                    console.log(energies)
                }


            }
        }
    }

    cb(null);
}


module.exports = {
    parseAdvertisement: parse_advertisement
};
