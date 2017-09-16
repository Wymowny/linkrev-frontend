function getBaseUrl() {

    return "https://linkrev.com/";
  }
  
  function getCountUrl() {
  
    return this.getBaseUrl() +  "api/comments/count";
  }

  function getCommentsUrl() {
    
      return this.getBaseUrl() +  "api/comments";
}

function getAddCommentUrl() {
    
      return this.getBaseUrl() +  "api/comment";
}

  function getCurrentUrl(callback) {

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {

        callback(tabs[0].url);
    });
}

function getCurrentLanguage() {

    var language;

    if (window.navigator.languages) {

        language = window.navigator.languages[0];
    } else {

        language = window.navigator.userLanguage || window.navigator.language;
    }

    return language;
}