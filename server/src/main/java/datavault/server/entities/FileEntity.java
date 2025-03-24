package datavault.server.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "files")  // Matches the "files" table in your PostgreSQL DB
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Auto-increment primary key

    @Column(unique = true, nullable = false)
    private String fileId;  // Unique business identifier for the file (could be UUID)

    @Column(nullable = false)
    private String hash;  // Hash of the file for integrity check (e.g., SHA-256)

    @Column(nullable = false)
    private String fileName;  // Name of the file stored/displayed


    public FileEntity() {}

    public FileEntity(String fileId, String hash, String fileName) {
        this.fileId = fileId;
        this.hash = hash;
        this.fileName = fileName;
    }

    public Long getId() {
        return id;
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
