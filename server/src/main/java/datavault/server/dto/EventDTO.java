package datavault.server.dto;

import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;

/**
 * A record to capture the data of an event that will be published to the server
 * @param user The user committing the action on the file
 * @param action The action that had been made on the file
 * @param fileID The ID of the file that the event was published for
 */
public record EventDTO(UserEntity user, Action action, String fileID) {}
