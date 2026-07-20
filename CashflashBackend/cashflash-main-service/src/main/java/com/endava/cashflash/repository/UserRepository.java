package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    //checks if email exists
    @Query(value = Queries.EXISTS_BY_EMAIL, nativeQuery = true)
    int existsByEmail(@Param("email") String email);

    //checks if phone number exists
    @Query(value = Queries.EXISTS_BY_PHONE, nativeQuery = true)
    int existsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query("""
		    select u from User u
		    left join fetch u.wallet
		    left join fetch u.bankAccounts
		    left join fetch u.cards
		    where u.userId = :userId
		""")
    Optional<User> findUserWithPaymentMethods(@Param("userId") Long userId);

    @Query(value = Queries.FIND_USER_BY_EMAIL, nativeQuery = true)
    Optional<User> findByEmail(@Param("email") String email);

    @Query(value = Queries.FIND_USER_BY_PHONE_NUMBER, nativeQuery = true)
    Optional<User> findByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query(value = Queries.FIND_USER_BY_PAYMENT_ID, nativeQuery = true)
    Optional<User> findByPaymentId(@Param("paymentId") String paymentId);

    @Query(value = Queries.FIND_USER_BY_USER_ID, nativeQuery = true)
    Optional<User> findByUserId(@Param("userId") Long userId);

    @Query(value = Queries.FIND_ALL_USERS_BY_KYC_STATUS, nativeQuery = true)
    List<User> findAllByKycStatus(@Param("kycStatus") String kycStatus);

    default List<User> findAllByKycStatus(KycStatus kycStatus) {
        return findAllByKycStatus(kycStatus.name());
    }
}