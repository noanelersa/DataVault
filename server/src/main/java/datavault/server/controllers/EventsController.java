package datavault.server.controllers;

import datavault.server.dto.EventDTO;
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
        log.info("Event was captured, {} tried to {} file with hash: '{}'",
                event.user(),
                event.action().name().toLowerCase(),
                event.fileHash());

        eventsService.validateEvent(event);
        return ResponseEntity.ok().build();
    }
}
