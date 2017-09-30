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
    var language = window.navigator.userLanguage || window.navigator.language;

    if (language.length > 2) {
        language = language.substring(0, 2);
    }
 
    return language;
}