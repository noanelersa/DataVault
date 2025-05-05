#ifndef DRIVER_HANDLER_H
#define DRIVER_HANDLER_H

typedef enum {
    READ = 0,
    WRITE,
    CREATE,
    CLEANUP,

    NUM_FILE_ACTIONS
} EFileAction;

typedef struct {
    char* fileID;                  // dynamically allocated string
    EFileAction allowedAction;
} MapEntryValue;

void MapSet(const char* key, const MapEntryValue* value);
MapEntryValue* MapGet(const char* key);
void MapRemove(const char* key);
void MapCleanup(void);  // Optional cleanup

#endif // DRIVER_HANDLER_H
