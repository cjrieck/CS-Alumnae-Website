$(function() {

	var timer; // for throttling scroll event

	var navSearchActive = false;
	var mainSearchActive = false;

	var cardsDiv = $('.results').offset().top; // get top of cards div

	// async retrieval of LinkedIn API
	$.getScript('http://platform.linkedin.com/in.js?async=true', function()
	{
		IN.init({
			onLoad: onLinkedInLoad(),
			api_key: '77lw834nbnef0f',
			authorize: true
		});
	});

	$('.signin-button').click(function(){
		if (!IN.User.isAuthorized()){
			onLinkedInLogin();
		} else {

			// display alert that user already registered
			$('.alert').stop().animate({
				top: "0%"
			}, 300, function(){
				// displays alert for 2 seconds before
				// animating back up
				setTimeout(function () {
			        $('.alert').stop().animate({
			        	top: '-100%'
			        }, 300);
			    }, 2000);
			});
		}
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
				$('.nav-banner').stop().animate({
					'background-position-y': '5px'
				}, 300);

				$('.nav').stop().animate({
					opacity: '1.0',
					height: '60px'
				}, 300);

				$('.nav-search').hide("slow");
				$('.signin-text').removeClass('scrolled');
			}

			// if screen at top of results div
			if (currPos >= cardsDiv) {
				$('.nav-banner').stop().animate({
					'background-position-y': '0'
				}, 300);

				$('.nav').stop().animate({
					opacity: '0.94',
					height: '50px'
				}, 300);

				$('.nav-search').show("slow");
				$('.signin-text').addClass('scrolled');
			}
		}, 100);
	});


	// code for animating timeline div down with arrow pointing to item
	// clicked on
	// ---------------------------------------------------------------------------------
	// $('.item').click(function(){
	// 	console.log("click item");

	// 	if ($('.bottom').length > 0) {
	// 		$('.bottom, .arrow-up').remove();
	// 	}

	// 	$(this).after('<div class="arrow-up"></div><div class="bottom"></div>');

	// 	$('.arrow-up').css('margin-left', $(this).offset().left + $(this).width()/5);

	// 	$('.bottom').animate({
	// 		height: "toggle"
	// 	}, 500);
	// });

	// $(document).mouseup(function(e){
	// 	var divToHide = $('.bottom');

	// 	if(!divToHide.is(e.target)
	// 	&& divToHide.has(e.target).length === 0) {
	// 		$('.bottom, .arrow-up').animate({
	// 			height: "toggle"
	// 		}, 500);
	// 	}
	// });
	// ---------------------------------------------------------------------------------
	

	function onLinkedInLoad() {
		IN.Event.on(IN, "auth", function() {onLinkedInLogin();}); // on authorization, perform onLinkedInLogin
	}

	function onLinkedInLogin() {

		if (IN.User.isAuthorized()) { // if user is authorized... 
			$('.login-button').hide(); // hide login button

			// get users profile and send result to postData()
			IN.API.Profile("me")
			.fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline")
			.result( function(me) {
				console.log(me);
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
				// if ($('.email').) {};
				// $('.item').css('opacity', '1');
				// $.each('.item', function(index, value))
				
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

					$('.results').html(data); // if returned something, fill html with results from search
					$('.item').addClass("hidden");

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
	$(document.body).on('appear', '.item', function(e, $affected) {
    	// add class called “appeared” for each appeared element
		$(this).addClass("appeared");
	});
	$('.item').appear({force_process: true});

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
					console.log("in DB")
				} else if (res === "invalid") {
					$('.alert').children('.alert-text').html("Not a Wheaton CS Alumnae/i");
					$('.alert').stop().animate({
						top: "0%"
					}, 300, function(){
						// displays alert for 2 seconds before
						// animating back up
						setTimeout(function () {
					        $('.alert').stop().animate({
					        	top: '-100%'
					        }, 300);
					    }, 2000, function(){
					    	$('.alert').children('.alert-text').html("Already Registered");
					    });
					});
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
			$('.item').animate({
				opacity: 0
			}, 600, function(){
				$('.list').empty();
				searchRequest(searchCriteria);
				$('#searchBar, #nav-searchBar').val('');
			});

		} else {
			getAllUsers();
		}
	}

	// when the search button is clicked
	$('#submit').click(function(){
		mainSearchActive = true;
		performSearch();
	});

	// when enter is hit
	$('#searchBar, #nav-searchBar').keypress(function(e){
		if (e.which === 13) {
			performSearch();
		}
	});

	// maps setup
    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

	// will pin pins onto the map based on user location given by the LinkedIn API
    function getLocations(userData) {

    	var infowindow = new google.maps.InfoWindow();
		// var service = new google.maps.places.PlacesService(map);

    	for (var i = 0; i < userData.length; i++) {
    		
    		var location;

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

			var name = userData[i]["firstName"] + " " + userData[i]["lastName"];

			// pins the locations onto the map (from Google documentation)
			geocoder.geocode( {"address": location}, function(results, status) {
			    if (status == google.maps.GeocoderStatus.OK) {
			      map.setCenter(results[0].geometry.location);

			      // set up maps pin
			      var marker = new google.maps.Marker({
			          map: map,
			          animation: google.maps.Animation.DROP,
			          position: results[0].geometry.location
			      });
			    } else {
			      console.log('Geocode was not successful for the following reason: ' + status);
			    }

			    // brings up name of person associated with pin
			    google.maps.event.addListener(marker, 'click', function() {
					infowindow.setContent(name);
					infowindow.open(map, this);
				});
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

	// STRICTLY FOR TESTING
	function testData() {
		var data = [{
			id: 'adfasdfadf',
			firstName: 'Clayton',
			lastName: 'Rieck',
			pictureUrls: {
				values: ['http://momstown.ca/sites/national.momstown.espresso.furthermore.ca/files/thing1_thing2.jpg']
			}
		}];
		postData(data[0]);
	}

	function initialize() {
	  	geocoder = new google.maps.Geocoder();
	  	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
		
		getAllUsers();

		}

    google.maps.event.addDomListener(window, 'load', initialize);
});
