#include "UINetHandler.h"

BOOL InitializeServer(SOCKET* listenSocket)
{
    WSADATA wsaData;
    int iResult = 0;
    struct addrinfo* result = NULL, hints;

    // Initialize Winsock
    iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        printf("WSAStartup failed with error: %d\n", iResult);
        return FALSE;
    }

    ZeroMemory(&hints, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;
    hints.ai_flags = AI_PASSIVE;

    // Resolve the server address and port
    iResult = getaddrinfo(NULL, "2512", &hints, &result);
    if (iResult != 0) {
        printf("getaddrinfo failed with error: %d\n", iResult);
        WSACleanup();
        return FALSE;
    }

    // Create a SOCKET for the server to listen for client connections
    *listenSocket = socket(result->ai_family, result->ai_socktype, result->ai_protocol);
    if (*listenSocket == INVALID_SOCKET) {
        printf("socket failed with error: %ld\n", WSAGetLastError());
        freeaddrinfo(result);
        WSACleanup();
        return FALSE;
    }

    // Setup the TCP listening socket
    iResult = bind(*listenSocket, result->ai_addr, (int)result->ai_addrlen);
    if (iResult == SOCKET_ERROR) {
        printf("bind failed with error: %d\n", WSAGetLastError());
        freeaddrinfo(result);
        closesocket(*listenSocket);
        WSACleanup();
        return FALSE;
    }

    freeaddrinfo(result);

    iResult = listen(*listenSocket, SOMAXCONN);
    if (iResult == SOCKET_ERROR) {
        printf("listen failed with error: %d\n", WSAGetLastError());
        closesocket(*listenSocket);
        WSACleanup();
        return FALSE;
    }

    return TRUE;
}

DWORD WINAPI ServerWorker(LPVOID lpParam)
{
    SOCKET listenSocket = *(SOCKET*)lpParam;
    SOCKET clientSocket;
    char recvbuf[512] = { 0 };
    int iResult = 0, iSendResult = 0;
    int recvbuflen = 512;

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
            iResult = recv(clientSocket, recvbuf, recvbuflen, 0);
            if (iResult > 0)
            {
                printf("Bytes received: %d\n", iResult);

                // Echo the buffer back to the sender.
                iSendResult = send(clientSocket, recvbuf, iResult, 0);
                if (iSendResult == SOCKET_ERROR)
                {
                    printf("send failed with error: %d\n", WSAGetLastError());
                    closesocket(clientSocket);
                    WSACleanup();
                    return 1;
                }
                printf("Bytes sent: %d\n", iSendResult);
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
        if (iResult == SOCKET_ERROR) {
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
