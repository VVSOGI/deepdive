디비 설계 개념 중 NF(Normal Form)

한국말로 정규화라고 한다. 정규화는 1에서 5단계까지 그리고 보이스 코드 정규형이라는 게 있는데,
보통 3단계까지의 정규화를 진행한다. 그 이상으로 넘어가면 설계가 오히려 복잡해진다고 한다.

정규화는 쉽게 말해서 각 테이블에 알맞은 데이터들만을 모아놓는 설계법이다.
소프트웨어 목적에 맞게 테이블을 잘 나누고, 각각의 관계는 FK로 묶어서 데이터의 무결성과 일관성을 높인다.
이 방식은 추후에 테이블의 컬럼들을 수정 및 확장할 때 테이블 간의 영향을 최소화 할 수 있다.

3NF 예시

```sql
-- 고객 테이블
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone_number VARCHAR(20),
    date_of_birth DATE
);

-- 계좌 테이블
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 거래 내역 테이블
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
```
