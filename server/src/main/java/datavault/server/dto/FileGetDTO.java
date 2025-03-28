package datavault.server.dto;

public record FileGetDTO(String fileId, String originalFileName, String originalFileHash, String uploadTime,
                         String owner) {
}
