// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import aov_artifacts from '../../build/contracts/AddressOwnershipVerification.json'

var AddressOwnershipVerification = contract(aov_artifacts);

var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    AddressOwnershipVerification.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      document.getElementById("address_transactor").value = accounts[0];
      document.getElementById("address_transactee").value = accounts[1];

      self.updateStatus();
    });
  },

  log: function(message) {
    document.getElementById("log").innerHTML += message + "<br />";
  },

  clearLog: function() {
    document.getElementById("log").innerHTML = "";
  },

  updateStatus: function() {
    var aov;
    var self = this;

    AddressOwnershipVerification.deployed().then(function(instance) {
      aov = instance;

      var transactor = document.getElementById("address_transactor").value;
      var transactee = document.getElementById("address_transactee").value;

      aov.getRequest.call(transactor, transactee, {from: account}).then(function(deposit) {
        if (deposit > 0) {
          document.getElementById("request").innerHTML = "Please send " + deposit + " wei to " + AddressOwnershipVerification.address + ' to verify your ownership, or <a href="#" onclick="App.removeRequest(); return false;">click here</a> to remove this request.';
        } else {
          document.getElementById("request").innerHTML = "No pending request.";
        }
      });

      aov.verify.call(transactor, transactee, {from: account}).then(function(result) {
        if (result) {
          document.getElementById("verified").innerHTML = 'Yes - <a a href="#" onclick="App.revoke(); return false;">click here</a> to revoke this verification.';
          document.getElementById("verified").style = "color: green";

        } else {
          document.getElementById("verified").innerHTML = 'No';
          document.getElementById("verified").style = "color: red";
        }
      });
    }).catch(function(e) {
      console.log(e);
      self.log("Error getting request; see console.");
    });
  },

  request: function() {
    var aov;
    var self = this;

    var transactor = document.getElementById("address_transactor").value;
    var transactee = document.getElementById("address_transactee").value;
    var deposit = parseInt(document.getElementById("deposit").value);

    AddressOwnershipVerification.deployed().then(function(instance) {
      aov = instance;
      return aov.request(transactee, deposit, {from: transactor});
    }).then(function() {
      self.log("request: complete");
    }).catch(function(e) {
      console.log(e);
      self.log("Error creating request; see console.");
    });

    self.updateStatus();
  },

  removeRequest: function() {
    var aov;
    var self = this;

    var transactor = document.getElementById("address_transactor").value;
    var transactee = document.getElementById("address_transactee").value;

    AddressOwnershipVerification.deployed().then(function(instance) {
      aov = instance;
      return aov.removeRequest(transactor, transactee, {from: transactor});
    }).then(function() {
      self.log("removeRequest: complete");
    }).catch(function(e) {
      console.log(e);
      self.log("Error removing verification; see console.");
    });

    self.updateStatus();
  },

  sendDeposit: function() {
    var aov;
    var self = this;

    var transactor = document.getElementById("address_transactor").value;
    var transactee = document.getElementById("address_transactee").value;
    var deposit = parseInt(document.getElementById("deposit").value);

    AddressOwnershipVerification.deployed().then(function(instance) {
      aov = instance;
      return web3.eth.sendTransaction({from: transactee, to: AddressOwnershipVerification.address, value: deposit});
    }).then(function() {
        self.log("sendDeposit: complete");
    }).catch(function(e) {
      console.log(e);
      self.log("Error sending deposit; see console.");
    });

    self.updateStatus();
  },

  revoke: function() {
    var aov;
    var self = this;

    var transactor = document.getElementById("address_transactor").value;
    var transactee = document.getElementById("address_transactee").value;
    var deposit = parseInt(document.getElementById("deposit").value);

    AddressOwnershipVerification.deployed().then(function(instance) {
      aov = instance;
      return aov.revoke(transactor, transactee, {from: transactor});
    }).then(function() {
      self.log("revoke: complete");
    }).catch(function(e) {
      console.log(e);
      self.log("Error removing verification; see console.");
    });

    self.updateStatus();
  },
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
