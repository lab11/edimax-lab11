/*
 * Have a squall advertise the IP address of an edimax smart plug.
 *
 * Uses two advertisements because name+ip+eddystone doesn't fit in 1 advertisement
 * plus scan response.
 */

// Global libraries
#include <stdint.h>

// Nordic libraries
#include "ble_advdata.h"

// nrf5x-base libraries
#include "simple_ble.h"
#include "eddystone.h"
#include "simple_adv.h"
#include "multi_adv.h"

#define ADV_SWITCH_MS 2500

// Define constants about this beacon.
#define DEVICE_NAME "sp2101w"
#define PHYSWEB_URL "j2x.us/edimax"

// Manufacturer specific data setup
#define UMICH_COMPANY_IDENTIFIER 0x02E0

typedef struct {
    uint8_t serviceid;
    // char ip[5];
    char ip[16];
} ip_mandata_t;

static ip_mandata_t ip_mandata = {
    0x19,
    EDIMAX_IP
};

// Intervals for advertising and connections
static simple_ble_config_t ble_config = {
    .platform_id       = 0x40,              // used as 4th octect in device BLE address
    .device_id         = DEVICE_ID_DEFAULT,
    .adv_name          = DEVICE_NAME,
    .adv_interval      = MSEC_TO_UNITS(2000, UNIT_0_625_MS),
    .min_conn_interval = MSEC_TO_UNITS(500, UNIT_1_25_MS),
    .max_conn_interval = MSEC_TO_UNITS(1000, UNIT_1_25_MS)
};

static void adv_eddystone () {
    eddystone_with_name(PHYSWEB_URL, NULL);
}

static void adv_ip () {
    // Setup manufacturer specific data
    ble_advdata_manuf_data_t mandata;
    mandata.company_identifier = UMICH_COMPANY_IDENTIFIER;
    mandata.data.p_data = (uint8_t*) &ip_mandata;
    mandata.data.size   = sizeof(ip_mandata);

    simple_adv_manuf_data(&mandata);
}

int main (void) {

    // Setup BLE
    simple_ble_init(&ble_config);

    // Need to init multi adv
    multi_adv_init(ADV_SWITCH_MS);

    // Register eddystone and data advertisements
    multi_adv_register_config(adv_eddystone);
    multi_adv_register_config(adv_ip);

    // Start rotating
    multi_adv_start();

    while (1) {
        power_manage();
    }
}
