/* Get data from edimax smart plugs when we get an advertisement from
 * it.
 */

var http = require('http');
var url = require('url');

function getRequest (hue_url, cb) {
    var options = url.parse(hue_url);
    options.method = 'GET';

    console.log(options)
    console.log('why')

    var data = '';
    var getReq = http.request(options, function (response) {
        var error;
        if (response.statusCode >= 300) {
            cb(undefined);
            return;
        }
        // var contentLength = response.headers['content-length'];
        // if (contentLength === undefined || parseInt(contentLength) === 0) {
        //     cb(undefined);
        //     return;
        // }

        response.setEncoding('utf8');
        response.on('data', function (result) {
            console.log(result)
            data += result;
        });
        response.on('end', function () {
            console.log(data)
            cb(JSON.parse(data));
        });
    }).on('error', function (error) {
        console.log(error)
        cb(undefined);
    }).on('timeout', function () {
        cb(undefined);
    });
    getReq.end();
}


function getBulbState (bridge_ip, bridge_username, bulb_id, cb) {
    var url = 'http://' + bridge_ip + '/api/' + bridge_username + '/lights/' + bulb_id;

    console.log('url ' + url);

    getRequest(url, function (d) {
        console.log('called with something')
        console.log(d)
        cb(d);
    });
};

var parse_advertisement = function (advertisement, cb) {

    if (advertisement.localName === 'hue') {
        if (advertisement.manufacturerData) {
            // Need at least 3 bytes. Two for manufacturer identifier and
            // one for the service ID.

            if (Array.isArray(advertisement.manufacturerData)) {
                var hue_bridge_ip       = undefined;
                var hue_bridge_username = undefined;
                var hue_bulb_id         = undefined;

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
                                hue_bridge_ip = b.slice(3, null_char_index).toString();
                            }
                        }

                        if (manufacturer_id == 0x02E0 && service_id == 0x1c) {
                            // OK! This looks like a bulb id / username
                            hue_bulb_id = b.readUInt8(3);

                            var remainder = b.slice(4);

                            // Parse it as a c string
                            var null_char_index = remainder.indexOf(0);
                            if (null_char_index > -1) {
                                hue_bridge_username = remainder.slice(0, null_char_index).toString();
                            }
                        }
                    }
                }


                if (hue_bridge_ip != undefined && hue_bridge_username != undefined && hue_bulb_id != undefined) {
                    console.log(hue_bridge_ip)
                    console.log(hue_bridge_username)
                    console.log(hue_bulb_id)
                    console.log('get hue')
                    getBulbState(hue_bridge_ip, hue_bridge_username, hue_bulb_id, function (bulb) {
                        if (bulb !== undefined) {
                            var state = bulb.state;
                            state.name = bulb.name;
                            state.device = 'hue';

                            var local = {
                                bridge_ipaddress: hue_bridge_ip,
                                bridge_username:  hue_bridge_username,
                                bulb_id:  hue_bulb_id,
                            };

                            cb(state, local);
                            return;
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
