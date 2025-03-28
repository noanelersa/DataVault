package datavault.server.services;

import datavault.server.Repository.ActivityLogRepository;
import datavault.server.Repository.AclRepository;
import datavault.server.Repository.FileRepository;
import datavault.server.dto.EventDTO;
import datavault.server.entities.ActivityLogEntity;
import datavault.server.entities.AclEntity;
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
    private final FileRepository fileRepository;

    public EventsService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public void validateEvent(EventDTO event) throws AclViolationException {
        Optional<FileEntity> file = fileRepository.findByFileId(event.fileID());

        if (file.isEmpty()) {
            log.warn("Validation failed: File ID '{}' does not exist in the database.", event.fileID());
            throw new AclViolationException(event);
        }

        log.info("Validation passed: File ID '{}' exists. Processing event...", event.fileID());
    }
    public void handleFileAction(UserEntity user, FileEntity file, Action action) {
        Action permission = getUserPermissionForFile(user, file);

        if (permission == null) {
            throw new AclViolationException("You do not have any access to this file.");
        }

        switch (action) {
            case READ:
                if (!permission.equals("read") && !permission.equals("write") && !permission.equals("manage")) {
                    throw new AclViolationException("You do not have permission to read this file.");
                }
                break;

            case WRITE:
                if (!permission.equals("write") && !permission.equals("manage")) {
                    throw new AclViolationException("You do not have permission to write to this file.");
                }
                break;

            case DELETE:
                if (!permission.equals("manage")) {
                    throw new AclViolationException("You do not have permission to delete this file.");
                }
                break;

            case SCREENSHOT:
                if (!permission.equals("read") && !permission.equals("write") && !permission.equals("manage")) {
                    throw new AclViolationException("You do not have permission to take a screenshot of this file.");
                }
                break;

            case MANAGE:
                if (!permission.equals("manage")) {
                    throw new AclViolationException("You do not have permission to manage this file.");
                }
                break;

            default:
                throw new IllegalArgumentException("Unsupported action: " + action);
        }

        //  the user is authorized
        logAction(user, file, action);
    }
    @Autowired
    private ActivityLogRepository activityLogRepository;


    private void logAction(UserEntity user, FileEntity file, Action action) {
        // 1️⃣ Print to logs using Lombok's log (from @Slf4j)
        log.info("User '{}' performed '{}' action on file '{}'",
                user.getUsername(), action, file.getFileName());

        // 2️⃣ Create a new ActivityLogEntity for the database
        ActivityLogEntity logEntry = new ActivityLogEntity();
        logEntry.setUser(user);
        logEntry.setFile(file);
        logEntry.setAction(action.toString()); // Assuming action is enum, convert to String
        logEntry.setTime(new java.sql.Timestamp(System.currentTimeMillis()));

        // 3️⃣ Save the log entry in the activity_log table
        activityLogRepository.save(logEntry);
    }


    @Autowired
    private AclRepository aclRepository;


    private Action getUserPermissionForFile(UserEntity user, FileEntity file) {
        Optional<AclEntity> aclEntry = aclRepository.findByUserAndFile(user, file);

        if (aclEntry.isPresent()) {
            return aclEntry.get().getAccessLevel();  // Assuming permission is a String like "read", "write"
        }
        else {
            return null;  // No permission found
        }
    }

}




