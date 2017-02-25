var AddressOwnershipVerification = artifacts.require("AddressOwnershipVerification.sol");

contract('AddressOwnershipVerification', function(accounts) {
    // Giving each account a name
    var creator        = accounts[0];
    var transactor     = accounts[1];
    var transactee     = accounts[2];
    var uninvolved     = accounts[3]; // Never added to the contract, used to test unauthorized access

    var defaultDeposit = 1234; // Deposit sent in normal cases

    // Used to verify that an exception was thrown during request
    // Adapted from https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
    var expectedExceptionPromise = function (action, gasToUse = 3000000) {
        return new Promise(function (resolve, reject) {
            try {
                resolve(action());
            } catch(e) {
                reject(e);
            }
        })
        .catch(function (e) {
            var message = e + "";

            if (message.indexOf("invalid JUMP") || message.indexOf("out of gas") > -1) {
                // We are in TestRPC
                return true;
            } else if (message.indexOf("please check your gas amount") > -1) {
                // We are in Geth for a deployment
                return true;
            } else {
                throw e;
            }
        }).then(function(result) {
            assert.isTrue(result);
        });
    };

    // Used to test if a specific event was triggered within a transaction
    var assertEventTriggered = function(tx, event) {
        var found = false;

        for (var i = 0; i < tx.logs.length; i++) {
            var log = tx.logs[i];
            if (log.event == event) {
                // We found the event!
                found = true;
                break;
            }
        }

        assert.isTrue(found, event + " event was expected but not triggered");
    };

    it("should not create request when transactor requests verification for themselves", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.request(transactor, defaultDeposit, {from: transactor});
            })
        })
    });

    it("should not create request when deposit is zero", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.request(transactee, 0, {from: transactor});
            })
        })
    });

    it("should create a new request", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.request(transactee, defaultDeposit, {from: transactor});
        }).then(function(result) {
            // Test for event
            assertEventTriggered(result, "RequestEvent");
        })
    });

    it("should not create request when there is already a request from transactor to transactee", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.request(transactee, defaultDeposit, {from: transactor});
            })
        })
    });

    it("should not create request when another request with a different deposit exists", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.request(transactee, defaultDeposit + 10, {from: transactor});
            })
        })
    });

    it("should return a request", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.getRequest.call(transactor, transactee);
        }).then(function(deposit) {
            assert.equal(deposit, defaultDeposit, "deposit wasn't " + defaultDeposit);
        });
    });

    it("should not verify request when incorrect deposit is sent", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.sendTransaction({from: transactee, value: defaultDeposit - 1});
            })
        })
    });

    it("should verify a request", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.sendTransaction({from: transactee, value: defaultDeposit});
        }).then(function(result) {
            // Test for event
            assertEventTriggered(result, "VerificationEvent");
        })
    });

    it("should return true for existing verifications", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.verify.call(transactor, transactee);
        }).then(function(result) {
            assert.isTrue(result, "Verification not found");
        });
    });

    it("should return false for non existing verifications", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.verify.call(transactor, uninvolved);
        }).then(function(result) {
            assert.isFalse(result, "Verification found");
        });
    });

    it("should not create request when matching verification already exists", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.request(transactee, defaultDeposit, {from: transactor});
            })
        })
    });

    it("should not remove verification when called by uninvolved party", function() {
        return AddressOwnershipVerification.deployed().then(function (instance) {
            return expectedExceptionPromise(function () {
                return instance.revoke(transactor, transactee, {from: uninvolved});
            })
        })
    });

    it("should remove a verification", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function(instance) {
            aov = instance;

            return aov.revoke(transactor, transactee, {from: transactor});
        }).then(function(result) {
            // Test for event
            assertEventTriggered(result, "RevokeEvent");
        });
    });

    it("should not remove a pending request when called by uninvolved party", function() {
        var aov;

        return AddressOwnershipVerification.deployed().then(function (instance) {
            aov = instance;

            return aov.request(transactee, defaultDeposit, {from: transactor});
        }).then(function() {
            return expectedExceptionPromise(function () {
                return aov.removeRequest(transactor, transactee, {from: uninvolved});
            })
        })
    });

    it("should remove a pending request", function() {
        return AddressOwnershipVerification.deployed().then(function(instance) {
            return instance.removeRequest(transactor, transactee, {from: transactor});
        }).then(function(result) {
            assertEventTriggered(result, "RemoveRequestEvent");
        });
    });

});
