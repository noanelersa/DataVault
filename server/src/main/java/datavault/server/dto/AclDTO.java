package datavault.server.dto;

import datavault.server.enums.Action;

public record AclDTO(String username, Action access) {
}
