/*++

Module Name:

    Utils.h

Abstract:

    Header file which contains the utils structures, type definitions,
    constants, global variables and function prototypes for the
	user mode part of the scanner.

Environment:

    User mode

--*/
#ifndef __UTILS_H__
#define __UTILS_H__

#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>

#define USERNAME_NAX_SIZE 256
#define AGENT_FILE_NAME_SIZE 512
#define PASSWORD_MAX_SIZE 256
#define TOKEN_SIZE 256

// FNV-1a 32-bit Constants
#define FNV_OFFSET_BASIS 2166136261u
#define FNV_PRIME        16777619u

// 8 hex digits + null terminator
#define FNV_HASH_STR_LEN 9

#define MAX_JSON_DATA_SIZE 1024
#define MAX_JSON_HEADERS_SIZE 256

// File actions - the action will be checked against the user's
// permissions to determine if the action is allowed.
enum EFileAction {
    READ = 0,
    WRITE,
    MANAGE,
    UPDATE_HASH,

    NUM_FILE_ACTIONS
} typedef EFileAction;

enum EAgentResponse {
    NOT_ALLOWED = 0,
    ALLOWED,
    NOT_REGISTERED,

    NUM_AGENT_RESPONSES
} typedef EAgentResponse;

typedef struct
{
    char username[256];
    int access;
} UserAccess;

/*
 * Computes the FNV-1a 32-bit hash of a given input string and stores it as a hex string in output buffer.
 *
 * @param input  The input null-terminated string to hash.
 * @param output Pre-allocated buffer (at least 9 bytes) to hold the
    resulting 8-character hex string + null terminator.
 */
void
Fnv1aHashString(
    const char* input,
    char* output);

char* 
Utf16ToUtf8(
    const wchar_t* utf16Str);

BOOLEAN
GetSystemUser(
    CHAR* username,
    const DWORD usernamsSize);

char*
GetPathFromUI(
    const char* input);

char*
ParseAccessControl(
    const char* input);

char*
 ExtractFileIdFromFile(
    char* path);

//
// SHA-256 hash function constants.
//

#define CHUNK_SIZE 8192
#define HASH_SIZE 32

// SHA-256 context structure
typedef struct {
    uint32_t state[8];
    uint64_t bitlen;
    uint8_t data[64];
    uint32_t datalen;
} SHA256_CTX;

// Function declarations
void
Sha256Transform(
    SHA256_CTX* ctx, 
    const uint8_t data[]);

void
Sha256Init(
    SHA256_CTX* ctx);

void
Sha256Update(
    SHA256_CTX* ctx, 
    const uint8_t data[],
    size_t len);

void 
Sha256Final(
    SHA256_CTX* ctx,
    uint8_t hash[]);

int
ComputeFileSha256(
    const char* filepath,
    uint8_t hash[HASH_SIZE + 1]);

int 
ComputeFileSha256Hex(
    const char* filepath,
    char hexOutput[HASH_SIZE * 2 + 1]);

static inline void ReduceBackslashes(char* str) {
    char* src = str;
    char* dst = str;

    while (*src) {
        if (src[0] == '\\' && src[1] == '\\') {
            *dst++ = '\\';
            src += 2;
        }
        else {
            *dst++ = *src++;
        }
    }
    *dst = '\0';
}

void
PrintSha256Hash(
    uint8_t hash[HASH_SIZE]);

// SHA-256 implementation constants
#define ROTRIGHT(a,b) (((a) >> (b)) | ((a) << (32-(b))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
#define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))
#define SIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))

// SHA-256 constants
static const uint32_t k[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};
char* GetTokenFromUI(
    const char* input);

#endif //  __UTILS_H__