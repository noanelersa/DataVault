#ifndef DRIVER_HANDLER_H
#define DRIVER_HANDLER_H

#include "Utils.h"

#define AGNET_FILE_NAME_SIZE 512

typedef struct {
    char* fileHash;  // Last saved file hash.
} MapEntryValue;

void MapSet(const char* key, const MapEntryValue* value);
MapEntryValue* MapGet(const char* key);
void MapRemove(const char* key);
void MapCleanup(void);  // Optional cleanup

#endif // DRIVER_HANDLER_H
