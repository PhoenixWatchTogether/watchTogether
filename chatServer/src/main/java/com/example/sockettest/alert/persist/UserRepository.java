package com.example.sockettest.alert.persist;

import com.example.sockettest.alert.persist.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    boolean existsByNickname(String nickname);

    Optional<User> findByEmailAndNickname(String email, String nickname);

    Optional<User> findByResetPasswordKey(String code);

    //추가한 부분
    Optional<User> findByNickname(String nickname);

    List<User> findAllByNicknameIn(List<String> nicknames);
}
