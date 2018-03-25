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
			var path = localStorage.path;
			var bbrole = roles.filter(role => role.match(/^(bb_user)$/)).length;
			var trlrole = roles.filter(role => role.match(/^(trl_user)$/)).length;
			var adminrole = roles.filter(role => role.match(/^(trl_admin)$/)).length;

			if(trlrole > 0 && path.match(/^(main|mini|\/main\/|\/mini\/)$/)) {
				trluser = user.profile;
				checkDevices();
			}

			if(bbrole > 0 && path.match(/^(chat|\/chat\/)$/)) {
				trluser = user.profile;
				initApp();
			}

			if(adminrole > 0 && path.match(/^(admin|\/admin\/)$/)) {
				trluser = user.profile;
				initApp();
			}

			if(trlrole == 0 && path.match(/^(main|mini|\/main\/|\/mini\/)$/)) {
				console.log("User role does not authorized");
				trluser = user.profile;
				checkDevices();
			}

			if(adminrole == 0 && path.match(/^(admin|\/admin\/)$/)) {
				console.log("User role does not authorized");
				trluser = user.profile;
				bootbox.alert("User does not have permission", function() {
					window.location = "/login";
				});
			}
		}
	}).catch(function(error) {
		console.log("Error: ",error);
	});
}
