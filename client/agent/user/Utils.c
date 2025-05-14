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

#include <stdio.h>
#include <stdlib.h>

#define AGENT_METADATA_SIZE 40
#define TEMP_SUFFIX ".tmp"

//int RemoveMetadataFromFile(const char* filePath)
//{
//    if (!filePath) {
//        fprintf(stderr, "Error: filePath is NULL.\n");
//        return -1;
//    }
//
//    FILE* input = fopen(filePath, "rb");
//    if (!input) {
//        perror("fopen (read)");
//        return -1;
//    }
//
//    if (fseek(input, 0, SEEK_END) != 0) {
//        perror("fseek (end)");
//        fclose(input);
//        return -1;
//    }
//
//    long fileSize = ftell(input);
//    if (fileSize < 0) {
//        perror("ftell");
//        fclose(input);
//        return -1;
//    }
//
//    if (fileSize < AGENT_METADATA_SIZE) {
//        fprintf(stderr, "Error: File is smaller than metadata size (%d bytes).\n", AGENT_METADATA_SIZE);
//        fclose(input);
//        return -1;
//    }
//
//    long dataSize = fileSize - AGENT_METADATA_SIZE;
//
//    char* buffer = (char*)malloc(dataSize);
//    if (!buffer) {
//        perror("malloc");
//        fclose(input);
//        return -1;
//    }
//
//    if (fseek(input, AGENT_METADATA_SIZE, SEEK_SET) != 0) {
//        perror("fseek (skip metadata)");
//        free(buffer);
//        fclose(input);
//        return -1;
//    }
//
//    size_t bytesRead = fread(buffer, 1, dataSize, input);
//    fclose(input);
//    if (bytesRead != (size_t)dataSize) {
//        fprintf(stderr, "Error: Expected to read %ld bytes, but got %zu.\n", dataSize, bytesRead);
//        free(buffer);
//        return -1;
//    }
//
//    // Prepare temp file path
//    char tempFilePath[FILENAME_MAX];
//    snprintf(tempFilePath, sizeof(tempFilePath), "%s%s", filePath, TEMP_SUFFIX);
//
//    FILE* output = fopen(tempFilePath, "wb");
//    if (!output) {
//        perror("fopen (write temp)");
//        free(buffer);
//        return -1;
//    }
//
//    size_t bytesWritten = fwrite(buffer, 1, dataSize, output);
//    free(buffer);
//    fclose(output);
//
//    if (bytesWritten != (size_t)dataSize) {
//        fprintf(stderr, "Error: Expected to write %ld bytes, but wrote %zu.\n", dataSize, bytesWritten);
//        remove(tempFilePath);
//        return -1;
//    }
//
//    // Replace original file
//    if (remove(filePath) != 0) {
//        perror("remove (original)");
//        remove(tempFilePath);
//        return -1;
//    }
//
//    if (rename(tempFilePath, filePath) != 0) {
//        perror("rename (temp to original)");
//        return -1;
//    }
//
//    return 0;
//}

int RemoveMetadataFromFile(const char* filePath)
{
    if (!filePath) {
        fprintf(stderr, "Error: filePath is NULL.\n");
        return -1;
    }

    FILE* input = fopen(filePath, "rb");
    if (!input) {
        perror("fopen (read)");
        return -1;
    }

    if (fseek(input, 0, SEEK_END) != 0) {
        perror("fseek (end)");
        fclose(input);
        return -1;
    }

    long fileSize = ftell(input);
    if (fileSize < 0) {
        perror("ftell");
        fclose(input);
        return -1;
    }

    if (fileSize < AGENT_METADATA_SIZE) {
        fprintf(stderr, "Error: File is smaller than metadata size (%d bytes).\n", AGENT_METADATA_SIZE);
        fclose(input);
        return -1;
    }

    long dataSize = fileSize - AGENT_METADATA_SIZE;
    char* buffer = (char*)malloc(dataSize);
    if (!buffer) {
        perror("malloc");
        fclose(input);
        return -1;
    }

    if (fseek(input, AGENT_METADATA_SIZE, SEEK_SET) != 0) {
        perror("fseek (skip metadata)");
        free(buffer);
        fclose(input);
        return -1;
    }

    size_t bytesRead = fread(buffer, 1, dataSize, input);
    fclose(input);

    if (bytesRead != (size_t)dataSize) {
        fprintf(stderr, "Error: Expected to read %ld bytes, but got %zu.\n", dataSize, bytesRead);
        free(buffer);
        return -1;
    }

    FILE* output = fopen(filePath, "wb");
    if (!output) {
        perror("fopen (overwrite)");
        free(buffer);
        return -1;
    }

    size_t bytesWritten = fwrite(buffer, 1, dataSize, output);
    free(buffer);
    fclose(output);

    if (bytesWritten != (size_t)dataSize) {
        fprintf(stderr, "Error: Expected to write %ld bytes, but wrote %zu.\n", dataSize, bytesWritten);
        return -1;
    }

    return 0;
}


//void PrependToFile(const char* file_path, const char* text, const unsigned int textLength)
//{
//    FILE* originalFile = fopen(file_path, "rb");
//    if (!originalFile)
//    {
//        perror("Error opening original file");
//        return;
//    }
//
//    FILE* temp = fopen(TEMP_FILE_PATH1, "wb");
//    if (!temp)
//    {
//        perror("Error creating temporary file");
//        fclose(originalFile);
//        return;
//    }
//
//    // Write the new text first
//    fwrite(text, 1, strlen(text), temp);
//
//    // Copy the original file content in chunks -  4 KB buffer.
//    char buffer[4096];
//    size_t bytes_read;
//    while ((bytes_read = fread(buffer, 1, sizeof(buffer), originalFile)) > 0)
//    {
//        fwrite(buffer, 1, bytes_read, temp);
//    }
//
//    fclose(originalFile);
//    fclose(temp);
//
//    // Replace the original file with the temp file
//    if (remove(file_path) != 0)
//    {
//        perror("Error removing original file");
//        return;
//    }
//
//    if (rename(TEMP_FILE_PATH1, file_path) != 0)
//    {
//        perror("Error renaming temporary file");
//    }
//}

void PrependToFile(const char* file_path, const char* text, const unsigned int textLength)
{
    if (!file_path || !text) {
        fprintf(stderr, "Error: NULL input.\n");
        return;
    }

    FILE* originalFile = fopen(file_path, "rb");
    if (!originalFile) {
        perror("Error opening original file");
        return;
    }

    // Determine original file size
    if (fseek(originalFile, 0, SEEK_END) != 0) {
        perror("fseek (end)");
        fclose(originalFile);
        return;
    }

    long originalSize = ftell(originalFile);
    if (originalSize < 0) {
        perror("ftell");
        fclose(originalFile);
        return;
    }

    rewind(originalFile);  // Go back to the start

    // Allocate memory to hold the original content
    char* originalBuffer = (char*)malloc(originalSize);
    if (!originalBuffer) {
        perror("malloc");
        fclose(originalFile);
        return;
    }

    if (fread(originalBuffer, 1, originalSize, originalFile) != (size_t)originalSize) {
        perror("fread");
        free(originalBuffer);
        fclose(originalFile);
        return;
    }

    fclose(originalFile);

    // Reopen the file for writing (truncates it)
    FILE* output = fopen(file_path, "wb");
    if (!output) {
        perror("Error reopening file for writing");
        free(originalBuffer);
        return;
    }

    // Write the new text first
    if (fwrite(text, 1, textLength, output) != textLength) {
        perror("fwrite (prepend text)");
        free(originalBuffer);
        fclose(output);
        return;
    }

    // Write the original content
    if (fwrite(originalBuffer, 1, originalSize, output) != (size_t)originalSize) {
        perror("fwrite (original data)");
    }

    free(originalBuffer);
    fclose(output);
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