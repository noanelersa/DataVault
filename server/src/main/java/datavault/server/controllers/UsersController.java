package datavault.server.controllers;

import datavault.server.dto.LoginDTO;
import datavault.server.services.JwtService;
import datavault.server.services.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("user")
public class UsersController {
    @Autowired
    LoginService loginService;

    @Autowired
    JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody LoginDTO loginDTO) {
        Boolean isAuthenticated = loginService.validateCradentials(loginDTO);

        if (isAuthenticated) {
            String token = jwtService.generateToken(loginDTO.username());
            return ResponseEntity.ok(token);
        } else {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }
}
