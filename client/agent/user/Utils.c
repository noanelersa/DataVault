#include "Utils.h"

BOOLEAN GetSystemUser(CHAR* username, const DWORD usernamsSize)
{
    // Open a pipe to the whoami command.
    FILE* fp = _popen("whoami", "r");

    // If the command was successful, read the output.
    if (fp && fgets(username, usernamsSize, fp))
    {
        // Remove newline characters.
        username[strcspn(username, "\r\n")] = 0;

        _pclose(fp);

        return TRUE;
    }

    return FALSE;
}

void Fnv1aHashString(const char* input, char* output)
{
    DWORD hash = FNV_OFFSET_BASIS;

    while (*input)
    {
        hash ^= (unsigned char)(*input++);
        hash *= FNV_PRIME;
    }

    // Write the hash as an 8-character lowercase hex string.
    snprintf(output, FNV_HASH_STR_LEN, "%08x", hash);
}

#include <stdio.h>
#include <stdlib.h>

void RemoveMetadataFromFile(const char* filePath)
{
    if (!filePath) {
        fprintf(stderr, "Error: filePath is NULL.\n");
        perror("RemoveFirst40Bytes");
    }

    FILE* fp = fopen(filePath, "rb");
    if (!fp) {
        perror("fopen (read)");
    }

    // Seek to end to get file size
    if (fseek(fp, 0, SEEK_END) != 0) {
        perror("fseek");
        fclose(fp);
    }

    long fileSize = ftell(fp);
    if (fileSize < 0) {
        perror("ftell");
        fclose(fp);
    }

    if (fileSize < AGENT_METADATA_SIZE) {
        fprintf(stderr, "Error: File is smaller than 40 bytes.\n");
        perror("RemoveFirst40Bytes");
        fclose(fp);
    }

    rewind(fp);

    // Allocate buffer for remaining data
    char* buffer = (char*)malloc(fileSize - AGENT_METADATA_SIZE);
    if (!buffer) {
        perror("malloc");
        fclose(fp);
    }

    if (fseek(fp, AGENT_METADATA_SIZE, SEEK_SET) != 0) {
        perror("fseek (skip 40)");
        free(buffer);
        fclose(fp);
    }

    size_t bytesRead = fread(buffer, 1, fileSize - AGENT_METADATA_SIZE, fp);
    if (bytesRead != (size_t)(fileSize - AGENT_METADATA_SIZE)) {
        perror("fread");
        free(buffer);
        fclose(fp);
    }
    fclose(fp);

    // Open file for writing and overwrite
    fp = fopen(filePath, "wb");
    if (!fp) {
        perror("fopen (write)");
        free(buffer);
    }

    size_t bytesWritten = fwrite(buffer, 1, fileSize - AGENT_METADATA_SIZE, fp);
    if (bytesWritten != (size_t)(fileSize - AGENT_METADATA_SIZE)) {
        perror("fwrite");
        free(buffer);
        fclose(fp);
    }

    free(buffer);
    fclose(fp);

    return 0;
}


void PrependToFile(const char* file_path, const char* text, const unsigned int textLength)
{
    FILE* originalFile = fopen(file_path, "rb");
    if (!originalFile)
    {
        perror("Error opening original file");
        return;
    }

    FILE* temp = fopen(TEMP_FILE_PATH, "wb");
    if (!temp)
    {
        perror("Error creating temporary file");
        fclose(originalFile);
        return;
    }

    // Write the new text first
    fwrite(text, 1, strlen(text), temp);

    // Copy the original file content in chunks -  4 KB buffer.
    char buffer[4096];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), originalFile)) > 0)
    {
        fwrite(buffer, 1, bytes_read, temp);
    }

    fclose(originalFile);
    fclose(temp);

    // Replace the original file with the temp file
    if (remove(file_path) != 0)
    {
        perror("Error removing original file");
        return;
    }

    if (rename(TEMP_FILE_PATH, file_path) != 0)
    {
        perror("Error renaming temporary file");
    }
}

char* GetPathFromUI(const char* input) 
{
    char* dollar_pos = strchr(input, '$');
    if (!dollar_pos) 
    {
        return NULL; // No '$' found, invalid input
    }

    size_t path_length = dollar_pos - input;

    char* path = (char*)malloc(path_length + 1);
    if (!path)
    {
        return NULL;
    }

    strncpy(path, input, path_length);
    path[path_length] = '\0';

    return path;
}

char* ParseAccessControl(const char* input)
{
    // Find the start of the user list (after the first '$')
    const char* user_list = strchr(input, '$');
    if (!user_list || *(user_list + 1) == '\0')
    {
        return strdup("[]"); // Return empty JSON array if no users are found
    }
    user_list++;

    UserAccess users[100]; // Assume max 100 users for simplicity
    int user_count = 0;

    char* token = strtok(strdup(user_list), "|");
    while (token && user_count < 100)
    {
        char* semicolon = strchr(token, ';');
        if (semicolon)
        {
            *semicolon = '\0'; // Split username and access
            users[user_count].access = atoi(semicolon + 1);
            strncpy(users[user_count].username, token, sizeof(users[user_count].username) - 1);
            users[user_count].username[sizeof(users[user_count].username) - 1] = '\0';
            user_count++;
        }
        token = strtok(NULL, "|");
    }

    // Build JSON string
    char* json_result = (char*)malloc(MAX_JSON_SIZE);
    if (!json_result) return NULL;
    strcpy(json_result, "[");

    for (int i = 0; i < user_count; i++) 
    {
        char entry[512];
        snprintf(entry, sizeof(entry), "{\"username\": \"%s\", \"access\": %d}", users[i].username, users[i].access);
        strcat(json_result, entry);
        if (i < user_count - 1) 
        {
            strcat(json_result, ", ");
        }
    }

    strcat(json_result, "]");
    return json_result;
}