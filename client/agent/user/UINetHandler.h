/*++

Module Name:

    UINethandler.h

Abstract:

    Header file which contains the structures, type definitions,
    constants, global variables and function prototypes for the
    network handler which will communicate with the UI.

Environment:

    User mode

--*/
#ifndef __UI_NET_HANDLER_H__
#define __UI_NET_HANDLER_H__

#include <windows.h>
#include <stdio.h>

#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "Ws2_32.lib")

#include "Utils.h"

#define DV_AGENT_PORT "2512"

#define MAX_UI_MESSAGE_SIZE 1024

// TODO: Remove when file hsahing is implemented.
#define TIME_BUFFER_SIZE 64

// UI request types
#define UI_REQUEST_FILE_REGISTER 1

typedef struct _AGENT_SERVER_CONTEXT {

	SOCKET* listenSocket;
    char* username;

} AGENT_SERVER_CONTEXT, * PAGENT_SERVER_CONTEXT;

BOOL
InitializeServer(
    SOCKET* listenSocket);

DWORD WINAPI 
ServerWorker(
    LPVOID lpParam);

BOOLEAN 
HandleUIRequest(
    char* recvbuf,
    int recvbuflen,
    const char* username);

BOOLEAN 
HandleUIFileRegister(
    char* recvbuf,
    int recvbuflen,
    const char* username);

#endif //  __UI_NET_HANDLER_H__
