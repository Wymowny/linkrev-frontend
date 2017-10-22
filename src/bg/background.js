"use strict";

linkRev.prototype.init = function() {
    // Initial functions:
    this.onUpdatedTab();
    this.onActivatedTab();
    this.localizeHtmlPage();
};

linkRev.prototype.onUpdatedTab = function() {
  chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
        var _this = this;
        var url = tab.url;

        if (url !== undefined && changeinfo.status == "complete") {
            chrome.storage.local.remove('linkRev_hots', function() {
                _this.getCurrentUrl(_this.checkStatus.bind(_this));
            });
        }
  }.bind(this));
};

linkRev.prototype.onActivatedTab = function() {
    chrome.tabs.onActivated.addListener(function(details) {
        var _this = this;

        chrome.storage.local.remove('linkRev_hots', function() {
            _this.getCurrentUrl(_this.checkStatus.bind(_this));
        });
    }.bind(this));
};

linkRev.prototype.updateIcon = function(text) {
    if (!text) {
        chrome.browserAction.setBadgeText({
            text: ""
        });
    } else if (text === 'HOT') {
        chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
        chrome.browserAction.setBadgeText({
            text: "HOT"
        });
    } else {
        chrome.browserAction.setBadgeBackgroundColor({color: "#EE7600"});
        chrome.browserAction.setBadgeText({
            text: text.toString()
        });
    }
};

linkRev.prototype.checkStatus = function(url) {
    var _this = this;

    chrome.storage.local.get('linkRev_settings', function(results) {
        var statusUrl = _this.getStatusUrl() + "?link=" + encodeURIComponent(url);

        if (results.linkRev_settings) {

            if (results.linkRev_settings.language) {
                statusUrl += '&language=' + results.linkRev_settings.language;
            }

            if (results.linkRev_settings.country) {
                statusUrl += '&country=' + results.linkRev_settings.country;
            }

            statusUrl += '&showAll=' + results.linkRev_settings.showAll;
        }
        
        $.ajax({
            type: "GET",
            url: statusUrl,
            success: function(result) {
    
                if (result.hots.length) {
                    _this.updateIcon('HOT');
                    chrome.storage.local.set({'linkRev_hots': result.hots});
                } else {
                    if (result.count > 0) {
                        _this.updateIcon(result.count);
                    } else {
                        _this.updateIcon();
                    }
                }
            },
            error: function() {
                _this.updateIcon();
            },
            dataType: "json"
        });
    });
};

linkRev.prototype.getStatusUrl = function() {
  return this.getBasicUrl() +  "api/comments/status";
};

new linkRev();