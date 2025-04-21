#include <windows.h>
#include <stdio.h>

int main() {
    HANDLE hFile = CreateFileW(L"test.txt", GENERIC_READ, FILE_SHARE_READ, NULL,
                               OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    if (hFile == INVALID_HANDLE_VALUE) {
        printf("Error opening file: %lu\n", GetLastError());
        return 1;
    }

    // Seek to offset 0 (should really go to 40 if your hook works)
    SetFilePointer(hFile, 0, NULL, FILE_BEGIN);

    char buffer[100] = {0};
    DWORD bytesRead;

    if (ReadFile(hFile, buffer, sizeof(buffer) - 1, &bytesRead, NULL)) {
        printf("Read: %s\n", buffer);
    } else {
        printf("ReadFile failed: %lu\n", GetLastError());
    }

    CloseHandle(hFile);
    return 0;
}
