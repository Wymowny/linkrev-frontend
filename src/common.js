"use strict";

function linkRev() {
    this.init();
}

linkRev.prototype.getCurrentUrl = function(callback, settings) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {

        if (settings) {
            callback(tabs[0].url, settings);
        } else {
            callback(tabs[0].url);
        }
    });
};

linkRev.prototype.getCurrentLanguage = function() {
    var language = window.navigator.userLanguage || window.navigator.language;

    if (language.length > 2) {
        language = language.substring(0, 2);
    }

    if (this.supportedLanguages.indexOf(language) > -1) {
        return language;
    }

    return '';
};

linkRev.prototype.getCurrentCountry = function(language) {
    var country = window.navigator.userLanguage || window.navigator.language;

    if (country.length > 2) {

        country = country.substring(3, 5);

        if (this.supportedCountries.indexOf(country) > -1) {
            return country;
        } else {
            return '';
        }
    } else {
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

linkRev.prototype.supportedLanguages = ['en', 'de', 'pl'];

linkRev.prototype.supportedCountries = ['AU', 'AT', 'CA', 'DE', 'GB', 'IN', 'IE', 'NZ', 'US', 'PL', 'CH'];

linkRev.prototype.getBasicUrl = function() {
    return "https://linkrev.com/";
};