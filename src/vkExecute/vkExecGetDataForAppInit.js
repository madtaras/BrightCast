/* globals API, Args */
var response = {};

// Getting user name and small(50x50) avatar
var userInfo = API.users.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "name_case": "Nom",
    "fields": "photo_50",
    "v": 5.40})[0];
response.userInfo = userInfo;


// Getting user's audios
var userAudios = API.audio.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "count": 40});
response.userAudios = userAudios;

// Getting user's audios count
var userAudiosCount = API.audio.getCount({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "owner_id": Args.user_id});
response.userAudiosCount = userAudiosCount;

// Getting friends with opened audio
var friendsWithOpenedAudios = [];
var allFriendsArray = API.friends.get( {user_id: Args.user_id} );
var allFriendsString = "";
// converting arrFriendsArray to string
while (allFriendsArray.length) {
    allFriendsString = allFriendsString + allFriendsArray.shift();
}
// getting can_see_audio field
allFriendsArray = API.users.get({
    "user_ids": allFriendsString,
    "fields": "can_see_audio",
    "access_token": Args.access_token,
    "v": 5.40});

while (allFriendsArray.length) {
    if (allFriendsArray[0].can_see_audio) {
        friendsWithOpenedAudios.push(allFriendsArray[0]);
    }
    allFriendsArray.shift();
}
response.friendsWithOpenedAudios = friendsWithOpenedAudios;


// Getting user's groups
var userGroups = API.groups.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "count": 1000,
    "extended": 1});
response.userGroups = userGroups;


// Getting friends who broadcast
var broadcastingFriends = API.audio.getBroadcastList({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "active": 1
});
response.broadcastingFriends = broadcastingFriends;


// returning response object
return response;