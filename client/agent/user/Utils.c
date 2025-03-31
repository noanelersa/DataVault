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