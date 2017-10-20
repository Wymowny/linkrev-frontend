"use strict";

function linkRev() {
    this.init();
}

linkRev.prototype.getCurrentUrl = function(callback, settings) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {

        if (settings) {

            callback(tabs[0].url, settings);
        }
        else {

            callback(tabs[0].url);
        }
    });
};

linkRev.prototype.getCurrentLanguage = function() {
    var locale = window.navigator.userLanguage || window.navigator.language;

    if (locale.length > 2) {

        locale = locale.substring(0, 2);
    }

    return locale;
};

linkRev.prototype.getCurrentCountry = function(language) {
    var locale = window.navigator.userLanguage || window.navigator.language;

    if (locale.length > 2) {

        return locale.substring(3, 5);
    }
    else {

        if (language === 'pl') return 'PL';
        if (language === 'en') return 'US';
        if (language === 'de') return 'CH';
    }

    return '';
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
};