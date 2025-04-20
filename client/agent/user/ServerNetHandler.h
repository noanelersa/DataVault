/*++

Module Name:

    Nethandler.h

Abstract:

    Header file which contains the structures, type definitions,
    constants, global variables and function prototypes for the
    network handler which will communicate with the server.

Environment:

    User mode

--*/
#ifndef __NET_HANDLER_H__
#define __NET_HANDLER_H__

#include <windows.h>
#include <stdio.h>

#include <wininet.h>
#pragma comment(lib, "wininet.lib")

#define DV_AGENT_NAME "DataVaultAgent"

// TODO: Should be replaced with dynamic server ip (as CLI parameter)
#define DV_SERVER_IP "192.168.71.1"

#define DV_SERVER_PORT 8080

#define ALLOW_ACCESS_CODE 200
#define DENY_ACCESS_CODE 403

BOOL
OpenHttpConnection(
    HINTERNET* hRequest,
    HINTERNET* hConnect);

VOID
CloseAllHandlers(
	HINTERNET* hRequest,
	HINTERNET* hConnect,
	HINTERNET* hSession);

#endif //  __NET_HANDLER_H__
