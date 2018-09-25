# BGG Active Auction Search

This App can be used to search all active Auction Geek Lists against your Wishlist.

## Setup Instructions

- Install Node.JS from https://nodejs.org/en/download/
- Run `npm install`
- Run `npm start`

To use the Active Auction Search tool point to `http://localhost:8000/#!/bgg`

To use the Collection tool point to `http://localhost:8000/#!/collection`

To use the Wishlist Market tool point to `http://localhost:8000/#!/market`

Input your BGG username and submit. The app takes a few minutes to run, but data will be live as soon as the fist entry comes in.

## Known Issues

Because of the XML API caching, you may have to submit a couple of time before data will start to arrive. You should only have to do this for the initial run against any user ID. Just push submit a couple of times then wait.

## Screen Shot

![Screenshot](https://cf.geekdo-images.com/images/pic3590958.png)

![Screenshot](https://cf.geekdo-images.com/images/pic3590959.png)

