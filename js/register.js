///////////////////////////////
// OidcClient config
///////////////////////////////
Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.INFO;
var client = null;

localStorage.path = "main";

var settings = {
	authority: 'https://accounts.kbb1.com/auth/realms/main',
	client_id: 'trl',
	redirect_uri: 'https://trl.kbb1.com/',
	post_logout_redirect_uri: 'https://trl.kbb1.com/login',
	response_type: 'id_token token',
	scope: 'profile',

	filterProtocolClaims: true,
	loadUserInfo: true
};
client = new Oidc.UserManager(settings);

client.getUser().then(function(user) {
	console.log("User: ",user);
	if(user === null) {
		client.signinRedirect();
	} else {
		var path = localStorage.path;
		window.location = "/"+path;
	}
}).catch(function(error) {
	console.log("Error: ",error);
})
