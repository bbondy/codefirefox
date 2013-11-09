Code Firefox
===========

Video tutorial site for coding Firefox and other Mozilla related technology

Setting up this project on Windows
==================================

1. Extract `third_party/redisbin.zip` to a folder on your Desktop
2. Copy `third_party/redis-win/redis.conf` to that same folder on your Desktop
3. Run redis-server passing in the command line: redis.conf (listens on port 10226)
4. Install node.js (Current Version: v0.10.20)
5. Run: npm install in the source code directory
6. Run: node app
7. Once the server is running visit localhost:22935/initData
8. Browser to localhost:22935/videos to see all of the data or localhost:22935/slug to see a specific video

Versions
========

Install node.js (Current Version: v0.10.20)
redis-server: https://github.com/MSOpenTech/redis/ (Windows based on Redis 2.6. The latest version merged in 2.6.12)
