#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include <stdlib.h>

#define MAGIC_VALUE "DTVL"
#define MAGIC_LENGTH 4

bool check_buffer_magic(const unsigned char *buffer, size_t buffer_size) {
    if (buffer == NULL || buffer_size < MAGIC_LENGTH) {
        return false;
    }

    return memcmp(buffer, MAGIC_VALUE, MAGIC_LENGTH) == 0;
}

unsigned char* add_magic_and_json_to_buffer(const unsigned char *input_buffer, 
                                          size_t input_size, 
                                          size_t *output_size) {
    const char *json_data = "{\"name\": \"example\",\"version\": 1.0,\"description\": \"Sample JSON data\"}";
    size_t json_len = strlen(json_data);
    
    // Calculate new buffer size
    *output_size = MAGIC_LENGTH + json_len + input_size;
    
    // Allocate new buffer
    unsigned char *new_buffer = malloc(*output_size);
    if (new_buffer == NULL) {
        printf("Error: Memory allocation failed\n");
        return NULL;
    }

    // Write magic number
    memcpy(new_buffer, MAGIC_VALUE, MAGIC_LENGTH);
    
    // Write JSON data
    memcpy(new_buffer + MAGIC_LENGTH, json_data, json_len);
    
    // Copy existing data if any
    if (input_buffer != NULL && input_size > 0) {
        memcpy(new_buffer + MAGIC_LENGTH + json_len, input_buffer, input_size);
    }

    return new_buffer;
}

// Example main function showing usage
int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("Usage: %s <filename>\n", argv[0]);
        return 1;
    }

    // Read file into buffer
    FILE *file = fopen(argv[1], "rb");
    if (file == NULL) {
        printf("Error: Could not open file %s\n", argv[1]);
        return 1;
    }

    // Get file size
    fseek(file, 0, SEEK_END);
    size_t file_size = ftell(file);
    fseek(file, 0, SEEK_SET);

    // Read file content
    unsigned char *buffer = malloc(file_size);
    if (buffer == NULL) {
        printf("Error: Memory allocation failed\n");
        fclose(file);
        return 1;
    }
    fread(buffer, 1, file_size, file);
    fclose(file);

    // Check magic and process buffer
    if (check_buffer_magic(buffer, file_size)) {
        printf("Buffer has valid DTVL magic number\n");
    } else {
        printf("Adding magic number and JSON data...\n");
        size_t new_size;
        unsigned char *new_buffer = add_magic_and_json_to_buffer(buffer, file_size, &new_size);
        
        if (new_buffer) {
            // Write the new buffer back to file
            file = fopen(argv[1], "wb");
            if (file) {
                fwrite(new_buffer, 1, new_size, file);
                fclose(file);
                printf("Successfully added magic number and JSON data\n");
            }
            free(new_buffer);
        } else {
            printf("Failed to add magic number and JSON data\n");
        }
    }

    free(buffer);
    return 0;
}
