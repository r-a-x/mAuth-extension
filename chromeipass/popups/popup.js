
function status_response(r) {

	hideAll();
	console.log(r);

	if ( r.isMobileAvailable && r.isServerAvailable){
		$('#connected-and-associated').show();
		$('#associated-identifier').html(r.mobileName);
		$('#reconnect-button-qr-regenerate').show();
	}
	else if ( !r.associated && r.isServerAvailable){
		$('#connected-not-associated').show();
		$('#unassociated-identifier').html(r.identifier);
		$('#connect-button').show();
	}
	else if ( !r.isServerAvailable ){
		$('#error-encountered').show();
		$('#error-message').html("No Internet Connection or the Server is down");
		$('#connect-button').show();
	}
	else if ( !r.isMobileAvailable){
		$('#error-encountered').show();
		$('#error-message').html(r.error);
		$('#reconnect-button-qr-regenerate').show();
	}

}


function qrCodeRegenerateResponse(r){
	
	console.log("The object returned from the Callback, Let's see what happends");
	hideAll();

    $('#identifier').show();
	$('#identifier').html(r.identifier);
	// $('#identifier').html("Yes it should be displayed !!!");
	$('#reconnect-button-connect').show();
    $('#reconnect-button-qr-regenerate').hide();

}




	chrome.extension.sendMessage(
		{action: "get_status"}, status_response
	);


function hideAll(){
    $('#initial-state').hide();
    $('#error-encountered').hide();
    $('#need-reconfigure').hide();
    $('#not-configured').hide();
    $('#configured-and-associated').hide();
    $('#configured-not-associated').hide();
    $('#connect-button').hide();
    $('#reconnect-button-connect').hide();
    $('#reconnect-button-qr-regenerate').hide();
}


function init(){

    $("#redetect-fields-button").click(function() {
        chrome.tabs.query({"active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT}, function(tabs) {
            if (tabs.length === 0)
                return; // For example: only the background devtools or a popup are opened
            var tab = tabs[0];

            chrome.tabs.sendMessage(tab.id, {
                action: "redetect_fields"
            });
        });
    });


    $("#connect-button").click(function(){
        console.log("The connect button is called");
        chrome.extension.sendMessage({
            action:"connect",
        },status_response);
    });


    $("#reconnect-button-connect").click(function() {
        console.log("The reconnect-connect button is pressed");

        chrome.extension.sendMessage({
            action:"reconnect"
            },status_response
        );

    });


    $("#reconnect-button-qr-regenerate").click(function(){
        console.log("The Reconnect-qr  button is pressed");

        chrome.extension.sendMessage({
				action:"regenerate_qr"
			},qrCodeRegenerateResponse
		);

    });

}


if(window.attachEvent) {
    window.attachEvent('onload', init);
}
else {
    if(window.onload) {
        var curronload = window.onload;
        var newonload = function(evt) {
            curronload(evt);
            init();
        };
        window.onload = newonload;
    } else {
        // window.onload = yourFunctionName;
        window.onload = init;
    }
}