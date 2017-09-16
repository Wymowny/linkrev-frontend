function getGmailUrl() {
  return "https://linkrev.com/";
}

function getCountUrl() {

  return "api/comments/count"
}

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

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    
    getInboxCount(
      url,
      function(count) {
        alert(count);
        updateUnreadCount(count);
      },
      function() {
        delete localStorage.unreadCount;
        updateIcon();
      }
    );
  }); 
}

function updateUnreadCount(count) {
  var changed = localStorage.unreadCount != count;
  localStorage.unreadCount = count;
  updateIcon();
}

function updateIcon() {
  if (!localStorage.hasOwnProperty('unreadCount')) {
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"?"});
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
    chrome.browserAction.setBadgeText({
      text: localStorage.unreadCount != "0" ? localStorage.unreadCount : ""
    });
  }
}

function getInboxCount(url, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();
  }, requestTimeout);

  function handleSuccess(count) {
    localStorage.requestFailureCount = 0;
    window.clearTimeout(abortTimerId);
    if (onSuccess)
      onSuccess(count);
  }

  var invokedErrorCallback = false;
  function handleError() {
    ++localStorage.requestFailureCount;
    window.clearTimeout(abortTimerId);
    if (onError && !invokedErrorCallback)
      onError();
    invokedErrorCallback = true;
  }

  try {
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4)
        return;

      if (this.responseText) {
        
        handleSuccess(JSON.parse(this.responseText));
      }

      handleError();
    };

    xhr.onerror = function(error) {
      handleError();
    };

    xhr.open("GET", getCountUrl() + "?url=" + url, true);
    xhr.send(null);
  } catch(e) {
    handleError();
  }
}