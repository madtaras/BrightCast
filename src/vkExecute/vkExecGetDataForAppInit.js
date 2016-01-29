/* globals API, Args */
var response = {};

// Getting user name and small(50x50) avatar
response.userInfo = API.users.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "name_case": "Nom",
    "fields": "photo_50",
    "v": 5.40})[0];


// Getting user's audios
// fallback for old versions of app in which only 40 audios were load on launch
if (!Args.my_audios_to_load) {
    Args.my_audios_to_load = 40;
}

response.userAudios = API.audio.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "count": Args.my_audios_to_load});

// Getting user's audios count
response.userAudiosCount = API.audio.getCount({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "owner_id": Args.user_id});


// Getting friends with opened audio
response.friendsWithOpenedAudios = [];
var allFriendsArray = API.friends.get({
    "user_id": Args.user_id,
    "order": "hints"
});

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

while (!!allFriendsArray.length && (response.friendsWithOpenedAudios.length < 100 )) {
    if (allFriendsArray[0].can_see_audio) {
        response.friendsWithOpenedAudios.push(allFriendsArray[0]);
    }
    allFriendsArray.shift();
}


// Getting user's groups
response.userGroups = API.groups.get({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "count": 1000,
    "extended": 1});


// Getting friends who broadcast
response.broadcastingFriends = API.audio.getBroadcastList({
    "user_id": Args.user_id,
    "access_token": Args.access_token,
    "v": 5.40,
    "active": 1
});


// returning response object
return response;