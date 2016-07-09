/* Get data from edimax smart plugs when we get an advertisement from
 * it.
 */

var parse_advertisement = function (advertisement, cb) {

    if (advertisement.localName === 'sp2101w') {
        if (advertisement.manufacturerData) {
            // Need at least 3 bytes. Two for manufacturer identifier and
            // one for the service ID.

            if (Array.isArray(advertisement.manufacturerData)) {
                console.log('is array!!!! so cool')
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
                }


            } else {
                console.log('not array')
            }
        }
    }

    cb(null);
}


module.exports = {
    parseAdvertisement: parse_advertisement
};
