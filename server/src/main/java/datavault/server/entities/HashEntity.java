package datavault.server.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
