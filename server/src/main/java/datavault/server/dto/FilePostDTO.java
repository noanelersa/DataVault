package datavault.server.dto;

import java.util.List;

public record FilePostDTO(String owner, String fileName, String fileHash, List<AclDTO> acl) {
}
