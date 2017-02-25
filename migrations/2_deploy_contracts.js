var AddressOwnershipVerification = artifacts.require("./AddressOwnershipVerification.sol");

module.exports = function(deployer) {
  deployer.deploy(AddressOwnershipVerification);
};
