package datavault.server.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "files")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Auto-increment primary key

    @Column(unique = true, nullable = false)
    private String fileId;  // Unique business identifier for the file (could be UUID)

    @Column(nullable = false)
    private String fileName;  // Name of the file stored/displayed

    @ManyToOne
    private UserEntity owner;
}
