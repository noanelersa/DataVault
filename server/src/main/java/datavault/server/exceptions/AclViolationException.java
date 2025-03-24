package datavault.server.exceptions;

import datavault.server.dto.EventDTO;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import static java.lang.String.format;

@ResponseStatus(value = HttpStatus.FORBIDDEN)
public class AclViolationException extends RuntimeException {

    public AclViolationException(EventDTO event) {
        super(format("%s violated the ACL by performing action %s on file with id: '%s'",
                event.user(), event.action(), event.fileID()));
    }

    public AclViolationException(String message) {
        super(message);
    }
}
