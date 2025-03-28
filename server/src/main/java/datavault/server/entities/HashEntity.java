package datavault.server.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.time.Instant;

@Entity
@Table(name = "hashes")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HashEntity {

    @Id
    private String hash;

    @ManyToOne
    private FileEntity file;

    @Column
    private Timestamp timestamp;

    @Column
    private Boolean original;

    public HashEntity(String hash, FileEntity fileEntity) {
        this.hash = hash;
        this.file = fileEntity;
        this.timestamp = Timestamp.from(Instant.now());
        this.original = false;
    }
}
