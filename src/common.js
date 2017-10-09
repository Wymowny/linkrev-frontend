function linkRev() {
    this.init();
}

linkRev.prototype.getCurrentUrl = function(callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        callback(tabs[0].url);
    });
};

linkRev.prototype.getCurrentLanguage = function() {
    var language = window.navigator.userLanguage || window.navigator.language;

    if (language.length > 2) {
        language = language.substring(0, 2);
    }

    return language;
};

linkRev.prototype.getCommentsUrl = function() {
    return this.getBasicUrl() +  "api/comments";
};

linkRev.prototype.localizeHtmlPage = function() {
    var objects = document.getElementsByTagName('html');

    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
};

linkRev.prototype.getBasicUrl = function() {

    return "https://linkrev.com/";
}