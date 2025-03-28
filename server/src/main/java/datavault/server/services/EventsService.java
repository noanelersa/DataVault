package datavault.server.services;

import datavault.server.Repository.AclRepository;
import datavault.server.Repository.ActivityLogRepository;
import datavault.server.Repository.FileRepository;
import datavault.server.dto.EventDTO;
import datavault.server.entities.ActivityLogEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import datavault.server.exceptions.AclViolationException;
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
    private AclService aclService;

    @Autowired
    UsersService usersService;

    public void validateEvent(EventDTO event) throws AclViolationException {
        Optional<FileEntity> file = fileRepository.findByFileId(event.fileID());

        if (file.isEmpty()) {
            log.warn("Validation failed: File ID '{}' does not exist in the database.", event.fileID());
            throw new AclViolationException(event);
        }

        UserEntity user = usersService.getUser(event.user().getUsername());

        aclService.checkViolation(file.get(), user, event.action());

        log.info("Validation passed: File ID '{}' exists. Processing event...", event.fileID());
    }
}




