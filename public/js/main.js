
    // $(function() {
    // 	initialize();
    // });

    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

    function getLocations(userData) {
    	// console.log(userData[0]["location"]["name"]);
    	for (var i = 0; i < userData.length; i++) {
			geocoder.geocode( {"address": userData[i]["location"]["name"]}, function(results, status) {
				// console.log(results);
			    if (status == google.maps.GeocoderStatus.OK) {
			      map.setCenter(results[0].geometry.location);
			      var marker = new google.maps.Marker({
			          map: map,
			          position: results[0].geometry.location
			      });
			    } else {
			      console.log('Geocode was not successful for the following reason: ' + status);
			    }
			});
		};
	};

	function onLinkedInAuth() {
		IN.API.Profile("me").fields("id", "first-name", "last-name", "location", "positions","picture-url").result( function(me) {
			//var id=me.values[0].id;
			//console.log(me.values[0].lastName);
			//var fName=me.values[0].firstName
			//var lName=me.values[0].lastName
			$.ajax({
				type: 'POST',
				url: '/request',
				data: JSON.stringify(me.values[0]),
				contentType: "application/json; charset=utf-8",
				//dataType: "string",
				complete: function(){},
				processData: false,
				success: function(){
					console.log("success");
					initialize();
				},
				error: function(jqXHR, textStatus, errorThrown){
					console.log("bad: " + textStatus + ": " + errorThrown);
				}
			});
			// initialize();
		});
	};
	function populateProfiles (userData){
		console.log(userData[0]);
		var picture = userData[0]["pictureUrl"];
		$(".profile-picture").attr("src",picture);
		console.log("populated profiles")

	};

    function initialize() {
    	console.log('initializing google maps');
      	geocoder = new google.maps.Geocoder();
      	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  	    console.log("initialized map");

	    $.ajax({
	    	type: 'GET',
	    	url: '/map-pins',
	    	complete: function(){},
			success: function(data){
				// console.log(data[0]);
				getLocations(data);
				populateProfiles(data);
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
	    });
	};

    google.maps.event.addDomListener(window, 'load', initialize);