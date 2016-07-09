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

ifndef EDIMAX_IP
$(error Must define EDIMAX_IP)
endif

CFLAGS += -DEDIMAX_IP=\"$(EDIMAX_IP)\"

main.o: .FORCE

NRF_BASE_PATH ?= ../../nrf5x-base
include $(NRF_BASE_PATH)/make/Makefile