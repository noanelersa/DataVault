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