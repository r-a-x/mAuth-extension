// The file responsible for handling the network requests etc
var network={}
network.timeOut = 1 ;

network.errorHandler = function(data,status,xhr){
  console.log("Oops !! Error connecting to the server");
  return xhr !== 200;
}

network.successHandler = function(data,status,xhr){
  console.log("Success the data is received from the App");
  return JSON.parse(xhr.data);
}

network.sendSync = function(url,data,successHandler,errorHandler){
  errorHandler = errorHandler || network.errorHandler;
  // return httpRequest(url,data,successHandler,errorHandler,false);
  data = JSON.stringify(data);
  console.log("The json data is"+data);
  return http(url,data);
}

function http(url ,request) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-Type", "application/json");
	try {
		page.debug("Request: {1}", request);
		xhr.send(request);
	}
	catch (e) {
		console.log("Mauth: " + e);
	}
	page.debug("Response: {1} => {2}", xhr.status, xhr.responseText);
	return [xhr.status, xhr.responseText];
}

function httpRequest(url,data,successHandler,errorHandler,isAsync){
  var responseText = $.ajax({
      url : url,
      contentType :"application/json",
      type:"POST",
      async:isAsync,
      data:JSON.stringify(data),
      // success:successHandler,
      // error : errorHandler
    }
  ).responseText;
  console.log("The resonse from the Response Tetx is " + responseText );
  return JSON.parse(responseText);
}


network.send = function(request,url) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-Type", "application/json");
	try {
		var r = JSON.stringify(request);
		page.debug("Request: {1}", r);
		xhr.send(r);
	}
	catch (e) {
		console.log("MauthHttp: " + e);
	}
	page.debug("Response: {1} => {2}", xhr.status, xhr.responseText);
	return [xhr.status, xhr.responseText];
}
