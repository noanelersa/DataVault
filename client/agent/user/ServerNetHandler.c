#include "ServerNetHandler.h"

BOOL OpenHttpConnection(HINTERNET* hSession, HINTERNET* hConnect)
{
    // Initialize WinINet session.
    *hSession = InternetOpenA(DV_AGENT_NAME, INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!(*hSession))
    {
        printf("Error: InternetOpenA failed with %d\n", GetLastError());
        return FALSE;
    }

    // Open HTTP connection.
    *hConnect = InternetConnectA(hSession, DV_SERVER_IP, DV_SERVER_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!(*hConnect))
    {
        printf("Error: InternetConnectA failed with %d\n", GetLastError());
        InternetCloseHandle(*hSession);
        return FALSE;
    }

    return TRUE;
}

VOID CloseAllHandlers(HINTERNET* hRequest, HINTERNET* hConnect, HINTERNET* hSession)
{
    if (*hRequest) {
        InternetCloseHandle(*hRequest);
        *hRequest = NULL;
    }
    if (*hConnect) {
        InternetCloseHandle(*hConnect);
        *hConnect = NULL;
    }
    if (*hSession) {
        InternetCloseHandle(*hSession);
        *hSession = NULL;
    }
}