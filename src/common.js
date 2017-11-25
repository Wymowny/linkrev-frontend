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
        if (language === 'pt') return 'BR';
    }

    return '';
};

linkRev.prototype.getCommentsUrl = function() {
    return this.getBasicUrl() +  "api/comments";
};

linkRev.prototype.getVoteLinkUpUrl = function() {
    return this.getBasicUrl() +  "api/link/voteUp";
};

linkRev.prototype.getVoteLinkDownUrl = function() {
    return this.getBasicUrl() +  "api/link/voteDown";
};

linkRev.prototype.localizeHtmlPage = function() {
    $('body').children().each(function () {
        $(this).html($(this).html().replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        }));
    });
};

linkRev.prototype.supportedLanguages = ['en', 'de', 'pl', 'pt'];

linkRev.prototype.supportedCountries = ['AU', 'AT', 'BR', 'CA', 'DE', 'GB', 'IN', 'IE', 'NZ', 'US', 'PL', 'PT', 'CH'];

linkRev.prototype.getBasicUrl = function() {
    return "https://linkrev.com/";
};