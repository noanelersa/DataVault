package datavault.server.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
