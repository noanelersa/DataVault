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

#define DV_AGENT_PORT 2512

BOOL
InitializeServer(
    SOCKET* listenSocket);

DWORD WINAPI 
ServerWorker(
    LPVOID lpParam);

#endif //  __UI_NET_HANDLER_H__
