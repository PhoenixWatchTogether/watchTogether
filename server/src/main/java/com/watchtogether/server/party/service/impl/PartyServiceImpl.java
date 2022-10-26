package com.watchtogether.server.party.service.impl;

import com.watchtogether.server.exception.PartyException;
import com.watchtogether.server.exception.UserException;
import com.watchtogether.server.exception.type.PartyErrorCode;
import com.watchtogether.server.party.domain.entitiy.InviteParty;
import com.watchtogether.server.party.domain.entitiy.Party;
import com.watchtogether.server.party.domain.entitiy.PartyMember;
import com.watchtogether.server.party.domain.model.AcceptPartyForm;
import com.watchtogether.server.party.domain.model.CreatePartyForm;
import com.watchtogether.server.party.domain.model.InvitePartyForm;
import com.watchtogether.server.party.domain.repository.InvitePartyRepository;
import com.watchtogether.server.party.domain.repository.PartyMemberRepository;
import com.watchtogether.server.party.domain.repository.PartyRepository;
import com.watchtogether.server.party.service.PartyService;
import com.watchtogether.server.users.domain.entitiy.User;
import com.watchtogether.server.users.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.watchtogether.server.exception.type.UserErrorCode.NOT_FOUND_USER;

@Service
@RequiredArgsConstructor
public class PartyServiceImpl implements PartyService {

    private final PartyRepository partyRepository;
    private final InvitePartyRepository invitePartyRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final UserRepository userRepository;
    private final EntityManagerFactory emf;
    private final EntityManager em;

    // 파티장이 파티 생성 클릭
    public Party createParty(CreatePartyForm form) {
        Party party = Party.from(form);
        if (form.getReceiversNickName() != null) {
            String[] receiverNickName = form.getReceiversNickName().split(",");
            InvitePartyForm leaderForm = InvitePartyForm.builder()
                    .receiverNickName(form.getLeaderNickName())
                    .party(party)
                    .build();
            invitePartyRepository.save(InviteParty.leaderFrom(leaderForm));

            for (String s : receiverNickName) {
                InvitePartyForm invitePartyForm = InvitePartyForm.builder()
                        .receiverNickName(s)
                        .party(party)
                        .build();
                invitePartyRepository.save(InviteParty.from(invitePartyForm));
            }
        }
        return partyRepository.save(party);
    }

    //파티 초대링크 눌렀을때
    public ResponseEntity<Object> acceptParty(AcceptPartyForm form) {
        addMember(form);
        addPartyMember(form);
        return ResponseEntity.ok().build();
    }

    @Transactional
    public Party addMember(AcceptPartyForm form) {

        InviteParty inviteParty = findUser(form);
        Optional<Party> optionalParty = partyRepository.findById(inviteParty.getParty().getId());
        if (optionalParty.isPresent()) {
            inviteParty.setAccept(true);
            Party party = optionalParty.get();

            party.setPeople(party.getPeople() + 1);
            return partyRepository.save(party);
        }
        throw new PartyException(PartyErrorCode.NOT_FOUND_PARTY);

    }

    public ResponseEntity<Object> addPartyMember(AcceptPartyForm form) {
        InviteParty inviteParty = findUser(form);
        Optional<Party> optionalParty = partyRepository.findById(inviteParty.getParty().getId());

        if (optionalParty.isPresent()) {
            Party party = optionalParty.get();
            if (party.getPeople() == 4) {

                return savePartyMember(party.getId());
            } else {
                return null;
            }
        }
        throw new PartyException(PartyErrorCode.NOT_FOUND_PARTY);
    }

    public ResponseEntity<Object> savePartyMember(Long partyId) {
        List<Object[]> list = findAddPartyMember(partyId);
        for (Object[] object : list) {
            InvitePartyForm invitePartyForm = InvitePartyForm.builder()
                    .receiverNickName((String) object[0])
                    .party((Party) object[1])
                    .build();
            partyMemberRepository.save(PartyMember.from(invitePartyForm));
        }
        return ResponseEntity.ok().build();
    }

    public List<Object[]> findAddPartyMember(Long partyId) {
        EntityManager entityManager = emf.createEntityManager();

        Query query = entityManager
                .createQuery(" select i.receiverNickName, i.party " +
                        " from InviteParty i " +
                        " where i.accept = true and i.party.id=:partyId ");
        query.setParameter("partyId", partyId);
        return query.getResultList();
    }
//    public ResponseEntity<Object> putPartyMember(AcceptPartyForm form) {
//        InviteParty inviteParty = findUser(form);
//        Long partyId =inviteParty.getParty().getId();
//        List<PartyMember> partyMemberList = partyMemberRepository.findByParty_Id(partyId);
//        System.out.println(partyMemberList);
//        Optional<Party> optionalParty = partyRepository.findById(partyId);
//        if (optionalParty.isPresent()){
//            optionalParty.get().setMembers(partyMemberList);
//        }
//
//        Party party = em.find(Party.class, partyId);
//        List<PartyMember> members= party.getMembers();
//        System.out.println(members);
//        party.getMembers().get(0).getNickName();
//
//        return ResponseEntity.ok().build();
//    }

    public InviteParty findUser(AcceptPartyForm form) {
        InviteParty inviteParty = invitePartyRepository.findByReceiverNickNameAndReceiverUUID(form.getNick(), form.getUuid())
                .orElseThrow(() -> new PartyException(PartyErrorCode.NOT_FOUND_USER));
        if (inviteParty.getLimitDt().isBefore(LocalDateTime.now())) {
            throw new PartyException(PartyErrorCode.EXPIRE_CODE);
        } else if (!inviteParty.getReceiverUUID().equals(form.getUuid())) {
            throw new PartyException(PartyErrorCode.WRONG_VERIFICATION);
        }
        return inviteParty;
    }


    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(NOT_FOUND_USER));
        return user;
    }
}