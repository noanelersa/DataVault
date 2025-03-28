#include "file_metadata.h"
#include <iostream>
#include <fstream>
#include <cstring>
#include <ctime>

bool CheckIfFileHasMetadata(const std::string& filePath) {
    std::ifstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "ERROR- Cannot open file: " << filePath << std::endl;
        return false;
    }

    char magic[4];
    file.read(magic, 4);
    file.close();

    return std::memcmp(magic, "DVTL", 4) == 0;
}

bool embedMetadata(const std::string& filePath, const FileMetadata& metadata) {
    std::ifstream file(filePath, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "ERROR- Cannot open file for reading: " << filePath << std::endl;
        return false;
    }

    std::vector<char> fileData((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();

    std::ofstream outFile(filePath, std::ios::binary | std::ios::trunc);
    if (!outFile.is_open()) {
        std::cerr << "ERROR- Cannot open file for writing: " << filePath << std::endl;
        return false;
    }

    outFile.write(reinterpret_cast<const char*>(&metadata), sizeof(FileMetadata));
    outFile.write(fileData.data(), fileData.size());
    outFile.close();

    std::cout << "Metadata embedded successfully into: " << filePath << std::endl;
    return true;
}

bool extractMetadata(const std::string& filePath, FileMetadata& metadata) {
    std::ifstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "ERROR- Cannot open file: " << filePath << std::endl;
        return false;
    }

    file.read(reinterpret_cast<char*>(&metadata), sizeof(FileMetadata));
    file.close();

    return std::memcmp(metadata.magic, "DVTL", 4) == 0;
}