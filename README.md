Code Firefox
===========

Code Firefox is a video an exercise tutorial site for coding Firefox and other Mozilla related technologies.

Setting up this project
=======================

1. Fork ```bbondy/codefirefox``` to ```user/codefirefox```
2. Run ```git clone https://github.com/user/codefirefox``` in the required directory.
3. ```cd codefirefox``` , Move present working directory to ```codefirefox```
4. Install and setup redis
5. Run redis-server passing in the command line: redis.conf (listens on port 10226)
6. Copy data/conf.json.sample to data/conf.json, modify it appropriately
7. Install node.js (Current Version: v0.10.20)
8. Run: ```npm install``` in the source code directory
9. Run: ```node app```
10. Once the server is running visit ```localhost:22935/initData```
11. Browser to ```localhost:22935/videos``` to see all of the data or ```localhost:22935/slug``` to see a specific video

Exercise module
===============

https://github.com/bbondy/codefirefox

Running tests
=============

Tests are run using the Mocha framework. To get tests working just run:

```npm test````

Setting up redis on Windows
===========================

1. Extract `third_party/redisbin.zip` to a folder on your Desktop
2. Copy `third_party/redis-win/redis.conf` to that same folder on your Desktop

Setting up redis otherwise
==========================

1. See per platform instructions
2. Use the redis.conf from third_party/redis-win/redis.conf

Proxy note
==========

Note : In case you are behind a proxy connection, before running ```npm install``` run the following command.
```npm config set proxy http://<proxy_name or proxy_url>:<port_number>```

Versions
========

Install node.js (Current Version: v0.10.20)
redis-server: https://github.com/MSOpenTech/redis/ (Windows based on Redis 2.6. The latest version merged in 2.6.12)

Server side dependencies
========================

- Node
- express
- stylus
- jade
- async
- codecheckjs
- acorn.js
- underscore
- prettyjson

Client side dependencies
========================

- Backbone.js
- React
- RequireJS

Checklist for posting new videos
================================

- Add the video slug to data/videos.json
- Are there any links to MDN or other resources that should be added?
- Add a postedDate field to the JSON file
- Run `npm test`
- Subtitle the live in English from the local server
- Or alternatively, at least watch the video on the locally deployed server (sometimes ScreenFlow doesn't encode properly)
- Add to git and push
- Pull in on codefirefox.com
- Double check live video is live
- Post link on @codefirefox twitter
- Add link for translations to Mozilla team Amara site: http://www.amara.org/en/teams/add/video/mozilla/

