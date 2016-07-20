

// Stop extra messages from jslint.  Note that there should be no
// space between the / and the * and global.
/*globals clearTimeout, console, error, exports, httpRequest, require, setTimeout  */
/*jshint globalstrict: true*/
"use strict";

var http = require('httpClient');

function Edimax() {
    var edimax = {};
    var self = this;

    function postRequest (command, cb) {
        var options = {url: {}};

        options.url = 'http://' + self.getParameter('ipaddress') + ':10000/smartplug.cgi';
        options.headers = {
                'Content-Type': 'application/xml',
                'Content-Length': command.length
            };
        options.username = 'admin';
        options.headers['Authorization'] = "Basic " + new Buffer(options.username + ":" + self.getParameter('password')).toString("base64");

        options.body = command;

        var data = '';
        var postReq = http.post(options, function (inmsg) {
            cb(inmsg);
        });
    }


    edimax.power = function() {
        var on = self.get('power');

        var cmd_var = on ? "ON" : "OFF";
        var cmd = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="setup"><Device.System.Power.State>'+cmd_var+'</Device.System.Power.State></CMD></SMARTPLUG>';

        postRequest(cmd, function (inms) {});
    };

    return edimax;
}

/** Define inputs and outputs. */
exports.setup = function() {

    this.input('power', {
        type: "boolean",
        value: true
    });
    this.parameter('ipaddress', {
        type: "string",
        value: "192.168.0.10"
    });
    this.parameter('password', {
        type: "string",
        value: "admin"
    });

    this.edimax = Edimax.call(this);
};

exports.initialize = function() {
    this.addInputHandler('power', this.edimax.power);
};

/** Turn off changed lights on wrapup. */
exports.wrapup = function() {

};
