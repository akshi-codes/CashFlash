-- Master test bank accounts and cards for PSP simulator
USE cashflash_pspdb;

-- Bank Accounts for each supported bank
INSERT INTO bank_account_psp (bank_name, account_number, ifsc, last4, token, balance, is_active, is_linked) VALUES
('State Bank of India', '112233445566', 'SBIN0001234', '5566', UUID(), 75000.00, 1, 0),
('Canara Bank', '223344556677', 'CNRB0002345', '6677', UUID(), 50000.00, 1, 0),
('Bank of Baroda', '334455667788', 'BARB0003456', '7788', UUID(), 60000.00, 1, 0),
('Bank of India', '445566778899', 'BKID0004567', '8899', UUID(), 45000.00, 1, 0),
('Punjab National Bank', '556677889900', 'PUNB0005678', '9900', UUID(), 40000.00, 1, 0),
('Union Bank of India', '667788990011', 'UBIN0006789', '0011', UUID(), 55000.00, 1, 0);

-- Cards (Visa, Mastercard, RuPay)
INSERT INTO card_psp (card_number, expiry_month, expiry_year, last4, provider, card_type, token, balance, is_active, is_linked) VALUES
('4111111111111234', '12', '2028', '1234', 'VISA', 'DEBIT', UUID(), 35000.00, 1, 0),
('5123456789012345', '10', '2029', '2345', 'MASTERCARD', 'DEBIT', UUID(), 45000.00, 1, 0),
('6071234567893456', '08', '2028', '3456', 'RUPAY', 'DEBIT', UUID(), 30000.00, 1, 0);
