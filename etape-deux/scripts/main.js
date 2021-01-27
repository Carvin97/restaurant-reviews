class Entity {
    constructor(entityData) {
        if (this.constructor !== Entity) {
            throw new TypeError('Abstract class "Entity" cannot be instantiated directly');
        }
        
        this.hydrate(entityData);
    }

    hydrate(data) {
        for (let key in data) {
            let method = 'set' + key.charAt(0).toUpperCase() + key.substring(1);
            
            if(method in this) {
                if(typeof data[key] != 'undefined') 
                    this[method](data[key]);
            }
        }
    }
}

class Rating extends Entity {
    constructor(ratingData) {
        this.stars = 0;
        this.comment = '';

        super(ratingData);
    }

    setStars(stars) { this.stars = stars; }
    setComment(comment) { this.comment = comment; }
}

class Restaurant extends Entity {
    constructor(restaurantData) {
        this.restaurantName = '';
        this.address = '';
        this.lat = 0;
        this.long = 0;
        this.ratings = [];

        super(restaurantData);
    }

    setRestaurantName(restaurantName) { this.restaurantName = restaurantName; }
    setAddress(address) { this.address = address; }
    setLat(lat) { this.lat = lat; }
    setLong(long) { this.long = long; }
    
    setRating(ratings) {
        for(let i = 0; i < ratings.length; i++) {
            this.addRating(ratings[i]);
        }
    }

    addRating(ratingData) {
        let rating = new Rating(ratingData);
        this.ratings.push(rating);
    }
}

class HTMLFormaterInterface {
    constructor(entity) {
        if (this.constructor !== HTMLFormaterInterface) {
            throw new TypeError('Interface "HTMLFormaterInterface" cannot be instantiated directly');
        }
        
        this.entity = entity;
    }

    format() {
        throw new Error('You must implement this function');
    }
}

class RestaurantManager {
    constructor(HTMLFormater) {
        if (typeof HTMLFormater['format'] !== 'function') {
            throw new TypeError("Le paramètre n'est pas un HTMLFormater");
        }

        this.HTMLFormater = HTMLFormater;
    }

    add() {
        
    }

    delete() {

    }
}