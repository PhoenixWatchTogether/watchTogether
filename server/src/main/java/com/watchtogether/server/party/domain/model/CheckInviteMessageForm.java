package com.watchtogether.server.party.domain.model;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInviteMessageForm {

    private String nickname;
    private Long partyId;
}
