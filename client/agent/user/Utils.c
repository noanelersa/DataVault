#include "Utils.h"
#include <direct.h>
#include "UINetHandler.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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

char* Utf16ToUtf8(const wchar_t* utf16Str) {
    int utf8_len = WideCharToMultiByte(CP_UTF8, 0, utf16Str, -1, NULL, 0, NULL, NULL);
    if (utf8_len == 0) {
        return NULL; // conversion failed
    }

    char* utf8_str = (char*)malloc(utf8_len);
    if (!utf8_str) {
        return NULL; // memory allocation failed
    }

    if (WideCharToMultiByte(CP_UTF8, 0, utf16Str, -1, utf8_str, utf8_len, NULL, NULL) == 0) {
        free(utf8_str);
        return NULL; // conversion failed
    }

    return utf8_str; // caller must free
}

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
    char* json_result = (char*)malloc(MAX_JSON_DATA_SIZE);
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

char* ExtractFilePath(const char* input)
{
    if (!input) return NULL;

    const char* dollar = strchr(input, '$'); //Find the first occurrence of the '$'.
    if (!dollar) return NULL;

    size_t length = (size_t)(dollar - input);
    if (length == 0 || length > 256)  
        return NULL;

    char* fileId = (char*)malloc(length + 1);
    if (!fileId) return NULL;

    strncpy(fileId, input, length);
    fileId[length] = '\0';

    return fileId;
}

char* ExtractFileIdFromFile(char* path) {
    
    static char sanitizedFileId[AGENT_FILE_ID_SIZE + 1]; 
    
    FILE *file = fopen(path, "r");
    if (!file) {
        return NULL; 
    }

    char buffer[1024];
    size_t bytesRead = fread(buffer, 1, sizeof(buffer), file);
    fclose(file);

    if (strstr(buffer, "DTVL") == NULL) {
        return NULL; 
    }

    char *fileIdStart = strstr(buffer, "DTVL") + 4; 
    if (!fileIdStart) {
        return NULL; 
    }

    strncpy(sanitizedFileId, fileIdStart, AGENT_FILE_ID_SIZE);
    sanitizedFileId[AGENT_FILE_ID_SIZE] = '\0';  

    return sanitizedFileId;
}

//
// SHA-256 hash function constants.
//

void Sha256Transform(SHA256_CTX* ctx, const uint8_t data[]) {
    uint32_t a, b, c, d, e, f, g, h, i, j, t1, t2, m[64];

    for (i = 0, j = 0; i < 16; ++i, j += 4)
        m[i] = (data[j] << 24) | (data[j + 1] << 16) | (data[j + 2] << 8) | (data[j + 3]);
    for (; i < 64; ++i)
        m[i] = SIG1(m[i - 2]) + m[i - 7] + SIG0(m[i - 15]) + m[i - 16];

    a = ctx->state[0]; b = ctx->state[1]; c = ctx->state[2]; d = ctx->state[3];
    e = ctx->state[4]; f = ctx->state[5]; g = ctx->state[6]; h = ctx->state[7];

    for (i = 0; i < 64; ++i) {
        t1 = h + EP1(e) + CH(e, f, g) + k[i] + m[i];
        t2 = EP0(a) + MAJ(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    ctx->state[0] += a; ctx->state[1] += b; ctx->state[2] += c; ctx->state[3] += d;
    ctx->state[4] += e; ctx->state[5] += f; ctx->state[6] += g; ctx->state[7] += h;
}

void Sha256Init(SHA256_CTX* ctx) {
    ctx->datalen = 0;
    ctx->bitlen = 0;
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
}

void Sha256Update(SHA256_CTX* ctx, const uint8_t data[], size_t len) {
    for (size_t i = 0; i < len; ++i) {
        ctx->data[ctx->datalen] = data[i];
        ctx->datalen++;
        if (ctx->datalen == 64) {
            Sha256Transform(ctx, ctx->data);
            ctx->bitlen += 512;
            ctx->datalen = 0;
        }
    }
}

void Sha256Final(SHA256_CTX* ctx, uint8_t hash[]) {
    uint32_t i = ctx->datalen;

    ctx->data[i++] = 0x80;
    while (i < 56)
        ctx->data[i++] = 0x00;

    ctx->bitlen += ctx->datalen * 8;
    ctx->data[63] = ctx->bitlen;
    ctx->data[62] = ctx->bitlen >> 8;
    ctx->data[61] = ctx->bitlen >> 16;
    ctx->data[60] = ctx->bitlen >> 24;
    ctx->data[59] = ctx->bitlen >> 32;
    ctx->data[58] = ctx->bitlen >> 40;
    ctx->data[57] = ctx->bitlen >> 48;
    ctx->data[56] = ctx->bitlen >> 56;

    Sha256Transform(ctx, ctx->data);

    for (i = 0; i < 4; ++i) {
        for (int j = 0; j < 8; ++j)
            hash[i + j * 4] = (ctx->state[j] >> (24 - i * 8)) & 0x000000ff;
    }
}

int ComputeFileSha256(const char* filepath, uint8_t hash[HASH_SIZE + 1]) {
    FILE* file = fopen(filepath, "rb");
    if (!file) {
        perror("Failed to open file");
        return -1;
    }

    SHA256_CTX ctx;
    Sha256Init(&ctx);

    uint8_t buffer[CHUNK_SIZE];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, CHUNK_SIZE, file)) > 0)
        Sha256Update(&ctx, buffer, bytes_read);

    if (ferror(file)) {
        perror("ComputeFileSha256: Error reading file");
        fclose(file);
        return -1;
    }

    Sha256Final(&ctx, hash);
    fclose(file);

    // Null-terminate the hash.
	hash[HASH_SIZE] = '\0';
    return 0;
}

#include "Utils.h"

/**
 * Compute the SHA-256 of a file and return it as a hex string.
 *
 * @param filepath  Path to the file to hash.
 * @param hexOutput Buffer of at least (HASH_SIZE*2 + 1) bytes
 *                  (i.e. 64 chars + null terminator).
 * @return  0 on success, -1 on failure.
 */
int ComputeFileSha256Hex(const char* filepath, char hexOutput[HASH_SIZE * 2 + 1]) {
    uint8_t binHash[HASH_SIZE + 1];
    if (ComputeFileSha256(filepath, binHash) != 0) {
        return -1;
    }
    // Convert each byte to two hex chars:
    for (int i = 0; i < HASH_SIZE; i++) {
        // %02x always produces two lowercase hex digits
        snprintf(hexOutput + (i * 2), 3, "%02x", binHash[i]);
    }
    hexOutput[HASH_SIZE * 2] = '\0';
    return 0;
}


void PrintSha256Hash(uint8_t hash[HASH_SIZE]) {
    for (int i = 0; i < HASH_SIZE; ++i)
        printf("%02x", hash[i]);
    printf("\n");
}