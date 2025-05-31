#include "DriverHandler.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define MAP_BUCKETS 128

typedef struct MapEntry {
    char* key;
    MapEntryValue* value;
    struct MapEntry* next;
} MapEntry;

typedef struct {
    MapEntry* buckets[MAP_BUCKETS];
} Map;

static Map* GetMapInstance() {
    static Map* instance = NULL;
    if (instance == NULL) {
        instance = (Map*)calloc(1, sizeof(Map));
        if (!instance) {
            fprintf(stderr, "Error: Failed to allocate memory for singleton map.\n");
            exit(EXIT_FAILURE);
        }
    }
    return instance;
}

static unsigned int Hash(const char* key) {
    unsigned int h = 0;
    while (*key) {
        h = (h << 5) + *key++;
    }
    return h % MAP_BUCKETS;
}

void MapSet(const char* key, const MapEntryValue* value) {
    if (!key || !value || !value->fileID) return;

    Map* map = GetMapInstance();
    unsigned int index = Hash(key);
    MapEntry* entry = map->buckets[index];

    while (entry) {
        if (strcmp(entry->key, key) == 0) {
            char* newFileID = strdup(value->fileID);
            if (!newFileID) {
                fprintf(stderr, "Error: Failed to duplicate fileID string.\n");
                return;
            }

            free(entry->value->fileID);
            entry->value->fileID = newFileID;
            entry->value->allowedAction = value->allowedAction;
            return;
        }
        entry = entry->next;
    }

    // New entry
    entry = (MapEntry*)malloc(sizeof(MapEntry));
    if (!entry) {
        fprintf(stderr, "Error: Failed to allocate memory for MapEntry.\n");
        return;
    }

    entry->key = strdup(key);
    if (!entry->key) {
        fprintf(stderr, "Error: Failed to duplicate key string.\n");
        free(entry);
        return;
    }

    entry->value = (MapEntryValue*)malloc(sizeof(MapEntryValue));
    if (!entry->value) {
        fprintf(stderr, "Error: Failed to allocate memory for MapEntryValue.\n");
        free(entry->key);
        free(entry);
        return;
    }

    entry->value->fileID = strdup(value->fileID);
    if (!entry->value->fileID) {
        fprintf(stderr, "Error: Failed to duplicate fileID string.\n");
        free(entry->value);
        free(entry->key);
        free(entry);
        return;
    }

    entry->value->allowedAction = value->allowedAction;
    entry->next = map->buckets[index];
    map->buckets[index] = entry;
}

MapEntryValue* MapGet(const char* key) {
    if (!key) return NULL;

    Map* map = GetMapInstance();
    unsigned int index = Hash(key);
    MapEntry* entry = map->buckets[index];

    while (entry) {
        if (strcmp(entry->key, key) == 0) {
            return entry->value;
        }
        entry = entry->next;
    }

    return NULL;
}

void MapRemove(const char* key) {
    if (!key) return;

    Map* map = GetMapInstance();
    unsigned int index = Hash(key);
    MapEntry* entry = map->buckets[index];
    MapEntry* prev = NULL;

    while (entry) {
        if (strcmp(entry->key, key) == 0) {
            if (prev) prev->next = entry->next;
            else map->buckets[index] = entry->next;

            free(entry->key);
            free(entry->value->fileID);
            free(entry->value);
            free(entry);
            return;
        }
        prev = entry;
        entry = entry->next;
    }
}

void MapCleanup(void) {
    Map* map = GetMapInstance();
    for (int i = 0; i < MAP_BUCKETS; ++i) {
        MapEntry* entry = map->buckets[i];
        while (entry) {
            MapEntry* next = entry->next;
            free(entry->key);
            if (entry->value) {
                free(entry->value->fileID);
                free(entry->value);
            }
            free(entry);
            entry = next;
        }
        map->buckets[i] = NULL;
    }
}
