function getBaseUrl() {

    return "https://linkrev.com/";
  }
  
  function getCountUrl() {
  
    return this.getBaseUrl() +  "api/comments/count";
  }

  function getCurrentUrl(callback) {

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {

        callback(tabs[0].url);
    });
}