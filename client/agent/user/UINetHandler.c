#include "UINetHandler.h"
#include "ServerNetHandler.h"
#include "Utils.h"
#include <time.h>

BOOL InitializeServer(SOCKET* listenSocket)
{
    WSADATA wsaData;
    int iResult = 0;
    struct addrinfo* result = NULL, hints;

    // Initialize Winsock
    iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0)
    {
        printf("WSAStartup failed with error: %d\n", iResult);
        return FALSE;
    }

    ZeroMemory(&hints, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;
    hints.ai_flags = AI_PASSIVE;

    // Resolve the server address and port
    iResult = getaddrinfo(NULL, DV_AGENT_PORT, &hints, &result);
    if (iResult != 0)
    {
        printf("getaddrinfo failed with error: %d\n", iResult);
        WSACleanup();
        return FALSE;
    }

    // Create a SOCKET for the server to listen for client connections
    *listenSocket = socket(result->ai_family, result->ai_socktype, result->ai_protocol);
    if (*listenSocket == INVALID_SOCKET) 
    {
        printf("socket failed with error: %ld\n", WSAGetLastError());
        freeaddrinfo(result);
        WSACleanup();
        return FALSE;
    }

    // Setup the TCP listening socket
    iResult = bind(*listenSocket, result->ai_addr, (int)result->ai_addrlen);
    if (iResult == SOCKET_ERROR)
    {
        printf("bind failed with error: %d\n", WSAGetLastError());
        freeaddrinfo(result);
        closesocket(*listenSocket);
        WSACleanup();
        return FALSE;
    }

    freeaddrinfo(result);

    iResult = listen(*listenSocket, SOMAXCONN);
    if (iResult == SOCKET_ERROR)
    {
        printf("listen failed with error: %d\n", WSAGetLastError());
        closesocket(*listenSocket);
        WSACleanup();
        return FALSE;
    }

    return TRUE;
}

DWORD WINAPI ServerWorker(LPVOID lpParam)
{
    SOCKET clientSocket;
    char recvbuf[MAX_UI_MESSAGE_SIZE] = { 0 };
    int iResult = 0, iSendResult = 0;

	// Parse the agent server context.
	AGENT_SERVER_CONTEXT agentServerContext = *(AGENT_SERVER_CONTEXT*)lpParam;
    SOCKET listenSocket = *(agentServerContext.listenSocket);
	const char* username = agentServerContext.username;

    while (TRUE)
    {
        // Accept a client socket.
        clientSocket = accept(listenSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET)
        {
            printf("Accept failed with error: %d\n", WSAGetLastError());
            closesocket(listenSocket);
            WSACleanup();
            return 1;
        }

        // Receive until the peer shuts down the connection.
        do
        {
            iResult = recv(clientSocket, recvbuf, sizeof(recvbuf), 0);
            if (iResult > 0)
            {
                printf("Bytes received from UI: %d\n", iResult);

				// Handle the UI request.
				BOOLEAN ret = HandleUIRequest(recvbuf, iResult, username);

				// Send the response to the UI.
                iSendResult = send(clientSocket, &((char)ret), iResult, 0);

                if (iSendResult == SOCKET_ERROR)
                {
                    printf("send failed with error: %d\n", WSAGetLastError());
                    closesocket(clientSocket);
                    WSACleanup();
                    return 1;
                }
                printf("Bytes sent TO UI: %d\n", iSendResult);
            }
            else if (iResult == 0)
            {
				printf("Connection closing...\n");
            }
            else 
            {
                printf("recv failed with error: %d\n", WSAGetLastError());
                closesocket(clientSocket);
                WSACleanup();
                return 1;
            }
        } while (iResult > 0);

        // Shutdown the connection since we're done.
        iResult = shutdown(clientSocket, SD_SEND);
        if (iResult == SOCKET_ERROR)
        {
            printf("shutdown failed with error: %d\n", WSAGetLastError());
            closesocket(clientSocket);
            WSACleanup();
            return 1;
        }

        // Cleanup
        closesocket(clientSocket);
    }

    return 0;
}

BOOLEAN HandleUIRequest(char* recvbuf, int recvbuflen, const char* username)
{
    if (recvbuflen == 0)
    {
		printf("Error: Received empty message from UI\n");
		return FALSE;
    }

	const unsigned int retquestType = recvbuf[0];

    switch (retquestType)
    {
    case UI_REQUEST_FILE_REGISTER:
        return HandleUIFileRegister((recvbuf+1), (recvbuflen-1), username);
    case UI_REQUEST_UPDATE_PERMISSIONS:
        return HandleUIUpdatePermissions((recvbuf + 1), (recvbuflen - 1), username);
    default:
        printf("Error: Invalid requrest type received from UI: %d\n", retquestType);
        return FALSE;
    }
}

BOOLEAN HandleUIFileRegister(char* recvbuf, int recvbuflen, const char* username)
{
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    // JSON request body
    char jsonData[MAX_JSON_SIZE*2] = { 0 };

    // At the moment we don't support file hash functionality in the server.
    // Therefore, we use the current time as the file hash for now - in Fnv1a format.
	char timeBuffer[TIME_BUFFER_SIZE] = { 0 };
	char fileHash[FNV_HASH_STR_LEN] = { 0 };

    time_t timeNow = time(NULL);
    struct tm* timeSt = localtime(&timeNow);
    strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", timeSt);
	Fnv1aHashString(timeBuffer, fileHash);

	// TODO: Get the ACL from the UI.
    // Follow the API format - USE recvbuf and recvbuflen.

    char* jsonAclString = ParseAccessControl(recvbuf);

    // Format JSON payload.
    snprintf(jsonData, sizeof(jsonData),
        "{ \"owner\": \"%s\", \"fileHash\": \"%s\", \"fileName\":\"secret.txt\",\"acl\": %s }",
        username, fileHash, jsonAclString);

    // Free the allocated memory.
    free(jsonAclString);

    // Open HTTP connection
    if (!OpenHttpConnection(&hSession, &hConnect))
    {
        return FALSE;
    }

    // Open HTTP request (POST)
    hRequest = HttpOpenRequestA(hConnect, "POST", "/file", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) 
    {
        printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return FALSE;
    }

    char headers[512] = { 0 };
    snprintf(headers, sizeof(headers),
        "Host: %s:%d\r\nContent-Type: application/json\r\nAccept: */*\r\n",
        DV_SERVER_IP, DV_SERVER_PORT);

    const DWORD headersLen = (DWORD)strlen(headers);
    const DWORD jsonLen = (DWORD)strlen(jsonData);

    // Send HTTP request with JSON data
    if (!HttpSendRequestA(hRequest, headers, headersLen, jsonData, jsonLen))
    {
        printf("Error: HttpSendRequestA failed with %drr\n", GetLastError());
        CloseAllHandlers(&hRequest, &hConnect, &hSession);
        return FALSE;
    }

    DWORD statusCode = 0;
    DWORD statusCodeSize = sizeof(statusCode);

    // Get the HTTP status code.
    if (!HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &statusCodeSize, NULL))
    {
        printf("HttpQueryInfoA failed with error for file registeration: %d\n", GetLastError());
        return FALSE;
    }

    printf("Server responded with HTTP status code for file registeration: %d\n", statusCode);

	// Check if the file was registered successfully.
	// TODO: Deal with the case where the file was not registered becaue it already exists.
    if (statusCode != ALLOW_ACCESS_CODE)
    {
        return FALSE;
    }

    // Read the response.
    // TODO: Change to uuid size (fileId size).
    char serverResponse[AGENT_FILE_ID_SIZE + 1] = { 0 };
    DWORD bytesRead = 0;

	// TODO: Remove if not needed.
    // For reading in chunks.
    // while (InternetReadFile(hRequest, serverResponse, sizeof(serverResponse), &bytesRead) && bytesRead > 0)

    if (!InternetReadFile(hRequest, serverResponse, sizeof(serverResponse) - 1, &bytesRead))
    {
        printf("Error: InternetReadFile failed with %d in file registeration\n", GetLastError());
    }

	char magicFileIDCombined[AGENT_MAGIC_SIZE + AGENT_FILE_ID_SIZE] = { 0 };

	// Combine the magic number and file ID.
	strncpy(magicFileIDCombined, AGENT_MAGIC, AGENT_MAGIC_SIZE);
	strncpy(magicFileIDCombined + AGENT_MAGIC_SIZE, serverResponse, AGENT_FILE_ID_SIZE);

    char* protectedFilePath = GetPathFromUI(recvbuf);

	// Prepend the magic number and file ID to the file.
    PrependToFile(protectedFilePath, magicFileIDCombined, sizeof(magicFileIDCombined));

    // Free the allocated memory.
	free(protectedFilePath);

    // Cleanup
    CloseAllHandlers(&hRequest, &hConnect, &hSession);

    return TRUE;
}

BOOLEAN HandleUIUpdatePermissions(char* recvbuf, int recvbuflen, const char* username){

    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    char* extractedPath = ExtractFilePath(recvbuf);
    char* jsonAcl = ParseAccessControl(recvbuf);

    
    char *fileId = ExtractFileIdFromFile(extractedPath);
    
    if (!extractedPath || !jsonAcl) {
        printf("Error: Failed to parse input data.\n");
        if (extractedPath) free(extractedPath);
        if (jsonAcl) free(jsonAcl);
        return FALSE;
    }

    if (!OpenHttpConnection(&hSession, &hConnect)) {
        printf("Error: Failed to open HTTP connection.\n");
        free(extractedPath);
        free(jsonAcl);
        return FALSE;
    }
    
    char* aclCopy = strdup(jsonAcl);
    if (!aclCopy) {
        printf("Error: Memory allocation failed for aclCopy.\n");
        CloseAllHandlers(&hRequest, &hConnect, &hSession);
        free(extractedPath);
        free(jsonAcl);
        return FALSE;
    }
    
    char* entry = strstr(aclCopy, "{\"username\":");
    while (entry) {
        char username[128] = {0};
        int access = -1;
    
        // Extract username
        char* usernameKey = strstr(entry, "\"username\":");
        if (!usernameKey) break;
    
        char* uStart = strchr(usernameKey + 10, '\"');
        if (!uStart) break;
    
        char* uEnd = strchr(uStart + 1, '\"');
        if (!uEnd) break;
    
        size_t uLen = uEnd - (uStart + 1);
        if (uLen >= sizeof(username)) uLen = sizeof(username) - 1;
        strncpy(username, uStart + 1, uLen);
        username[uLen] = '\0';
    
        printf("Extracted username: %s\n", username);
    
        // Extract access level
        char* accessStr = strstr(uEnd, "\"access\":");
        if (!accessStr) break;
    
        access = atoi(accessStr + 9);
        printf("Extracted access level for %s: %d\n", username, access);
    
        char endpoint[256];
        snprintf(endpoint, sizeof(endpoint), "/acl/%s/%s/%d", fileId, username, access);
        printf("Requesting endpoint: %s\n", endpoint);
    
        char body[128];
        snprintf(body, sizeof(body), "{ \"access\": %d }", access);
        printf("Sending JSON body: %s\n", body);
    
        // Send request
        hRequest = HttpOpenRequestA(hConnect, "PUT", endpoint, NULL, NULL, NULL,
                                    INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
        if (!hRequest) {
            printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
            break;
        }
    
        char headers[512];
        snprintf(headers, sizeof(headers),
                 "Host: %s:%d\r\nContent-Type: application/json\r\nAccept: */*\r\n",
                 DV_SERVER_IP, DV_SERVER_PORT);
    
        DWORD headersLen = (DWORD)strlen(headers);
        DWORD bodyLen = (DWORD)strlen(body);
    
        if (!HttpSendRequestA(hRequest, headers, headersLen, body, bodyLen)) {
            printf("Error: HttpSendRequestA failed with %d\n", GetLastError());
            InternetCloseHandle(hRequest);
            hRequest = NULL;
            break;
        }
    
        DWORD statusCode = 0;
        DWORD statusCodeSize = sizeof(statusCode);
        if (!HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER,
                            &statusCode, &statusCodeSize, NULL)) {
            printf("Error: HttpQueryInfoA failed with %d\n", GetLastError());
            InternetCloseHandle(hRequest);
            hRequest = NULL;
            break;
        }
    
        printf("Server responded for user %s with status code: %lu\n", username, statusCode);
    
        InternetCloseHandle(hRequest);
        hRequest = NULL;
    
        entry = strstr(uEnd, "{\"username\":");
    }    

    CloseAllHandlers(&hRequest, &hConnect, &hSession);
    free(extractedPath);
    free(jsonAcl);
    free(aclCopy);

    return TRUE;
}
