let listCheckboxElts = document.querySelectorAll('.resto-review-filter input[type=checkbox]'),
    listResto = {},
    map;
            
const pos = { lat: 16.237769, lng: -61.603356 },
    listRatingsClass = ['star-one', 'star-two', 'star-three', 'star-four', 'star-five'];

let hideReviews = function(event) {
    let restoElt = event.currentTarget,
        targetElt = event.target.parentNode;

    if(targetElt.className !== 'resto-add-review' && targetElt.className !== 'rating-review' && event.target.className !== 'resto-add-review') {     
        restoElt.addEventListener('click', displayReviews);
        restoElt.removeEventListener('click', hideReviews);
        
        let listReviewsElt = restoElt.getElementsByClassName('resto-list-reviews')[0];
            imgRestoElt = restoElt.getElementsByClassName('resto-img')[0];

        restoElt.removeChild(listReviewsElt);
        
        if(imgRestoElt) {
            restoElt.removeChild(imgRestoElt);
        }

        let restoData = listResto[restoElt.dataset.id];
        restoData.infoWindow.close();
    }
};

let displayReviews = function(event) {
    let restoElt = event.currentTarget;
    restoElt.removeEventListener('click', displayReviews);
    restoElt.addEventListener('click', hideReviews);
    
    const indexResto = restoElt.dataset.id,
            resto = data[indexResto],
            reviewsLen = resto['ratings'].length;

    ajaxGet('https://maps.googleapis.com/maps/api/streetview/metadata?size=400x400&location='+resto['lat']+','+resto['long']+'&key=AIzaSyBtcuVEmXSLRFWAS07yCPNqnunLfgYgju4', function(reponse) {
        let imgMetaData = JSON.parse(reponse),
            listReviewsElt = restoElt.querySelector('.resto-list-reviews');

        if(imgMetaData.status == 'OK') {
            let imgStreetView = new Image();

            imgStreetView.addEventListener('load', function() {
                imgStreetView.className = 'resto-img';
                restoElt.insertBefore(imgStreetView, listReviewsElt);
            });

            imgStreetView.src = 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location='+resto['lat']+','+resto['long']+'&key=AIzaSyBtcuVEmXSLRFWAS07yCPNqnunLfgYgju4'; 
        }
    });

    createFormReview(restoElt);
    
    for(let i = 0; i < reviewsLen; i++) {
        let review = resto['ratings'][i];
        createReview(review, restoElt);
    }

    if(resto.placeId && reviewsLen < 1) {
        const requestDetail = {
            placeId: data[indexResto].placeId,
            fields: ['reviews']
        };

        let service = new google.maps.places.PlacesService(map);
    
        service.getDetails(requestDetail, function(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                let reviews = place.reviews;

                for(let i = 0; i < reviews.length; i++) {
                    let review = {
                        'comment': reviews[i].text, 
                        'stars': reviews[i].rating
                    };
                    
                    data[indexResto]['ratings'].push(review);
                    createReview(review, restoElt);
                }
            }
        });
    }

    let restoData = listResto[indexResto];
    restoData.infoWindow.open(map, restoData.marker);
};

let filterResto = function() {
    const listNotations = ['horrible', 'mediocre', 'moyen', 'tres-bien', 'excellent'];
    let checkedRatings = [];
    
    for(let c = 0; c < listCheckboxElts.length; c++) {
        let checkboxElt = listCheckboxElts[c];
        
        if(checkboxElt.checked) {
            let notation = checkboxElt.name,
                rating = listNotations.indexOf(notation) + 1;
            
            checkedRatings.push(rating);
        }
    }

    for(let c = 0; c < data.length; c++) {
        let resto = data[c],
            checked = checkedRatings.indexOf(resto['rating']);
        
        if(checked == -1) {
            deleteResto(c);
        } else {
            createResto(resto, c);
        }
    }
};

function addComment(formElt, restoElt) {
    let idResto = restoElt.dataset.id,
        fieldRatingElt = formElt.querySelector('.field-rating-review'),
        fieldCommentElt = formElt.querySelector('.field-content-review');
    
    let review = {
        'stars': Number(fieldRatingElt.value),
        'comment': fieldCommentElt.value
    };
    
    data[idResto]['ratings'].push(review);
    data[idResto]['rating'] = getAverage(data[idResto]);
    createReview(review, restoElt);

    fieldRatingElt.value = '';
    fieldCommentElt.value = '';

    let starAverage = restoElt.querySelector('.resto-star-average'),
        average = data[idResto]['rating'];
    
    starAverage.className = '';
    starAverage.classList.add('resto-star-average');
    starAverage.classList.add('icon-star');
    starAverage.classList.add(listRatingsClass[average - 1]);
}

function createFormReview(restoElt) {
    let idResto = restoElt.dataset.id;
    
    let formElt = document.createElement('form');
    formElt.className = 'resto-add-review';

    let tag = '<div class="rating-review">';
        tag += '<label for="rating-review'+idResto+'">Note :</label>';
        tag += '<input class="field-rating-review" id="rating-review'+idResto+'" name="rating-review" type="number" min="1" max="5" data-tooltip="tooltip-rating"/>';
        tag += '</div>'
        tag += '<textarea class="field-content-review" name="msg-review" placeholder="Partager votre expériance concernant ce lieu" data-tooltip="tooltip-review-content"></textarea>';
        tag += '<input class="btn-publish-review" type="button" value="Publier" />';
        
        tag += '<br /><div class="tooltip" id="tooltip-rating">Vous devez noter entre 1 et 5 etoiles</div>';
        tag += '<br /><div class="tooltip" id="tooltip-review-content">Le message est invalide</div>';
    
    formElt.innerHTML = tag;
    
    let btnPublishElt = formElt.querySelector('.btn-publish-review');
    btnPublishElt.addEventListener('click', function() {
        let result = true,
            checkAddReview = check['add-review'];

        for(let id in checkAddReview) {
            result = checkAddReview[id](formElt, id) && result;
        }

        if(result) {
            addComment(formElt, restoElt);
        }
    });

    let listReviewsElt = restoElt.getElementsByClassName('resto-list-reviews')[0];
    
    if(!listReviewsElt) {
        listReviewsElt = document.createElement('div');
        listReviewsElt.className = 'resto-list-reviews';
        restoElt.appendChild(listReviewsElt);
    }
    
    listReviewsElt.appendChild(formElt);
}

function getAverage(data) {
    let reviewsLen = data['ratings'].length,
        sum = 0;
    
    for(let i = 0; i < reviewsLen; i++) {
        let review = data['ratings'][i];
        sum += review['stars'];
    }

    return Math.round(sum / reviewsLen);
}

function createReview(review, restoElt) {
    const rating = review['stars'] - 1;
    
    let tag = '<i class="icon-star '+listRatingsClass[rating]+'"></i>';
        tag += '<p>'+review['comment']+'</p>';

    let reviewElt = document.createElement('div');
    reviewElt.className = 'resto-reviews';
    reviewElt.innerHTML = tag;

    let listReviewsElt = restoElt.querySelector('.resto-list-reviews'),
        referenceNodeElt = restoElt.querySelector('.resto-add-review');

    listReviewsElt.insertBefore(reviewElt, referenceNodeElt);
}

function createResto(resto, idResto) {
    if(!(idResto in listResto)) {
        let marker = new google.maps.Marker({
            position: {
                lat: resto.lat,
                lng: resto.long
            },

            map: map
        });
        
        if(!('rating' in resto)) {
            resto['rating'] = getAverage(resto);
        }

        let tag = '<header>';
        tag += '<i class="resto-star-average icon-star '+ listRatingsClass[resto['rating'] - 1] +'"></i>';
        tag += '<h3 class="resto-titre">' + resto['restaurantName'] + '</h3>';
        tag += '<p class="resto-adress"><strong>Adresse : </strong>' + resto['address'] + '</p>'
        tag += '</header>';

        let articleElt = document.createElement('article');
        articleElt.className = 'resto';
        articleElt.innerHTML = tag;
        articleElt.dataset.id = idResto;
        articleElt.addEventListener('click', displayReviews);
        
        let listRestaurantsElt = document.getElementsByClassName('list-restaurants')[0];
        listRestaurantsElt.appendChild(articleElt);

        const infowindow = new google.maps.InfoWindow({content: tag});

        marker.addListener('click', function() {
            infowindow.open(map, marker);
        });
        
        listResto[idResto] = {
            elt: articleElt,
            marker: marker,
            infoWindow: infowindow
        };
    }
}

function deleteResto(idResto) {
    if(idResto in listResto) {
        let resto = listResto[idResto];
        
        listRestaurantsElt = document.getElementsByClassName('list-restaurants')[0];
        listRestaurantsElt.removeChild(resto.elt);
        resto.marker.setMap(null);
        delete listResto[idResto];
    }
}

function ajaxGet(url, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.addEventListener('load', function () {
        if(req.status >= 200 && req.status < 400) {
            callback(req.responseText);
        } else {
            console.error(req.status + ' ' + req.statusText + ' ' + url);
        }
    });
    
    req.addEventListener('error', function () {
        console.error('Erreur réseau avec l\'URL ' + url);
    });
    
    req.send(null);
}

//La fonction initMap est executée par le sdk de google map
function initMap() {
    //Je crée un objet Map et je lui envoie en parametre un element html
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11
    });

    //Je verifie si la collection d'objet navigator dispose de l'objet geolocation
    if("geolocation" in navigator) {
        //J'appelle la methode getCurrentPosition de l'objet geolocation afin de retrouver la position de l'utilisateur
        //après son autorisation via la fonction de callback
        navigator.geolocation.getCurrentPosition(function(position) {
            if(!pos) {
                //J'enregistre la position dans un tableau
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            }

            //Je centre la carte sur la position de l'utilisateur
            map.setCenter(pos);

            //Je crée un marqueur sur la position de l'utiilisateur egalement
            const marker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: './imgs/marker-green.png'
            });

            let service = new google.maps.places.PlacesService(map);

            let request = {
                location: new google.maps.LatLng(pos.lat, pos.lng),
                radius: 50000,
                query: 'restaurant'
            };

            service.textSearch(request, function(results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        let place = results[i];

                        let resto = {
                            "restaurantName": place.name,
                            "address": place.formatted_address,
                            "lat": place.geometry.location.lat(),
                            "long": place.geometry.location.lng(),
                            "placeId": place.place_id,
                            "ratings": [],
                            "rating": Math.round(place.rating)
                        };
                        
                        data.push(resto);
                    }

                    for(let i = 0; i < data.length; i++) {
                        createResto(data[i], i);
                    }
                }
            });
    
            //Option de filtrage
            for(let i = 0; i < listCheckboxElts.length; i++) {
                let checkboxElt = listCheckboxElts[i];
                checkboxElt.addEventListener('change', filterResto);
                //Pour chaque checkbox le callback filterResto est executé au moment que l'utilisateur change leurs états
            }
        });
    } else {
        console.error('La geolocation est indisponible');
    }
}

let btnPointerElt = document.getElementsByClassName('btn-pointer-resto')[0];
btnPointerElt.addEventListener('click', function() {
    map.addListener('click', function(event) {
        let mapMouseEvent = event,
            latLng = mapMouseEvent.latLng;

        const positionCursor = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };

        let latFielddElt = document.querySelector('.resto-field-coordinate-lat input');
        latFielddElt.value = positionCursor.lat;

        let longFielddElt = document.querySelector('.resto-field-coordinate-long input');
        longFielddElt.value = positionCursor.lng;  

        google.maps.event.clearInstanceListeners(map);
    });
});


let check = {
    'add-form': {},
    'add-review': {}
};

check['add-review']['rating'] = function(formElt) {
    let fieldRatingElt = formElt.querySelector('.field-rating-review'),
        tooltipStyle = getTooltip(fieldRatingElt).style;
    
    let ratingValue = parseInt(fieldRatingElt.value);

    if(!isNaN(ratingValue) && ratingValue > 0 && ratingValue <= 5) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
};

check['add-review']['content-review'] = function(formElt) {
    let fieldCommentElt = formElt.querySelector('.field-content-review'),
        tooltipStyle = getTooltip(fieldCommentElt).style;
    
    if (fieldCommentElt.value.length >= 5) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
};

check['add-form']['resto-name'] = function() {
    let fieldRestoNameElt = document.querySelector('.resto-field.resto-name input'),
        tooltipStyle = getTooltip(fieldRestoNameElt).style;

    if (fieldRestoNameElt.value.length >= 2) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
};

check['add-form']['lat'] = function() {
    let fieldRestoLatElt = document.querySelector('.resto-field-coordinate .resto-field-coordinate-lat input'),
        tooltipStyle = getTooltip(fieldRestoLatElt).style,
        latValue = parseFloat(fieldRestoLatElt.value);
    
    if (!isNaN(latValue)) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
};

check['add-form']['long'] = function() {
    let fieldRestoLongElt = document.querySelector('.resto-field-coordinate .resto-field-coordinate-long input'),
        tooltipStyle = getTooltip(fieldRestoLongElt).style,
        longValue = parseFloat(fieldRestoLongElt.value);

    if (!isNaN(longValue)) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
}

check['add-form']['resto-adress'] = function() {
    let fieldRestoAdressElt = document.querySelector('.resto-field.resto-adress textarea'),
        tooltipStyle = getTooltip(fieldRestoAdressElt).style;

    if (fieldRestoAdressElt.value.length >= 5) {
        tooltipStyle.display = 'none';
        return true;
    } else {
        tooltipStyle.display = 'inline-block';
        return false;
    }
};

function getTooltip(element) {
    let tooltypeId = element.dataset.tooltip,
        tooltypeElt = document.getElementById(tooltypeId);

    if(tooltypeElt) {
        return tooltypeElt;
    }

    return false;
}

let btnAddRestoElt = document.getElementsByClassName('btn-publish-review')[0];
btnAddRestoElt.addEventListener('click', function() {
    let result = true,
        checkAddForm = check['add-form'];
    
    for(let id in checkAddForm) {
        result = checkAddForm[id](id) && result;
    }
    
    if(result) {
        let fieldElts = {
            nameFieldElt: document.querySelector('.resto-field.resto-name input'),
            latFieldElt: document.querySelector('.resto-field-coordinate .resto-field-coordinate-lat input'),
            longFieldElt: document.querySelector('.resto-field-coordinate .resto-field-coordinate-long input'),
            contentFieldElt: document.querySelector('.resto-field.resto-adress textarea')
        };

        let resto = {
            "restaurantName": fieldElts.nameFieldElt.value,
            "address": fieldElts.contentFieldElt.value,
            "lat": Number(fieldElts.latFieldElt.value),
            "long": Number(fieldElts.longFieldElt.value),
            "ratings": []
        };
    
        data.push(resto);
        createResto(resto, data.length - 1);

        fieldElts.nameFieldElt.value = '';
        fieldElts.contentFieldElt.value = '';
        fieldElts.latFieldElt.value = '';
        fieldElts.longFieldElt.value = '';
    }
})

/* Debug

let fieldElts = {
    nameFieldElt: document.querySelector('.resto-field.resto-name input'),
    latFieldElt: document.querySelector('.resto-field-coordinate .resto-field-coordinate-lat input'),
    longFieldElt: document.querySelector('.resto-field-coordinate .resto-field-coordinate-long input'),
    contentFieldElt: document.querySelector('.resto-field.resto-adress textarea')
};

fieldElts.nameFieldElt.value = 'Le Lamentin';
fieldElts.contentFieldElt.value = 'Route de Monmier';
fieldElts.latFieldElt.value = 16.177025775919663;
fieldElts.longFieldElt.value = -61.668930645996085;*/