package datavault.server.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@Slf4j
@ControllerAdvice
public class ExceptionsHandler {

    @ExceptionHandler(AclViolationException.class)
    public ResponseEntity<Object> handleAclViolation(AclViolationException ex) {
        log.warn(ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @ExceptionHandler(FileAlreadyExistsException.class)
    public ResponseEntity<Object> handleDuplicateFile(FileAlreadyExistsException ex) {
        log.warn(ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

}

