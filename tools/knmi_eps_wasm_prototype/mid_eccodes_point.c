#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include "eccodes.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define MID_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define MID_EXPORT
#endif

static int read_long(codes_handle* h, const char* key, int32_t* out) {
    long value = 0;
    const int err = codes_get_long(h, key, &value);
    if (err != CODES_SUCCESS) return err;
    *out = (int32_t)value;
    return CODES_SUCCESS;
}

static int read_member(codes_handle* h, int32_t* member) {
    const char* keys[] = {"perturbationNumber", "ensembleMemberNumber", "number"};
    *member = -1;
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); i++) {
        int32_t value = -1;
        if (read_long(h, keys[i], &value) == CODES_SUCCESS && value >= 0) {
            *member = value;
            return CODES_SUCCESS;
        }
    }
    return CODES_SUCCESS;
}

/*
 * Decode exactly one already-split GRIB message from memory. No NODEFS, no
 * filesystem fallback and no values[] transfer to JavaScript. The ABI returns
 * only the metadata used by MID plus the nearest grid-point value.
 */
MID_EXPORT
int mid_grib1_nearest(
    const uint8_t* message,
    size_t message_len,
    double latitude,
    double longitude,
    double* value,
    double* grid_latitude,
    double* grid_longitude,
    double* distance_km,
    int32_t* grid_index,
    int32_t* indicator_of_parameter,
    int32_t* indicator_of_type_of_level,
    int32_t* level,
    int32_t* time_range_indicator,
    int32_t* member
) {
    if (!message || message_len < 12 || !value || !grid_latitude || !grid_longitude ||
        !distance_km || !grid_index || !indicator_of_parameter ||
        !indicator_of_type_of_level || !level || !time_range_indicator || !member) {
        return CODES_INVALID_ARGUMENT;
    }
    if (memcmp(message, "GRIB", 4) != 0 || message[7] != 1) {
        return CODES_INVALID_MESSAGE;
    }

    codes_handle* h = codes_handle_new_from_message_copy(NULL, message, message_len);
    if (!h) return CODES_INVALID_MESSAGE;

    int err = CODES_SUCCESS;
    int32_t edition = 0;
    if ((err = read_long(h, "edition", &edition)) != CODES_SUCCESS || edition != 1) goto cleanup;
    if ((err = read_long(h, "indicatorOfParameter", indicator_of_parameter)) != CODES_SUCCESS) goto cleanup;
    if ((err = read_long(h, "indicatorOfTypeOfLevel", indicator_of_type_of_level)) != CODES_SUCCESS) goto cleanup;
    if ((err = read_long(h, "level", level)) != CODES_SUCCESS) goto cleanup;
    if ((err = read_long(h, "timeRangeIndicator", time_range_indicator)) != CODES_SUCCESS) goto cleanup;
    if ((err = read_member(h, member)) != CODES_SUCCESS) goto cleanup;

    {
        codes_nearest* nearest = codes_grib_nearest_new(h, &err);
        if (!nearest || err != CODES_SUCCESS) {
            if (nearest) codes_grib_nearest_delete(nearest);
            goto cleanup;
        }
        size_t count = 1;
        double out_lat = 0.0, out_lon = 0.0, out_value = 0.0, out_distance = 0.0;
        int out_index = 0;
        err = codes_grib_nearest_find(
            nearest,
            h,
            latitude,
            longitude,
            0,
            &out_lat,
            &out_lon,
            &out_value,
            &out_distance,
            &out_index,
            &count
        );
        codes_grib_nearest_delete(nearest);
        if (err != CODES_SUCCESS || count != 1) goto cleanup;
        *value = out_value;
        *grid_latitude = out_lat;
        *grid_longitude = out_lon;
        *distance_km = out_distance;
        *grid_index = (int32_t)out_index;
    }

cleanup:
    codes_handle_delete(h);
    return err;
}
