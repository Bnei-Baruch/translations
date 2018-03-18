///////////////////////////////
// OidcClient config
///////////////////////////////
Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.INFO;
var client = null;

function oidcLogin() {
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
			//client.signinRedirect();
			window.location = "/login";
		} else {
			console.log("Hi: ",user.profile);
			var at = KJUR.jws.JWS.parse(user.access_token);
			console.log(at);
			var roles = at.payloadObj.realm_access.roles;
			if(roles.filter(role => role.match(/^(bb_user|trl_user)$/)).length > 0) {
				trluser = user.profile;
				checkDevices();
			} else {
				console.log("User role does not authorized");
				trluser = user.profile;
				checkDevices();
			}
		}
	}).catch(function(error) {
		console.log("Error: ",error);
	});
}
