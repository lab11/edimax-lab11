

// Stop extra messages from jslint.  Note that there should be no
// space between the / and the * and global.
/*globals clearTimeout, console, error, exports, httpRequest, require, setTimeout  */
/*jshint globalstrict: true*/
"use strict";

var http = require('httpClient');

function Hue() {
    var hue = {};
    var self = this;

    function putRequest (params, cb) {
        var options = {url: {}};

        options.body = JSON.stringify(params);
        options.url = 'http://' + self.getParameter('bridge_ipaddress') + '/api/' + self.getParameter('bridge_username') + '/lights/' + self.getParameter('bulb_id') + '/state';
        options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': options.body.length
            };
        var postReq = http.put(options, function (inmsg) {
            cb(inmsg);
        });
    }


    hue.power = function() {
        var on = self.get('power');

        var params = {
            on: on
        };

        putRequest(params, function (inms) {});
    };

    return hue;
}

/** Define inputs and outputs. */
exports.setup = function() {

    this.input('power', {
        type: "boolean",
        value: true
    });
    this.parameter('bridge_ipaddress', {
        type: "string",
        value: "192.168.0.10"
    });
    this.parameter('bridge_username', {
        type: "string",
        value: "admin"
    });
    this.parameter('bulb_id', {
        type: "integer",
        value: "admin"
    });

    this.hue = Hue.call(this);
};

exports.initialize = function() {
    this.addInputHandler('power', this.hue.power);
};

exports.wrapup = function() {

};
