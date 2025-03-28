package datavault.server.controllers;

import datavault.server.dto.EventDTO;
import datavault.server.exceptions.AclViolationException;
import datavault.server.services.EventsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/events")
@Slf4j
public class EventsController {
    @Autowired
    EventsService eventsService;

    @PostMapping
    public ResponseEntity<?> newEvent(@RequestBody EventDTO event) {
        log.info("Event was captured, {} tried to {} file with id: '{}'",
                event.user(),
                event.action().name().toLowerCase(),
                event.fileID());

        try {
            eventsService.validateEvent(event);
            return ResponseEntity.ok().body("Event validated successfully!");
        } catch (AclViolationException e) {
            log.warn("Unauthorized access attempt by user {} on file {}",
                    event.user(), event.fileID());
            return ResponseEntity.status(403).body("You do not have permission to perform this action.");
        /*} catch (FileAlreadyExistsException e) {
            log.warn("Duplicate file attempt by user {} on file {}",
                    event.user(), event.fileID());
            return ResponseEntity.status(409).body("File already exists.");*/
        } catch (Exception e) {
            log.error("Unexpected error occurred: {}", e.getMessage());
            return ResponseEntity.status(500).body("Internal Server Error");
        }
    }


}
