chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
  var url = tab.url;
      
  if (url !== undefined && changeinfo.status == "complete") {
    updateCommentsCount();
  }
 });

chrome.tabs.onActivated.addListener(function(details) {
  updateCommentsCount();
});

function updateCommentsCount() {
  getCurrentUrl(unreadMessagesCount);
}

function unreadMessagesCount(url) {
  getInboxCount(
    url, function(count) {
      updateUnreadCount(count);
    },

    function() {
      chrome.storage.local.remove('unreadCount', function() {

        updateIcon();
      });
    }
  );
}

function updateUnreadCount(count) {  
  chrome.storage.local.get('unreadCount', function(results) {
    var changed = results.unreadCount != count;

    if (changed) {
      chrome.storage.local.set({'unreadCount': count}, function() {
        
      updateIcon();
      });
    }
  });
}

function updateIcon() {
  chrome.storage.local.get('unreadCount', function(results) {
    if (results.unreadCount) {
      chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
      chrome.browserAction.setBadgeText({
        text: results.unreadCount != "0" ? results.unreadCount : ""
      });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
      chrome.browserAction.setBadgeText({text:"0"});
    }
  });
}

function getInboxCount(url, onSuccess, onError) {

  $.ajax({
    type: "GET",
    url: getCountUrl() + "?link=" + url,
    success: function(count) {

      onSuccess(count);
    },
    error: onError,
    dataType: "html"
  });
}