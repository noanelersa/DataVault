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

#define USERNAME_NAX_SIZE 256

// FNV-1a 32-bit Constants
#define FNV_OFFSET_BASIS 2166136261u
#define FNV_PRIME        16777619u

// 8 hex digits + null terminator
#define FNV_HASH_STR_LEN 9

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

BOOLEAN
GetSystemUser(
    CHAR* username, const DWORD usernamsSize);

#endif //  __UTILS_H__