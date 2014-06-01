$(function() {

	var timer; // for throttling scroll event

	var navSearchActive = false;
	var mainSearchActive = false;

	var cardsDiv = $('.results').offset().top; // get top of cards div

	console.log("LOADED");

	// async retrieval of LinkedIn API
	$.getScript('http://platform.linkedin.com/in.js?async=true', function()
	{
		IN.init({
			onLoad: onLinkedInLoad(),
			api_key: '77lw834nbnef0f',
			authorize: true
		});
	});

	// controls when nav bar is displayed.
	// will display once past top of results div
	$(window).on('scroll', function(){
		if (timer) {
			clearTimeout(timer);
		} 

		timer = setTimeout(function(){
			var currPos = $(window).scrollTop();

			// if above results div
			if (currPos < cardsDiv) {

				$('.nav, .nav-banner').removeClass("scrolled");

				// $('.nav-search').hide("slow");
				if (!$('#nav-searchBar').is(':focus')) {
					$('.nav-search').removeClass('active');
				}

				$('.signin-text').removeClass('scrolled');
			}

			// if screen at top of results div
			if (currPos+60 >= cardsDiv) {
				
				$('.nav, .nav-banner').addClass("scrolled");

				// $('.nav-search').show("slow");

				$('.nav-search').addClass('active');

				$('.signin-text').addClass('scrolled');
			}
		}, 10);
	});


	// code for animating timeline div down with arrow pointing to item
	// clicked on
	// ---------------------------------------------------------------------------------
	$('.item').click(function(){
		console.log("click item");

		if ($('.bottom').length > 0) {
			$('.bottom, .arrow-up').remove();
		}

		$(this).after('<div class="arrow-up"></div><div class="bottom"></div>');

		$('.arrow-up').css('margin-left', $(this).offset().left + $(this).width()/5);

		$('.bottom').animate({
			height: "toggle"
		}, 500);
	});

	$(document).mouseup(function(e){
		var divToHide = $('.bottom');

		if(!divToHide.is(e.target)
		&& divToHide.has(e.target).length === 0) {
			$('.bottom, .arrow-up').animate({
				height: "toggle"
			}, 500);
		}
	});
	// ---------------------------------------------------------------------------------
	

	function onLinkedInLoad() {
		IN.Event.on(IN, "auth", function() {			
			onLinkedInLogin();
		}); // on authorization, perform onLinkedInLogin		
	}

	function onLinkedInLogin() {
		// console.log(IN.User.isAuthorized());
		if (IN.User.isAuthorized()) { // if user is authorized... 
			$('.login-button, .signin-button').hide(); // hide login button
			// get users profile and send result to postData()
			IN.API.Profile("me")
			.fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline")
			.result( function(me) {
				postData(me["values"][0]); // will attempt to insert results into DB
			})
			.error(function(err) {
	    		alert(err);
		    });
		} else {

			$('.login-button').show(); // if not authorized, show login button
		}

	}

	// gets all user data in the form of rendered html
	function getAllUsers() {

		$.ajax({
			type: 'GET',
			url: '/all',
			success: function(data){

				$('.list').html(data); // clears and replaces html with the rendered html received

				getData();
				getUnregisteredUsers();
				
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});

	}

	// will get all entries in the DB 'unregistered'
	// and put them onto the screen beneath the registered
	// users
	function getUnregisteredUsers() {
		
		$.ajax({
			type: 'GET',
			url: '/unregistered',
			success: function(data){

				$('.list').append(data); // append new html to previous html
				
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// gets all user data in the form of JSON
	// and then use that to populate the map with
	// pins and individual tiles with info
	function getData() {
		$.ajax({
			type: 'GET',
			url: '/map-pins',
			success: function(data){
				if (data.length > 0){

					getLocations(data); // put map pins onto Google Map
					populateProfiles(data); // put picture and general info on persons card
				};
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// gets user data based on a search criteria and sent back as
	// rendered html
	function searchRequest(searchCriteria) {

		$.ajax({
			type: 'GET',
			url: '/search/'+searchCriteria,
			success: function(data) {
				if (data.length > 0) {

					// check if being called from navBar search
					// if it is then populate drop down menu underneath with results
					// else...
					$('.results').html(data); // if returned something, fill html with results from search
					

					// $('.item').addClass("hidden");

					// $(document.body).on('appear', '.item', function(e, $affected) {
				 //    	// add class called “appeared” for each appeared element
					// 	$(this).addClass("appeared");
					// 	console.log("appearing");
					// });
					// $('.item').appear({force_process: true});
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// still requires some performance for smooth interaction
	// $(document.body).on('appear', '.item', function(e, $affected) {
 //    	// add class called “appeared” for each appeared element
	// 	$(this).addClass("appeared");
	// });

	// $('.item').appear({force_process: true});

	// takes in JSON data (LinkedIn results) and sends that to node server
	// to be inserted into DB
	function postData(data) {
		
		$.ajax({
			type: 'POST',
			url: '/request',
			data: JSON.stringify(data), // sends back JSON string
			contentType: "application/json; charset=utf-8",
			success: function(res){
				if (res === "Already exists") {
					// console.log("in DB");
				} else if (res === "invalid") {
					// console.log("Invalid user");

					$('.alert').children('.alert-text').html("Not a Wheaton CS Alumnae/i");
					
					$('.alert').addClass("active");

					setTimeout(function(){
						$('.alert').removeClass("active");
						// $('.alert').children('.alert-text').html("Already Registered").delay(1000);
					}, 2000);

				} else {
					getAllUsers(); // refresh page with new user				
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	};

	// will perform search in DB given the string in the input field
	function performSearch() {

		var searchCriteria = $('#searchBar').val() || $('#nav-searchBar').val(); // get value of search field

		if (searchCriteria.length > 0) {

			// check if being called from navBar search
			// if it is then empty drop down menu underneath
			// else...
			$('.list').empty();
			searchRequest(searchCriteria);

		} else {
			getAllUsers();
		}
	}

	// whenever input field changes, query for users
	$('#searchBar').on('input', function(){
		$('.input-field').addClass("active");
		performSearch();
	});

	$('#nav-searchBar').on('input', function(){
		$('.input-field').addClass("active");
		performSearch(); // do this for now until performNavBarSearch is implemented
		// performNavBarSearch();
	})

	// maps setup
    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

	function bindInfoWindow(marker, map, infowindow, html) {
	    google.maps.event.addListener(marker, 'click', function() {
	        infowindow.setContent(html);
	        infowindow.open(map, marker);
	    });
	} 

	// will pin pins onto the map based on user location given by the LinkedIn API
    function getLocations(userData) {

		// var service = new google.maps.places.PlacesService(map);

		var location;
		var name;
		var marker;
		var infowindow;


    	for (var i = 0; i < userData.length; i++) {
    		
    		var that;
    		// var location;
    		// var name;
    		// var marker;
    		// var infowindow;

    		// if no location data, break
			if (!userData[i].location) {
				break;
			}

			// checks to see if user is in Greater Boston Area
			// if they are then set the location to "Boston, MA"
			if (userData[i]["location"]["name"].indexOf("Boston") != -1) {
				location = "Boston, MA";
			} else {
				// otherwise, use the location data from LinkedIn
				location = userData[i]["location"]["name"];
			}

			name = userData[i]["firstName"] + " " + userData[i]["lastName"];

			// console.log("FOR LOOP NAME: "+name);

			infowindow = new google.maps.InfoWindow({"content": name});

			console.log("FORLOOP: "+infowindow["content"]);

			// pins the locations onto the map (from Google documentation)
			geocoder.geocode( {"address": location}, function(results, status) {
			    if (status == google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);

					// set up maps pin
					marker = new google.maps.Marker({
						map: map,
						animation: google.maps.Animation.DROP,
						position: results[0].geometry.location
					});

					console.log(infowindow["content"]);

					bindInfoWindow(marker, map, infowindow, infowindow["content"]);

					// brings up name of person associated with pin
					//    google.maps.event.addListener(marker, 'click', function() {
					// 	infowindow.setContent(name);
					// 	infowindow.open(map, this);
					// });

			    } else {
			     	console.log('Geocode was not successful for the following reason: ' + status);
			    }
			});
		};
	};

	// populates individual cards
	function populateProfiles (userData){

		// checks if data passed in is a JSON object
		if ($.isPlainObject(userData)){

			// for each item, fill the picture src with value in JSON
			$.each(userData, function(item, value){
				var picture = value["pictureUrls"]["values"][0];

				$("#"+value.id).attr("src", picture);
			});
		}
	};

	function initialize() {
	  	geocoder = new google.maps.Geocoder();
	  	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
		
		getAllUsers();

	}

    google.maps.event.addDomListener(window, 'load', initialize);
});
