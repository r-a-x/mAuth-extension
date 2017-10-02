mauth={}

mauth.associated = {"value": false, "hash": null};
mauth.lastSync = null;
mauth.lastMakeConnectionCallTimeStamp = null;
mauth.lastMakeConnectionCallStatus = false;
mauth.qrUid=null;
mauth.isEncryptionKeyUnrecognized = false;
mauth.currentMauthHttp = {"version": 0, "versionParsed": 0};
mauth.latestMauthHttp = (typeof(localStorage.latestmauthHttp) == 'undefined') ? {"version": 0, "versionParsed": 0, "lastChecked": null} : JSON.parse(localStorage.latestmauthHttp);
mauth.keySize = 8; // wtf? stupid cryptoHelpers
mauth.pluginUrlDefault = "http://localhost:19455";
mauth.latestVersionUrl = "https://passifox.appspot.com/kph/latest-version.txt";
mauth.cacheTimeout = 30 * 1000; // milliseconds
mauth.keyId = "chromeipass-cryptokey-name";
mauth.keyBody = "chromeipass-key";
mauth.isMobileAvailable = false;
mauth.mobileLastCall = new Date("October 13, 2014 11:13:00");
mauth.serverLastCall = new Date("October 13, 2014 11:13:00");
mauth.isServerAvailable = false;
mauth.waitingTimeIntervalInSeconds = 4;
mauth.to_s = cryptoHelpers.convertByteArrayToString;
mauth.to_b = cryptoHelpers.convertStringToByteArray;


function updateStatus(mAlive,sAlive,mLastCall,sLastCall){
    mauth.mobile.available = mAlive;
    mauth.server.available = sAlive;
    mauth.mobile.lastCall = mLastCall || mauth.mobile.lastCall;
    mauth.server.lastCall = sLastCall || mauth.server.lastCall;
}

mauth.connectUrl = mauth.pluginUrlDefault + "/connect";
mauth.connect = function(tab){
  var connection = {
    "uid":qr.uid,
    "msg":"connect"
  };
  // based on the response, I can find out if the backend is working and if the mobile is having
  // some issue in it
  mauth.isMobileAvailable = false;
  mauth.isServerAvailable = false;
  var response = network.sendPollSync(url,connection);
  var status = response[0];
  if ( status == 404 ){
    page.tabs[tab.id].errorMessage = "Unable to Connect to Internet";
    mauth.isMobileAvailable = false;
    mauth.isServerAvailable = false;
  }
  else if ( status != 200) {
    page.tabs[tab.id].errorMessage = "Please make sure the phone is unlocked and connected to internet";
    mauth.isMobileAvailable = false;
    mauth.isServerAvailable = true;
  }
  else if ( status == 200){
    page.tabs[tab.id].errorMessage = "Chrome is connected to the mobile phone !!";
    mauth.isMobileAvailable = true;
    mauth.isServerAvailable = true;
    mauth.mobileName = resonse[1];
  }
  return status == 200;
}

mauth.getCredentials = mauth.pluginUrlDefault + "/getcreds";
mauth.getCreds = function ( uid, url ){
      var credsRequest = {
        "uid":uid,
        "url":url
      };
    return network.sendSync(mauth.getCredentials,credsRequest);
}

mauth.availableCreds  = mauth.pluginUrlDefault +"/availablecreds";
mauth.getAvailableCreds = function ( uid ){
  var availableCreds ={
    'uid':uid
  };
  return network.sendSync(mauth.availableCreds,availableCreds);
}

mauth.isAssociated = function(uid,tab){
    if ( uid === qr.uid)
        return mauth.isMobileAvailable && mauth.isServerAvailable;
    page.tabs[tab.id].errorMessage = error.UidChanged;
    return false;
}

mauth.associate = function(callback, tab) {

	if(mauth.isAssociated()) {
		return;
	}
	page.tabs[tab.id].errorMessage = null;
  var qr = generateQRCode();
		browserAction.show(callback, tab);
}

function getTimeInSeconds(current,old){
  return ( current.getTime() - old.getTime() ) /1000;
}

mauth.serverPing = function(uid){
  return true;
}
mauth.mobilePing = function(uid){
  return false;
}

function testAssociation(tab,uid,lastCall,errorMessage , isAvailable, ping ) {

  var lastCallInSeconds = getTimeInSeconds(new  Date(),lastCall);
  if (lastCallInSeconds > mauth.waitingTimeIntervalInSeconds){
      var status = ping(uid);
      lastCall = new Date();
      isAvailable = status;
      if ( status == false)
        page.tabs[tab.id].errorMessage = errorMessage;
      return status;
  }
    return isAvailable;

}


mauth.testAssociation = function (tab, triggerUnlock) {

  page.tabs[tab.id].errorMessage = "Unknown Error in the connection !!";

  if (qr.uid == null ){
    page.tabs[tab.id].errorMessage = "Please scan the code through phone !!";
    return false;
  }

  var serverStatus = testAssociation(tab,
    qr.uid,
    mauth.serverLastCall,
    "Please ensure that you are connected to Internet",
    mauth.isServerAvailable,
    serverPing );

  if ( serverStatus == false )
    return false ;

  return testAssociation(tab,
     qr.uid,
     mauth.mobileLastCall,
     "Please ensure that phone is connected to Internet",
     mauth.isMobileAvailable,
     mobilePing );

}


mauth.retrieveCredentials = function (callback, tab, url, submiturl, forceCallback, triggerUnlock) {

	page.debug("Mauth.retrieveCredentials(callback, {1}, {2}, {3}, {4})", tab.id, url, submiturl, forceCallback);

	page.tabs[tab.id].errorMessage = null;

	// is browser associated to keepass?
	if(!mauth.testAssociation(tab, triggerUnlock)) {
		browserAction.showDefault(null, tab);
		if(forceCallback) {
			callback([]);
		}
		return;
	}

  var request = {
    "uid":qr.uid,
    "url":url,
    "submitUrl":submiturl
  };

	var result = network.send(request,mauth.getCredentials);
	var status = result[0];
	var response = result[1];
	var entries = [];

	if(mauth.checkStatus(status, tab)) {
		var r = JSON.parse(response);
    console.log("The calling of the retrieveCredentials being called ");
    for ( var i =0 ; i < r.length ; i++){
    }
    entries = r;

    if ( entries.length == 0){
      console.log("The length of the possible credentials that can be inserted is zerpo");
      browserAction.showDefault(null,tab);
    }
	}
	else {
		browserAction.showDefault(null, tab);
	}
	page.debug("keepass.retrieveCredentials() => entries.length = {1}", entries.length);
	callback(entries);
}
mauth.checkStatus = function (status, tab) {
	var success = (status >= 200 && status <= 299);
	mauth.isMobileAvailable = true;
	mauth.isServerAvailable = true;

	if(tab && page.tabs[tab.id]) {
		delete page.tabs[tab.id].errorMessage;
	}

	if (!success) {
		keepass.associated.value = false;
		keepass.associated.hash = null;
		if(tab && page.tabs[tab.id]) {
			page.tabs[tab.id].errorMessage = "Unknown error: " + status;
		}
		console.log("Error: "+ status);

		if (status == 503) {
			keepass.isMauthMobileAvailable = false;
			console.log("Mobile is not connected !! Please try again");
			if(tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "Mobile is not connected.";
			}
		}
		else if (status == 0) {
			keepass.isMauthServerAvailable = false;
			console.log("Could not connect to Server !! Please check the internet connection");
			if(tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "Please check the internet connection";
			}
		}
	}

	page.debug("Mauth.checkStatus({1}, [tabID]) => {2}", status, success);

	return success;
}


mauth.isConnectedUrl = mauth.pluginUrlDefault + "/isconnected";
mauth.testAssociationPromise = function ( uid, tab ){

        return new Promise( function (resolve,reject){

            var checkConnectionRequest = {
                "uid":uid,
                "deviceType":"browser",
                "ping":"mobile"
                };


            var connected = false;

            page.tabs[tab.id].errorMessage = error.UnknownErrorInConnection;
            if ( qr.uid === uid &&  getTimeInSeconds(new Date(), mauth.server.lastCall) < mauth.waitingTimeIntervalInSeconds ) {
                    connected = mauth.isAssociated();
            }
            else {
                var result = network.send(checkConnectionRequest, mauth.isConnectedUrl);
                if (result === null) {
                    page.tabs[tab.id].errorMessage = error.ServerNotReachable;
                    connected = false;
                    updateStatus(false,false,new Date(),new Date());

                }
                else if ( result[0]  === 200 )  {
                        connected = result[1]["mobileAlive"];
                        if ( !result[1]["mobileAlive"] )
                            page.tabs[tab.id].errorMessage = error.MobileNotConnected;
                        updateStatus(connected,true,result[1]["lastTimeMobileSync"],new Date());
                }
            }

            if ( connected )
                resolve();
            else
                reject();

        } );
}
