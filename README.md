# An ethereum address ownership verification smart contract
Think SMS cell phone number verification for ethereum addresses.

**Possible use cases**:

Exchanges could use this contract to verify their user's withdrawal addresses before sending them crypto currencies.

This could remove a possible user error from the withdrawal processes.

# Requirements
* [truffle](http://truffleframework.com) v3.0.2 or higher
* [testrpc](https://github.com/ethereumjs/testrpc) must be running for local testing

# Online demo
:TODO:

# Local installation
```bash
git clone https://github.com/smoove/AddressOwnershipVerification.git
cd AddressOwnershipVerification
npm install
truffle compile
truffle migrate # make sure testrpc/geth/parity is running
npm run build
truffle serve
```

Then navigate to [http://localhost:8080/](http://localhost:8080/) in your browser.

# Usage
## Definitions
`address`:    An ethereum address

`transactor`: The party that wants to verify another parties ownership over `address`

`transactee`: The party that is asked to verify their ownership of `address`

`deposit`:    A randomly generated number. It represents the amount of wei `transactee` has to send to verify ownership of `address`.

## Suggested workflow
1. Transactor receives an address from transactee, who claims to own said address.
2. Transactor generates a random number, `deposit`. This can be anything greater than 0 up to uint32's max value (4294967295).
3. Transactor calls `request(address, deposit)`
4. Transactor tells transactee to send `deposit` amount of wei to this contract - Transactee could also listen for the `RequestEvent` event to get notified.
5. Transactee sends `deposit` amount of wei to this contract from `address`
6. Transactee listens for the `TrustEvent` event or gets informed by transactee that the deposit has been sent
7. Transactor can now call `verify(transactor, address)` to know wether or not transactee has fullfilled the request

optional:
* Transactor or transactee can call `removeRequest(transactor, transactee)` to cancel a pending request before it was verified. This triggers the `RemoveRequestEvent` event.
* Transactor or transactee can call `revoke(transactor, transactee)` to revoke the verification and return deposit to transactee. This triggers the `RevokeEvent` event.

# Events
## RequestEvent
```
event RequestEvent(address indexed transactor, address indexed transactee, uint32 indexed deposit);
```
Triggered when a new request is created.

## RemoveRequestEvent
```
event RemoveRequestEvent(address indexed transactor, address indexed transacteedeposit); 
```
Triggered when a pending request is removed by either party before it was verified.

## VerificationEvent
```
event VerificationEvent(address indexed transactor, address indexed transactee, uint32 indexed deposit); 
```
Triggered when a pending request is successfully verified.

## RevokeEvent
```
event RevokeEvent(address indexed transactor, address indexed transactee, uint32 indexed deposit);  
```
Triggered when either party revokes an existing verification.

# Running tests
```bash
truffle test
```

