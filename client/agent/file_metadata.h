#ifndef FILE_METADATA_H
#define FILE_METADATA_H

#include <cstdint>
#include <string>
#include <vector>

enum class AccessLevel : uint8_t {
    NO_ACCESS = 0,
    READ_ONLY = 1,
    READ_WRITE = 2,
    MANAGE = 3,
};

struct FileMetadata {
    char magic[4] = { 'D', 'V', 'T', 'L' }; // "DVT" (DataVault) Magic "DVTL"
    char file_id[16];                     // Unique file ID (UUID)
    uint8_t hash[32];                     // SHA-256 hash (First & Last rows)
    uint32_t owner_id;                    // User ID
    AccessLevel acl;                      // Access control ADD IT AS ENUM
    uint64_t timestamp;                   // File registration timestamp
    char reserved[4] = { 0 };               // Reserved for future use
};

bool CheckIfFileHasMetadata(const std::string& filePath);
bool embedMetadata(const std::string& filePath, const FileMetadata& metadata);
bool extractMetadata(const std::string& filePath, FileMetadata& metadata);

#endif