package com.watchtogether.server.ottAuth.components;

import org.springframework.stereotype.Component;

@Component
public interface OttAuthComponent {

    String verifyOttAccount(String id, String password);

}
