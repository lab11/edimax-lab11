PROJECT_NAME = $(shell basename "$(realpath ./)")

APPLICATION_SRCS = $(notdir $(wildcard ./*.c))
APPLICATION_SRCS += softdevice_handler.c
APPLICATION_SRCS += ble_advdata.c
APPLICATION_SRCS += ble_conn_params.c
APPLICATION_SRCS += app_timer.c
APPLICATION_SRCS += app_error.c

APPLICATION_SRCS += simple_ble.c
APPLICATION_SRCS += simple_adv.c
APPLICATION_SRCS += multi_adv.c
APPLICATION_SRCS += eddystone.c

LIBRARY_PATHS += ../../include .
SOURCE_PATHS += ../../src

SOFTDEVICE_MODEL = s130
SDK_VERSION = 11

ifndef HUE_BRIDGE_IP
$(error Must define HUE_BRIDGE_IP)
endif

CFLAGS += -DHUE_BRIDGE_IP=\"$(HUE_BRIDGE_IP)\"

ifndef HUE_BULB_ID
$(error Must define HUE_BULB_ID)
endif

CFLAGS += -DHUE_BULB_ID=$(HUE_BULB_ID)

ifndef HUE_USERNAME
$(error Must define HUE_USERNAME)
endif

CFLAGS += -DHUE_USERNAME=\"$(HUE_USERNAME)\"

# Hack to get main.c rebuilt
hack := $(shell touch main.c)


ENABLE_WIRELESS_DFU = 1
RAM_KB=32
FLASH_KB=256

NRF_BASE_PATH ?= ../../nrf5x-base
include $(NRF_BASE_PATH)/make/Makefile
