package datavault.server.dto;

import java.util.List;

public record FileGetDTO(String fileId, String originalFileName, String originalFileHash, String uploadTime,
                         String owner, List<AclDTO> acl, List<AlertDTO> alerts) {
}
