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
    char pw[16];
} ip_mandata_t;

typedef struct {
    uint8_t serviceid;
    char pw[10];
} pw_mandata_t;

static ip_mandata_t _ip_mandata = {
    0x19,
    EDIMAX_IP
};

static pw_mandata_t _pw_mandata = {
    0x1a,
    EDIMAX_PW
};

static ble_advdata_manuf_data_t _mandata_ip;
static ble_advdata_manuf_data_t _mandata_pw;

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
    eddystone_with_name(PHYSWEB_URL);
}

static void adv_ip () {
    uint32_t      err_code;
    ble_advdata_t advdata;
    ble_advdata_t sredata;


    // Setup manufacturer specific data
    _mandata_ip.company_identifier = UMICH_COMPANY_IDENTIFIER;
    _mandata_ip.data.p_data = (uint8_t*) &_ip_mandata;
    _mandata_ip.data.size   = sizeof(_ip_mandata);

    _mandata_pw.company_identifier = UMICH_COMPANY_IDENTIFIER;
    _mandata_pw.data.p_data = (uint8_t*) &_pw_mandata;
    _mandata_pw.data.size   = sizeof(_pw_mandata);

    // Build and set advertising data
    memset(&advdata, 0, sizeof(advdata));
    memset(&sredata, 0, sizeof(sredata));

    // Common
    advdata.include_appearance      = false;
    advdata.flags                   = BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE;

    // Put name in the scan response
    sredata.name_type               = BLE_ADVDATA_FULL_NAME;


    // Handle manufacturer data
    advdata.p_manuf_specific_data  = &_mandata_ip;
    sredata.p_manuf_specific_data  = &_mandata_pw;

    // Actually setup the advertisement
    err_code = ble_advdata_set(&advdata, &sredata);
    APP_ERROR_CHECK(err_code);

    // Start the advertisement
    advertising_start();
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
