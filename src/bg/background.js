"use strict";

linkRev.prototype.init = function() {
  
      // Initial functions:
      this.onUpdatedTab();
      this.onActivatedTab();
      this.localizeHtmlPage();
  };

  
linkRev.prototype.onUpdatedTab = function() {
  chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
      var url = tab.url;

      if (url !== undefined && changeinfo.status == "complete") {
          this.updateCommentsCount();
      }
  }.bind(this));
};

linkRev.prototype.onActivatedTab = function() {

  var _this = this;

  chrome.tabs.onActivated.addListener(function(details) {
      this.updateCommentsCount();
  }.bind(this));
};

linkRev.prototype.updateCommentsCount = function() {
  var _this = this;

  this.getCurrentUrl(_this.unreadMessagesCount);
};

linkRev.prototype.unreadMessagesCount = function(url) {
  var _this = new linkRev();

  _this.getInboxCount(
      url, function(count) {
          _this.updateUnreadCount(count);
      },

      function() {
          chrome.storage.local.remove('unreadCount', function() {
              _this.updateIcon();
          });
      }
  );
};

linkRev.prototype.updateUnreadCount = function(count) {

  var _this = this;

  chrome.storage.local.get('unreadCount', function(results) {
      var changed = results.unreadCount != count;

      if (changed) {
          chrome.storage.local.set({'unreadCount': count}, function() {
              _this.updateIcon();
          });
      }
  });
};

linkRev.prototype.updateIcon = function() {
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
};

linkRev.prototype.getInboxCount = function(url, onSuccess, onError) {

  $.ajax({
      type: "GET",
      url: this.getCountUrl() + "?link=" + url,
      success: function(count) {
        
          onSuccess(count);
      },
      error: onError,
      dataType: "html"
  });
};

linkRev.prototype.getCountUrl = function() {
  return this.getBasicUrl() +  "api/comments/count";
};

new linkRev();