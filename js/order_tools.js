"use strict";
   
    // Initialize everything when the window finishes loading
    window.addEventListener("load", function(event) {
     
      var network_testnet = document.getElementById("network_testnet");
      var message = document.getElementById("message");
      var account = document.getElementById("account");

      var offerid = document.getElementById("offerid");
      var buy_asset = document.getElementById("buy_asset"); 
      var buy_issuer = document.getElementById("buy_issuer"); 
      var sell_asset = document.getElementById("sell_asset");      
      var sell_issuer = document.getElementById("sell_issuer");
      var sell_asset_bal = document.getElementById("sell_asset_bal");
      var buy_asset_bal = document.getElementById("buy_asset_bal");
      var amount = document.getElementById("amount");
      var will_get = document.getElementById("will_get");
      var averge_price = document.getElementById("averge_price");
      var ask_price = document.getElementById("ask_price");
      var offer_price = document.getElementById("offer_price");
      var submit_offer = document.getElementById("submit_offer");
      var get_market_price = document.getElementById("get_market_price");
      var closed_state = document.getElementById("closed_state");
      var full_search = document.getElementById("full_search");
      var cancel_offer = document.getElementById("cancel_offer");
 
      var seed = document.getElementById("seed");          
      var balance = document.getElementById("balance");
      var thresh_set = document.getElementById("thresh_set"); 
      var master_weight = document.getElementById("master_weight");      
      var url = document.getElementById("url");
      var open = document.getElementById("open");
      var close = document.getElementById("close");
      var merge_accounts = document.getElementById("merge_accounts");
      var status = document.getElementById("status");
      var network = document.getElementById("network");
 
      var socket;
      var socket_open_flag = false;
      var operation_globle;
      var paymentsEventSource;
      var server;
      var cancel_offer_flag;

      //merge_accounts.disabled = true;
      network.value ="mss_server";
      console.log("just after var");
      status.textContent = "Not Connected";
      url.value = "ws://zipperhead.ddns.net:9494";
      //create_socket();
      close.disabled = true;
      open.disabled = true;
      asset.value = "CCC";
           
      seed.value = 'SA3CKS64WFRWU7FX2AV6J6TR4D7IRWT7BLADYFWOSJGQ4E5NX7RLDAEQ'; 
        
      StellarSdk.Network.useTestNet();
      //StellarSdk.Memo.text("sacarlson");
      var hostname = "horizon-testnet.stellar.org";
            
      reset_horizon_server();
      current_mode.value = "TestNet MSS-server";

      create_socket();
      var key = StellarSdk.Keypair.fromSeed(seed.value);
      update_key();
    
      update_balances();
      //start_effects_stream();

          function attachToPaymentsStream(opt_startFrom) {
            console.log("start attacheToPaymentsStream");
            var futurePayments = server.effects().forAccount(account.value);
            if (opt_startFrom) {
                console.log("opt_startFrom detected");
                futurePayments = futurePayments.cursor(opt_startFrom);
            }
            if (paymentsEventSource) {
                console.log('close open effects stream');
                paymentsEventSource.close();
            }
            console.log('open effects stream with cursor: ' + opt_startFrom);
            paymentsEventSource = futurePayments.stream({
                onmessage: function (effect) { effectHandler(effect, true); }
            });
          };

          function start_effects_stream() {
	    server.effects()
            .forAccount(account.value)
            .limit(30)
            .order('desc')
            .call()
            .then(function (effectResults) {
                console.log("then effectResults");
                var length = effectResults.records ? effectResults.records.length : 0;
                for (index = length-1; index >= 0; index--) {
                    console.log("index" + index);
                    var currentEffect = effectResults.records[index];
                    effectHandler(currentEffect, false);
                }
                var startListeningFrom;
                if (length > 0) {
                    latestPayment = effectResults.records[0];
                    startListeningFrom = latestPayment.paging_token;
                }
                attachToPaymentsStream(startListeningFrom);
            })
            .catch(function (err) {
                console.log("error detected in attachToPaymentsStream");
                attachToPaymentsStream('now');
                console.log(err)
            });
          }

          function effectHandler(effect,tf) {
            console.log("got effectHandler event");
            console.log(tf);
            console.log(effect);
            if (effect.type === 'account_debited') {
               if (effect.asset_type === "native") {
                  balance.value = balance.value - effect.amount;
               }else {
                  CHP_balance.value = CHP_balance.value - effect.amount;
               }
            }
            if (effect.type === 'account_credited') {
               if (effect.asset_type === "native") {
                  balance.value = balance.value + effect.amount;
               }else {
                  CHP_balance.value = CHP_balance.value + effect.amount;
               }
            }
            if (effect.type === 'account_created') {
               balance.value = effect.starting_balance;
            }
          };

      function reset_horizon_server() {
        console.log("reset_horizon_server");        
        server = new StellarSdk.Server({     
          hostname: hostname,
          port: 443,
          secure: true
        });
      }
       
      function get_account_info(account,params,callback) {
        if (network.value === "mss_server") {
          socket_open_flag = true;
        }else {
          console.log("get_account_info horizon mode");
          server.accounts()
          .address(account)
          .call()
          .then(function (accountResult) {
            callback(accountResult,params);                    
          })
          .catch(function (err) {
            console.log("got error in get_account_info");
            console.error(err);
            callback(err,params);          
          })
        }
      }

      function display_message(param) {
        message.textContent = JSON.stringify(param);
      }


      function display_balance(account_obj,params) {          
          var balance = 0;
          console.log("display_balance account_obj");
          console.log(account_obj);
          console.log(account_obj.name);          
          if (params.detail == true) {
            display_message(account_obj);
          }
          return account_obj;          
        }

      
       function get_balance(account,to_id,asset) {         
         get_account_info(account,{to_id:to_id,asset:asset},display_balance)
       } 
     
      function update_key() {
        key = StellarSdk.Keypair.fromSeed(seed.value);
        account.value = key.address();
      }
      
      function update_balances_set(account_obj,params) {
        display_balance(account_obj,{to_id:params.to_id1,
          asset_code:params.asset_code1,
          detail:false}
        );

        display_balance(account_obj,{
          to_id:params.to_id2,
          asset_code:params.asset_code2,
          detail:params.detail}
        );
      }

      function update_balances() {
        if (network.value === "mss_server"){
          console.log("update_balances mss mode");
          get_balance_updates_mss();
          return
        }
        get_account_info(account.value,{
          to_id1:"balance",
          asset_code1:null,
          detail:true},update_balances_set);
      
      }


      
      function createAccount(key) {
          console.log("start createAccount");
          var operation = createAccountOperation();
          createTransaction(key,operation);
        }

      function sendPaymentTransaction() {
        var key = StellarSdk.Keypair.fromSeed(seed.value);
        if (asset.value== "native") {
          var asset_obj = new StellarSdk.Asset.native();
          if (dest_balance.value == 0){
            if (amount.value < 20) {
              message.textContent = "destination account not active must send min 20 native";
              return;
            }
            createAccount(key);
          }else {
            createPaymentTransaction(key,asset_obj);
          }
        }else {
          if (dest_balance.value == 0){
            message.textContent = "destination account not active, can only send native";
            return;
          }
          var asset_obj = new StellarSdk.Asset(asset.value, issuer.value);
          message.textContent = "started payment: ";
          createPaymentTransaction(key,asset_obj);
        }        
      }    
  

      function createPaymentTransaction(key,asset_obj) {
          var operation = createPaymentOperation(asset_obj);
          createTransaction(key,operation);
        }

     function accountMergeTransaction() {
          // this will send all native of key from seed.value account to destination.value account
          console.log("accountMerge");        
          key = StellarSdk.Keypair.fromSeed(seed.value);
          console.log(key.address());
          var operation = accountMergeOperation();
          console.log("operation created ok");
          createTransaction(key,operation);
        }

     function addSignerTransaction() {
          console.log("addSignerTransaction");        
          key = StellarSdk.Keypair.fromSeed(seed.value);
          console.log(key.address());
          var operation = addSignerOperation();
          console.log("operation created ok");
          createTransaction(key,operation);
        }

     function setOptionsTransaction() {
          console.log("addSignerTransaction");        
          key = StellarSdk.Keypair.fromSeed(seed.value);
          console.log(key.address());
          var operation = setOptionsOperation();
          console.log("operation created ok");
          createTransaction(key,operation);
        }

     function manageOfferTransaction() {
          console.log("cancelOfferTransaction");        
          key = StellarSdk.Keypair.fromSeed(seed.value);
          console.log(key.address());
          var operation = manageOfferOperation();
          console.log("operation created ok");
          createTransaction(key,operation);
        }


     function submitTransaction_mss(transaction) {
       console.log("start submitTransaction_mss");
       var b64 = transaction.toEnvelope().toXDR().toString("base64");
       var action = '{"action":"send_b64", "envelope_b64":"' + b64 + '"}';
       socket.send(action);
     }

     function get_seq(address) {
       var action = '{"action":"get_sequence", "account":"' + address + '"}'
       socket.send(action);
     }

     function get_offerid() {
       var action = '{"action":"get_offers", "offerid":"' + offerid.value + '"}'
       socket.send(action);
     }

     function createTransaction_mss_submit(key,operation,seq_num) {
       var account = new StellarSdk.Account(key.address(), seq_num);
       var transaction = new StellarSdk.TransactionBuilder(account,{fee:100})            
           .addOperation(operation)          
           .addSigner(key)
           .build();
       submitTransaction_mss(transaction); 
     }

     function createTransaction_mss(key,operation) {
       operation_globle = operation;
       get_seq(key.address());
     }

   
     

      function createTransaction_horizon(key,operation) {
        server.loadAccount(key.address())
          .then(function (account) {
            var transaction = new StellarSdk.TransactionBuilder(account,{fee:100})            
            .addOperation(operation)          
            .addSigner(key)
            .build();                     
           server.submitTransaction(transaction);           
          })
          .then(function (transactionResult) {
            console.log(transactionResult);
            //console.log(transaction.toEnvelope().toXDR().toString("base64"));
            //message.textContent = transaction.toEnvelope().toXDR().toString("base64");
          })
          .catch(function (err) {
            console.log(err);
          });
        }
     
      function createTransaction(key,operation) {
        if (network.value === "mss_server") {
          console.log("start mss trans");
          createTransaction_mss(key,operation);
        } else {
          createTransaction_horizon(key,operation);
        }
       
      }

      function createPaymentOperation(asset_obj) {
                 return StellarSdk.Operation.payment({
                   destination: destination.value,
                   amount: amount.value,
                   asset: asset_obj
                 });
               }

      function createAccountOperation() {
                 return StellarSdk.Operation.createAccount({
                   destination: destination.value,
                   startingBalance: amount.value
                 });
               }

      function accountMergeOperation() {
                 console.log(destination.value);
                 return StellarSdk.Operation.accountMerge({
                   destination: destination.value
                 });                                     
               }

      function addSignerOperation() {
                 console.log(signer.value);
                 console.log(Number(weight.value));
                 return StellarSdk.Operation.setOptions({
                   signer: {
                     address: signer.value,
                     weight: Number(weight.value)
                   }
                 });
               }

      function addTrustlineOperation(asset_type, issuer_address) {
                 //asset_type examples "USD", "CHP"
                 asset = new StellarSdk.Asset(asset_type, issuer_address);
                 return StellarSdk.Operation.changeTrust({asset: asset}); 
               }
      
      function manageOfferOperation() {
           console.log("manageOfferOperation");
            var opts = {};
            if (sell_asset.value == "XLM") {
              opts.selling = new StellarSdk.Asset.native();
            } else {
              opts.selling = new StellarSdk.Asset(sell_asset.value, sell_issuer.value);
            }
            if (buy_asset.value == "XLM") {
              opts.buying = new StellarSdk.Asset.native();
            } else {
              opts.buying = new StellarSdk.Asset(buy_asset.value, buy_issuer.value);
            }
            opts.amount = amount.value;
            opts.price = offer_price.value;
            if (cancel_offer_flag) {
              console.log("cancel_offer_flag true");
              opts.offerId = offerid.value;
              opts.amount = '0.0';
              amount.value = '0.0';
            } else {
              //opts.offerId = 0;
              opts.amount = amount.value;
            }
            return StellarSdk.Operation.manageOffer(opts);
          }

      function setOptionsOperation() {
                 console.log(Number(master_weight.value));
                 console.log(Number(threshold.value));
                 var opts = {};
                 //opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
                 //opts.clearFlags = 1;
                 //opts.setFlags = 1;
                 opts.masterWeight = Number(master_weight.value);
                 opts.lowThreshold = Number(threshold.value);
                 opts.medThreshold = Number(threshold.value);
                 opts.highThreshold = Number(threshold.value);

                 //opts.signer = {
                 // address: signer.value,
                 // weight: weight.value
                // };
                 //opts.homeDomain = "www.example.com";
                 return StellarSdk.Operation.setOptions(opts);
               }

       function get_balance_updates_mss() {
      // this querys balance updates from the mss-server
      // see socket.addEventListener to see how the responces from this are feed 
      // to browser display boxes
      console.log("start get_balance_updates_mss");
      if (socket.readyState === 1) {
        var action = '{"action":"get_account_info","account":"';
        var tail = '"}';
        socket.send(action + account.value + tail);       
        var action = '{"action":"get_lines_balance","account":"';
        var tail = '"}';
        socket.send(action + account.value + '","issuer":"' + buy_issuer.value +'","asset":"' + buy_asset.value + tail);
        var action = '{"action":"get_lines_balance","account":"';
        var tail = '"}';
        socket.send(action + account.value + '","issuer":"' + sell_issuer.value +'","asset":"' + sell_asset.value + tail);
      }
    }

    function get_offers_mss() {
      // this querys balance updates from the mss-server
      // see socket.addEventListener to see how the responces from this are feed 
      // to browser display boxes
      console.log("start get_offers_mss");
      if (socket.readyState === 1) {
        if (buysell.value === "buy") {
          var action = '{"action":"get_buy_offers","asset":"';
        }else {
          var action = '{"action":"get_sell_offers","asset":"';
        }
        var tail = '"}';
        socket.send(action + asset.value + '","issuer":"'+ issuer.value +'","sort":"' + sort.value + tail);        
      }
    }

    function get_offers_full_horizon() {
//https://horizon-testnet.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum4&buying_asset_code=AAA&buying_asset_issuer=GAX4CUJEOUA27MDHTLSQCFRGQPEXCC6GMO2P2TZCG7IEBZIEGPOD6HKF
    }

    function get_offers_full_mss() {
      console.log("start get_offers_full_mss");
      if (socket.readyState === 1) {
        var action = '{"action":"get_offers","sell_asset":"';  
        var tail = '"}';
        socket.send(action + buy_asset.value + '","sell_issuer":"'+ buy_issuer.value +'","buy_asset":"' + sell_asset.value + '","buy_issuer":"' + sell_issuer.value + '","sellerid":"' + account.value + tail);          
      }
      //var offer = (1.0 / Number(ask_price.value));
      will_get.value = Number(offer_price.value) * Number(amount.value);
    }

    function get_offers_hist_mss() {
      console.log("start get_offers_hist_mss");
      if (socket.readyState === 1) {
        var action = '{"action":"get_tx_offer_hist","sell_asset":"';
        if (closed_state.value == "all") {  
          var tail = '"}';
        } else if (closed_state.value == "canceled") {
           var tail = '","closed":"true"}';
        } else {
           var tail = '","closed":"false"}';
        }
        socket.send(action + buy_asset.value + '","sell_issuer":"'+ buy_issuer.value +'","buy_asset":"' + sell_asset.value + '","buy_issuer":"' + sell_issuer.value + tail);          
      }
    }


    function get_market_price_mss() {
      // this querys balance updates from the mss-server
      // see socket.addEventListener to see how the responces from this are feed 
      // to browser display boxes
      console.log("start get_market_price_mss");
      if (socket.readyState === 1) {        
        var action = '{"action":"get_market_price","sell_asset":"';       
        var tail = '"}';
        socket.send(action + buy_asset.value + '","sell_issuer":"'+ buy_issuer.value +'","buy_asset":"' + sell_asset.value + '","buy_issuer":"' + sell_issuer.value + '","sell_amount":"' + amount.value + '","sellerid":"' + account.value + tail);        
      }
    }
//{"action":"get_market_price", "sell_asset":"BBB","sell_amount":4, "buy_asset":"AAA"}
    
      function create_socket() {
        console.log("started create_socket");
        open.disabled = true;
        close.disabled = false;
        socket = new WebSocket(url.value, "echo-protocol");

        socket.addEventListener("open", function(event) {         
          open.disabled = true;
          close.disabled = false;
          status.textContent = "Connected";
        });

        // Display messages received from the mss-server
        // and feed desired responce to browser input boxes
        socket.addEventListener("message", function(event) {
          message.textContent = "MSS Server responce: " + event.data;
          var event_obj = JSON.parse(event.data);
          console.log(event.data);
          console.log("event_obj.action");
          console.log(event_obj.action);
          if (event_obj.action == "get_account_info") {          
              balance.value = event_obj.balance;                       
          }

          if (event_obj.action == "get_lines_balance") {
            console.log("get_lines_balance detected");
            console.log(event_obj.issuer);
            console.log(sell_issuer.value);
            if (event_obj.issuer == sell_issuer.value && event_obj.assetcode == sell_asset.value) {
              sell_asset_bal.value = event_obj.balance;
            }
            if (event_obj.issuer == buy_issuer.value && event_obj.assetcode == buy_asset.value) {
              buy_asset_bal.value = event_obj.balance;
            }            
          }
         
          if (event_obj.action == "get_sequence") {
            var seq_num = (event_obj.sequence).toString();
            console.log("got sequence");
            console.log(seq_num);
            createTransaction_mss_submit(key, operation_globle, seq_num)
          }
          if (event_obj.action == "send_b64") {
            get_balance_updates_mss();
          }
                   
          if (event_obj.action == "get_offerid") {
//{[{"sellerid":"GAMCHGO4ECUREZPKVUCQZ3NRBZMK6ESEQVHPRZ36JLUZNEH56TMKQXEB","offerid":70,"sellingassettype":0,"sellingassetcode":null,"sellingissuer":null,"buyingassettype":1,"buyingassetcode":"CCC","buyingissuer":"GAX4CUJEOUA27MDHTLSQCFRGQPEXCC6GMO2P2TZCG7IEBZIEGPOD6HKF","amount":10000000,"pricen":1,"priced":1,"price":1.0,"flags":0,"lastmodified":1018137,"index":0,"inv_price":1.0}],"action":"get_offerid","count":1}
            var offer = event_obj.orders[0];            
            if (offer.buyingassettype == 0) {
              buy_asset.value = "XLM"; 
              buy_issuer.value = "";
            } else {  
              buy_asset.value = offer.buyingassetcode; 
              buy_issuer.value = offer.buyingissuer;
            }
            if (offer.sellingassettype == 0) {
              sell_asset.value = "XLM";
              sell_issuer.value = "";
            } else {
              sell_asset.value = offer.sellingassetcode;
              sell_issuer.value = offer.sellingissuer;
            }
            amount.value = offer.amount;
            offer_price.value = offer.price;
            manageOfferTransaction();         
          }

          if (event_obj.action == "get_market_price") {
            ask_price.value = event_obj.max_bid;
            averge_price.value = event_obj.averge_price;
            offer_price.value = (1.0 / Number(ask_price.value));
            will_get.value = (1.0 / Number(averge_price.value)) * Number(amount.value);
            if (event_obj.max_sell_amount) {
              amount.value = event_obj.max_sell_amount;
            }         
          }

        });

        // Display any errors that occur
        socket.addEventListener("error", function(event) {
          message.textContent = "Error: " + event;
        });

        socket.addEventListener("close", function(event) {
          open.disabled = false;
          close.disabled = true;
          status.textContent = "Not Connected";
        });

        socket.onopen = function (event) {
          console.log("got onopen event");
          get_balance_updates_mss();
        };

      }

      // Create a new connection when the Connect button is clicked
      open.addEventListener("click", function(event) {
        create_socket();
      });

      

      // Close the connection when the Disconnect button is clicked
      close.addEventListener("click", function(event) {
        console.log("closed socket");
        close.disabled = true;
        open.disabled = false;
        message.textContent = "";
        socket.close();
      });
     
      change_network.addEventListener("click", function(event) { 
        console.log("mode: " + network.value);        
        if(network.value === "testnet" ) {
          close.disabled = true;
          open.disabled = true;
          StellarSdk.Network.useTestNet();
          hostname = "horizon-testnet.stellar.org";
          current_mode.value = "Stellar TestNet";
          console.log(socket);
          if (typeof(socket) !== "undefined") {
            socket.close();
          }
          reset_horizon_server();
          //update_balances();
         // start_effects_stream();
        }else if (network.value === "live" ){
          console.log("mode Live!!");  
          close.disabled = true;
          open.disabled = true;
          StellarSdk.Network.usePublicNetwork();
          hostname = "horizon-live.stellar.org";
          current_mode.value = "Stellar Live!!";
          console.log(socket);
          if (typeof(socket) !== "undefined") {
            socket.close();
          }
          reset_horizon_server();
          //update_balances();
          //start_effects_stream();
        }else {
          //mss-server mode
          console.log("start mss-server mode");
          //paymentsEventSource.close();
          server = false;
          close.disabled = false;
          StellarSdk.Network.useTestNet();
          create_socket();
          current_mode.value = "TestNet MSS-server";
        }     
        update_balances();          
      });
      
      save.addEventListener("click", function(event) {         
        if (typeof(Storage) !== "undefined") {
          var encrypted = CryptoJS.AES.encrypt(seed.value, pass_phrase.value);       
          // Store
          localStorage.setItem(seed_nick.value, encrypted);
          seed.value = "seed saved to local storage"        
        }else {
          seed.value = "Sorry, your browser does not support Web Storage...";
        }
      });

      restore.addEventListener("click", function(event) {         
        if (typeof(Storage) !== "undefined") {
          // Retrieve
          var encrypted = localStorage.getItem(seed_nick.value);
          seed.value = CryptoJS.AES.decrypt(encrypted, pass_phrase.value).toString(CryptoJS.enc.Utf8);
          update_key();
          update_balances();
        }else {
          seed.value = "Sorry, your browser does not support Web Storage...";
        }        
      });

      list_seed_keys.addEventListener("click", function(event) {
        var result = "";
        for ( var i = 0, len = localStorage.length; i < len; ++i ) {
          //console.log(  localStorage.key( i ) );
          result = result + localStorage.key( i ) + ", ";
        }
        message.textContent = result;
      });

      start_search.addEventListener("click", function(event) {
        get_offers_mss();
      });

      cancel_offer.addEventListener("click", function(event) {
        cancel_offer_flag = true;
        get_offerid();
        //cancelOfferTransaction();
      });

      submit_offer.addEventListener("click", function(event) {
        cancel_offer_flag = false;
        manageOfferTransaction();
      });

      show_offer.addEventListener("click", function(event) {
        cancel_offer_flag = false;
        get_offerid();
      });

      get_market_price.addEventListener("click", function(event) {
        cancel_offer_flag = false;
        get_market_price_mss();
      });

      full_search.addEventListener("click", function(event) {
        console.log("full_search");
        get_offers_full_mss();
      });

      search_offer_hist.addEventListener("click", function(event) {
        console.log("search_offer_hist");
        get_offers_hist_mss();
      });
   

  });

