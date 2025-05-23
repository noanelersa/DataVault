/*++

Copyright (c) 1999-2002  Microsoft Corporation

Module Name:

    scanUser.c

Abstract:

    This file contains the implementation for the main function of the
    user application piece of scanner.  This function is responsible for
    actually scanning file contents.

Environment:

    User mode

--*/

#include <windows.h>
#include <stdlib.h>
#include <stdio.h>
#include <winioctl.h>
#include <string.h>
#include <crtdbg.h>
#include <assert.h>
#include <fltuser.h>
#include "scanuk.h"
#include "scanuser.h"
#include <dontuse.h>

#include "Utils.h"
#include "ServerNetHandler.h"
#include "UINetHandler.h"
#include "DriverHandler.h"

//
//  Default and Maximum number of threads.
//

#define SCANNER_DEFAULT_REQUEST_COUNT       5
#define SCANNER_DEFAULT_THREAD_COUNT        2
#define SCANNER_MAX_THREAD_COUNT            64

//
//  Context passed to worker threads
//

typedef struct _SCANNER_THREAD_CONTEXT {

    HANDLE Port;
    HANDLE Completion;
	char* username;

} SCANNER_THREAD_CONTEXT, *PSCANNER_THREAD_CONTEXT;


VOID
Usage (
    VOID
    )
/*++

Routine Description

    Prints usage

Arguments

    None

Return Value

    None

--*/
{
    printf( "Usage: scanuser [requests per thread] [number of threads(1-64)]\n" );
}

// Function to send JSON data to the server
EAgentResponse CheckUserActionWithServer(const char* username, const char* fileHash, const unsigned char action)
{
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    // JSON request body.
    char jsonData[MAX_JSON_DATA_SIZE] = { 0 };

    // Format JSON payload.
    snprintf(jsonData, sizeof(jsonData),
        "{ \"user\": \"%s\", \"action\": \"%c\", \"fileHash\": \"%.64s\" }",
        username, (action+'0'), fileHash);

    // Open HTTP connection.
    if (!OpenHttpConnection(&hSession, &hConnect))
    {
        return FALSE;
    } 

    // Open HTTP request (POST).
    hRequest = HttpOpenRequestA(hConnect, "POST", "/events", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) {
        printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return FALSE;
    }

    char headers[MAX_JSON_HEADERS_SIZE] = { 0 };
    snprintf(headers, sizeof(headers),
        "Host: %s:%d\r\nContent-Type: application/json\r\nAccept: */*\r\n",
        DV_SERVER_IP, DV_SERVER_PORT);

	const DWORD headersLen = (DWORD)strnlen(headers, MAX_JSON_HEADERS_SIZE);
    const DWORD jsonLen = (DWORD)strnlen(jsonData, MAX_JSON_DATA_SIZE);

    // Send HTTP request with JSON data.
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
        printf("Server responded with HTTP status code: %d\n", statusCode);
    }

	// Cleanup hr handles.
	CloseAllHandlers(&hRequest, &hConnect, &hSession);

    EAgentResponse res = NOT_REGISTERED;
    if (statusCode == SUCESS)
    {
        res = ALLOWED;
    }
    else if (statusCode == FAILURE)
    {
        res = NOT_ALLOWED;
    }

    return res;
}

EAgentResponse UpdateFileHashWithServer(const char* username, const char* oldFileHash, const char* newFileHash)
{
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    // JSON request body.
    char jsonData[MAX_JSON_DATA_SIZE] = { 0 };

    // Format JSON payload.
    snprintf(jsonData, sizeof(jsonData),
        "{ \"username\": \"%s\", \"originalHash\": \"%.64s\", \"newHash\": \"%.64s\" }",
        username, oldFileHash, newFileHash);

    // Open HTTP connection.
    if (!OpenHttpConnection(&hSession, &hConnect))
    {
        return FALSE;
    }

    // Open HTTP request (POST).
    hRequest = HttpOpenRequestA(hConnect, "PUT", "/file", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) {
        printf("Error: HttpOpenRequestA failed with %d\n", GetLastError());
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return FALSE;
    }

    char headers[MAX_JSON_HEADERS_SIZE] = { 0 };
    snprintf(headers, sizeof(headers),
        "Host: %s:%d\r\nContent-Type: application/json\r\nAccept: */*\r\n",
        DV_SERVER_IP, DV_SERVER_PORT);

    const DWORD headersLen = (DWORD)strnlen(headers, MAX_JSON_HEADERS_SIZE);
    const DWORD jsonLen = (DWORD)strnlen(jsonData, MAX_JSON_DATA_SIZE);

    // Send HTTP request with JSON data.
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
        printf("Server responded with HTTP status code: %d\n", statusCode);
    }

    // Cleanup hr handles.
    CloseAllHandlers(&hRequest, &hConnect, &hSession);

    EAgentResponse res = NOT_REGISTERED;
    if (statusCode == SUCESS)
    {
        res = ALLOWED;
    }
    else if (statusCode == FAILURE)
    {
        res = NOT_ALLOWED;
    }

    return res;
}

DWORD
ScannerWorker(
    _In_ PSCANNER_THREAD_CONTEXT Context
    )
/*++

Routine Description

    This is a worker thread that


Arguments

    Context  - This thread context has a pointer to the port handle we use to send/receive messages,
                and a completion port handle that was already associated with the comm. port by the caller

Return Value

    HRESULT indicating the status of thread exit.

--*/
{
    PSCANNER_NOTIFICATION notification;
    SCANNER_REPLY_MESSAGE replyMessage;
    PSCANNER_MESSAGE message;
    LPOVERLAPPED pOvlp;
    UCHAR result;
    DWORD outSize;
    HRESULT hr;
    ULONG_PTR key;

#pragma warning(push)
#pragma warning(disable:4127) // conditional expression is constant

    while (TRUE) {

#pragma warning(pop)

        //
        //  Poll for messages from the filter component to scan.
        //
        result = GetQueuedCompletionStatus( Context->Completion, &outSize, &key, &pOvlp, INFINITE );

        //
        //  Obtain the message: note that the message we sent down via FltGetMessage() may NOT be
        //  the one dequeued off the completion queue: this is solely because there are multiple
        //  threads per single port handle. Any of the FilterGetMessage() issued messages can be
        //  completed in random order - and we will just dequeue a random one.
        //

        message = CONTAINING_RECORD( pOvlp, SCANNER_MESSAGE, Ovlp );

        if (result == 0) {

            //
            //  An error occured.
            //
            hr = HRESULT_FROM_WIN32( GetLastError() );
            break;
        }

        // printf("Received message, size %Id\n", pOvlp->InternalHigh);

        notification = &message->Notification;

        const char* ntPath = Utf16ToUtf8(notification->FilePath);

		// TODO: Make it dynamic - we usually us C:\<path> format, but it can change.
        char filePath[AGENT_FILE_NAME_SIZE] = { 0 };
		filePath[0] = 'C'; // Ensure the first character is 'C'.
		filePath[1] = ':'; // Ensure the second character is ':'

        // Copy the NT path after "C:"
        strcpy(filePath + 2, ntPath + 23);

        const unsigned char requestedAction = notification->Action;

        uint8_t currentFileHash[HASH_SIZE * 2 + 1] = { 0 };

        if (requestedAction == READ || requestedAction == WRITE)
        {
            if (MapGet(filePath) != NULL)
            {
                memcpy(currentFileHash, MapGet(filePath)->fileHash, HASH_SIZE * 2);
            }
            else
            {
                if (ComputeFileSha256Hex(filePath, currentFileHash) != 0) {
                    printf("ScannerWorker: Failed computing the file hash for file path %s\n", filePath);
                    break;
                }
            }

            result = CheckUserActionWithServer(Context->username, currentFileHash, requestedAction);

            if (result == ALLOWED)
            {
                printf("ScannerWorker: Allowed action %d for file %s\n", requestedAction, filePath);
                
                // File hashed allowed, but the file path isn't present in the map,
				// meanining the file was copied or moved(not in the original registered path).
                // TODO: In the future, deal with it - now just add the new path to the map - you
                // will need to search by value and find the same hash and then erase the old key(filePath).
                if (MapGet(filePath) == NULL)
                {
                    MapEntryValue entry;
                    entry.fileHash = strdup(currentFileHash);
                    MapSet(filePath, &entry);
				}
            }
            else if (result == NOT_ALLOWED)
            {
                printf("ScannerWorker: NOT Allowed action %d for file %s\n", requestedAction, filePath);
            }
        }
        else if (requestedAction == UPDATE_HASH)
        {
			MapEntryValue* entryValue = MapGet(filePath);
            if (entryValue != NULL)
            {
                if (ComputeFileSha256Hex(filePath, currentFileHash) != 0) {
                    printf("ScannerWorker: Failed computing the file hash for file path %s\n", filePath);
                    break;
                }

                // printf("ScannerWorker: old file hash %.32s and new one %.32s\n", entryValue->fileHash, currentFileHash);

                result = UpdateFileHashWithServer(Context->username, entryValue->fileHash, currentFileHash);
                if (result == ALLOWED)
                {
                    MapEntryValue entry;
                    entry.fileHash = strdup(currentFileHash);

                    // Update the file hash in the map.
                    MapSet(filePath, &entry);
                }
            }
            else
            {
                printf("ScannerWorker: cleanup for unregistered file in path %s\n", filePath);
                result = NOT_REGISTERED;
            }
        }
        else
        {
			// Unknown action requested.
            printf("ScannerWorker: Unknown action requested %d\n", requestedAction);
            result = NOT_ALLOWED;
        }

		// Free the allocated memory for the NT path once done using it.
        free(ntPath);

        replyMessage.ReplyHeader.Status = 0;
        replyMessage.ReplyHeader.MessageId = message->MessageHeader.MessageId;

        replyMessage.Reply.AllowAction = result;
        
        if (requestedAction == UPDATE_HASH)
            printf("Replying message, SafeToOpen: %d\n", replyMessage.Reply.AllowAction);

        hr = FilterReplyMessage( Context->Port,
                                 (PFILTER_REPLY_HEADER) &replyMessage,
                                 sizeof( replyMessage ) );

        if (SUCCEEDED( hr )) {

            // printf( "Replied message\n" );

        } else {

            printf( "Scanner: Error replying message. Error = 0x%X\n", hr );
            break;
        }

        memset( &message->Ovlp, 0, sizeof( OVERLAPPED ) );

        hr = FilterGetMessage( Context->Port,
                               &message->MessageHeader,
                               FIELD_OFFSET( SCANNER_MESSAGE, Ovlp ),
                               &message->Ovlp );

        if (hr != HRESULT_FROM_WIN32( ERROR_IO_PENDING )) {
            printf("Scanner: Error 0x%x", ERROR_IO_PENDING);
            break;
        }
    }

    if (!SUCCEEDED( hr )) {

        if (hr == HRESULT_FROM_WIN32( ERROR_INVALID_HANDLE )) {

            //
            //  Scanner port disconncted.
            //

            printf( "Scanner: Port is disconnected, probably due to scanner filter unloading.\n" );

        } else {

            printf( "Scanner: Unknown error occured. Error = 0x%X\n", hr );
        }
    }

    return hr;
}


int _cdecl
main (
    _In_ int argc,
    _In_reads_(argc) char *argv[]
    )
{
    DWORD requestCount = SCANNER_DEFAULT_REQUEST_COUNT;
    DWORD threadCount = SCANNER_DEFAULT_THREAD_COUNT;
    HANDLE threads[SCANNER_MAX_THREAD_COUNT] = { NULL };
    SCANNER_THREAD_CONTEXT context;
    HANDLE port, completion;
    PSCANNER_MESSAGE messages;
    DWORD threadId;
    HRESULT hr;
	AGENT_SERVER_CONTEXT agentServerContext;

    SOCKET listenSocket = INVALID_SOCKET;
    HANDLE serverThread;

    //
    //  Check how many threads and per thread requests are desired.
    //

    if (argc > 1)
    {

        requestCount = atoi( argv[1] );

        if (requestCount <= 0) {

            Usage();
            return 1;
        }

        if (argc > 2)
        {

            threadCount = atoi( argv[2] );
        }

        if (threadCount <= 0 || threadCount > 64)
        {

            Usage();
            return 1;
        }
    }

    // Get the system username.
    char username[USERNAME_NAX_SIZE] = { 0 };
    BOOLEAN retGetUser = GetSystemUser(username, sizeof(username));
    if (!retGetUser)
    {
        printf("Error: Getting the systen username failed\n");
        return 1;
    }

    // Hash the username with FNV-1a.
    char hashedUsername[FNV_HASH_STR_LEN] = { 0 };
    Fnv1aHashString(username, hashedUsername);

	// Initialize the agent listener.
    if (!InitializeServer(&listenSocket))
    {
        return 1;
    }

	agentServerContext.listenSocket = &listenSocket;
	agentServerContext.username = hashedUsername;

    // Create a thread to handle client connections.
    serverThread = CreateThread(NULL, 0, ServerWorker, &agentServerContext, 0, &threadId);
    if (serverThread == NULL)
    {
        printf("ERROR: Couldn't create server thread: %d\n", GetLastError());
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }

    //
    //  Open a commuication channel to the filter
    //

    printf( "Scanner: Connecting to the filter ...\n" );

    hr = FilterConnectCommunicationPort( ScannerPortName,
                                         0,
                                         NULL,
                                         0,
                                         NULL,
                                         &port );

    if (IS_ERROR( hr )) {

        printf( "ERROR: Connecting to filter port: 0x%08x\n", hr );
        return 2;
    }

    //
    //  Create a completion port to associate with this handle.
    //

    completion = CreateIoCompletionPort( port,
                                         NULL,
                                         0,
                                         threadCount );

    if (completion == NULL) {

        printf( "ERROR: Creating completion port: %d\n", GetLastError() );
        CloseHandle( port );
        return 3;
    }

    printf( "Scanner: Port = 0x%p Completion = 0x%p\n", port, completion );

    context.Port = port;
    context.Completion = completion;
	context.username = hashedUsername;

    //
    //  Allocate messages.
    //

    messages = calloc(((size_t) threadCount) * requestCount, sizeof(SCANNER_MESSAGE));

    if (messages == NULL) {

        hr = ERROR_NOT_ENOUGH_MEMORY;
        goto main_cleanup;
    }
    
    //
    //  Create specified number of threads.
    //

    for (DWORD i = 0; i < threadCount; i++) {
        
        threads[i] = CreateThread( NULL,
                                   0,
                                   (LPTHREAD_START_ROUTINE) ScannerWorker,
                                   &context,
                                   0,
                                   &threadId );

        if (threads[i] == NULL) {

            //
            //  Couldn't create thread.
            //

            hr = GetLastError();
            printf( "ERROR: Couldn't create thread: %d\n", hr );
            goto main_cleanup;
        }

        for (DWORD j = 0; j < requestCount; j++) {
        
            PSCANNER_MESSAGE msg = &(messages[i * requestCount + j]);

            memset( &msg->Ovlp, 0, sizeof( OVERLAPPED ) );

            //
            //  Request messages from the filter driver.
            //

            hr = FilterGetMessage( port,
                                   &msg->MessageHeader,
                                   FIELD_OFFSET( SCANNER_MESSAGE, Ovlp ),
                                   &msg->Ovlp );

            if (hr != HRESULT_FROM_WIN32( ERROR_IO_PENDING )) {
                goto main_cleanup;
            }
        }
    }

    hr = S_OK;
    
main_cleanup:

    // WaitForSingleObject(serverThread, INFINITE);

    for (INT i = 0; threads[i] != NULL; ++i) {
        WaitForSingleObjectEx(threads[i], INFINITE, FALSE);
    }

    printf( "Scanner:  All done. Result = 0x%08x\n", hr );

    closesocket( listenSocket );
    WSACleanup();

    CloseHandle( port );
    CloseHandle( completion );

    free(messages);

    MapCleanup();

    return hr;
}

