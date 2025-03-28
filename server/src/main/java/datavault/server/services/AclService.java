package datavault.server.services;

import datavault.server.Repository.AclRepository;
import datavault.server.dto.AclDTO;
import datavault.server.entities.AclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AclService {

    @Autowired
    AclRepository aclRepository;

    @Autowired
    UsersService usersService;

    public void newAcl(FileEntity file, List<AclDTO> aclList) {
        List<AclEntity> entities = new ArrayList<>();
        for ( AclDTO aclDTO: aclList) {
            UserEntity user = usersService.getUser(aclDTO.username());
            AclEntity acl = new AclEntity(file, user, aclDTO.access());
            entities.add(acl);
        }

        aclRepository.saveAllAndFlush(entities);
    }
}
