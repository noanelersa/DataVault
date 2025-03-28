package datavault.server.services;

import datavault.server.Repository.UserRepository;
import datavault.server.entities.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsersService {

    @Autowired
    private UserRepository userRepository;

    public UserEntity getUser(String username) {
        UserEntity user = userRepository.findByUsername(username);

        if (user == null) {
            return createUser(username);
        }

        return user;
    }

    private UserEntity createUser(String username) {
        UserEntity user = new UserEntity(username);

        return userRepository.save(user);
    }
}
