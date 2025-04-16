#include <stdio.h>
#include <stdlib.h>

int main() {
    FILE *file = fopen("secret.txt", "r"); // Open the file in read mode
    if (file == NULL) {
        perror("Error opening file");
        return 1;
    }

    long pos = ftell(file);
    if (pos == -1L) {
        perror("ftell failed");
    } else {
        printf("Current file pointer position: %ld\n", pos);
    }

    fseek(file, 0, SEEK_SET);

    pos = ftell(file);
    if (pos == -1L) {
        perror("ftell failed");
    } else {
        printf("Current file pointer position: %ld\n", pos);
    }

    char ch;
    while ((ch = fgetc(file)) != EOF) { // Read character by character
        putchar(ch); // Print to stdout
    }

    fclose(file); // Close the file
    return 0;
}
