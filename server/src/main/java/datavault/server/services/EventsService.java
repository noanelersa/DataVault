package datavault.server.services;

import datavault.server.Repository.AclRepository;
import datavault.server.Repository.ActivityLogRepository;
import datavault.server.Repository.FileRepository;
import datavault.server.Repository.HashRepository;
import datavault.server.dto.EventDTO;
import datavault.server.entities.ActivityLogEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.HashEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import datavault.server.exceptions.AclViolationException;
import datavault.server.exceptions.NoSuchFileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
public class EventsService {
    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private HashRepository hashRepository;

    @Autowired
    private AclService aclService;

    @Autowired
    UsersService usersService;

    public void validateEvent(EventDTO event) throws AclViolationException {
        HashEntity hash = hashRepository.findByHash(event.fileHash());

        if (hash == null) {
            log.debug("Validation failed: File hash '{}' does not exist in the database.", event.fileHash());
            throw new NoSuchFileException();
        }

        UserEntity user = usersService.getUser(event.user().getUsername());

        aclService.checkViolation(hash.getFile(), user, event.action());

        log.info("Validation passed: File hash '{}' exists. Processing event...", event.fileHash());
    }
}




