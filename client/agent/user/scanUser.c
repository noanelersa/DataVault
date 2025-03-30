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

#include "NetHandler.h"
#include "Utils.h"

//
//  Default and Maximum number of threads.
//

#define SCANNER_DEFAULT_REQUEST_COUNT       5
#define SCANNER_DEFAULT_THREAD_COUNT        2
#define SCANNER_MAX_THREAD_COUNT            64

// TODO: Remove later.
UCHAR FoulString[] = "DataVaultIsBad";

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

    printf( "Connects to the scanner filter and scans buffers \n" );
    printf( "Usage: scanuser [requests per thread] [number of threads(1-64)]\n" );
}

// Function to send JSON data to the server
BOOL ScanBufferWithServer(const char* username)
{
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;

    // JSON request body
    char jsonData[512] = { 0 };

	// TODO: Make these dynamic.
    LPCSTR action = "1";
    LPCSTR fileID = "123";

    // Format JSON payload.
    snprintf(jsonData, sizeof(jsonData),
        "{ \"user\": \"%s\", \"action\": \"%s\", \"fileID\": \"%s\" }",
        username, action, fileID);

    // Open HTTP connection
    if (!OpenHttpConnection(hSession, hConnect))
    {
        return FALSE;
    } 

    // Open HTTP request (POST)
    hRequest = HttpOpenRequestA(hConnect, "POST", "/events", NULL, NULL, NULL,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hRequest) {
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
    if (HttpQueryInfoA(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &statusCodeSize, NULL))
    {
        printf("Server responded with HTTP status code: %d\n", statusCode);
    }
    else
    {
        printf("HttpQueryInfoA failed with error: %d\n", GetLastError());
    }

    // Cleanup
	CloseAllHandlers(&hRequest, &hConnect, &hSession);

    // If true, allow access to file.
    return (statusCode == ALLOW_ACCESS_CODE);
}

BOOL
ScanBuffer (
    _In_reads_bytes_(BufferSize) PUCHAR Buffer,
    _In_ ULONG BufferSize
    )
/*++

Routine Description

    Scans the supplied buffer for an instance of FoulString.

    Note: Pattern matching algorithm used here is just for illustration purposes,
    there are many better algorithms available for real world filters

Arguments

    Buffer      -   Pointer to buffer
    BufferSize  -   Size of passed in buffer

Return Value

    TRUE        -    Found an occurrence of the appropriate FoulString
    FALSE       -    Buffer is ok

--*/
{
    PUCHAR p;
    ULONG searchStringLength = sizeof(FoulString) - sizeof(UCHAR);

    for (p = Buffer;
         p <= (Buffer + BufferSize - searchStringLength);
         p++) {

        if (RtlEqualMemory( p, FoulString, searchStringLength )) {

            printf( "Found a string\n" );

            //
            //  Once we find our search string, we're not interested in seeing
            //  whether it appears again.
            //

            return TRUE;
        }
    }

    return FALSE;
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
    BOOL result;
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

        if (!result) {

            //
            //  An error occured.
            //

            hr = HRESULT_FROM_WIN32( GetLastError() );
            break;
        }

        printf( "Received message, size %Id\n", pOvlp->InternalHigh );

        notification = &message->Notification;

        assert(notification->BytesToScan <= SCANNER_READ_BUFFER_SIZE);
        _Analysis_assume_(notification->BytesToScan <= SCANNER_READ_BUFFER_SIZE);

		// TODO: Uncomment this later. ignore server when testing.
		//result = ScanBufferWithServer(Context->username);
        printf("Magic is : %.4s\n", notification->Magic);
        printf("FileId is : %.36s\n", notification->FileId);
		result = TRUE;
        replyMessage.ReplyHeader.Status = 0;
        replyMessage.ReplyHeader.MessageId = message->MessageHeader.MessageId;

        replyMessage.Reply.SafeToOpen = result;

        printf( "Replying message, SafeToOpen: %d\n", replyMessage.Reply.SafeToOpen );

        hr = FilterReplyMessage( Context->Port,
                                 (PFILTER_REPLY_HEADER) &replyMessage,
                                 sizeof( replyMessage ) );

        if (SUCCEEDED( hr )) {

            printf( "Replied message\n" );

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

    //
    //  Check how many threads and per thread requests are desired.
    //

    if (argc > 1) {

        requestCount = atoi( argv[1] );

        if (requestCount <= 0) {

            Usage();
            return 1;
        }

        if (argc > 2) {

            threadCount = atoi( argv[2] );
        }

        if (threadCount <= 0 || threadCount > 64) {

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

    for (INT i = 0; threads[i] != NULL; ++i) {
        WaitForSingleObjectEx(threads[i], INFINITE, FALSE);
    }
    
    printf( "Scanner:  All done. Result = 0x%08x\n", hr );

    CloseHandle( port );
    CloseHandle( completion );

    free(messages);

    return hr;
}

