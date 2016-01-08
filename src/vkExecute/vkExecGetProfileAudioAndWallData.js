/* globals API, Args */
var response = {};

// Getting user's audios and info about user
var userAudios = API.audio.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "owner_id": Args.owner_id,
    "v": 5.40,
    "count": 20
});
response.userAudios = userAudios;

// Getting user's audios count
var userAudiosCount = API.audio.getCount({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "owner_id": Args.owner_id});
response.userAudiosCount = userAudiosCount;

// Getting posts from user's wall
var wallPosts = API.wall.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "owner_id": Args.owner_id,
    "v": 5.40,
    "count": 20
});
response.wallPosts = wallPosts;

return response;