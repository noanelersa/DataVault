#include "UINetHandler.h"
#include "ServerNetHandler.h"
#include "Utils.h"
#include "DriverHandler.h"

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
    char outBuf[1024] = { 0 };
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

                memset(outBuf, 0, sizeof(outBuf));

				// Send the response to the UI.
                iSendResult = send(clientSocket, (const char*)&ret, sizeof(BOOLEAN), 0);

                if (iSendResult == SOCKET_ERROR)
                {
                    printf("send failed with error: %d\n", WSAGetLastError());
                    closesocket(clientSocket);
                    WSACleanup();
                    return 1;
                }
                printf("Bytes sent TO UI: %d\n", iSendResult);
                printf("Sending to UI: success=%d, message=%s\n", success, outBuf);

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

BOOLEAN HandleUIRequest(char* recvbuf, int recvbuflen, const char* username,char* outStrBuf, int outBufSize)
{
    if (recvbuflen == 0)
    {
		printf("Error: Received empty message from UI\n");
		return FALSE;
    }

	const unsigned int retquestType = recvbuf[0];
    printf("retquestType: %d\n", retquestType);
    switch (retquestType)
    {
    case UI_REQUEST_FILE_REGISTER:
        return HandleUIFileRegister((recvbuf+1), (recvbuflen-1), username);
    case UI_REQUEST_UPDATE_PERMISSIONS:
        return HandleUIUpdatePermissions((recvbuf + 1), (recvbuflen - 1), username);
    case UI_REQUEST_DELETE_FILE:
        return HandleUIDeleteFile((recvbuf + 1), (recvbuflen - 1), username);
    case UI_REQUEST_LOGIN:
        return HandleUILogin((recvbuf + 1), (recvbuflen - 1),outStrBuf, outBufSize);
    default:
        printf("Error: Invalid requrest type received from UI: %d\n", retquestType);
        return FALSE;
    }
}

BOOLEAN HandleUIFileRegister(char* recvbuf, int recvbuflen, const char* username)
{
    printf("=== %s ===\n", username);
    printf("Length: %d bytes\n", recvbuflen);

    // Hex dump
    printf("Hex: ");
    for (int i = 0; i < recvbuflen; ++i) {
        printf("%02X ", (unsigned char)recvbuf[i]);
        if ((i + 1) % 16 == 0) printf("\n");
    }
    printf("\n");

    // ASCII view
    printf("Printable: ");
    for (int i = 0; i < recvbuflen; ++i) {
        char c = recvbuf[i];
        if (isprint((unsigned char)c))
            putchar(c);
        else
            putchar('.');
    }
    printf("\n==========================\n");

    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    // JSON request body.
    char jsonData[MAX_JSON_DATA_SIZE] = { 0 };

    char* protectedFilePath = GetPathFromUI(recvbuf);

    uint8_t fileHash[HASH_SIZE * 2 + 1] = { 0 };
    if (ComputeFileSha256Hex(protectedFilePath, fileHash) != 0)
    {
        printf("HandleUIFileRegister: Failed computing the file hash for file path %s\n", protectedFilePath);
        
        // Free the allocated memory.
        free(protectedFilePath);
        return FALSE;
    }

    char* jsonAclString = ParseAccessControl(recvbuf);
    
    printf("recvbuf: %.*s\n", recvbuflen, recvbuf);

    char* token = GetTokenFromUI(recvbuf);             
    if (!token) {
        printf("Error: failed to extract token.\n");   
        free(jsonAclString);                          
        return FALSE;                                
    }

    printf("The extracted token: %s\n",token);

    // Format JSON payload.
    snprintf(jsonData, sizeof(jsonData),
        "{ \"owner\": \"%s\", \"fileName\": \"%s\", \"fileHash\":\"%.64s\",\"acl\":\%s\ }",
        username, protectedFilePath, fileHash, jsonAclString);

    // Open HTTP connection.
    if (!OpenHttpConnection(&hSession, &hConnect))
    {
        // Free the allocated memory.
        free(protectedFilePath);
        free(jsonAclString);
        free(token); 
        return FALSE;
    }

    // Open HTTP request (POST).
    hRequest = HttpOpenRequestA(hConnect, "POST", "/file", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) 
    {
        free(token); 
        printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);

        // Free the allocated memory.
        free(protectedFilePath);
        free(jsonAclString);
        return FALSE;
    }

    char headers[MAX_JSON_HEADERS_SIZE] = { 0 };
    snprintf(headers, sizeof(headers),
    "Host: %s:%d\r\n"
    "Content-Type: application/json\r\n"
    "Accept: */*\r\n"
    "Authorization: Bearer %s\r\n",
    DV_SERVER_IP, DV_SERVER_PORT, token);


    const DWORD headersLen = (DWORD)strnlen(headers, MAX_JSON_HEADERS_SIZE);
    const DWORD jsonLen = (DWORD)strnlen(jsonData, MAX_JSON_DATA_SIZE);

    free(token);

    // Send HTTP request with JSON data.
    if (!HttpSendRequestA(hRequest, headers, headersLen, jsonData, jsonLen))
    {
        printf("Error: HttpSendRequestA failed with %drr\n", GetLastError());
        CloseAllHandlers(&hRequest, &hConnect, &hSession);

        // Free the allocated memory.
        free(protectedFilePath);
        free(jsonAclString);
        return FALSE;
    }

    DWORD statusCode = 0;
    DWORD statusCodeSize = sizeof(statusCode);

    // Get the HTTP status code.
    if (!HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &statusCodeSize, NULL))
    {
        printf("HttpQueryInfoA failed with error for file registeration: %d\n", GetLastError());
        CloseAllHandlers(&hRequest, &hConnect, &hSession);

        // Free the allocated memory.
        free(protectedFilePath);
        free(jsonAclString);
        return FALSE;
    }

    printf("Server responded with HTTP status code for file registeration: %d\n", statusCode);

    // Cleanup
    CloseAllHandlers(&hRequest, &hConnect, &hSession);

    // Check if the file was registered successfully.
    // TODO: Deal with the case where the file was not registered becaue it already exists.
    if (statusCode != SUCESS)
    {
        if (statusCode == ALREADY_EXIST)
        {
            printf("HandleUIFileRegister: File already registered in the server\n");
        }
        else if (statusCode == FAILURE)
        {
            printf("HandleUIFileRegister: File cannot be registered by the current user - not an owner\n");
        }

        // Free the allocated memory.
        free(protectedFilePath);
        free(jsonAclString);
		return FALSE;
    }

    // Reduce one backslash from the file path - \\ -> \.
    ReduceBackslashes(protectedFilePath);

	// Save the file hash in the map.
    MapEntryValue entry;
	entry.fileHash = strdup(fileHash);
    MapSet(protectedFilePath, &entry);

    // Free the allocated memory.
    free(protectedFilePath);
    free(jsonAclString);
    return TRUE;
}

BOOLEAN HandleUIUpdatePermissions(char* recvbuf, int recvbuflen, const char* username){

    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    char* extractedPath = GetPathFromUI(recvbuf);
    char* jsonAcl = ParseAccessControl(recvbuf);

    
    char *fileId = ExtractFileIdFromFile(extractedPath); //change to file hash later
    
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

    char* token = GetTokenFromUI(recvbuf);             
    if (!token) {
        printf("Error: failed to extract token.\n");   
        return FALSE;                                
    }

    printf("The extracted token: %s\n",token);

    
    char* entry = strstr(aclCopy, "{\"username\":");
    while (entry) {
        char username[USERNAME_NAX_SIZE] = {0};
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
    
        char endpoint[ENDPOINT_MAX_SIZE];
        snprintf(endpoint, sizeof(endpoint), "/acl/%s/%s/%d", fileId, username, access);
        printf("Requesting endpoint: %s\n", endpoint);
    
        char body[MAX_UI_MESSAGE_SIZE];
        snprintf(body, sizeof(body), "{ \"access\": %d }", access);
        printf("Sending JSON body: %s\n", body);
    
        // Send request
        hRequest = HttpOpenRequestA(hConnect, "PUT", endpoint, NULL, NULL, NULL,
                                    INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
        if (!hRequest) {
            printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
            break;
        }
    
        char headers[HEADER_BUFFER_SIZE];
        snprintf(headers, sizeof(headers),
                 "Host: %s:%d\r\n"
                 "Content-Type: application/json\r\n"
                 "Accept: */*\r\n"
                 "Authorization: Bearer %s\r\n",
                 DV_SERVER_IP, DV_SERVER_PORT,token);
    
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
    free(token);

    return TRUE;
}

BOOLEAN HandleUIDeleteFile(char* recvbuf, int recvbuflen, const char* username) {

    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    char* extractedPath = GetPathFromUI(recvbuf);

    printf("Extracted file path: %s\n", extractedPath);
    if (!extractedPath) {
        printf("Error: Failed to extract file path.\n");
        return FALSE;
    }

    char *fileId = ExtractFileIdFromFile(extractedPath); //will be removed since we use hashes.

    if (!fileId) {
        printf("Error: Failed to extract file ID.\n");
        free(extractedPath);
        return FALSE;
    }

    char* token = GetTokenFromUI(recvbuf);             
    if (!token) {
        printf("Error: failed to extract token.\n");   
        return FALSE;                                
    }

    printf("The extracted token: %s\n",token);

    if (!OpenHttpConnection(&hSession, &hConnect)) {
        printf("Error: Failed to open HTTP connection.\n");
        free(extractedPath);
        free(token);
        return FALSE;
    }

    char endpoint[ENDPOINT_MAX_SIZE];
    snprintf(endpoint, sizeof(endpoint), "/acl/%s/%s", fileId, username);
    printf("Requesting DELETE endpoint: %s\n", endpoint);

    hRequest = HttpOpenRequestA(hConnect, "DELETE", endpoint, NULL, NULL, NULL,
                                INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) {
        printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
        CloseAllHandlers(&hRequest, &hConnect, &hSession);
        free(extractedPath);
        free(token);
        return FALSE;
    }
    

    char headers[HEADER_BUFFER_SIZE];
    snprintf(headers, sizeof(headers),
        "Host: %s:%d\r\n"
        "Accept: */*\r\n"
        "Authorization: Bearer %s\r\n",
        DV_SERVER_IP, DV_SERVER_PORT,token);

    if (!HttpSendRequestA(hRequest, headers, (DWORD)strlen(headers), NULL, 0)) {
        printf("Error: HttpSendRequestA failed with %d\n", GetLastError());
        InternetCloseHandle(hRequest);
        CloseAllHandlers(&hRequest, &hConnect, &hSession);
        free(extractedPath);
        return FALSE;
    }

    DWORD statusCode = 0;
    DWORD statusCodeSize = sizeof(statusCode);
    if (!HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER,
                        &statusCode, &statusCodeSize, NULL)) {
        printf("Error: HttpQueryInfoA failed with %d\n", GetLastError());
        InternetCloseHandle(hRequest);
        CloseAllHandlers(&hRequest, &hConnect, &hSession);
        free(extractedPath);
        return FALSE;
    }

    printf("Server responded with status code: %lu\n", statusCode);

    InternetCloseHandle(hRequest);
    CloseAllHandlers(&hRequest, &hConnect, &hSession);
    free(extractedPath);
    free(token);

    return (statusCode == 200 || statusCode == 204); 
}

BOOLEAN HandleUILogin(char* recvbuf, int recvbuflen, char* token, int tokenSize) {

    char username[USERNAME_NAX_SIZE] = {0};
    char password[PASSWORD_MAX_SIZE] = {0};
    char auth_token[TOKEN_SIZE] = {0};
    int i = 0, j = 0;

    while (i < recvbuflen && recvbuf[i] != '|' && i < sizeof(username) - 1) {
        username[i] = recvbuf[i];
        i++;
    }
    username[i] = '\0';

    if (recvbuf[i] != '|') {
        printf("Invalid login format\n");
        return FALSE;
    }
    i++;

    while (i < recvbuflen && j < sizeof(password) - 1) {
        password[j++] = recvbuf[i++];
    }
    password[j] = '\0';

    char body[MAX_UI_MESSAGE_SIZE];
    snprintf(body, sizeof(body), "{\"username\":\"%s\",\"password\":\"%s\"}", username, password);
    printf("Sending JSON: %s\n", body);

    HINTERNET hInternet = InternetOpenA("LoginTest", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) {
        printf("InternetOpen failed\n");
        return FALSE;
    }

    HINTERNET hConnect = InternetConnectA(hInternet, DV_SERVER_IP, 8080, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        printf("InternetConnect failed\n");
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    printf("InternetConnect succeeded\n");

    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", "/user/login", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) {
        printf("HttpOpenRequestA failed with %lu\n", GetLastError());
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    const char* headers = "Content-Type: application/json\r\n";


    const DWORD headersLen = (DWORD)strlen(headers);
    const DWORD jsonLen = (DWORD)strlen(body);

    BOOL sent = HttpSendRequestA(hRequest, headers, headersLen, (LPVOID)body, jsonLen);
    if (!sent) {
        printf("HttpSendRequestA failed with error: %lu\n", GetLastError());
        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    DWORD statusCode = 0;
    DWORD statusCodeSize = sizeof(statusCode);
    if (!HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &statusCodeSize, NULL)) {
        printf("HttpQueryInfoA failed: %lu\n", GetLastError());
    } else {
        printf("HTTP Status Code: %ld\n", statusCode);
    }

    char response[MAX_SERVER_RESPONSE] = {0};
    DWORD bytesRead = 0;
    if (InternetReadFile(hRequest, response, sizeof(response) - 1, &bytesRead)) {
        response[bytesRead] = '\0';
        printf("Response:\n%s\n", response);

        if (bytesRead > 0 && bytesRead < sizeof(auth_token)) {
        memcpy(auth_token, response, bytesRead);
        auth_token[bytesRead] = '\0';  
        printf("Auth token: %s\n", auth_token);
        snprintf(token, tokenSize, "%s", auth_token);
        } else {
        printf("Invalid token size or empty response.\n");
        }
            } else {
                printf("InternetReadFile failed\n");
            }

    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);

    return statusCode == 200;
}
