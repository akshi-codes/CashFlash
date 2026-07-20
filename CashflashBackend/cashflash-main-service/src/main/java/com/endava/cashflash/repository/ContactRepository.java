package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Provides contact persistence and lookup queries.
public interface ContactRepository extends JpaRepository<Contact, Long> {

    @Query(value = Queries.FIND_CONTACTS_BY_USER_ID_ORDER_BY_ALIAS_ASC, nativeQuery = true)
    List<Contact> findByUser_UserIdOrderByAliasAsc(@Param("userId") Long userId);

    @Query(value = Queries.FIND_CONTACT_BY_CONTACT_ID_AND_USER_ID, nativeQuery = true)
    Optional<Contact> findByContactIdAndUser_UserId(@Param("contactId") Long contactId,
                                                    @Param("userId") Long userId);
}
