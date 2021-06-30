const api = {
	get: async function(url, json) {
		let resp;
		if(json) {
			let params = '?';
			Object.keys(json).forEach(key => {
				if(params.length > 1) params+='&';
				params+=encodeURIComponent(key)+'='+encodeURIComponent(json[key]);
			})
			resp = await fetch(url+params, {
				credentials: "include",
				method: "GET",
			})
		} else {
			resp = await fetch(url, {
				credentials: "include",
				method: "GET" 
			})
		}
	
		return await resp.json()
	},
	post: async function(url, json) {
		let resp;
		if(json) {
			let params = "";
			Object.keys(json).forEach(key => {
				if(params.length > 1) params+='&';
				params+=encodeURIComponent(key)+'='+encodeURIComponent(json[key]);
			})
			resp = await fetch(url, {
				credentials: "include",
				method: "POST",
				headers: new Headers({
					'Content-Type': 'application/x-www-form-urlencoded'
				}),
				body: params
			})
		} else {
			resp = await fetch(url, {
				credentials: "include",
				method: "POST" 
			})
		}
	
		return await resp.json()
	}
}